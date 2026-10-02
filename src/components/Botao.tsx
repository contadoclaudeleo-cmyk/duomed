import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'contorno' | 'perigo' | 'claro'
type Tamanho = 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  larguraTotal?: boolean
}

// Botão estilo Duolingo: sombra inferior sólida que some ao pressionar
const variantes: Record<Variante, string> = {
  primario: 'bg-agua text-white shadow-[0_4px_0_0_var(--color-agua-escura)] hover:brightness-105',
  secundario: 'bg-laranja text-white shadow-[0_4px_0_0_var(--color-laranja-escura)] hover:brightness-105',
  contorno:
    'bg-superficie text-texto border-2 border-borda shadow-[0_4px_0_0_var(--borda)] hover:bg-superficie-2',
  perigo: 'bg-erro text-white shadow-[0_4px_0_0_var(--color-erro-escura)] hover:brightness-105',
  claro: 'bg-white text-agua-texto shadow-[0_4px_0_0_rgba(0,0,0,0.15)] hover:brightness-95',
}

const tamanhos: Record<Tamanho, string> = {
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
}

export function Botao({
  variante = 'primario',
  tamanho = 'lg',
  larguraTotal,
  className = '',
  disabled,
  children,
  ...resto
}: Props) {
  const aparencia = disabled
    ? 'bg-apagado text-apagado-texto shadow-[0_4px_0_0_var(--apagado-sombra)]'
    : `${variantes[variante]} active:translate-y-1 active:shadow-none`

  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-2xl font-extrabold uppercase tracking-wide transition-[transform,box-shadow,filter,background-color] duration-75 ${tamanhos[tamanho]} ${aparencia} ${larguraTotal ? 'w-full' : ''} ${className}`}
      {...resto}
    >
      {children}
    </button>
  )
}
