import { CalendarClock, CircleCheck, RotateCcw, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { MAX_QUESTOES_POR_REVISAO, origemDoItem, proximaRevisao, questoesParaRevisar } from '../lib/revisao'
import { quandoRelativo } from '../lib/datas'
import { useAgora } from '../lib/hooks'
import type { ItemRevisao, OrigemRevisao } from '../types'
import { Botao } from '../components/Botao'
import { Lapio } from '../components/Lapio'

/** Tela de entrada da revisão: mostra as duas filas (erros e acertos) e inicia a sessão */
export function Revisao() {
  const fila = useJogo((s) => s.filaRevisao)
  const agora = useAgora(30_000)

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-8 text-center">
      <Lapio altura={130} />
      <h1 className="mt-4 text-2xl font-extrabold">Revisão</h1>
      <p className="mt-1 max-w-sm text-texto-suave">
        As questões que você errou e as que você acertou voltam aqui para fixar o conteúdo. Revisar não gasta vidas.
      </p>

      <div className="mt-6 flex w-full flex-col gap-3">
        <CartaoFila
          origem="erro"
          fila={fila}
          agora={agora}
          Icone={RotateCcw}
          titulo="Erros"
          subtitulo="Questões que você errou"
          corIcone="bg-laranja/15 text-laranja-escura"
          variante="secundario"
          vazio="Quando você errar uma questão, ela aparece aqui na hora."
        />
        <CartaoFila
          origem="acerto"
          fila={fila}
          agora={agora}
          Icone={CircleCheck}
          titulo="Acertos"
          subtitulo="Questões que você acertou, para não esquecer"
          corIcone="bg-agua/15 text-agua-texto dark:text-menta"
          variante="primario"
          vazio="As questões que você acertar nas lições voltam aqui depois de 3 dias."
        />
      </div>

      <div className="mt-10 w-full rounded-2xl border-2 border-borda p-4 text-left text-sm text-texto-suave">
        <p className="mb-1 font-extrabold text-texto">Como funciona</p>
        <p>
          <strong className="text-texto">Erros:</strong> a questão errada pode ser revisada na hora. Cada acerto empurra
          ela para mais longe: volta depois de 1 dia, de 3 dias e de 7 dias. Acertou de novo, ela sai da fila.
        </p>
        <p className="mt-2">
          <strong className="text-texto">Acertos:</strong> a questão acertada na lição volta depois de 3 dias e depois de
          7 dias. Acertou as duas vezes, ela sai da fila.
        </p>
        <p className="mt-2">Errou em qualquer momento, a questão vai para os erros e começa do zero.</p>
      </div>
    </div>
  )
}

interface PropsCartao {
  origem: OrigemRevisao
  fila: Record<string, ItemRevisao>
  agora: number
  Icone: LucideIcon
  titulo: string
  subtitulo: string
  corIcone: string
  variante: 'primario' | 'secundario'
  vazio: string
}

function CartaoFila({ origem, fila, agora, Icone, titulo, subtitulo, corIcone, variante, vazio }: PropsCartao) {
  const navegar = useNavigate()
  const daOrigem = Object.fromEntries(Object.entries(fila).filter(([, item]) => origemDoItem(item) === origem))
  const pendentes = questoesParaRevisar(daOrigem, agora).length
  const naFila = Object.keys(daOrigem).length
  const proxima = proximaRevisao(daOrigem)

  return (
    <div className="rounded-2xl border-2 border-borda bg-superficie p-4 text-left">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${corIcone}`}>
          <Icone className="h-6 w-6" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold">{titulo}</p>
          <p className="text-sm font-semibold text-texto-suave">{subtitulo}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold leading-none">{pendentes}</p>
          <p className="text-xs font-semibold text-texto-suave">para agora</p>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-texto-suave">
        {naFila === 0 ? (
          vazio
        ) : pendentes === 0 && proxima ? (
          <span className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" /> {naFila} na fila. Próxima {quandoRelativo(proxima, agora)}
          </span>
        ) : (
          `${naFila} na fila no total`
        )}
      </p>

      <Botao
        className="mt-3"
        larguraTotal
        tamanho="md"
        variante={variante}
        disabled={pendentes === 0}
        onClick={() => navegar(`/revisao/praticar?tipo=${origem === 'acerto' ? 'acertos' : 'erros'}`)}
      >
        {pendentes > 0 ? textoBotao(Math.min(pendentes, MAX_QUESTOES_POR_REVISAO)) : 'Tudo revisado'}
      </Botao>
    </div>
  )
}

const textoBotao = (n: number) => `Revisar ${n} ${n === 1 ? 'questão' : 'questões'}`
