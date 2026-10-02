import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MetaDiaria } from '../types'
import { useJogo } from '../store/useJogo'
import { Logo } from '../components/Logo'
import { Lapio } from '../components/Lapio'
import { Botao } from '../components/Botao'
import { BarraProgresso } from '../components/BarraProgresso'

const METAS: { valor: MetaDiaria; nome: string; descricao: string }[] = [
  { valor: 10, nome: 'Leve', descricao: 'Cerca de 1 lição por dia' },
  { valor: 20, nome: 'Regular', descricao: 'Cerca de 2 lições por dia' },
  { valor: 30, nome: 'Intensa', descricao: 'Cerca de 3 lições por dia' },
]

/** Onboarding: apresentação, nome, semestre e meta diária */
export function BoasVindas() {
  const navegar = useNavigate()
  const criarUsuario = useJogo((s) => s.criarUsuario)
  const [passo, setPasso] = useState(0)
  const [nome, setNome] = useState('')
  const [semestre, setSemestre] = useState<number | null>(null)
  const [meta, setMeta] = useState<MetaDiaria | null>(null)

  const podeAvancar = passo === 0 || (passo === 1 && nome.trim().length > 0) || (passo === 2 && semestre) || (passo === 3 && meta)

  function avancar() {
    if (!podeAvancar) return
    if (passo < 3) return setPasso(passo + 1)
    criarUsuario(nome, semestre!, meta!)
    navegar('/', { replace: true })
  }

  if (passo === 0) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-16">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
            <Logo altura={150} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xs text-lg text-texto-suave"
          >
            Medicina em lições curtas, um pouco todo dia.
          </motion.p>
        </div>
        <Botao larguraTotal onClick={avancar}>
          Começar
        </Botao>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPasso(passo - 1)}
          className="rounded-lg p-1 text-texto-suave hover:bg-superficie-2"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.6} />
        </button>
        <BarraProgresso valor={passo / 3} rotulo="Progresso do cadastro" />
      </div>

      <form
        className="flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          avancar()
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={passo}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 pt-8"
          >
            {passo === 1 && (
              <>
                <Fala>Oi! Eu sou o Lápio. Como posso te chamar?</Fala>
                <input
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={30}
                  placeholder="Seu nome"
                  aria-label="Seu nome"
                  className="mt-8 w-full rounded-2xl border-2 border-borda bg-superficie px-4 py-4 text-lg font-semibold outline-none transition-colors placeholder:text-apagado-texto focus:border-agua"
                />
              </>
            )}

            {passo === 2 && (
              <>
                <Fala>Prazer, {nome.trim().split(' ')[0]}! Em que semestre você está?</Fala>
                <div className="mt-8 grid grid-cols-4 gap-3">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSemestre(s)}
                      aria-pressed={semestre === s}
                      className={`rounded-2xl border-2 py-3.5 text-lg font-extrabold transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${
                        semestre === s
                          ? 'border-agua bg-agua/10 text-agua-texto shadow-[0_3px_0_0_var(--color-agua)] dark:text-menta'
                          : 'border-borda bg-superficie shadow-[0_3px_0_0_var(--borda)]'
                      }`}
                    >
                      {s}º
                    </button>
                  ))}
                </div>
              </>
            )}

            {passo === 3 && (
              <>
                <Fala>Qual vai ser sua meta diária? Dá para mudar depois no perfil.</Fala>
                <div className="mt-8 flex flex-col gap-3">
                  {METAS.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      onClick={() => setMeta(m.valor)}
                      aria-pressed={meta === m.valor}
                      className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${
                        meta === m.valor
                          ? 'border-agua bg-agua/10 shadow-[0_3px_0_0_var(--color-agua)]'
                          : 'border-borda bg-superficie shadow-[0_3px_0_0_var(--borda)]'
                      }`}
                    >
                      <span>
                        <span className="block text-lg font-extrabold">{m.nome}</span>
                        <span className="text-sm text-texto-suave">{m.descricao}</span>
                      </span>
                      <span className="font-extrabold text-laranja-escura dark:text-laranja">{m.valor} XP</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <Botao type="submit" larguraTotal disabled={!podeAvancar}>
          {passo === 3 ? 'Começar a estudar' : 'Continuar'}
        </Botao>
      </form>
    </div>
  )
}

/** Lápio com um balão de fala */
function Fala({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      <Lapio altura={110} className="shrink-0" />
      <div className="relative mb-6 rounded-2xl border-2 border-borda bg-superficie px-4 py-3 text-lg font-bold">
        {children}
        <span className="absolute -left-[8px] bottom-4 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-borda bg-superficie" />
      </div>
    </div>
  )
}
