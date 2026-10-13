import { useSearchParams } from 'react-router-dom'
import { buscarMateria } from '../data'
import { iniciarTreino } from '../lib/estudo'
import { CarregarSessao } from '../components/CarregarSessao'
import { Sessao } from './Sessao'

/** Abre no servidor um treino com a área e a banca do endereço (sem elas, tudo misturado) */
export function TreinoSessao() {
  const [parametros] = useSearchParams()
  const materia = buscarMateria(parametros.get('materia') ?? '')
  const banca = parametros.get('banca')

  const partes = [materia?.nome, banca].filter(Boolean)
  const titulo = partes.length ? `Treino: ${partes.join(' · ')}` : 'Treino misturado'

  return (
    <CarregarSessao key={parametros.toString()} abrir={() => iniciarTreino(materia?.id ?? null, banca)} voltarPara="/treino">
      {(s) => <Sessao modo="treino" titulo={titulo} banca={banca} sessaoId={s.sessao} itens={s.questoes} />}
    </CarregarSessao>
  )
}
