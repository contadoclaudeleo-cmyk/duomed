import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { materiaDisponivel, materiasDoModo } from '../data'
import type { CicloCurso, Materia } from '../types'
import { useJogo } from '../store/useJogo'
import { contarConcluidas } from '../lib/progresso'
import { BarraProgresso } from '../components/BarraProgresso'
import { IconeMateria } from '../components/IconeMateria'
import { AbasModo } from '../components/AbasModo'

const SUBTITULOS = {
  graduacao: 'Matérias do curso de medicina, do básico ao clínico.',
  residencia: 'As grandes áreas cobradas nas provas de residência, com foco em casos clínicos.',
}

const CICLOS: { ciclo: CicloCurso; titulo: string }[] = [
  { ciclo: 'basico', titulo: 'Ciclo básico' },
  { ciclo: 'clinico', titulo: 'Ciclo clínico' },
  { ciclo: 'internato', titulo: 'Internato' },
]

/** Na graduação, separa as matérias por ciclo do curso; na residência, é um grupo só */
function agrupar(materias: Materia[]): { titulo: string | null; materias: Materia[] }[] {
  if (!materias.some((m) => m.ciclo)) return [{ titulo: null, materias }]
  return CICLOS.map(({ ciclo, titulo }) => ({ titulo, materias: materias.filter((m) => m.ciclo === ciclo) })).filter(
    (g) => g.materias.length > 0,
  )
}

export function Materias() {
  const navegar = useNavigate()
  const atual = useJogo((s) => s.materiaAtual)
  const concluidas = useJogo((s) => s.licoesConcluidas)
  const escolher = useJogo((s) => s.escolherMateria)
  const nivel = useJogo((s) => s.nivel)
  // A aba começa no modo atual, mas dá para espiar o outro antes de escolher
  const [aba, setAba] = useState(useJogo.getState().modo)

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-5 flex items-center gap-3">
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

      <AbasModo valor={aba} aoMudar={setAba} />
      <p className="mb-5 mt-3 text-sm text-texto-suave">{SUBTITULOS[aba]}</p>

      {agrupar(materiasDoModo(aba)).map((grupo) => (
        <section key={`${aba}-${grupo.titulo ?? 'todas'}`} className="mb-6">
          {grupo.titulo && (
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-texto-suave">
              {grupo.titulo} <span className="font-bold">({grupo.materias.length})</span>
            </h2>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {grupo.materias.map((m, i) => {
              const disponivel = materiaDisponivel(m)
              const { feitas, total } = contarConcluidas(m, concluidas, nivel)
              const selecionada = m.id === atual
              return (
                <motion.button
                  key={`${aba}-${m.id}`}
                  type="button"
                  disabled={!disponivel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04 }}
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
        </section>
      ))}
    </div>
  )
}
