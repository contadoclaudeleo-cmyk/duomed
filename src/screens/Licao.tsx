import { Navigate, useParams } from 'react-router-dom'
import { buscarLicao, nivelDaUnidade } from '../data'
import { useJogo } from '../store/useJogo'
import { statusDasLicoes } from '../lib/progresso'
import { iniciarLicao } from '../lib/estudo'
import { CarregarSessao } from '../components/CarregarSessao'
import { Sessao } from './Sessao'

/**
 * Tela de lição da trilha: pede a lição ao servidor e abre a sessão.
 * É o servidor que confere as vidas e o Plus (sem vidas, ele recusa).
 */
export function Licao() {
  const { licaoId = '' } = useParams()
  const local = buscarLicao(licaoId)
  const concluidas = useJogo((s) => s.licoesConcluidas)

  if (!local) return <Navigate to="/" replace />

  // Lição bloqueada não pode ser aberta pela URL
  const nivel = nivelDaUnidade(local.unidade)
  if (statusDasLicoes(local.materia, concluidas, nivel)[licaoId] === 'bloqueada') return <Navigate to="/" replace />

  return (
    <CarregarSessao key={licaoId} abrir={() => iniciarLicao(licaoId)}>
      {(s) => <Sessao modo="licao" titulo={local.licao.titulo} licaoId={local.licao.id} sessaoId={s.sessao} itens={s.questoes} />}
    </CarregarSessao>
  )
}
