import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Phosphor icons default to the "regular" (line) weight. Individual icons opt
// into "fill" only when selected/active — see Sidebar (active nav) and Topbar.
createRoot(document.getElementById('root')).render(
  <App />
)
