import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { QuestaoAssociarPares } from '../../types'
import { embaralhar } from '../../lib/embaralhar'
import type { PropsQuestao } from './tipos'

type Lado = 'esquerda' | 'direita'

/**
 * Toque em um item de cada coluna para ligar os dois.
 * Itens ligados ganham o mesmo número. Toque de novo para desfazer.
 */
export function AssociarPares({ questao, resposta, aoResponder, verificada }: PropsQuestao<QuestaoAssociarPares>) {
  const esquerdas = useMemo(() => embaralhar(questao.pares.map((p) => p.esquerda)), [questao])
  const direitas = useMemo(() => embaralhar(questao.pares.map((p) => p.direita)), [questao])
  const [selecionado, setSelecionado] = useState<{ lado: Lado; texto: string } | null>(null)

  // Mapa esquerda -> direita das ligações feitas
  const ligacoes: Record<string, string> = resposta && typeof resposta === 'object' ? resposta : {}
  const gabarito = useMemo(
    () => Object.fromEntries(questao.pares.map((p) => [p.esquerda, p.direita])),
    [questao],
  )

  // Número de cada ligação, na ordem em que aparecem na coluna da esquerda
  const numeroDaLigacao = (esq: string) => {
    const ligadas = esquerdas.filter((e) => ligacoes[e])
    return ligadas.indexOf(esq) + 1
  }
  const esquerdaDe = (dir: string) => Object.keys(ligacoes).find((e) => ligacoes[e] === dir)

  function salvar(novas: Record<string, string>) {
    aoResponder(Object.keys(novas).length ? novas : null)
  }

  function tocar(lado: Lado, texto: string) {
    if (verificada) return
    const esq = lado === 'esquerda' ? texto : esquerdaDe(texto)

    // Tocar num item já ligado desfaz a ligação
    if (esq && ligacoes[esq]) {
      const novas = { ...ligacoes }
      delete novas[esq]
      salvar(novas)
      setSelecionado(null)
      return
    }

    if (!selecionado || selecionado.lado === lado) {
      setSelecionado(selecionado?.texto === texto ? null : { lado, texto })
      return
    }

    // Um de cada lado selecionado: liga os dois
    const [e, d] = lado === 'esquerda' ? [texto, selecionado.texto] : [selecionado.texto, texto]
    salvar({ ...ligacoes, [e]: d })
    setSelecionado(null)
  }

  function estilo(lado: Lado, texto: string) {
    const esq = lado === 'esquerda' ? texto : esquerdaDe(texto)
    const ligado = !!(esq && ligacoes[esq])
    if (verificada) {
      if (!ligado) return 'border-borda bg-superficie opacity-50'
      return gabarito[esq!] === ligacoes[esq!]
        ? 'border-agua bg-acerto-fundo text-acerto-texto'
        : 'border-erro bg-erro-fundo text-erro-texto'
    }
    if (selecionado?.lado === lado && selecionado.texto === texto)
      return 'border-agua bg-agua/10 text-agua-texto dark:text-menta shadow-[0_3px_0_0_var(--color-agua)]'
    if (ligado) return 'border-agua/60 bg-superficie-2 shadow-[0_3px_0_0_var(--borda)]'
    return 'border-borda bg-superficie shadow-[0_3px_0_0_var(--borda)] hover:bg-superficie-2'
  }

  function item(lado: Lado, texto: string) {
    const esq = lado === 'esquerda' ? texto : esquerdaDe(texto)
    const numero = esq && ligacoes[esq] ? numeroDaLigacao(esq) : 0
    return (
      <motion.button
        key={texto}
        type="button"
        disabled={verificada}
        onClick={() => tocar(lado, texto)}
        className={`relative flex min-h-16 w-full items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors duration-100 active:translate-y-[3px] active:shadow-none sm:text-base ${estilo(lado, texto)}`}
      >
        {numero > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agua text-xs font-bold text-white"
          >
            {numero}
          </motion.span>
        )}
        <span className="flex-1">{texto}</span>
      </motion.button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold leading-snug sm:text-2xl">{questao.enunciado}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">{esquerdas.map((t) => item('esquerda', t))}</div>
        <div className="flex flex-col gap-3">{direitas.map((t) => item('direita', t))}</div>
      </div>
      {!verificada && (
        <p className="text-center text-sm text-texto-suave">
          Toque em um item de cada coluna para formar um par.
        </p>
      )}
    </div>
  )
}
