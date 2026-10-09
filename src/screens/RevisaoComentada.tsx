import { ArrowLeft, Check, CircleCheck, CircleX, Lightbulb, ListChecks, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { buscarLicao } from '../data'
import { useJogo } from '../store/useJogo'
import { arquivoPublico } from '../lib/caminho'
import { gabaritoLicao, mensagemDoErro } from '../lib/estudo'
import type { Questao, Resposta, TipoQuestao } from '../types'
import { Abas } from '../components/Abas'
import { Botao } from '../components/Botao'

/** Questão do gabarito. Sem `acertou`, a pessoa não respondeu (gabarito aberto pela trilha). */
interface ItemComentado {
  questao: Questao
  acertou?: boolean
  resposta?: Resposta | null
}

type Filtro = 'todas' | 'erradas'

const NOMES_TIPO: Record<TipoQuestao, string> = {
  multipla_escolha: 'Múltipla escolha',
  verdadeiro_falso: 'Verdadeiro ou falso',
  completar_lacuna: 'Complete a frase',
  associar_pares: 'Associe os pares',
  caso_clinico: 'Caso clínico',
  identificar_imagem: 'Identifique a estrutura',
}

/**
 * Revisão comentada (gabarito): cada questão com a resposta certa e o comentário.
 * /comentada mostra a sessão que acabou de terminar, com o que a pessoa marcou.
 * /comentada/:licaoId mostra as questões de uma lição da trilha (o servidor
 * só entrega as que a pessoa já respondeu).
 */
export function RevisaoComentada() {
  const { licaoId } = useParams()
  const navegar = useNavigate()
  const resultado = useJogo((s) => s.ultimoResultado)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [daLicao, setDaLicao] = useState<ItemComentado[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!licaoId) return
    let ativo = true
    gabaritoLicao(licaoId).then(
      (qs) => ativo && setDaLicao(qs.map((questao) => ({ questao }))),
      (e) => ativo && setErro(mensagemDoErro(e)),
    )
    return () => {
      ativo = false
    }
  }, [licaoId])

  let titulo: string
  let itens: ItemComentado[]
  if (licaoId) {
    const local = buscarLicao(licaoId)
    if (!local) return <Navigate to="/" replace />
    titulo = local.licao.titulo
    if (!daLicao) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          {erro ? (
            <>
              <p className="font-bold">{erro}</p>
              <Botao larguraTotal onClick={() => navegar(-1)}>
                Voltar
              </Botao>
            </>
          ) : (
            <Loader2 className="h-10 w-10 animate-spin text-agua" strokeWidth={2.6} aria-label="Carregando" />
          )}
        </div>
      )
    }
    itens = daLicao
  } else {
    if (!resultado) return <Navigate to="/" replace />
    titulo = resultado.titulo
    itens = resultado.respostas
  }

  const erradas = itens.filter((i) => i.acertou === false).length
  const visiveis = filtro === 'erradas' ? itens.filter((i) => i.acertou === false) : itens
  const voltar = () => navegar(-1)

  return (
    <div className="min-h-dvh bg-fundo">
      <header className="sticky top-0 z-10 border-b-2 border-borda bg-fundo/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={voltar}
            className="rounded-lg p-1 text-texto-suave transition-colors hover:bg-superficie-2"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-7 w-7" strokeWidth={2.6} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wide text-agua-texto dark:text-menta">
              Revisão comentada
            </p>
            <h1 className="truncate text-lg font-extrabold">{titulo}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5">
        {resultado && !licaoId && (
          <p className="text-sm font-semibold text-texto-suave">
            Você acertou {itens.length - erradas} de {itens.length}. Veja a resposta certa e o comentário de cada questão.
          </p>
        )}

        {erradas > 0 && (
          <Abas
            rotulo="Quais questões mostrar"
            valor={filtro}
            aoMudar={setFiltro}
            opcoes={[
              { valor: 'todas', rotulo: `Todas (${itens.length})`, Icone: ListChecks },
              { valor: 'erradas', rotulo: `Erradas (${erradas})`, Icone: CircleX },
            ]}
          />
        )}

        {visiveis.map((item) => (
          <CartaoQuestao key={item.questao.id} numero={itens.indexOf(item) + 1} item={item} />
        ))}

        <p className="px-2 text-center text-xs text-texto-suave">
          O conteúdo do DuoMed ainda está passando por revisão médica.
        </p>

        <Botao larguraTotal onClick={voltar}>
          Voltar
        </Botao>
      </main>
    </div>
  )
}

