import { motion } from 'framer-motion'
import { ChevronsDown, ChevronsUp, Shield } from 'lucide-react'
import { Fragment } from 'react'
import { useJogo } from '../store/useJogo'
import { diasParaFimDaLiga, gerarLiga, xpDaSemana, ZONA_PROMOCAO, ZONA_REBAIXAMENTO } from '../lib/ranking'
import { useAgora } from '../lib/hooks'

const CORES_AVATAR = ['bg-agua', 'bg-laranja', 'bg-tinta', 'bg-[#0f766e]', 'bg-[#b45309]', 'bg-[#64748b]']

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

export function Ranking() {
  const nome = useJogo((s) => s.usuario?.nome ?? 'Você')
  const xpPorDia = useJogo((s) => s.xpPorDia)
  const agora = useAgora(60_000)
  const liga = gerarLiga(nome, xpDaSemana(xpPorDia, agora), agora)
  const dias = diasParaFimDaLiga(agora)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c08457] text-white shadow-[0_4px_0_0_#9a6a45]">
          <Shield className="h-9 w-9" fill="currentColor" strokeWidth={1.5} />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold">Liga Bronze</h1>
        <p className="text-texto-suave">
          Os {ZONA_PROMOCAO} primeiros sobem de liga. Termina em {dias} {dias === 1 ? 'dia' : 'dias'}.
        </p>
      </div>

      <ol className="mt-6 overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
        {liga.map((j, i) => {
          const posicao = i + 1
          return (
            <Fragment key={j.id}>
              {posicao === liga.length - ZONA_REBAIXAMENTO + 1 && (
                <li className="flex items-center justify-center gap-2 border-y-2 border-borda bg-superficie-2 py-1.5 text-xs font-extrabold uppercase tracking-wide text-erro-texto">
                  <ChevronsDown className="h-4 w-4" /> Zona de rebaixamento
                </li>
              )}
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className={`flex items-center gap-3 px-4 py-3 ${j.ehVoce ? 'bg-acerto-fundo' : ''}`}
              >
                <span
                  className={`w-6 text-center font-extrabold ${
                    posicao <= ZONA_PROMOCAO ? 'text-agua-texto dark:text-menta' : 'text-texto-suave'
                  }`}
                >
                  {posicao}
                </span>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                    j.ehVoce ? 'bg-agua' : CORES_AVATAR[i % CORES_AVATAR.length]
                  }`}
                >
                  {iniciais(j.nome)}
                </span>
                <span className={`flex-1 truncate font-bold ${j.ehVoce ? 'text-acerto-texto' : ''}`}>
                  {j.nome}
                  {j.ehVoce && ' (você)'}
                </span>
                <span className="font-bold text-texto-suave">{j.xp} XP</span>
              </motion.li>
              {posicao === ZONA_PROMOCAO && (
                <li className="flex items-center justify-center gap-2 border-y-2 border-borda bg-superficie-2 py-1.5 text-xs font-extrabold uppercase tracking-wide text-agua-texto dark:text-menta">
                  <ChevronsUp className="h-4 w-4" /> Zona de promoção
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>

      <p className="mt-4 text-center text-xs text-texto-suave">
        Nesta versão os outros jogadores são fictícios. O ranking reinicia toda segunda-feira.
      </p>
    </div>
  )
}
