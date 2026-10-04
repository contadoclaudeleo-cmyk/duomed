import type { ReactNode } from 'react'

/** Props iguais às dos ícones do lucide, para usar uns no lugar dos outros */
export interface PropsIcone {
  className?: string
  strokeWidth?: number
}

// Desenhos de órgãos no mesmo estilo do lucide (traço, 24x24, cantos redondos)
function Desenho({ className, strokeWidth = 2, children }: PropsIcone & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function Pulmao(p: PropsIcone) {
  return (
    <Desenho {...p}>
      <path d="M12 3v7" />
      <path d="M12 10c-1 1.5-2.2 2-3 2" />
      <path d="M12 10c1 1.5 2.2 2 3 2" />
      <path d="M6.1 20C7.7 20 9 18.7 9 17V7.3C9 6.6 8.4 6 7.8 6c-.3 0-.5.1-.7.2C5.6 7.3 4.6 8.9 3.6 12c-.4 1.4-.6 3-.6 4.8C3 18.5 4.3 19.9 5.9 20Z" />
      <path d="M17.9 20c-1.6 0-2.9-1.3-2.9-3V7.3c0-.7.6-1.3 1.2-1.3.3 0 .5.1.7.2 1.5 1.1 2.5 2.7 3.5 5.8.4 1.4.6 3 .6 4.8 0 1.7-1.3 3.1-2.9 3.2Z" />
    </Desenho>
  )
}

export function Rim(p: PropsIcone) {
  return (
    <Desenho {...p}>
      {/* Par de rins com os ureteres descendo */}
      <path d="M7.5 3C4.8 3 3 6 3 10s1.8 7 4.5 7c1.6 0 2.2-1.2 1.7-2.4-.4-1-1-2-1-4.6s.6-3.6 1-4.6C9.7 4.2 9.1 3 7.5 3Z" />
      <path d="M16.5 3C19.2 3 21 6 21 10s-1.8 7-4.5 7c-1.6 0-2.2-1.2-1.7-2.4.4-1 1-2 1-4.6s-.6-3.6-1-4.6C14.3 4.2 14.9 3 16.5 3Z" />
      <path d="M8.5 10H10c1.1 0 2 .9 2 2v9" />
      <path d="M15.5 10H14c-1.1 0-2 .9-2 2" />
    </Desenho>
  )
}

export function Estomago(p: PropsIcone) {
  return (
    <Desenho {...p}>
      <path d="M9 2v4.5c0 1.6-.8 2.6-2.2 3.6C5.4 11.2 4.5 13 5 15.5c.6 3.2 3.3 5.5 6.8 5.5 4.3 0 7.2-3.3 7.2-7.3 0-3-2-5.2-4.6-5.2-1.4 0-2.4.9-2.4 2.3V12" />
      <path d="M12 2v6.7" />
      <path d="M19 15.5h2.5" />
    </Desenho>
  )
}

export function Figado(p: PropsIcone) {
  return (
    <Desenho {...p}>
      <path d="M3 9.5C3 6.8 5 5 8 5h9.5C19.6 5 21 6.4 21 8.3c0 3-3 5.2-6.3 7.4C12 17.6 10.2 19 8.7 19 5.3 19 3 14.7 3 9.5Z" />
      <path d="M12.5 5 11 11" />
    </Desenho>
  )
}

export function Utero(p: PropsIcone) {
  return (
    <Desenho {...p}>
      <path d="M12 14c-2.5 0-4-1.7-4-4.2V8c0-.6.4-1 1-1h6c.6 0 1 .4 1 1v1.8c0 2.5-1.5 4.2-4 4.2Z" />
      <path d="M10.5 14v4a1.5 1.5 0 0 0 3 0v-4" />
      <path d="M8 8.5C6 8.5 5 7 4.5 5.5" />
      <path d="M16 8.5c2 0 3-1.5 3.5-3" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="20" cy="8" r="1.5" />
    </Desenho>
  )
}

export function Bexiga(p: PropsIcone) {
  return (
    <Desenho {...p}>
      <path d="M6 3c0 3 .5 4.6 2.2 5.6" />
      <path d="M18 3c0 3-.5 4.6-2.2 5.6" />
      <path d="M12 8c-4 0-7 2.5-7 6 0 3 2.5 5 5 5h4c2.5 0 5-2 5-5 0-3.5-3-6-7-6Z" />
      <path d="M12 19v3" />
    </Desenho>
  )
}
