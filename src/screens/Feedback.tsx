import { AnimatePresence, motion } from 'framer-motion'
import { Bug, FileWarning, Heart, Lightbulb, MessageSquareHeart, Star, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { enviarFeedback, MAX_CARACTERES, meusFeedbacks, type Feedback as ItemFeedback, type TipoFeedback } from '../lib/feedback'
import { Botao } from '../components/Botao'
import { Lapio } from '../components/Lapio'

const TIPOS: { valor: TipoFeedback; rotulo: string; Icone: LucideIcon; cor: string; dica: string }[] = [
  { valor: 'sugestao', rotulo: 'Sugestão', Icone: Lightbulb, cor: '#f59e0b', dica: 'O que você gostaria de ver no DuoMed?' },
  { valor: 'problema', rotulo: 'Problema', Icone: Bug, cor: '#ef4444', dica: 'O que aconteceu? Em qual tela? O que você esperava?' },
  { valor: 'conteudo', rotulo: 'Questão errada', Icone: FileWarning, cor: '#8b5cf6', dica: 'Qual matéria e qual questão? O que está errado?' },
  { valor: 'elogio', rotulo: 'Elogio', Icone: Heart, cor: '#14b8a6', dica: 'Conta o que você mais gostou!' },
]

const NOMES_NOTA = ['', 'Ruim', 'Pode melhorar', 'Bom', 'Muito bom', 'Excelente!']

/** Aba de feedback: a pessoa avalia o app e manda sugestões, problemas ou elogios */
export function Feedback() {
  const [tipo, setTipo] = useState<TipoFeedback>('sugestao')
  const [nota, setNota] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [historico, setHistorico] = useState<ItemFeedback[]>([])

  useEffect(() => {
    meusFeedbacks().then(setHistorico)
  }, [])

  const tipoAtual = TIPOS.find((t) => t.valor === tipo)!
  const podeEnviar = mensagem.trim().length >= 3 && !enviando

  async function enviar() {
    setErro(null)
    setEnviando(true)
    try {
      await enviarFeedback(tipo, mensagem, nota)
      setEnviado(true)
      setMensagem('')
      setNota(null)
      setHistorico(await meusFeedbacks())
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <motion.span
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-agua text-white shadow-[0_4px_0_0_var(--color-agua-escura)]"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        >
          <MessageSquareHeart className="h-9 w-9" strokeWidth={2.2} />
        </motion.span>
        <h1 className="mt-3 text-2xl font-extrabold">Feedback</h1>
        <p className="max-w-md text-texto-suave">
          Conte o que achou do DuoMed, o que pode melhorar ou se achou algum erro. A gente lê tudo!
        </p>
      </div>

      <AnimatePresence mode="wait">
        {enviado ? (
          <motion.div
            key="obrigado"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-borda bg-superficie p-6 text-center"
          >
            <Lapio humor="festa" altura={100} />
            <p className="text-xl font-extrabold">Obrigado pelo feedback!</p>
            <p className="text-texto-suave">Recebemos sua mensagem. Ela ajuda a deixar o DuoMed cada vez melhor.</p>
            <Botao tamanho="md" variante="contorno" onClick={() => setEnviado(false)}>
              Enviar outro
            </Botao>
          </motion.div>
        ) : (
          <motion.div key="formulario" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Nota do app */}
            <div className="mt-6 rounded-2xl border-2 border-borda bg-superficie p-4">
              <p className="font-extrabold">Como você avalia o DuoMed?</p>
              <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Nota">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={nota === n}
                    aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
                    onClick={() => setNota(nota === n ? null : n)}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Star
                      className={`h-9 w-9 ${nota !== null && n <= nota ? 'text-laranja' : 'text-apagado'}`}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </motion.button>
                ))}
                <span className="ml-2 text-sm font-bold text-texto-suave">{nota ? NOMES_NOTA[nota] : 'Opcional'}</span>
              </div>
            </div>

            {/* Tipo */}
            <p className="mb-2 mt-5 font-extrabold">Sobre o que você quer falar?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Tipo de feedback">
              {TIPOS.map(({ valor, rotulo, Icone, cor }) => {
                const ativo = valor === tipo
                return (
                  <motion.button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    onClick={() => setTipo(valor)}
                    whileTap={{ scale: 0.96 }}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-sm font-extrabold transition-colors ${
                      ativo ? 'bg-superficie' : 'border-borda bg-superficie text-texto-suave hover:bg-superficie-2'
                    }`}
                    style={ativo ? { borderColor: cor, color: cor, boxShadow: `0 3px 0 0 ${cor}` } : undefined}
                  >
                    <Icone className="h-6 w-6" strokeWidth={2.4} />
                    {rotulo}
                  </motion.button>
                )
              })}
            </div>

            {/* Mensagem */}
            <div className="mt-5">
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value.slice(0, MAX_CARACTERES))}
                placeholder={tipoAtual.dica}
                rows={5}
                className="w-full resize-none rounded-2xl border-2 border-borda bg-superficie p-4 font-semibold outline-none focus:border-agua"
              />
              <p className="mt-1 text-right text-xs font-semibold text-texto-suave tabular-nums">
                {mensagem.length}/{MAX_CARACTERES}
              </p>
            </div>

            {erro && <p className="mb-2 text-center text-sm font-bold text-erro-texto">{erro}</p>}
            <Botao larguraTotal disabled={!podeEnviar} onClick={enviar}>
              {enviando ? 'Enviando...' : 'Enviar feedback'}
            </Botao>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Histórico */}
      {historico.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl font-extrabold">Seus feedbacks</h2>
          <ul className="flex flex-col gap-3">
            {historico.map((f) => {
              const t = TIPOS.find((x) => x.valor === f.tipo) ?? TIPOS[0]
              return (
                <li key={f.id} className="rounded-2xl border-2 border-borda bg-superficie p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white"
                      style={{ background: t.cor }}
                    >
                      <t.Icone className="h-3.5 w-3.5" strokeWidth={2.6} />
                      {t.rotulo}
                    </span>
                    {f.nota && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-laranja-escura dark:text-laranja">
                        <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} /> {f.nota}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-semibold text-texto-suave">
                      {new Date(f.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{f.mensagem}</p>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
