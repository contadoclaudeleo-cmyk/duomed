import { arquivoPublico } from '../lib/caminho'
import type { CSSProperties } from 'react'

/** Nome do app: "Duo" em cinza escuro e "Med" em verde-água, como no logo */
export function NomeDuoMed({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`} style={style}>
      <span className="text-tinta dark:text-texto">Duo</span>
      <span className="text-agua">Med</span>
    </span>
  )
}

interface Props {
  /** Altura em pixels */
  altura?: number
  className?: string
}

/**
 * Logo horizontal. No modo escuro o "Duo" escuro da imagem sumiria no fundo,
 * então mostramos o Lápio + o nome escrito em texto claro.
 */
export function Logo({ altura = 56, className = '' }: Props) {
  return (
    <div className={className}>
      <img
        src={arquivoPublico('brand/logo-duomed.png')}
        alt="DuoMed"
        style={{ height: altura }}
        className="w-auto dark:hidden"
        draggable={false}
      />
      <div className="hidden items-center gap-1 dark:flex" style={{ height: altura }}>
        <img src={arquivoPublico('brand/lapio.png')} alt="" style={{ height: altura }} className="w-auto" draggable={false} />
        <NomeDuoMed className="leading-none" style={{ fontSize: Math.round(altura * 0.42) }} />
      </div>
    </div>
  )
}
