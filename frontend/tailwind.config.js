/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {

      fontFamily: {
        
        sans: ["Inter", "system-ui", "sans-serif"],

        body: ["Inter", "system-ui", "sans-serif"],
        
        dyslexic: ["OpenDyslexic", "Arial", "sans-serif"],
        
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        "a11y-xs":   ["0.75rem",  { lineHeight: "1.6" }],
        "a11y-sm":   ["0.875rem", { lineHeight: "1.6" }],
        "a11y-base": ["1rem",     { lineHeight: "1.75" }],
        "a11y-lg":   ["1.125rem", { lineHeight: "1.8" }],
        "a11y-xl":   ["1.25rem",  { lineHeight: "1.85" }],
        "a11y-2xl":  ["1.5rem",   { lineHeight: "1.9" }],
        "a11y-3xl":  ["1.875rem", { lineHeight: "2.0" }],
      },

      letterSpacing: {
        "dyslexia-sm": "0.05em",
        "dyslexia-md": "0.12em",
        "dyslexia-lg": "0.20em",
      },

      lineHeight: {
        "reading-normal":  "1.75",
        "reading-relaxed": "2.0",
        "reading-loose":   "2.25",
      },

      colors: {
        
        surface:           "var(--color-surface)",
        "surface-raised":  "var(--color-surface-raised)",
        "surface-overlay": "var(--color-surface-overlay)",
        "on-surface":      "var(--color-on-surface)",
        "on-surface-muted":"var(--color-on-surface-muted)",
        border:            "var(--color-border)",
        "border-focus":    "var(--color-border-focus)",

        primary: {
          DEFAULT: "var(--color-primary)",
          hover:   "var(--color-primary-hover)",
          muted:   "var(--color-primary-muted)",
          fg:      "var(--color-primary-fg)",
        },

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

        trust: {
          high:   "#22c55e",   
          medium: "#f59e0b",   
          low:    "#ef4444",   
        },

        proctor: {
          frame:   "var(--color-proctor-frame)",
          safe:    "#16a34a",
          warn:    "#d97706",
          alert:   "#dc2626",
          overlay: "rgba(0,0,0,0.65)",
        },

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

        dx: {
          bg:               "#fdf6e3",  
          surface:          "#f8f0d8",
          text:             "#3b2f1e",  
          "text-secondary": "#6b5344",
          accent:           "#c05621",  
          border:           "#d4b896",
          focus:            "#c05621",
          success:          "#2d6a4f",
          danger:           "#9b1c1c",
          warning:          "#92400e",
        },
      },

      borderRadius: {
        "card":  "12px",
        "panel": "16px",
        "modal": "20px",
        "pill":  "9999px",
      },

      boxShadow: {
        "card":    "0 2px 8px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)",
        "panel":   "0 4px 24px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.16)",
        "modal":   "0 8px 48px rgba(0,0,0,0.4),  0 4px 16px rgba(0,0,0,0.3)",
        "focus":   "0 0 0 3px var(--color-border-focus)",
        "proctor": "0 0 0 2px #22c55e, 0 0 16px rgba(34,197,94,0.3)",
        "alert":   "0 0 0 2px #ef4444, 0 0 16px rgba(239,68,68,0.35)",
      },

      transitionDuration: {
        "fast":   "120ms",
        "normal": "200ms",
        "slow":   "350ms",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      zIndex: {
        "navbar":  "100",
        "proctor": "200",
        "overlay": "300",
        "modal":   "400",
        "toast":   "500",
        "tooltip": "600",
      },

      keyframes: {
        
        "proctor-ping": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.7)" },
          "50%":       { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
        },
        
        "alert-flash": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%":       { backgroundColor: "rgba(239,68,68,0.15)" },
        },
        
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        
        "bar-fill": {
          "0%":   { width: "0%" },
          "100%": { width: "var(--tw-bar-width, 100%)" },
        },
        
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
