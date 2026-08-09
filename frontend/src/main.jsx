import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AccessibilityProvider } from './hooks/useAccessibility.jsx'

/**
 * main.jsx — React DOM root
 *
 * AccessibilityProvider is mounted at the root so every page and component
 * can call useAccessibility() without any additional setup.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </StrictMode>,
)
