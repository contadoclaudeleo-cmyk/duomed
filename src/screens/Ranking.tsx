import { motion } from 'framer-motion'
import { Crown, RefreshCw, Trophy, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useJogo } from '../store/useJogo'
import { buscarRanking, diasParaFimDaSemana, xpDaSemana, type ResultadoRanking } from '../lib/ranking'
import { enviarAgora, useConta } from '../lib/nuvem'
import { useAgora } from '../lib/hooks'
import { Botao } from '../components/Botao'
import { Modal } from '../components/Modal'
import { PainelConta } from '../components/PainelConta'
import { Lapio } from '../components/Lapio'

const CORES_AVATAR = ['bg-[#8b5cf6]', 'bg-laranja', 'bg-[#3b82f6]', 'bg-[#ec4899]', 'bg-[#0f766e]', 'bg-[#64748b]']

// Ouro, prata e bronze para os três primeiros
const MEDALHAS: Record<number, string> = {
  1: 'bg-[#f5b301] text-white shadow-[0_3px_0_0_#c98f00]',
  2: 'bg-[#a8b4c0] text-white shadow-[0_3px_0_0_#7f8b97]',
  3: 'bg-[#c08457] text-white shadow-[0_3px_0_0_#9a6a45]',
}

function iniciais(nome: string) {
  const partes = nome.replace('.', '').trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

export function Ranking() {
  const logado = useConta((s) => !!s.sessao)
  const xpPorDia = useJogo((s) => s.xpPorDia)
  const agora = useAgora(60_000)
  const dias = diasParaFimDaSemana(agora)
  const meuXp = xpDaSemana(xpPorDia, agora)
  const [abrirConta, setAbrirConta] = useState(false)
  const [ranking, setRanking] = useState<ResultadoRanking | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(false)
    try {
      // Manda o XP mais recente antes, para a sua posição sair certa
      await enviarAgora()
      setRanking(await buscarRanking())
    } catch {
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (logado) carregar()
  }, [logado, carregar])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Cabeçalho */}
      <div className="flex flex-col items-center text-center">
        <motion.span
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5b301] text-white shadow-[0_4px_0_0_#c98f00]"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        >
          <Trophy className="h-9 w-9" strokeWidth={2.2} />
        </motion.span>
        <h1 className="mt-3 text-2xl font-extrabold">Ranking da semana</h1>
        <p className="text-texto-suave">
          Quem fizer mais XP até domingo fica no topo. Reinicia em {dias} {dias === 1 ? 'dia' : 'dias'}.
        </p>
      </div>

      {/* Seu XP da semana */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border-2 border-borda bg-superficie px-4 py-3">
        <span className="font-bold text-texto-suave">Seu XP nesta semana</span>
        <span className="text-lg font-extrabold text-laranja-escura dark:text-laranja">{meuXp} XP</span>
      </div>

      {!logado && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border-2 border-borda bg-superficie p-6 text-center">
          <Lapio altura={90} />
          <p className="text-lg font-extrabold">Entre no ranking</p>
          <p className="max-w-80 text-texto-suave">
            O ranking mostra quem tem conta no DuoMed. Crie a sua para competir com outros estudantes e salvar seu progresso.
          </p>
          <Botao tamanho="md" onClick={() => setAbrirConta(true)}>
            Criar conta ou entrar
          </Botao>
        </div>
      )}

      {logado && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-texto-suave">
              <UsersRound className="h-4 w-4" strokeWidth={2.6} />
              {ranking
                ? `${ranking.participantes} ${ranking.participantes === 1 ? 'estudante pontuou' : 'estudantes pontuaram'} nesta semana`
                : 'Carregando…'}
            </p>
            <button
              type="button"
              onClick={carregar}
              disabled={carregando}
              className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-bold text-agua-texto hover:bg-superficie-2 disabled:opacity-50 dark:text-menta"
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} strokeWidth={2.6} />
              Atualizar
            </button>
          </div>

          {erro && (
            <div className="mt-3 rounded-2xl border-2 border-borda bg-superficie p-4 text-center">
              <p className="font-bold">Não deu para carregar o ranking.</p>
              <p className="text-sm text-texto-suave">Confira a internet e toque em Atualizar.</p>
            </div>
          )}

          {!erro && ranking && <ListaRanking ranking={ranking} />}

          {!erro && !ranking && carregando && (
            <div className="mt-3 flex flex-col gap-2" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-superficie-2" />
              ))}
            </div>
          )}
        </>
      )}

      <p className="mt-4 text-center text-xs text-texto-suave">
        No ranking aparecem só o primeiro nome, a inicial do sobrenome e o XP da semana.
      </p>

      {!logado && (
        <Modal aberto={abrirConta} aoFechar={() => setAbrirConta(false)}>
          <h2 className="mb-4 text-center text-xl font-extrabold">Entrar no ranking</h2>
          <PainelConta />
        </Modal>
      )}
    </div>
  )
}

function ListaRanking({ ranking }: { ranking: ResultadoRanking }) {
  const { jogadores } = ranking
  const voce = jogadores.find((j) => j.ehVoce)
  // Quem não pontuou nesta semana aparece separado, embaixo da lista
  const lista = jogadores.filter((j) => j.xp > 0 || !j.ehVoce)
  const voceForaDaLista = voce && voce.xp === 0

  if (lista.length === 0) {
    return (
      <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border-2 border-borda bg-superficie p-6 text-center">
        <Lapio altura={80} />
        <p className="font-extrabold">Ninguém pontuou ainda nesta semana</p>
        <p className="text-sm text-texto-suave">Faça uma lição e seja o primeiro do ranking!</p>
      </div>
    )
  }

  return (
    <ol className="mt-3 overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
      {lista.map((j, i) => (
        <LinhaRanking key={`${j.posicao}-${j.nome}-${i}`} jogador={j} indice={i} />
      ))}
      {voceForaDaLista && (
        <>
          <li className="border-t-2 border-borda bg-superficie-2 py-1 text-center text-xs font-extrabold uppercase tracking-wide text-texto-suave">
            Você ainda não pontuou nesta semana
          </li>
          <LinhaRanking jogador={voce} indice={lista.length} />
        </>
      )}
    </ol>
  )
}

function LinhaRanking({ jogador: j, indice }: { jogador: { posicao: number; nome: string; xp: number; ehVoce: boolean }; indice: number }) {
  const medalha = j.xp > 0 ? MEDALHAS[j.posicao] : undefined
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(indice, 15) * 0.03 }}
      className={`flex items-center gap-3 border-b-2 border-borda px-4 py-3 last:border-b-0 ${j.ehVoce ? 'bg-acerto-fundo' : ''}`}
    >
      <span className="flex w-8 justify-center">
        {medalha ? (
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${medalha}`}>
            {j.posicao === 1 ? <Crown className="h-4 w-4" strokeWidth={2.6} /> : j.posicao}
          </span>
        ) : (
          <span className="font-extrabold text-texto-suave">{j.xp > 0 ? j.posicao : '–'}</span>
        )}
      </span>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
          j.ehVoce ? 'bg-agua' : CORES_AVATAR[indice % CORES_AVATAR.length]
        }`}
      >
        {iniciais(j.nome)}
      </span>
      <span className={`flex-1 truncate font-bold ${j.ehVoce ? 'text-acerto-texto' : ''}`}>
        {j.nome}
        {j.ehVoce && ' (você)'}
      </span>
      <span className="font-extrabold text-texto-suave">{j.xp} XP</span>
    </motion.li>
  )
}
