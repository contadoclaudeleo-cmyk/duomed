import { useState } from 'react'
import { arquivoPublico } from '../../lib/caminho'
import type { QuestaoIdentificarImagem } from '../../types'
import { ListaOpcoes } from './ListaOpcoes'
import type { PropsQuestao } from './tipos'

const PLACEHOLDER = arquivoPublico('questoes/placeholder.svg')

export function IdentificarImagem({ questao, resposta, aoResponder, verificada }: PropsQuestao<QuestaoIdentificarImagem>) {
  // Se a imagem não existir, cai no placeholder
  const [falhou, setFalhou] = useState(false)
  const src = !questao.imagem || falhou ? PLACEHOLDER : arquivoPublico(questao.imagem)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">Identifique a estrutura</p>
      <figure>
        {/* Fundo sempre branco: as imagens anatômicas são feitas para fundo claro */}
        <div className="overflow-hidden rounded-2xl border-2 border-borda bg-white p-2">
          <img
            src={src}
            onError={() => setFalhou(true)}
            alt="Imagem anatômica da questão"
            className="mx-auto max-h-64 w-full object-contain"
          />
        </div>
        {questao.creditoImagem && src !== PLACEHOLDER && (
          <figcaption className="mt-1.5 text-right text-[11px] text-texto-suave">{questao.creditoImagem}</figcaption>
        )}
      </figure>
      <h2 className="text-lg font-bold leading-snug sm:text-xl">{questao.enunciado}</h2>
      <ListaOpcoes
        idQuestao={questao.id}
        opcoes={questao.opcoes}
        correta={questao.resposta}
        escolhida={typeof resposta === 'string' ? resposta : null}
        verificada={verificada}
        aoEscolher={aoResponder}
        emGrade
      />
    </div>
  )
}