function CartaoQuestao({ numero, item }: { numero: number; item: ItemComentado }) {
  const { questao, acertou } = item

  return (
    <article className="overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
      <div className="flex items-center gap-2 border-b-2 border-borda px-4 py-2.5">
        <span className="font-extrabold">Questão {numero}</span>
        <span className="text-sm font-semibold text-texto-suave">· {NOMES_TIPO[questao.tipo]}</span>
        {acertou !== undefined && (
          <span
            className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
              acertou ? 'bg-acerto-fundo text-acerto-texto' : 'bg-erro-fundo text-erro-texto'
            }`}
          >
            {acertou ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
            {acertou ? 'Acertou' : 'Errou'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Enunciado questao={questao} />
        <Gabarito item={item} />

        <div className="rounded-xl bg-superficie-2 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-extrabold text-laranja-escura dark:text-laranja">
            <Lightbulb className="h-4 w-4" strokeWidth={2.6} /> Comentário
          </p>
          <p className="text-[15px] leading-relaxed">{questao.explicacao}</p>
        </div>
      </div>
    </article>
  )
}

function Enunciado({ questao }: { questao: Questao }) {
  if (questao.tipo === 'completar_lacuna') {
    // Mostra a frase já completa, com a palavra certa destacada
    const [antes, depois] = questao.enunciado.split('___')
    return (
      <p className="text-[17px] font-semibold leading-relaxed">
        {antes}
        <span className="rounded-md bg-acerto-fundo px-1.5 py-0.5 font-extrabold text-acerto-texto">
          {questao.resposta}
        </span>
        {depois}
      </p>
    )
  }

  return (
    <>
      {questao.tipo === 'caso_clinico' && (
        <p className="rounded-xl border-l-4 border-agua bg-agua/10 p-3 text-[15px] leading-relaxed">{questao.caso}</p>
      )}
      {questao.tipo === 'identificar_imagem' && <ImagemQuestao imagem={questao.imagem} credito={questao.creditoImagem} />}
      <p className="text-[17px] font-bold leading-snug">{questao.enunciado}</p>
    </>
  )
}

function ImagemQuestao({ imagem, credito }: { imagem?: string; credito?: string }) {
  const placeholder = arquivoPublico('questoes/placeholder.svg')
  const [falhou, setFalhou] = useState(false)
  const src = !imagem || falhou ? placeholder : arquivoPublico(imagem)
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border-2 border-borda bg-white p-2">
        <img src={src} onError={() => setFalhou(true)} alt="Imagem da questão" className="mx-auto max-h-56 w-full object-contain" />
      </div>
      {credito && src !== placeholder && (
        <figcaption className="mt-1 text-right text-[11px] text-texto-suave">{credito}</figcaption>
      )}
    </figure>
  )
}

/** Alternativas com a certa em verde e, se a pessoa errou, a marcada por ela em vermelho */
function Gabarito({ item }: { item: ItemComentado }) {
  const { questao, resposta } = item

  if (questao.tipo === 'associar_pares') {
    const ligacoes = resposta && typeof resposta === 'object' ? resposta : null
    return (
      <ul className="flex flex-col gap-2">
        {questao.pares.map((par) => {
          const ligouErrado = ligacoes !== null && ligacoes[par.esquerda] !== par.direita
          return (
            <li key={par.esquerda} className="rounded-xl border-2 border-agua/40 bg-acerto-fundo/50 px-3 py-2 text-sm">
              <span className="font-bold">{par.esquerda}</span>
              <span className="text-texto-suave"> → </span>
              <span className="font-bold text-acerto-texto">{par.direita}</span>
              {ligouErrado && (
                <span className="mt-1 flex items-start gap-1 text-erro-texto">
                  <X className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} /> Você ligou com: {ligacoes?.[par.esquerda]}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  // Completar lacuna já mostra a resposta na frase; aqui só aparece o que a pessoa marcou, se errou
  if (questao.tipo === 'completar_lacuna') {
    if (typeof resposta !== 'string' || resposta === questao.resposta) return null
    return (
      <ul>
        <Opcao texto={resposta} estado="marcada-errada" />
      </ul>
    )
  }

  const opcoes =
    questao.tipo === 'verdadeiro_falso'
      ? [
          { texto: 'Verdadeiro', valor: true as Resposta, certa: questao.resposta === true },
          { texto: 'Falso', valor: false as Resposta, certa: questao.resposta === false },
        ]
      : questao.opcoes.map((o) => ({ texto: o, valor: o as Resposta, certa: o === questao.resposta }))

  return (
    <ul className="flex flex-col gap-2">
      {opcoes.map((o) => (
        <Opcao
          key={o.texto}
          texto={o.texto}
          estado={o.certa ? 'certa' : resposta === o.valor ? 'marcada-errada' : 'neutra'}
        />
      ))}
    </ul>
  )
}

function Opcao({ texto, estado }: { texto: string; estado: 'certa' | 'marcada-errada' | 'neutra' }) {
  const estilo = {
    certa: 'border-agua bg-acerto-fundo text-acerto-texto font-bold',
    'marcada-errada': 'border-erro bg-erro-fundo text-erro-texto font-bold',
    neutra: 'border-borda text-texto-suave',
  }[estado]

  return (
    <li className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm ${estilo}`}>
      {estado === 'certa' && <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />}
      {estado === 'marcada-errada' && <X className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />}
      <span className="flex-1">{texto}</span>
      {estado === 'marcada-errada' && <span className="shrink-0 text-xs font-extrabold uppercase">Sua resposta</span>}
      {estado === 'certa' && <span className="shrink-0 text-xs font-extrabold uppercase">Correta</span>}
    </li>
  )
}
