import { motion } from 'framer-motion'
import { BookOpen, Check, ChevronDown, FileText, Flag, Lightbulb, X } from 'lucide-react'
import { useState } from 'react'
import { Botao } from './Botao'
import { Lapio } from './Lapio'
import { Modal } from './Modal'
import { fontesDaQuestao } from '../data/fontes'
import { enviarFeedback } from '../lib/feedback'

interface Props {
  questaoId: string
  /** Prova de onde a questão foi adaptada (ex.: "AMRIGS 2025") */
  prova?: string
  acertou: boolean
  explicacao: string
  respostaCorreta: string
  aoContinuar: () => void
  /**
   * Revisão no estilo Anki: depois de acertar, em vez de só "Continuar",
   * a pessoa escolhe Difícil, Bom ou Fácil (cada um mostra quando a questão volta).
   */
  avaliacao?: { nota: 'dificil' | 'bom' | 'facil'; rotulo: string; prazo: string }[]
  aoAvaliar?: (nota: 'dificil' | 'bom' | 'facil') => void
}

const CORES_NOTA = {
  dificil: 'bg-laranja shadow-[0_4px_0_0_var(--color-laranja-escura)]',
  bom: 'bg-agua shadow-[0_4px_0_0_var(--color-agua-escura)]',
  facil: 'bg-[#3b82f6] shadow-[0_4px_0_0_#1d4ed8]',
}

const ELOGIOS = ['Muito bem!', 'Mandou bem!', 'Exato!', 'Isso mesmo!', 'Perfeito!']

