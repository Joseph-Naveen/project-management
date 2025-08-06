import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // StrictMode disabled to prevent double API calls in development
  // StrictMode intentionally double-executes effects to detect side effects
  // This causes issues with cost optimization for Render free tier
  <App />
)
