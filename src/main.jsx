import React from 'react'
// Idioma: se resuelve antes de pintar nada (preferencia manual → idioma del dispositivo → castellano).
import '@/i18n'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