/** Faixa que sobe da parte de baixo depois de verificar a resposta */
export function PainelFeedback({
  questaoId,
  prova,
  acertou,
  explicacao,
  respostaCorreta,
  aoContinuar,
  avaliacao,
  aoAvaliar,
}: Props) {
  const [elogio] = useState(() => ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)])
  const titulo = acertou ? elogio : 'Não foi dessa vez'
  // O comentário só aparece se a pessoa pedir
  const [mostrarResolucao, setMostrarResolucao] = useState(false)
  const [reportar, setReportar] = useState(false)
  const fontes = fontesDaQuestao(questaoId)

  return (
    <>
    <Modal aberto={reportar} aoFechar={() => setReportar(false)}>
      <ReportarErro questaoId={questaoId} aoFechar={() => setReportar(false)} />
    </Modal>
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className={`pb-seguro border-t-2 ${acertou ? 'border-agua/30 bg-acerto-fundo' : 'border-erro/30 bg-erro-fundo'}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex flex-1 gap-3">
          <Lapio humor={acertou ? 'acerto' : 'erro'} altura={64} className="shrink-0" />
          <div className={`flex-1 ${acertou ? 'text-acerto-texto' : 'text-erro-texto'}`}>
            <div className="flex items-center gap-2">
              <motion.span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${acertou ? 'bg-agua' : 'bg-erro'} text-white`}
                initial={{ scale: 0, rotate: acertou ? -120 : 0 }}
                animate={acertou ? { scale: 1, rotate: 0 } : { scale: 1, rotate: [0, -14, 12, -8, 0] }}
                transition={{
                  scale: { type: 'spring', stiffness: 480, damping: 14, delay: 0.12 },
                  // Mola só aceita dois valores; o balanço do erro usa animação comum
                  rotate: acertou ? { type: 'spring', stiffness: 300, damping: 15, delay: 0.12 } : { duration: 0.5, delay: 0.25 },
                }}
              >
                {acertou ? <Check className="h-5 w-5" strokeWidth={3.5} /> : <X className="h-5 w-5" strokeWidth={3.5} />}
              </motion.span>
              <motion.h3
                className="text-xl font-extrabold"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18, duration: 0.25 }}
              >
                {titulo}
              </motion.h3>
            </div>
            {!acertou && (
              <p className="mt-2 font-bold">
                Resposta correta: <span className="font-semibold">{respostaCorreta}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => setMostrarResolucao((m) => !m)}
              aria-expanded={mostrarResolucao}
              className={`mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold transition-colors ${
                acertou ? 'border-agua/40 hover:bg-agua/10' : 'border-erro/40 hover:bg-erro/10'
              }`}
            >
              <Lightbulb className="h-4 w-4" strokeWidth={2.6} aria-hidden />
              {mostrarResolucao ? 'Esconder resolução' : 'Ver resolução'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mostrarResolucao ? 'rotate-180' : ''}`}
                strokeWidth={2.6}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => setReportar(true)}
              className="ml-2 mt-2 inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-texto-suave hover:bg-black/5"
            >
              <Flag className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
              Reportar erro
            </button>
            {mostrarResolucao && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 max-h-48 overflow-y-auto text-sm leading-relaxed text-texto"
              >
                <p>{explicacao}</p>
                {prova && (
                  <p className="mt-2 flex gap-1.5 text-xs text-texto-suave">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} aria-hidden />
                    <span>
                      <strong>Adaptada da prova:</strong> {prova}.
                    </span>
                  </p>
                )}
                {fontes.length > 0 && (
                  <p className="mt-2 flex gap-1.5 text-xs text-texto-suave">
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} aria-hidden />
                    <span>
                      <strong>Bibliografia da matéria:</strong> {fontes.join('; ')}. Questão ainda não revisada por médico.
                    </span>
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
        {acertou && avaliacao && aoAvaliar ? (
          <div className="w-full sm:w-auto">
            <p className="mb-2 text-center text-xs font-extrabold uppercase tracking-wide text-acerto-texto sm:text-right">
              Como foi? A questão volta em…
            </p>
            <div className="grid grid-cols-3 gap-2 sm:w-96">
              {avaliacao.map(({ nota, rotulo, prazo }) => (
                <button
                  key={nota}
                  type="button"
                  onClick={() => {
                    aoAvaliar(nota)
                    aoContinuar()
                  }}
                  className={`flex flex-col items-center rounded-2xl px-2 py-2.5 font-extrabold text-white transition-transform active:translate-y-1 active:shadow-none ${CORES_NOTA[nota]}`}
                >
                  <span className="text-sm uppercase tracking-wide">{rotulo}</span>
                  <span className="text-xs font-bold opacity-90">{prazo}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Botao variante={acertou ? 'primario' : 'perigo'} onClick={aoContinuar} className="w-full sm:w-44">
            Continuar
          </Botao>
        )}
      </div>
    </motion.div>
    </>
  )
}

/** Janela para avisar que a questão tem erro (vai para os feedbacks do Painel) */
function ReportarErro({ questaoId, aoFechar }: { questaoId: string; aoFechar: () => void }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<'escrevendo' | 'enviando' | 'enviado'>('escrevendo')
  const [erro, setErro] = useState<string | null>(null)

  async function enviar() {
    setErro(null)
    setEstado('enviando')
    try {
      await enviarFeedback('conteudo', texto, null, questaoId)
      setEstado('enviado')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.')
      setEstado('escrevendo')
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Lapio humor="festa" altura={90} />
        <h2 className="text-xl font-extrabold">Obrigado!</h2>
        <p className="text-texto-suave">Vamos conferir esta questão e corrigir se for o caso.</p>
        <Botao larguraTotal onClick={aoFechar}>
          Voltar para a questão
        </Botao>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" onKeyDown={(e) => e.stopPropagation()}>
      <h2 className="text-center text-xl font-extrabold">Reportar erro na questão</h2>
      <p className="text-center text-sm text-texto-suave">
        O que está errado? Se souber, diga a resposta certa e de onde ela vem (livro, diretriz, prova).
      </p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, 2000))}
        rows={5}
        placeholder="Ex.: a resposta certa é B, segundo a diretriz da SBC de 2020..."
        className="w-full resize-none rounded-2xl border-2 border-borda bg-superficie p-3 text-sm font-semibold outline-none focus:border-agua"
      />
      {erro && <p className="text-center text-sm font-bold text-erro-texto">{erro}</p>}
      <Botao larguraTotal disabled={texto.trim().length < 3 || estado === 'enviando'} onClick={enviar}>
        {estado === 'enviando' ? 'Enviando...' : 'Enviar'}
      </Botao>
      <Botao larguraTotal variante="contorno" onClick={aoFechar}>
        Cancelar
      </Botao>
    </div>
  )
}
