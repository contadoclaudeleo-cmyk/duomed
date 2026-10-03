import { motion } from 'framer-motion'
import { Flame, Zap } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { buscarMateria } from '../data'
import { ofensivaVigente } from '../lib/ofensiva'
import { chaveDia } from '../lib/datas'
import { ContadorVidas } from './ContadorVidas'
import { IconeMateria } from './IconeMateria'
import { NumeroAnimado } from './Animacoes'

// Último valor mostrado de cada contador. Fica fora do componente para lembrar
// entre uma tela e outra: ao voltar de uma lição, o XP sobe contando.
const ultimosVistos: Record<string, number> = {}

/** Topo da trilha: matéria atual (toque para trocar), ofensiva, XP e vidas */
export function BarraStatus() {
  const materia = buscarMateria(useJogo((s) => s.materiaAtual))
  const ofensiva = ofensivaVigente(useJogo((s) => s.ofensiva))
  const xpTotal = useJogo((s) => s.xpTotal)
  const meta = useJogo((s) => s.usuario?.metaDiaria ?? 20)
  const xpHoje = useJogo((s) => s.xpPorDia[chaveDia()] ?? 0)
  const metaBatida = xpHoje >= meta

  return (
    <header className="sticky top-0 z-20 border-b-2 border-borda bg-fundo">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
        <Link
          to="/materias"
          className="flex items-center gap-2 rounded-xl border-2 border-borda px-2.5 py-1.5 font-bold transition-colors hover:bg-superficie-2"
          aria-label={`Matéria atual: ${materia?.nome}. Trocar matéria`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-agua text-white">
            <IconeMateria nome={materia?.icone ?? ''} className="h-4 w-4" />
          </span>
          <span className="max-w-32 truncate text-sm sm:max-w-none">{materia?.nome}</span>
        </Link>

        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-1 font-extrabold ${metaBatida ? 'text-laranja' : 'text-apagado-texto'}`}
            title="Ofensiva: dias seguidos batendo a meta"
            aria-label={`Ofensiva de ${ofensiva} dias`}
          >
            <ContadorQueSobe chave="ofensiva" valor={ofensiva}>
              {/* Com a meta batida, o fogo fica tremulando */}
              <motion.span
                className="block"
                style={{ transformOrigin: '50% 90%' }}
                animate={metaBatida ? { scaleY: [1, 1.12, 0.96, 1], rotate: [0, -4, 3, 0] } : { scaleY: 1, rotate: 0 }}
                transition={metaBatida ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
              >
                <Flame className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
              </motion.span>
            </ContadorQueSobe>
          </span>
          <span className="flex items-center gap-1 font-extrabold text-laranja-escura dark:text-laranja" aria-label={`${xpTotal} XP`}>
            <ContadorQueSobe chave="xp" valor={xpTotal}>
              <Zap className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
            </ContadorQueSobe>
          </span>
          <ContadorVidas />
        </div>
      </div>
    </header>
  )
}

/** Ícone + número. Se o valor mudou desde a última vez na tela, o ícone pula e o número sobe contando. */
function ContadorQueSobe({ chave, valor, children }: { chave: string; valor: number; children: ReactNode }) {
  // Guardado uma vez ao montar, para a contagem não reiniciar se a tela atualizar
  const [de] = useState(() => ultimosVistos[chave] ?? valor)
  const subiu = valor > de

  useEffect(() => {
    ultimosVistos[chave] = valor
  }, [chave, valor])

  return (
    <>
      <motion.span
        className="block"
        animate={subiu ? { scale: [1, 1.45, 1], rotate: [0, 12, 0] } : { scale: 1 }}
        transition={{ duration: 0.55, delay: 0.35 }}
      >
        {children}
      </motion.span>
      <NumeroAnimado valor={valor} de={subiu ? de : valor} atraso={0.3} duracao={0.8} />
    </>
  )
}
