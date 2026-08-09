/**
 * proctoringService.js — Exam Session & Anomaly API calls
 */
import api from './api';

/**
 * Start a new proctored exam session.
 * @param {number} studentId
 * @param {string} examTitle
 * @returns {Promise<{ session_id, trust_score, status, ... }>}
 */
export async function createSession(studentId, examTitle) {
  const response = await api.post('/api/v1/proctoring/sessions', {
    student_id: studentId,
    exam_title: examTitle,
  });
  return response.data;
}

/**
 * Log a proctoring anomaly. Backend auto-deducts trust score.
 * @param {number} sessionId
 * @param {'GAZE_OFFSCREEN'|'MULTIPLE_FACES'|'NO_FACE_DETECTED'|'AUDIO_DISTURBANCE'} flagType
 * @param {number} confidenceScore  — 0.0 to 1.0
 * @param {string} [details]
 * @returns {Promise<AnomalyLogResponse>}
 */
export async function logAnomaly(sessionId, flagType, confidenceScore = 1.0, details = '') {
  const response = await api.post('/api/v1/proctoring/anomalies', {
    session_id: sessionId,
    flag_type: flagType,
    confidence_score: confidenceScore,
    details,
  });
  return response.data;
}

/**
 * Close / update an exam session (mark as COMPLETED).
 * @param {number} sessionId
 * @param {'COMPLETED'|'FLAGGED'} [status]
 */
export async function closeSession(sessionId, status = 'COMPLETED') {
  const response = await api.patch(`/api/v1/proctoring/sessions/${sessionId}`, {
    status,
    end_time: new Date().toISOString(),
  });
  return response.data;
}
