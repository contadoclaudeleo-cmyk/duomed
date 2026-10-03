import { motion } from 'framer-motion'
import { Award, Clock, Flame, MessageSquareText, Target, TrendingUp, Zap, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { formatarDuracao } from '../lib/datas'
import { buscarConquista } from '../lib/conquistas'
import { Botao } from '../components/Botao'
import { Lapio } from '../components/Lapio'

interface CartaoProps {
  rotulo: string
  valor: string
  Icone: LucideIcon
  cor: 'laranja' | 'agua' | 'texto'
  atraso: number
}

const cores = {
  laranja: { borda: 'border-laranja', fundo: 'bg-laranja', texto: 'text-laranja-escura' },
  agua: { borda: 'border-agua', fundo: 'bg-agua', texto: 'text-agua-texto dark:text-menta' },
  texto: { borda: 'border-tinta dark:border-borda-forte', fundo: 'bg-tinta dark:bg-borda-forte', texto: 'text-texto' },
}

function CartaoNumero({ rotulo, valor, Icone, cor, atraso }: CartaoProps) {
  const c = cores[cor]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: atraso, type: 'spring', stiffness: 300, damping: 20 }}
      className={`flex-1 overflow-hidden rounded-2xl border-2 ${c.borda}`}
    >
      <div className={`${c.fundo} px-2 py-1 text-center text-xs font-extrabold uppercase tracking-wide text-white`}>
        {rotulo}
      </div>
      <div className={`flex items-center justify-center gap-1.5 bg-superficie py-3 text-xl font-extrabold ${c.texto}`}>
        <Icone className="h-5 w-5" strokeWidth={2.6} aria-hidden />
        {valor}
      </div>
    </motion.div>
  )
}

export function Resultado() {
  const navegar = useNavigate()
  const r = useJogo((s) => s.ultimoResultado)
  if (!r) return <Navigate to="/" replace />

  const partesXp = [`${r.xp.base} da ${r.modo === 'licao' ? 'lição' : 'revisão'}`]
  if (r.xp.perfeita) partesXp.push(`${r.xp.perfeita} sem erros`)
  if (r.xp.casos) partesXp.push(`${r.xp.casos} de casos clínicos`)

  const titulo = r.precisao === 100 ? 'Perfeito!' : r.modo === 'licao' ? 'Lição concluída!' : 'Revisão concluída!'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-6 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Lapio humor="festa" altura={160} />

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-extrabold text-laranja"
          >
            {titulo}
          </motion.h1>
          <p className="mt-1 text-texto-suave">{r.titulo}</p>
        </div>

        <div className="flex w-full gap-3">
          <CartaoNumero rotulo="XP ganho" valor={`+${r.xp.total}`} Icone={Zap} cor="laranja" atraso={0.15} />
          <CartaoNumero rotulo="Precisão" valor={`${r.precisao}%`} Icone={Target} cor="agua" atraso={0.3} />
          <CartaoNumero rotulo="Tempo" valor={formatarDuracao(r.tempoMs)} Icone={Clock} cor="texto" atraso={0.45} />
        </div>
        <p className="-mt-3 text-xs text-texto-suave">{partesXp.join(' + ')}</p>

        {/* Destaques: meta do dia, nível novo e conquistas */}
        <div className="flex w-full flex-col gap-2">
          {r.bateuMetaAgora && (
            <Destaque Icone={Flame} cor="text-laranja" atraso={0.6}>
              Meta do dia batida! Ofensiva de {r.ofensiva} {r.ofensiva === 1 ? 'dia' : 'dias'}.
            </Destaque>
          )}
          {r.subiuParaNivel && (
            <Destaque Icone={TrendingUp} cor="text-agua" atraso={0.7}>
              Você chegou ao nível {r.subiuParaNivel}!
            </Destaque>
          )}
          {r.conquistasNovas.map((id, i) => (
            <Destaque key={id} Icone={Award} cor="text-laranja" atraso={0.8 + i * 0.1}>
              Conquista desbloqueada: <strong>{buscarConquista(id).titulo}</strong>
            </Destaque>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Botao larguraTotal variante="contorno" onClick={() => navegar('/comentada')}>
          <MessageSquareText className="h-5 w-5" strokeWidth={2.6} aria-hidden /> Ver revisão comentada
        </Botao>
        <Botao larguraTotal onClick={() => navegar(r.modo === 'revisao' ? '/revisao' : '/', { replace: true })}>
          Continuar
        </Botao>
      </div>
    </div>
  )
}

function Destaque({
  Icone,
  cor,
  atraso,
  children,
}: {
  Icone: LucideIcon
  cor: string
  atraso: number
  children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: atraso }}
      className="flex items-center gap-3 rounded-2xl border-2 border-borda bg-superficie px-4 py-3 text-left text-sm font-semibold"
    >
      <Icone className={`h-6 w-6 shrink-0 ${cor}`} strokeWidth={2.4} aria-hidden />
      <span>{children}</span>
    </motion.div>
  )
}
