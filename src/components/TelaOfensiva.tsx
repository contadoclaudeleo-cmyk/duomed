import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { arquivoPublico } from '../lib/caminho'
import { tocarSom } from '../lib/sons'
import { NumeroAnimado } from './Animacoes'

// ============================================================
// Tela de comemoração da ofensiva (o "foguinho"), feita para print e stories.
// Aparece quando a pessoa chega a um marco (3, 7, 14, 30... dias) e também
// pelo perfil. "Compartilhar" gera uma imagem 1080x1920 (formato de stories).
// ============================================================

const MARCOS = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365]

/** true se esse número de dias é um marco que merece a tela de comemoração */
export const ehMarcoDeOfensiva = (dias: number) => MARCOS.includes(dias) || (dias > 365 && dias % 100 === 0)

/** Frase de cada marco */
export function fraseDoMarco(dias: number) {
  if (dias >= 365) return 'Um ano inteiro de estudo. Lenda da residência!'
  if (dias >= 200) return 'Mais constante que plantão de UTI.'
  if (dias >= 100) return 'Cem dias! Isso é disciplina de residente.'
  if (dias >= 50) return 'Meio caminho para os 100. Ninguém segura!'
  if (dias >= 30) return 'Um mês inteiro sem falhar. Que orgulho!'
  if (dias >= 14) return 'Duas semanas firmes. O hábito pegou!'
  if (dias >= 7) return 'Uma semana inteira estudando!'
  return 'O foguinho acendeu. Bora manter!'
}

// Desenho do fogo (o mesmo do ícone Flame, em uma caixa de 24x24)
const CAMINHO_FOGO =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'

const FONTE = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif'

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement | null>((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = src
  })
}

/** Desenha a imagem para os stories (1080x1920) */
export async function gerarImagem(dias: number, nome: string): Promise<Blob | null> {
  const L = 1080
  const A = 1920
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = A
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  await document.fonts?.ready

  // Fundo laranja em degradê, com bolhas claras
  const fundo = ctx.createLinearGradient(0, 0, L, A)
  fundo.addColorStop(0, '#fbbf24')
  fundo.addColorStop(0.5, '#f97316')
  fundo.addColorStop(1, '#dc2626')
  ctx.fillStyle = fundo
  ctx.fillRect(0, 0, L, A)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (const [x, y, r] of [
    [120, 260, 180],
    [960, 420, 240],
    [180, 1500, 260],
    [920, 1700, 200],
    [540, 980, 520],
  ]) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Fogo grande com brilho
  ctx.save()
  ctx.translate(L / 2 - 300, 300)
  ctx.scale(25, 25)
  ctx.shadowColor = 'rgba(255, 240, 180, 0.9)'
  ctx.shadowBlur = 2
  const fogo = ctx.createLinearGradient(0, 3, 0, 22)
  fogo.addColorStop(0, '#fff7cc')
  fogo.addColorStop(1, '#ffffff')
  ctx.fillStyle = fogo
  ctx.fill(new Path2D(CAMINHO_FOGO))
  ctx.restore()

  // Número de dias
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(120, 30, 0, 0.35)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  ctx.font = `800 ${dias >= 1000 ? 260 : 340}px ${FONTE}`
  ctx.fillText(String(dias), L / 2, 1240)
  ctx.font = `800 92px ${FONTE}`
  ctx.fillText(dias === 1 ? 'dia de ofensiva' : 'dias de ofensiva', L / 2, 1370)
  ctx.shadowColor = 'transparent'

  // Frase e nome
  ctx.font = `600 50px ${FONTE}`
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  quebrarTexto(ctx, fraseDoMarco(dias), L / 2, 1480, 900, 64)
  ctx.font = `700 46px ${FONTE}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${nome} estuda para a residência todo dia`, L / 2, 1640, 960)

  // Rodapé com o mascote e o nome do app
  const lapio = await carregarImagem(arquivoPublico('brand/lapio.png'))
  if (lapio) {
    const h = 150
    const w = (lapio.width / lapio.height) * h
    ctx.drawImage(lapio, L / 2 - 200 - w / 2, 1720, w, h)
  }
  ctx.textAlign = 'left'
  ctx.font = `800 88px ${FONTE}`
  ctx.fillText('DuoMed', L / 2 - 110, 1825)

  return new Promise((ok) => canvas.toBlob(ok, 'image/png'))
}

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, largura: number, linha: number) {
  let atual = ''
  for (const palavra of texto.split(' ')) {
    const teste = atual ? `${atual} ${palavra}` : palavra
    if (ctx.measureText(teste).width > largura && atual) {
      ctx.fillText(atual, x, y)
      atual = palavra
      y += linha
    } else atual = teste
  }
  if (atual) ctx.fillText(atual, x, y)
}

