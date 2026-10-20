import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buscarMateria } from '../data'
import { iniciarTreino } from '../lib/estudo'
import { CarregarSessao } from '../components/CarregarSessao'
import { Sessao } from './Sessao'

/** Abre no servidor um treino com a área e as bancas do endereço (sem elas, tudo misturado) */
export function TreinoSessao() {
  const [parametros] = useSearchParams()
  const materia = buscarMateria(parametros.get('materia') ?? '')
  const chave = parametros.toString()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bancas = useMemo(() => parametros.getAll('banca'), [chave])

  const partes = [materia?.nome, bancas.join(' + ')].filter(Boolean)
  const titulo = partes.length ? `Treino: ${partes.join(' · ')}` : 'Treino misturado'

  return (
    <CarregarSessao key={chave} abrir={() => iniciarTreino(materia?.id ?? null, bancas)} voltarPara="/treino">
      {(s) => <Sessao modo="treino" titulo={titulo} banca={bancas} sessaoId={s.sessao} itens={s.questoes} />}
    </CarregarSessao>
  )
}
