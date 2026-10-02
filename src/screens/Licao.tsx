import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { buscarLicao, nivelDaUnidade } from '../data'
import { useJogo } from '../store/useJogo'
import { statusDasLicoes } from '../lib/progresso'
import { AvisoSemVidas } from '../components/AvisoSemVidas'
import { Sessao } from './Sessao'

/** Tela de lição da trilha: busca a lição pelo id da URL e abre a sessão */
export function Licao() {
  const { licaoId = '' } = useParams()
  const navegar = useNavigate()
  const local = buscarLicao(licaoId)
  const concluidas = useJogo((s) => s.licoesConcluidas)
  // Vidas no momento em que a lição foi aberta
  const [semVidasAoAbrir] = useState(() => {
    useJogo.getState().sincronizarVidas()
    return useJogo.getState().vidas <= 0
  })

  if (!local) return <Navigate to="/" replace />

  // Lição bloqueada não pode ser aberta pela URL
  const nivel = nivelDaUnidade(local.unidade)
  if (statusDasLicoes(local.materia, concluidas, nivel)[licaoId] === 'bloqueada') return <Navigate to="/" replace />

  if (semVidasAoAbrir) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-6">
        <AvisoSemVidas aoVoltar={() => navegar('/', { replace: true })} />
      </div>
    )
  }

  return (
    <Sessao
      modo="licao"
      titulo={local.licao.titulo}
      licaoId={local.licao.id}
      itens={local.licao.questoes.map((questao) => ({ questao, materiaId: local.materia.id }))}
    />
  )
}
