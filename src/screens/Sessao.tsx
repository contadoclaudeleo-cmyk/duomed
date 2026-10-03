import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardCheck, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ModoSessao, Questao as TQuestao, Resposta } from '../types'
import { useJogo } from '../store/useJogo'
import { corrigir, respostaCompleta, textoRespostaCorreta } from '../lib/correcao'
import type { RespostaDada } from '../lib/xp'
import { BarraProgresso } from '../components/BarraProgresso'
import { Botao } from '../components/Botao'
import { ContadorVidas } from '../components/ContadorVidas'
import { Modal } from '../components/Modal'
import { PainelFeedback } from '../components/PainelFeedback'
import { AvisoSemVidas } from '../components/AvisoSemVidas'
import { Questao } from '../components/questoes/Questao'

export interface ItemSessao {
  questao: TQuestao
  materiaId: string
}

interface Props {
  modo: ModoSessao
  titulo: string
  itens: ItemSessao[]
  licaoId?: string
  /** Só no teste de nível: recebe as respostas no fim, sem XP nem estatísticas */
  aoTerminar?: (respostas: RespostaDada[]) => void
}

/**
 * Motor de uma sessão de questões. Serve tanto para lições da trilha
 * quanto para a revisão (no modo revisão, errar não gasta vida) e para o
 * teste de nível (não gasta vida, não dá XP e não entra nas estatísticas).
 */
export function Sessao({ modo, titulo, itens, licaoId, aoTerminar }: Props) {
  const navegar = useNavigate()
  const responder = useJogo((s) => s.responder)
  const concluirSessao = useJogo((s) => s.concluirSessao)
  const vidas = useJogo((s) => s.vidas)

  const [indice, setIndice] = useState(0)
  const [resposta, setResposta] = useState<Resposta | null>(null)
  const [verificada, setVerificada] = useState(false)
  const [acertou, setAcertou] = useState(false)
  const [respostas, setRespostas] = useState<RespostaDada[]>([])
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [semVidas, setSemVidas] = useState(false)
  const inicio = useRef(Date.now())

  const item = itens[indice]
  const podeVerificar = !verificada && respostaCompleta(item.questao, resposta)
  const progresso = (indice + (verificada ? 1 : 0)) / itens.length

  const verificar = useCallback(() => {
    if (!podeVerificar) return
    const certo = corrigir(item.questao, resposta)
    setAcertou(certo)
    setVerificada(true)
    setRespostas((r) => [...r, { questao: item.questao, acertou: certo, resposta }])
    // Salva na hora: estatísticas, fila de revisão e perda de vida
    if (modo !== 'nivelamento') responder({ questao: item.questao, materiaId: item.materiaId, acertou: certo, modo })
  }, [podeVerificar, item, resposta, responder, modo])

  const continuar = useCallback(() => {
    if (!verificada) return

    // Lição sem vidas: para por aqui, sem XP
    if (modo === 'licao' && useJogo.getState().vidas <= 0) {
      setSemVidas(true)
      return
    }

    if (indice + 1 >= itens.length) {
      if (modo === 'nivelamento') return aoTerminar?.(respostas)
      concluirSessao({ modo, titulo, licaoId, respostas, tempoMs: Date.now() - inicio.current })
      navegar('/resultado', { replace: true })
      return
    }

    setIndice((i) => i + 1)
    setResposta(null)
    setVerificada(false)
  }, [verificada, modo, indice, itens.length, concluirSessao, titulo, licaoId, respostas, navegar, aoTerminar])

  // Enter verifica ou continua (para quem usa teclado no computador)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || confirmarSaida || semVidas) return
      e.preventDefault()
      if (verificada) continuar()
      else verificar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [verificada, verificar, continuar, confirmarSaida, semVidas])

  const sair = () => {
    // Quem sai do teste de nível começa no fácil
    if (modo === 'nivelamento') useJogo.getState().definirNivel('facil')
    navegar(modo === 'revisao' ? '/revisao' : '/', { replace: true })
  }

  return (
    <div className="flex h-dvh flex-col bg-fundo">
      {/* Topo: fechar, progresso e vidas */}
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 pb-2 pt-5">
        <button
          type="button"
          onClick={() => setConfirmarSaida(true)}
          className="rounded-lg p-1 text-texto-suave transition-colors hover:bg-superficie-2"
          aria-label="Sair da sessão"
        >
          <X className="h-7 w-7" strokeWidth={2.6} />
        </button>
        <div className="flex-1">
          <BarraProgresso valor={progresso} rotulo="Progresso da lição" />
        </div>
        {modo === 'licao' ? (
          <ContadorVidas />
        ) : (
          <span className="flex items-center gap-1 text-sm font-extrabold text-agua-texto dark:text-menta">
            {modo === 'revisao' ? (
              <RotateCcw className="h-5 w-5" strokeWidth={2.6} />
            ) : (
              <ClipboardCheck className="h-5 w-5" strokeWidth={2.6} />
            )}
            {modo === 'revisao' ? 'Revisão' : 'Teste'}
          </span>
        )}
      </header>

      {/* Questão atual */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.questao.id}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.2 }}
            >
              <Questao
                questao={item.questao}
                resposta={resposta}
                aoResponder={setResposta}
                verificada={verificada}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Rodapé: botão Verificar ou painel de feedback */}
      <footer className="shrink-0">
        {verificada ? (
          <PainelFeedback
            key={item.questao.id}
            acertou={acertou}
            explicacao={item.questao.explicacao}
            respostaCorreta={textoRespostaCorreta(item.questao, resposta)}
            aoContinuar={continuar}
          />
        ) : (
          <div className="pb-seguro border-t-2 border-borda">
            <div className="mx-auto flex max-w-2xl justify-end px-4 py-5">
              <Botao onClick={verificar} disabled={!podeVerificar} className="w-full sm:w-44">
                Verificar
              </Botao>
            </div>
          </div>
        )}
      </footer>

      <Modal aberto={confirmarSaida} aoFechar={() => setConfirmarSaida(false)}>
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-xl font-extrabold">Sair agora?</h2>
          <p className="text-texto-suave">
            {modo === 'licao'
              ? 'Você vai perder o progresso desta lição. As vidas perdidas não voltam.'
              : modo === 'revisao'
                ? 'Você pode continuar a revisão depois.'
                : 'Você começa no nível fácil e pode refazer o teste depois, pelo perfil.'}
          </p>
          <Botao larguraTotal onClick={() => setConfirmarSaida(false)}>
            Continuar estudando
          </Botao>
          <Botao larguraTotal variante="contorno" onClick={sair}>
            Sair
          </Botao>
        </div>
      </Modal>

      <Modal aberto={semVidas} aoFechar={sair}>
        <AvisoSemVidas aoVoltar={sair} />
      </Modal>

      {/* Leitores de tela: anuncia quantas vidas restam */}
      <span className="sr-only" aria-live="polite">
        {modo === 'licao' ? `${vidas} vidas restantes` : ''}
      </span>
    </div>
  )
}
