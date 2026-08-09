/**
 * tailwind.config.js
 * EduShieldAI — Accessibility-First Design System
 *
 * Theme Design Principles:
 *  1. Standard theme    — default dark-mode exam UI with purple/indigo accents
 *  2. High Contrast     — WCAG AAA (7:1+) black/white/yellow for low-vision users
 *  3. Dyslexia-Friendly — warm, low-saturation palette + OpenDyslexic font family
 *
 * These themes are activated by data-* attributes on <html>:
 *   data-theme="default"        (default)
 *   data-theme="high-contrast"
 *   data-theme="dyslexia"
 *
 * Usage in components:
 *   <html data-theme="high-contrast">
 *   className="bg-surface text-on-surface font-body"
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Enable class-based dark mode so we can toggle it programmatically
  // alongside our custom data-theme attributes.
  darkMode: "class",

  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────────
      // FONT FAMILIES
      // OpenDyslexic is served from /public/fonts/ via @font-face in
      // src/index.css. Inter is loaded from Google Fonts.
      // ─────────────────────────────────────────────────────────────────
      fontFamily: {
        // Default UI font — clean, highly legible sans-serif
        sans: ["Inter", "system-ui", "sans-serif"],
        // Body reading font (exam questions); swapped to OpenDyslexic
        // when dyslexia mode is active
        body: ["Inter", "system-ui", "sans-serif"],
        // Dyslexia-friendly font — referenced by the dyslexia theme
        dyslexic: ["OpenDyslexic", "Arial", "sans-serif"],
        // Monospace for code/debug output
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ─────────────────────────────────────────────────────────────────
      // FONT SIZES — Graduated scale for accessibility
      // Supports programmatic font-size bumping via useAccessibility hook.
      // xs to 3xl are custom sizes; Tailwind's defaults are preserved.
      // ─────────────────────────────────────────────────────────────────
      fontSize: {
        "a11y-xs":   ["0.75rem",  { lineHeight: "1.6" }],
        "a11y-sm":   ["0.875rem", { lineHeight: "1.6" }],
        "a11y-base": ["1rem",     { lineHeight: "1.75" }],
        "a11y-lg":   ["1.125rem", { lineHeight: "1.8" }],
        "a11y-xl":   ["1.25rem",  { lineHeight: "1.85" }],
        "a11y-2xl":  ["1.5rem",   { lineHeight: "1.9" }],
        "a11y-3xl":  ["1.875rem", { lineHeight: "2.0" }],
      },

      // ─────────────────────────────────────────────────────────────────
      // LETTER SPACING — Fine-grained reading comfort
      // ─────────────────────────────────────────────────────────────────
      letterSpacing: {
        "dyslexia-sm": "0.05em",
        "dyslexia-md": "0.12em",
        "dyslexia-lg": "0.20em",
      },

      // ─────────────────────────────────────────────────────────────────
      // LINE HEIGHT — Reading comfort scale
      // ─────────────────────────────────────────────────────────────────
      lineHeight: {
        "reading-normal":  "1.75",
        "reading-relaxed": "2.0",
        "reading-loose":   "2.25",
      },

      // ─────────────────────────────────────────────────────────────────
      // COLOR PALETTE
      //
      // Semantic CSS custom properties are used so that swapping
      // data-theme on <html> instantly re-skins every component.
      //
      // In components: bg-surface, text-on-surface, border-border, etc.
      // Actual color values live in src/index.css as CSS variables.
      // ─────────────────────────────────────────────────────────────────
      colors: {
        // Semantic surface tokens (CSS var-driven)
        surface:           "var(--color-surface)",
        "surface-raised":  "var(--color-surface-raised)",
        "surface-overlay": "var(--color-surface-overlay)",
        "on-surface":      "var(--color-on-surface)",
        "on-surface-muted":"var(--color-on-surface-muted)",
        border:            "var(--color-border)",
        "border-focus":    "var(--color-border-focus)",

        // Primary brand / accent
        primary: {
          DEFAULT: "var(--color-primary)",
          hover:   "var(--color-primary-hover)",
          muted:   "var(--color-primary-muted)",
          fg:      "var(--color-primary-fg)",
        },

        // Semantic feedback colors
        success: {
          DEFAULT: "var(--color-success)",
          muted:   "var(--color-success-muted)",
          fg:      "var(--color-success-fg)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          muted:   "var(--color-warning-muted)",
          fg:      "var(--color-warning-fg)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          muted:   "var(--color-danger-muted)",
          fg:      "var(--color-danger-fg)",
        },

        // Trust score gradient colors (for Recharts)
        trust: {
          high:   "#22c55e",   // green-500  — high integrity
          medium: "#f59e0b",   // amber-500  — moderate concern
          low:    "#ef4444",   // red-500    — critical anomaly
        },

        // Proctoring UI specifics
        proctor: {
          frame:   "var(--color-proctor-frame)",
          safe:    "#16a34a",
          warn:    "#d97706",
          alert:   "#dc2626",
          overlay: "rgba(0,0,0,0.65)",
        },

        // High-contrast palette (static, referenced by HC theme)
        hc: {
          bg:               "#000000",
          surface:          "#0d0d0d",
          text:             "#ffffff",
          "text-secondary": "#fffb00",
          accent:           "#fffb00",
          border:           "#ffffff",
          focus:            "#fffb00",
          success:          "#00ff88",
          danger:           "#ff4444",
          warning:          "#ffaa00",
        },

        // Dyslexia-friendly palette (warm, low-saturation)
        dx: {
          bg:               "#fdf6e3",  // warm cream
          surface:          "#f8f0d8",
          text:             "#3b2f1e",  // dark warm brown (not pure black)
          "text-secondary": "#6b5344",
          accent:           "#c05621",  // burnt orange — high contrast on cream
          border:           "#d4b896",
          focus:            "#c05621",
          success:          "#2d6a4f",
          danger:           "#9b1c1c",
          warning:          "#92400e",
        },
      },

      // ─────────────────────────────────────────────────────────────────
      // BORDER RADIUS — Softer, friendlier UI
      // ─────────────────────────────────────────────────────────────────
      borderRadius: {
        "card":  "12px",
        "panel": "16px",
        "modal": "20px",
        "pill":  "9999px",
      },

      // ─────────────────────────────────────────────────────────────────
      // BOX SHADOWS — Elevation system
      // ─────────────────────────────────────────────────────────────────
      boxShadow: {
        "card":    "0 2px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)",
        "panel":   "0 4px 24px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.16)",
        "modal":   "0 8px 48px rgba(0,0,0,0.4),  0 4px 16px rgba(0,0,0,0.3)",
        "focus":   "0 0 0 3px var(--color-border-focus)",
        "proctor": "0 0 0 2px #22c55e, 0 0 16px rgba(34,197,94,0.3)",
        "alert":   "0 0 0 2px #ef4444, 0 0 16px rgba(239,68,68,0.35)",
      },

      // ─────────────────────────────────────────────────────────────────
      // TRANSITIONS — Consistent motion tokens
      // ─────────────────────────────────────────────────────────────────
      transitionDuration: {
        "fast":   "120ms",
        "normal": "200ms",
        "slow":   "350ms",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      // ─────────────────────────────────────────────────────────────────
      // Z-INDEX — Explicit stacking context map
      // ─────────────────────────────────────────────────────────────────
      zIndex: {
        "navbar":  "100",
        "proctor": "200",
        "overlay": "300",
        "modal":   "400",
        "toast":   "500",
        "tooltip": "600",
      },

      // ─────────────────────────────────────────────────────────────────
      // ANIMATIONS — Micro-interactions
      // ─────────────────────────────────────────────────────────────────
      keyframes: {
        // Pulsing ring for the live proctoring indicator
        "proctor-ping": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.7)" },
          "50%":       { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
        },
        // Alert flash for anomaly detection
        "alert-flash": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%":       { backgroundColor: "rgba(239,68,68,0.15)" },
        },
        // Fade-in-up for toasts and panels
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Slide in from left for sidebar
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        // Trust score bar fill animation
        "bar-fill": {
          "0%":   { width: "0%" },
          "100%": { width: "var(--tw-bar-width, 100%)" },
        },
        // Shimmer for skeleton loading states
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "proctor-ping": "proctor-ping 2s ease-in-out infinite",
        "alert-flash":  "alert-flash 1s ease-in-out infinite",
        "fade-up":      "fade-up 0.25s cubic-bezier(0.4,0,0.2,1) both",
        "slide-in":     "slide-in 0.2s cubic-bezier(0.4,0,0.2,1) both",
        "bar-fill":     "bar-fill 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
        "shimmer":      "shimmer 1.8s linear infinite",
      },
    },
  },

  plugins: [],
};
