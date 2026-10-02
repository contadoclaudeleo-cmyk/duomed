import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MATERIAS, materiaDisponivel } from '../data'
import { useJogo } from '../store/useJogo'
import { contarConcluidas } from '../lib/progresso'
import { BarraProgresso } from '../components/BarraProgresso'
import { IconeMateria } from '../components/IconeMateria'

export function Materias() {
  const navegar = useNavigate()
  const atual = useJogo((s) => s.materiaAtual)
  const concluidas = useJogo((s) => s.licoesConcluidas)
  const escolher = useJogo((s) => s.escolherMateria)

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navegar(-1)}
          className="rounded-lg p-1 text-texto-suave hover:bg-superficie-2"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.6} />
        </button>
        <h1 className="text-2xl font-extrabold">Matérias</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MATERIAS.map((m, i) => {
          const disponivel = materiaDisponivel(m)
          const { feitas, total } = contarConcluidas(m, concluidas)
          const selecionada = m.id === atual
          return (
            <motion.button
              key={m.id}
              type="button"
              disabled={!disponivel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                escolher(m.id)
                navegar('/')
              }}
              className={`relative flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-[transform,box-shadow] duration-75 ${
                !disponivel
                  ? 'border-borda bg-superficie-2'
                  : selecionada
                    ? 'border-agua bg-agua/10 shadow-[0_4px_0_0_var(--color-agua)] active:translate-y-1 active:shadow-none'
                    : 'border-borda bg-superficie shadow-[0_4px_0_0_var(--borda)] hover:bg-superficie-2 active:translate-y-1 active:shadow-none'
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  disponivel ? 'bg-agua text-white' : 'bg-apagado text-apagado-texto'
                }`}
              >
                <IconeMateria nome={m.icone} className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className={`text-lg font-extrabold ${disponivel ? '' : 'text-apagado-texto'}`}>{m.nome}</span>
                  {selecionada && <Check className="h-5 w-5 text-agua" strokeWidth={3.5} />}
                </span>
                <span className="mt-0.5 block text-sm text-texto-suave">{m.descricao}</span>
                {disponivel ? (
                  <span className="mt-3 flex items-center gap-2">
                    <BarraProgresso valor={feitas / total} altura="fina" rotulo={`Progresso em ${m.nome}`} />
                    <span className="shrink-0 text-xs font-bold text-texto-suave">
                      {feitas}/{total}
                    </span>
                  </span>
                ) : (
                  <span className="mt-3 inline-block rounded-full bg-laranja/15 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-laranja-escura">
                    Em breve
                  </span>
                )}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
