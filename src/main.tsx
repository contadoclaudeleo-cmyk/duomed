import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import { App } from './App'
import { iniciarNuvem } from './lib/nuvem'

// Antes de desenhar: trata a volta do login com Google e liga a sincronização
iniciarNuvem()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* Quem pediu menos movimento no aparelho vê as telas sem animação */}
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
