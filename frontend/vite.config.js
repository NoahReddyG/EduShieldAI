import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * vite.config.js — EduShieldAI Frontend
 *
 * Key configuration:
 *  - TailwindCSS v4 via @tailwindcss/vite plugin (zero-config, faster HMR)
 *  - Dev-server proxy routes all /api/* calls to the FastAPI backend
 *    so CORS is not a dev concern and no env-var changes needed per machine.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // TailwindCSS v4 native Vite plugin
  ],

  server: {
    port: 5173,
    proxy: {
      // REST API proxy → FastAPI backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket proxy → FastAPI anomaly stream endpoint
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  build: {
    // Raise the chunk-size warning threshold (MediaPipe WASM is large)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Vendor-split strategy to keep initial bundle lean
        manualChunks: {
          react:      ['react', 'react-dom'],
          recharts:   ['recharts'],
          mediapipe:  ['@mediapipe/camera_utils', '@mediapipe/face_mesh'],
        },
      },
    },
  },
})
