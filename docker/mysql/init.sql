-- ─────────────────────────────────────────────────────────────────────────────
-- EduShield AI — MySQL Schema Initialization
-- Run automatically by Docker on first container startup via
-- /docker-entrypoint-initdb.d/init.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS edushield_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE edushield_db;

-- ── Users Table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name              VARCHAR(100)    NOT NULL,
    email             VARCHAR(100)    NOT NULL,
    password_hash     VARCHAR(255)    NOT NULL,
    role              ENUM('STUDENT','FACULTY','ADMIN') NOT NULL DEFAULT 'STUDENT',
    accessibility_mode TINYINT(1)     NOT NULL DEFAULT 0,
    preferred_font_scale FLOAT        NOT NULL DEFAULT 1.0,
    created_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Exam Sessions Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_sessions (
    session_id   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    student_id   INT UNSIGNED    NOT NULL,
    exam_title   VARCHAR(150)    NOT NULL,
    start_time   DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    end_time     DATETIME(6)     NULL,
    trust_score  FLOAT           NOT NULL DEFAULT 100.0,
    status       ENUM('IN_PROGRESS','COMPLETED','FLAGGED') NOT NULL DEFAULT 'IN_PROGRESS',

    PRIMARY KEY (session_id),
    INDEX idx_sessions_student (student_id),
    INDEX idx_sessions_status  (status),

    CONSTRAINT fk_sessions_student
        FOREIGN KEY (student_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Anomaly Logs Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_logs (
    log_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id       INT UNSIGNED NOT NULL,
    flag_type        ENUM('GAZE_OFFSCREEN','MULTIPLE_FACES','NO_FACE_DETECTED','AUDIO_DISTURBANCE') NOT NULL,
    confidence_score FLOAT        NOT NULL DEFAULT 1.0,
    details          VARCHAR(255) NULL,
    timestamp        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (log_id),
    INDEX idx_anomaly_session   (session_id),
    INDEX idx_anomaly_flag_type (flag_type),

    CONSTRAINT fk_anomaly_session
        FOREIGN KEY (session_id)
        REFERENCES exam_sessions (session_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Demo Faculty Account ─────────────────────────────────────────────────
-- Password hash for "admin123" (bcrypt, rounds=12) — CHANGE IN PRODUCTION
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
    'Demo Professor',
    'professor@admin.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFqAu2I8kGw9RVS',
    'FACULTY'
);