interface Props {
  aberta: boolean
  dias: number
  nome: string
  aoFechar: () => void
}

export function TelaOfensiva({ aberta, dias, nome, aoFechar }: Props) {
  const [gerando, setGerando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!aberta) return
    setAviso(null)
    const id = setTimeout(() => tocarSom('conquista'), 300)
    return () => clearTimeout(id)
  }, [aberta])

  async function compartilhar() {
    setGerando(true)
    setAviso(null)
    try {
      const blob = await gerarImagem(dias, nome)
      if (!blob) throw new Error('sem imagem')
      const arquivo = new File([blob], `duomed-ofensiva-${dias}.png`, { type: 'image/png' })
      const texto = `${dias} dias de ofensiva no DuoMed! 🔥`
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto }).catch(() => undefined)
      } else {
        // No computador: baixa a imagem para postar depois
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = arquivo.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setAviso('Imagem salva! É só postar nos seus stories.')
      }
    } catch {
      setAviso('Não deu para criar a imagem. Tire um print desta tela!')
    } finally {
      setGerando(false)
    }
  }

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-label={`${dias} dias de ofensiva`}
        >
          {/* Bolhas que sobem no fundo */}
          {Array.from({ length: 14 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white/15"
              style={{ width: 12 + (i % 5) * 14, height: 12 + (i % 5) * 14, left: `${(i * 37) % 100}%` }}
              initial={{ y: '110vh' }}
              animate={{ y: '-20vh' }}
              transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
            />
          ))}

          <button
            type="button"
            onClick={aoFechar}
            className="relative z-10 m-4 self-end rounded-full bg-white/20 p-2"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" strokeWidth={2.8} />
          </button>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
            >
              <motion.div
                style={{ transformOrigin: '50% 90%' }}
                animate={{ scaleY: [1, 1.1, 0.95, 1], rotate: [0, -4, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame
                  className="h-44 w-44 drop-shadow-[0_0_40px_rgba(255,240,180,0.9)]"
                  fill="#fff7cc"
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              </motion.div>
            </motion.div>
            <p className="text-8xl font-extrabold leading-none drop-shadow-[0_6px_0_rgba(120,30,0,0.3)]">
              <NumeroAnimado valor={dias} atraso={0.3} duracao={1} />
            </p>
            <p className="text-3xl font-extrabold">{dias === 1 ? 'dia de ofensiva' : 'dias de ofensiva'}</p>
            <motion.p
              className="mt-2 max-w-xs text-lg font-semibold text-white/90"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {fraseDoMarco(dias)}
            </motion.p>
            <div className="mt-6 flex items-center gap-2">
              <img src={arquivoPublico('brand/lapio.png')} alt="" className="h-12 w-auto" />
              <span className="text-2xl font-extrabold">DuoMed</span>
            </div>
          </div>

          <div className="pb-seguro relative z-10 flex flex-col gap-3 px-6 pb-6">
            {aviso && <p className="text-center text-sm font-bold">{aviso}</p>}
            <button
              type="button"
              onClick={compartilhar}
              disabled={gerando}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-extrabold uppercase text-orange-600 shadow-[0_5px_0_0_rgba(120,30,0,0.35)] transition-[transform,box-shadow] duration-75 active:translate-y-1 active:shadow-none disabled:opacity-70"
            >
              <Share2 className="h-5 w-5" strokeWidth={2.8} />
              {gerando ? 'Criando imagem...' : 'Compartilhar'}
            </button>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-2xl border-2 border-white/60 py-3.5 font-extrabold uppercase"
            >
              Continuar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
