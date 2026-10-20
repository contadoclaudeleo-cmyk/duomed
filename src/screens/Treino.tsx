import { motion } from 'framer-motion'
import { Check, FileText, Shuffle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MATERIAS, buscarMateria, materiaDisponivel } from '../data'
import { useJogo } from '../store/useJogo'
import { ehPlus } from '../lib/plus'
import { bancasDisponiveis, linkTreino, porcentagem, useEstatisticas, type Placar } from '../lib/estatisticas'
import { Botao } from '../components/Botao'
import { Modal } from '../components/Modal'
import { AvisoSemVidas } from '../components/AvisoSemVidas'
import { IconeMateria } from '../components/IconeMateria'

/** Treino por prova: escolhe a área e uma ou mais bancas (ou tudo misturado) e abre 10 questões */
export function Treino() {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const [materiaId, setMateriaId] = useState<string | null>(() => {
    const m = parametros.get('materia')
    return m && buscarMateria(m) ? m : null
  })
  const [escolhidas, setEscolhidas] = useState<string[]>(() => parametros.getAll('banca'))
  const [semVidas, setSemVidas] = useState(false)
  const { resumo } = useEstatisticas()

  const areas = MATERIAS.filter(materiaDisponivel)
  const bancas = bancasDisponiveis(materiaId)
  // Bancas escolhidas que têm questões na área atual (as outras são ignoradas; nenhuma = misturado)
  const validas = escolhidas.filter((e) => bancas.some((b) => b.banca === e))
  const alternar = (b: string) =>
    setEscolhidas((atual) => (atual.includes(b) ? atual.filter((x) => x !== b) : [...atual, b]))

  const placarDaBanca = (b: string): Placar | undefined =>
    materiaId ? resumo?.porMateriaBanca[materiaId]?.[b] : resumo?.porBanca[b]

  function comecar() {
    useJogo.getState().sincronizarVidas()
    if (useJogo.getState().vidas <= 0 && !ehPlus()) return setSemVidas(true)
    navegar(linkTreino(materiaId, validas))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-agua/15 text-agua-texto dark:text-menta">
          <FileText className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <h1 className="text-2xl font-extrabold">Treino por prova</h1>
      </div>
      <p className="mb-6 text-sm text-texto-suave">
        10 questões de provas reais, escolhidas entre as que você ainda não viu. Vale como lição: errar gasta vida e
        terminar dá XP.
      </p>

      {/* Área */}
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-texto-suave">1. Área</h2>
      <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Chip ativo={materiaId === null} aoEscolher={() => setMateriaId(null)}>
          <Shuffle className="h-5 w-5 shrink-0" strokeWidth={2.4} />
          Todas as áreas
        </Chip>
        {areas.map((m) => (
          <Chip key={m.id} ativo={materiaId === m.id} aoEscolher={() => setMateriaId(m.id)}>
            <IconeMateria nome={m.icone} className="h-5 w-5 shrink-0" />
            <span className="truncate">{m.nome}</span>
          </Chip>
        ))}
      </div>

      {/* Banca */}
      <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-texto-suave">2. Provas</h2>
      <p className="mb-3 text-xs font-semibold text-texto-suave">Escolha uma ou mais. As questões vêm alternadas entre elas.</p>
      <Chip ativo={validas.length === 0} aoEscolher={() => setEscolhidas([])} grande>
        <Shuffle className="h-6 w-6 shrink-0" strokeWidth={2.4} />
        <span className="flex-1">
          <span className="block font-extrabold">Geral (misturado)</span>
          <span className="text-xs font-semibold text-texto-suave">Questões de todas as bancas</span>
        </span>
      </Chip>
      <div className="mt-2 mb-28 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {bancas.map(({ banca: b, questoes }, i) => {
          const pct = porcentagem(placarDaBanca(b))
          return (
            <motion.div
              key={b}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.02 }}
            >
              <Chip ativo={validas.includes(b)} aoEscolher={() => alternar(b)} marcador>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold">{b}</span>
                  <span className="text-xs font-semibold text-texto-suave">
                    {questoes} {questoes === 1 ? 'questão' : 'questões'}
                  </span>
                </span>
                {pct !== null && <SeloPorcentagem pct={pct} />}
              </Chip>
            </motion.div>
          )
        })}
      </div>

      {/* Botão fixo embaixo, acima da barra de navegação */}
      <div className="fixed inset-x-0 bottom-[calc(67px+env(safe-area-inset-bottom))] z-20 border-t-2 border-borda bg-fundo/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto max-w-2xl">
          <Botao larguraTotal onClick={comecar}>
            Começar treino
            {validas.length === 1 ? ` · ${validas[0]}` : validas.length > 1 ? ` · ${validas.length} provas` : ''}
          </Botao>
        </div>
      </div>

      <Modal aberto={semVidas} aoFechar={() => setSemVidas(false)}>
        <AvisoSemVidas aoVoltar={() => setSemVidas(false)} />
      </Modal>
    </div>
  )
}

/** Porcentagem de acerto com cor: verde (bom), laranja (médio) ou vermelho (fraco) */
export function SeloPorcentagem({ pct }: { pct: number }) {
  const cor = pct >= 70 ? 'bg-acerto-fundo text-acerto-texto' : pct >= 50 ? 'bg-laranja/15 text-laranja-escura' : 'bg-erro-fundo text-erro-texto'
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold ${cor}`}>{pct}%</span>
}

function Chip({
  ativo,
  aoEscolher,
  grande,
  marcador,
  children,
}: {
  ativo: boolean
  aoEscolher: () => void
  grande?: boolean
  /** Mostra a caixinha de marcar (para escolher várias) */
  marcador?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={aoEscolher}
      aria-pressed={ativo}
      className={`relative flex w-full items-center gap-2 rounded-2xl border-2 text-left text-sm font-bold transition-[transform,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none ${
        grande ? 'px-4 py-3' : 'px-3 py-2.5'
      } ${
        ativo
          ? 'border-agua bg-agua/10 text-agua-texto shadow-[0_3px_0_0_var(--color-agua)] dark:text-menta'
          : 'border-borda bg-superficie shadow-[0_3px_0_0_var(--borda)] hover:bg-superficie-2'
      }`}
    >
      {marcador && (
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
            ativo ? 'border-agua bg-agua text-white' : 'border-borda bg-superficie'
          }`}
        >
          {ativo && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
        </span>
      )}
      {children}
      {ativo && grande && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-agua text-white">
          <Check className="h-4 w-4" strokeWidth={4} />
        </span>
      )}
    </button>
  )
}
