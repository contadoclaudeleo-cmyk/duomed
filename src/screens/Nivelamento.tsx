import { motion } from 'framer-motion'
import { SignalHigh, SignalLow } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NivelDificuldade } from '../types'
import { materiasDoModo, NOMES_MODO, NOMES_NIVEL, unidadesDoNivel } from '../data'
import { useJogo } from '../store/useJogo'
import { embaralhar } from '../lib/embaralhar'
import type { RespostaDada } from '../lib/xp'
import { Botao } from '../components/Botao'
import { Lapio } from '../components/Lapio'
import { Sessao, type ItemSessao } from './Sessao'

// ============================================================
// Teste de nível
// 8 questões da trilha difícil do modo escolhido, de matérias variadas.
// Quem acerta 6 ou mais começa no nível difícil.
// ============================================================

export const QUESTOES_NO_TESTE = 8
export const ACERTOS_PARA_DIFICIL = 6

/** Sorteia as questões do teste, alternando entre as matérias */
function montarTeste(modo: 'graduacao' | 'residencia'): ItemSessao[] {
  const porMateria = materiasDoModo(modo)
    .map((m) => {
      // Usa a trilha difícil; se a matéria ainda não tiver, usa a fácil
      const unidades = unidadesDoNivel(m, 'dificil').length ? unidadesDoNivel(m, 'dificil') : unidadesDoNivel(m, 'facil')
      const questoes = unidades.flatMap((u) => u.licoes.flatMap((l) => l.questoes))
      return embaralhar(questoes.map((questao) => ({ questao, materiaId: m.id })))
    })
    .filter((lista) => lista.length > 0)

  const itens: ItemSessao[] = []
  for (let rodada = 0; itens.length < QUESTOES_NO_TESTE && porMateria.some((l) => l[rodada]); rodada++) {
    for (const lista of embaralhar(porMateria)) {
      if (lista[rodada] && itens.length < QUESTOES_NO_TESTE) itens.push(lista[rodada])
    }
  }
  return itens
}

export function Nivelamento() {
  const navegar = useNavigate()
  const modo = useJogo((s) => s.modo)
  const definirNivel = useJogo((s) => s.definirNivel)
  const [fase, setFase] = useState<'inicio' | 'teste' | 'resultado'>('inicio')
  const [itens] = useState(() => montarTeste(modo))
  const [acertos, setAcertos] = useState(0)

  function escolher(nivel: NivelDificuldade) {
    definirNivel(nivel)
    navegar('/', { replace: true })
  }

  function terminar(respostas: RespostaDada[]) {
    setAcertos(respostas.filter((r) => r.acertou).length)
    setFase('resultado')
  }

  if (fase === 'teste') {
    return <Sessao modo="nivelamento" titulo="Teste de nível" itens={itens} aoTerminar={terminar} />
  }

  if (fase === 'resultado') {
    const recomendado: NivelDificuldade = acertos >= ACERTOS_PARA_DIFICIL ? 'dificil' : 'facil'
    const outro: NivelDificuldade = recomendado === 'dificil' ? 'facil' : 'dificil'
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-12">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Lapio humor={recomendado === 'dificil' ? 'festa' : 'parado'} altura={140} />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">Resultado do teste</p>
            <h1 className="mt-1 text-3xl font-extrabold">
              {acertos} de {itens.length} acertos
            </h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-agua bg-agua/10 p-4 text-left"
          >
            {recomendado === 'dificil' ? (
              <SignalHigh className="h-9 w-9 shrink-0 text-agua" strokeWidth={2.4} />
            ) : (
              <SignalLow className="h-9 w-9 shrink-0 text-agua" strokeWidth={2.4} />
            )}
            <div>
              <p className="font-extrabold">Recomendamos o nível {NOMES_NIVEL[recomendado].toLowerCase()}</p>
              <p className="text-sm text-texto-suave">
                {recomendado === 'dificil'
                  ? 'Você foi bem nas questões de prova. Comece direto nos casos mais desafiadores.'
                  : 'Comece pelos conceitos e passe para o nível difícil quando se sentir pronto.'}
              </p>
            </div>
          </motion.div>
          <p className="text-xs text-texto-suave">Você pode trocar de nível a qualquer momento, na trilha ou no perfil.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Botao larguraTotal onClick={() => escolher(recomendado)}>
            Começar no nível {NOMES_NIVEL[recomendado].toLowerCase()}
          </Botao>
          <Botao larguraTotal variante="contorno" onClick={() => escolher(outro)}>
            Prefiro o nível {NOMES_NIVEL[outro].toLowerCase()}
          </Botao>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Lapio altura={140} />
        <h1 className="text-2xl font-extrabold">Vamos descobrir seu nível?</h1>
        <p className="text-texto-suave">
          São {itens.length} questões no estilo das provas de {NOMES_MODO[modo].toLowerCase()}, de matérias variadas. O
          teste não gasta vidas. Se acertar {ACERTOS_PARA_DIFICIL} ou mais, você começa no nível difícil.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Botao larguraTotal onClick={() => setFase('teste')} disabled={itens.length === 0}>
          Fazer o teste
        </Botao>
        <Botao larguraTotal variante="contorno" onClick={() => escolher('facil')}>
          Pular e começar no fácil
        </Botao>
      </div>
    </div>
  )
}
