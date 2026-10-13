import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Lightbulb, Loader2, Play, Target, TrendingUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { MATERIAS, materiaDisponivel } from '../data'
import { useJogo } from '../store/useJogo'
import { ehPlus } from '../lib/plus'
import { mensagemDoErro } from '../lib/estudo'
import {
  linkTreino,
  MINIMO_PARA_AVALIAR,
  porcentagem,
  recomendar,
  useEstatisticas,
  type Placar,
} from '../lib/estatisticas'
import { Botao } from '../components/Botao'
import { Lapio } from '../components/Lapio'
import { Modal } from '../components/Modal'
import { AvisoSemVidas } from '../components/AvisoSemVidas'
import { IconeMateria } from '../components/IconeMateria'
import { NumeroAnimado } from '../components/Animacoes'
import { SeloPorcentagem } from './Treino'

/** Cor da barra conforme a porcentagem */
const corDaBarra = (pct: number) => (pct >= 70 ? 'bg-agua' : pct >= 50 ? 'bg-laranja' : 'bg-erro')

/** Aba "Como melhorar": acertos no geral, por área e por banca, e o que treinar agora */
export function Melhorar() {
  const navegar = useNavigate()
  const { resumo, erro, carregar } = useEstatisticas()
  const [aberta, setAberta] = useState<string | null>(null)
  const [semVidas, setSemVidas] = useState(false)

  function treinar(materiaId: string | null, banca: string | null) {
    useJogo.getState().sincronizarVidas()
    if (useJogo.getState().vidas <= 0 && !ehPlus()) return setSemVidas(true)
    navegar(linkTreino(materiaId, banca))
  }

  if (!resumo) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        {erro ? (
          <>
            <Lapio humor="erro" altura={100} />
            <p className="font-bold">{mensagemDoErro(erro)}</p>
            <Botao onClick={carregar}>Tentar de novo</Botao>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-agua" strokeWidth={2.6} aria-hidden />
            <p className="font-bold text-texto-suave">Calculando seus acertos...</p>
          </>
        )}
      </div>
    )
  }

  const pctGeral = porcentagem(resumo.geral)
  const recomendacoes = recomendar(resumo)
  const areas = MATERIAS.filter(materiaDisponivel)
  const bancasGerais = Object.entries(resumo.porBanca).sort((a, b) => b[1].respondidas - a[1].respondidas)

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-agua/15 text-agua-texto dark:text-menta">
          <TrendingUp className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <h1 className="text-2xl font-extrabold">Como melhorar</h1>
      </div>

      {/* Acerto geral */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-borda bg-superficie p-4">
        <Anel pct={pctGeral ?? 0} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold uppercase tracking-wide text-texto-suave">Acerto geral</p>
          <p className="text-3xl font-extrabold">
            {pctGeral === null ? '—' : <NumeroAnimado valor={pctGeral} formatar={(n) => `${n}%`} />}
          </p>
          <p className="text-sm font-semibold text-texto-suave">
            {resumo.geral.respondidas === 0
              ? 'Responda questões e seus números aparecem aqui.'
              : `${resumo.geral.acertos} acertos em ${resumo.geral.respondidas} respostas`}
          </p>
        </div>
      </div>

      {/* Recomendações */}
      <Titulo Icone={Lightbulb}>O que treinar agora</Titulo>
      <div className="mb-7 flex flex-col gap-3">
        {recomendacoes.map((r, i) => (
          <motion.div
            key={r.chave}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 rounded-2xl border-2 border-borda bg-superficie p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-extrabold leading-tight">
                <span>{r.titulo}</span>
                {r.pct !== null && <SeloPorcentagem pct={r.pct} />}
              </p>
              <p className="mt-0.5 text-sm text-texto-suave">{r.motivo}</p>
            </div>
            <button
              type="button"
              onClick={() => treinar(r.materiaId, r.banca)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-agua px-3 py-2 text-sm font-extrabold uppercase text-white shadow-[0_3px_0_0_var(--color-agua-escura)] transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none"
            >
              <Play className="h-4 w-4" fill="currentColor" strokeWidth={2.4} /> Treinar
            </button>
          </motion.div>
        ))}
      </div>

      {/* Por área, com as bancas dentro */}
      <Titulo Icone={Target}>Por área</Titulo>
      <p className="-mt-2 mb-3 text-xs text-texto-suave">Toque numa área para ver cada banca.</p>
      <div className="mb-7 overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
        {areas.map((m) => {
          const placar = resumo.porMateria[m.id]
          const bancas = Object.entries(resumo.porMateriaBanca[m.id] ?? {}).sort((a, b) => b[1].respondidas - a[1].respondidas)
          const expandida = aberta === m.id
          return (
            <div key={m.id} className="border-b-2 border-borda last:border-b-0">
              <button
                type="button"
                onClick={() => setAberta(expandida ? null : m.id)}
                aria-expanded={expandida}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-superficie-2"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agua text-white">
                  <IconeMateria nome={m.icone} className="h-5 w-5" />
                </span>
                <LinhaPlacar nome={m.nome} placar={placar} />
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-texto-suave transition-transform ${expandida ? 'rotate-180' : ''}`}
                  strokeWidth={2.6}
                />
              </button>
              <AnimatePresence initial={false}>
                {expandida && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-superficie-2"
                  >
                    <div className="flex flex-col gap-1 px-4 py-3">
                      {bancas.length === 0 && (
                        <p className="py-1 text-sm text-texto-suave">Nenhuma questão respondida nessa área ainda.</p>
                      )}
                      {bancas.map(([banca, p]) => (
                        <div key={banca} className="flex items-center gap-3 py-1.5">
                          <LinhaPlacar nome={banca} placar={p} pequena />
                          <button
                            type="button"
                            onClick={() => treinar(m.id, banca)}
                            className="shrink-0 rounded-lg border-2 border-borda px-2.5 py-1 text-xs font-extrabold uppercase text-agua-texto hover:bg-superficie dark:text-menta"
                          >
                            Treinar
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => treinar(m.id, null)}
                        className="mt-1 self-start text-sm font-extrabold text-agua-texto underline-offset-4 hover:underline dark:text-menta"
                      >
                        Treinar {m.nome} misturado →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Por banca, todas as áreas juntas */}
      {bancasGerais.length > 0 && (
        <>
          <Titulo Icone={TrendingUp}>Por banca (todas as áreas)</Titulo>
          <div className="mb-4 flex flex-col gap-1 rounded-2xl border-2 border-borda bg-superficie px-4 py-3">
            {bancasGerais.map(([banca, p]) => (
              <button
                key={banca}
                type="button"
                onClick={() => treinar(null, banca)}
                className="flex items-center gap-3 rounded-lg py-1.5 text-left hover:bg-superficie-2"
              >
                <LinhaPlacar nome={banca} placar={p} pequena />
              </button>
            ))}
          </div>
        </>
      )}
      <p className="mb-4 text-center text-xs text-texto-suave">
        Contam as respostas de lições, treinos e revisões. Com menos de {MINIMO_PARA_AVALIAR} respostas, a porcentagem
        ainda é só uma pista.
      </p>

      <Modal aberto={semVidas} aoFechar={() => setSemVidas(false)}>
        <AvisoSemVidas aoVoltar={() => setSemVidas(false)} />
      </Modal>
    </div>
  )
}

function Titulo({ Icone, children }: { Icone: typeof Target; children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
      <Icone className="h-5 w-5 text-agua" strokeWidth={2.6} aria-hidden />
      {children}
    </h2>
  )
}

/** Nome, barra de acerto e porcentagem */
function LinhaPlacar({ nome, placar, pequena }: { nome: string; placar?: Placar; pequena?: boolean }) {
  const pct = porcentagem(placar)
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={`truncate font-extrabold ${pequena ? 'text-sm' : ''}`}>{nome}</span>
        <span className="shrink-0 text-sm font-extrabold">
          {pct === null ? <span className="text-apagado-texto">—</span> : `${pct}%`}
          {placar && placar.respondidas > 0 && (
            <span className="ml-1 text-xs font-semibold text-texto-suave">({placar.respondidas})</span>
          )}
        </span>
      </div>
      <div className={`overflow-hidden rounded-full bg-apagado ${pequena ? 'h-1.5' : 'h-2.5'}`}>
        <motion.div
          className={`h-full rounded-full ${pct === null ? '' : corDaBarra(pct)}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct ?? 0}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}

/** Anel de porcentagem */
function Anel({ pct }: { pct: number }) {
  const r = 30
  const volta = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 72 72" className="h-20 w-20 shrink-0 -rotate-90" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="9" className="stroke-apagado" />
      <motion.circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        className={pct >= 70 ? 'stroke-agua' : pct >= 50 ? 'stroke-laranja' : 'stroke-erro'}
        strokeDasharray={volta}
        initial={{ strokeDashoffset: volta }}
        animate={{ strokeDashoffset: volta * (1 - pct / 100) }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}
