import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Bug,
  Clock,
  FileWarning,
  Heart,
  Lightbulb,
  MessageSquareHeart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buscarFeedbacks,
  buscarHorarios,
  buscarOnline,
  buscarPorDia,
  buscarResumo,
  ehAdmin,
  type DiaAdmin,
  type FeedbackAdmin,
  type HorarioAdmin,
  type OnlineAdmin,
  type ResumoAdmin,
} from '../lib/admin'
import { Abas } from '../components/Abas'
import { buscarQuestao } from '../data'
import { Lapio } from '../components/Lapio'

type Aba = 'geral' | 'horarios' | 'feedbacks'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TIPOS_FEEDBACK: Record<FeedbackAdmin['tipo'], { rotulo: string; Icone: LucideIcon; cor: string }> = {
  sugestao: { rotulo: 'Sugestão', Icone: Lightbulb, cor: '#f59e0b' },
  problema: { rotulo: 'Problema', Icone: Bug, cor: '#ef4444' },
  conteudo: { rotulo: 'Questão errada', Icone: FileWarning, cor: '#8b5cf6' },
  elogio: { rotulo: 'Elogio', Icone: Heart, cor: '#14b8a6' },
}

interface Dados {
  resumo: ResumoAdmin
  porDia: DiaAdmin[]
  horarios: HorarioAdmin[]
  feedbacks: FeedbackAdmin[]
  online: OnlineAdmin[]
}

/** Painel do administrador: números de uso, horários de pico e feedbacks */
export function Admin() {
  const navegar = useNavigate()
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [aba, setAba] = useState<Aba>('geral')
  const [dados, setDados] = useState<Dados | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const [resumo, porDia, horarios, feedbacks, online] = await Promise.all([
        buscarResumo(),
        buscarPorDia(),
        buscarHorarios(),
        buscarFeedbacks(),
        buscarOnline(),
      ])
      setDados({ resumo, porDia, horarios, feedbacks, online })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para carregar.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    ehAdmin().then((sim) => {
      setPermitido(sim)
      if (sim) carregar()
    })
  }, [carregar])

  if (permitido === false) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
        <Lapio altura={100} />
        <p className="text-lg font-extrabold">Área só para administradores</p>
        <button type="button" onClick={() => navegar('/')} className="font-bold text-agua-texto hover:underline dark:text-menta">
          Voltar para a trilha
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navegar(-1)}
          className="rounded-lg p-1 text-texto-suave hover:bg-superficie-2"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.6} />
        </button>
        <h1 className="flex flex-1 items-center gap-2 text-2xl font-extrabold">
          <ShieldCheck className="h-7 w-7 text-agua" /> Painel
        </h1>
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

      <Abas<Aba>
        rotulo="Seção do painel"
        valor={aba}
        aoMudar={setAba}
        opcoes={[
          { valor: 'geral', rotulo: 'Visão geral', Icone: BarChart3 },
          { valor: 'horarios', rotulo: 'Horários', Icone: Clock },
          { valor: 'feedbacks', rotulo: 'Feedbacks', Icone: MessageSquareHeart },
        ]}
      />

      {erro && (
        <div className="mt-4 rounded-2xl border-2 border-borda bg-superficie p-4 text-center">
          <p className="font-bold">{erro}</p>
          <p className="text-sm text-texto-suave">Se for a primeira vez, confira se o arquivo supabase/admin.sql foi rodado.</p>
        </div>
      )}

      {!dados && !erro && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-superficie-2" />
          ))}
        </div>
      )}

      {dados && aba === 'geral' && <VisaoGeral dados={dados} />}
      {dados && aba === 'horarios' && <MapaHorarios horarios={dados.horarios} />}
      {dados && aba === 'feedbacks' && <ListaFeedbacks feedbacks={dados.feedbacks} />}
    </div>
  )
}

function Cartao({ Icone, cor, valor, rotulo }: { Icone: LucideIcon; cor: string; valor: number; rotulo: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-borda bg-superficie p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: cor }}>
        <Icone className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <p className="mt-3 text-3xl font-extrabold tabular-nums">{valor}</p>
      <p className="text-sm font-semibold text-texto-suave">{rotulo}</p>
    </motion.div>
  )
}

function VisaoGeral({ dados }: { dados: Dados }) {
  const { resumo, porDia, online } = dados
  const maior = Math.max(1, ...porDia.map((d) => d.jogadores))

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Cartao Icone={Wifi} cor="#22c55e" valor={resumo.online_agora} rotulo="Online agora" />
        <Cartao Icone={Users} cor="#14b8a6" valor={resumo.entraram_hoje} rotulo="Entraram hoje" />
        <Cartao Icone={UserPlus} cor="#3b82f6" valor={resumo.contas_novas_hoje} rotulo="Contas novas hoje" />
        <Cartao Icone={Users} cor="#64748b" valor={resumo.contas_total} rotulo="Contas no total" />
        <Cartao Icone={Sparkles} cor="#8b5cf6" valor={resumo.plus_ativos} rotulo="Assinantes Plus" />
        <Cartao Icone={MessageSquareHeart} cor="#f59e0b" valor={resumo.feedbacks_total} rotulo="Feedbacks" />
      </div>

      {/* Gráfico dos últimos 30 dias */}
      <div className="mt-5 rounded-2xl border-2 border-borda bg-superficie p-4">
        <p className="font-extrabold">Jogadores por dia</p>
        <p className="text-sm text-texto-suave">Últimos 30 dias. Passe o dedo ou o mouse nas barras para ver o número.</p>
        <div className="mt-4 flex h-40 items-end gap-1">
          {porDia.map((d) => (
            <div
              key={d.dia}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${formatarDia(d.dia)}: ${d.jogadores} jogadores, ${d.contas_novas} contas novas`}
            >
              <motion.div
                className="w-full rounded-t-md bg-agua"
                initial={{ height: 0 }}
                animate={{ height: `${(d.jogadores / maior) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{ minHeight: d.jogadores > 0 ? 4 : 0 }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-tinta px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                {d.jogadores}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-texto-suave">
          <span>{porDia[0] && formatarDia(porDia[0].dia)}</span>
          <span>hoje</span>
        </div>
      </div>

      {/* Tabela dos dias */}
      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
        <table className="w-full text-sm">
          <thead className="bg-superficie-2 text-left text-xs uppercase tracking-wide text-texto-suave">
            <tr>
              <th className="px-4 py-2">Dia</th>
              <th className="px-4 py-2 text-right">Jogadores</th>
              <th className="px-4 py-2 text-right">Contas novas</th>
            </tr>
          </thead>
          <tbody>
            {[...porDia].reverse().slice(0, 14).map((d) => (
              <tr key={d.dia} className="border-t-2 border-borda">
                <td className="px-4 py-2 font-bold">{formatarDia(d.dia, true)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{d.jogadores}</td>
                <td className="px-4 py-2 text-right tabular-nums">{d.contas_novas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quem está online */}
      <div className="mt-5 rounded-2xl border-2 border-borda bg-superficie p-4">
        <p className="flex items-center gap-2 font-extrabold">
          <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> Online agora ({online.length})
        </p>
        {online.length === 0 ? (
          <p className="mt-2 text-sm text-texto-suave">Ninguém com o app aberto neste momento.</p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-borda">
            {online.map((o) => (
              <li key={o.email} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <strong>{o.nome ?? 'Sem nome'}</strong> <span className="text-texto-suave">{o.email}</span>
                </span>
                <span className="shrink-0 text-xs text-texto-suave">
                  {new Date(o.visto_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Tabela dia da semana x hora; quanto mais escuro, mais gente online */
function MapaHorarios({ horarios }: { horarios: HorarioAdmin[] }) {
  const valor = (dia: number, hora: number) => horarios.find((h) => h.dia_semana === dia && h.hora === hora)?.media ?? 0
  const maior = Math.max(0, ...horarios.map((h) => Number(h.media)))
  const pico = horarios.reduce<HorarioAdmin | null>((m, h) => (!m || Number(h.media) > Number(m.media) ? h : m), null)

  return (
    <div className="mt-4">
      <div className="rounded-2xl border-2 border-borda bg-superficie p-4">
        <p className="font-extrabold">Pessoas online por dia e horário</p>
        <p className="text-sm text-texto-suave">
          Média das últimas 4 semanas, no horário de Brasília. Quanto mais forte a cor, mais gente com o app aberto.
        </p>
        {pico && maior > 0 && (
          <p className="mt-2 inline-block rounded-full bg-agua/15 px-3 py-1 text-sm font-bold text-agua-texto dark:text-menta">
            Horário de pico: {DIAS_SEMANA[pico.dia_semana]} às {pico.hora}h ({pico.media} pessoas em média)
          </p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="border-separate border-spacing-0.5 text-[10px]">
            <thead>
              <tr>
                <th />
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} className="w-7 font-bold text-texto-suave">
                    {h}h
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS_SEMANA.map((nome, dia) => (
                <tr key={nome}>
                  <th className="pr-2 text-left text-xs font-extrabold text-texto-suave">{nome}</th>
                  {Array.from({ length: 24 }, (_, hora) => {
                    const v = Number(valor(dia, hora))
                    const forca = maior > 0 ? v / maior : 0
                    return (
                      <td
                        key={hora}
                        title={`${nome} ${hora}h: ${v} em média`}
                        className="h-7 w-7 rounded text-center font-bold"
                        style={{
                          background: v > 0 ? `color-mix(in srgb, var(--color-agua) ${Math.round(15 + forca * 85)}%, transparent)` : 'var(--superficie-2)',
                          color: forca > 0.55 ? 'white' : 'var(--texto-suave)',
                        }}
                      >
                        {v > 0 ? (v < 10 ? v.toFixed(v % 1 ? 1 : 0) : Math.round(v)) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {maior === 0 && (
          <p className="mt-3 text-sm text-texto-suave">
            Ainda sem dados. Os horários começam a aparecer depois que as pessoas usarem a versão nova do app.
          </p>
        )}
      </div>
    </div>
  )
}

function ListaFeedbacks({ feedbacks }: { feedbacks: FeedbackAdmin[] }) {
  const [filtro, setFiltro] = useState<FeedbackAdmin['tipo'] | 'todos'>('todos')
  const lista = filtro === 'todos' ? feedbacks : feedbacks.filter((f) => f.tipo === filtro)
  const comNota = feedbacks.filter((f) => f.nota)
  const media = comNota.length ? comNota.reduce((s, f) => s + (f.nota ?? 0), 0) / comNota.length : null

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['todos', 'sugestao', 'problema', 'conteudo', 'elogio'] as const).map((t) => {
          const ativo = filtro === t
          const qtd = t === 'todos' ? feedbacks.length : feedbacks.filter((f) => f.tipo === t).length
          return (
            <button
              key={t}
              type="button"
              onClick={() => setFiltro(t)}
              className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${
                ativo ? 'border-agua bg-agua text-white' : 'border-borda bg-superficie text-texto-suave hover:bg-superficie-2'
              }`}
            >
              {t === 'todos' ? 'Todos' : TIPOS_FEEDBACK[t].rotulo} ({qtd})
            </button>
          )
        })}
        {media !== null && (
          <span className="ml-auto flex items-center gap-1 text-sm font-extrabold text-laranja-escura dark:text-laranja">
            <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} /> Nota média {media.toFixed(1)} ({comNota.length})
          </span>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="mt-4 rounded-2xl border-2 border-borda bg-superficie p-6 text-center text-texto-suave">
          Nenhum feedback aqui ainda.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {lista.map((f) => {
            const t = TIPOS_FEEDBACK[f.tipo]
            return (
              <li key={f.id} className="rounded-2xl border-2 border-borda bg-superficie p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white"
                    style={{ background: t.cor }}
                  >
                    <t.Icone className="h-3.5 w-3.5" strokeWidth={2.6} />
                    {t.rotulo}
                  </span>
                  {f.nota && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-laranja-escura dark:text-laranja">
                      <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} /> {f.nota}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-semibold text-texto-suave">
                    {new Date(f.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                {f.questao_id && <QuestaoReportada id={f.questao_id} />}
                <p className="whitespace-pre-wrap">{f.mensagem}</p>
                <p className="mt-2 text-xs font-semibold text-texto-suave">
                  {f.nome ?? 'Sem nome'} · {f.email}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Mostra de qual questão é o "Reportar erro", com o enunciado e a resposta do app */
function QuestaoReportada({ id }: { id: string }) {
  const local = buscarQuestao(id)
  if (!local) return <p className="mb-2 text-xs font-bold text-texto-suave">Questão {id} (não encontrada)</p>
  const { questao, materia, unidade } = local
  return (
    <div className="mb-2 rounded-xl bg-superficie-2 p-3 text-sm">
      <p className="text-xs font-extrabold uppercase tracking-wide text-texto-suave">
        {materia.nome} · {unidade.titulo} · {id}
      </p>
      <p className="mt-1 font-semibold">{questao.enunciado}</p>
      <p className="mt-1 text-xs text-texto-suave">Explicação no app: {questao.explicacao}</p>
    </div>
  )
}

/** "2026-10-04" vira "04/10" (ou "sáb, 04/10") */
function formatarDia(dia: string, comSemana = false) {
  const d = new Date(`${dia}T12:00:00`)
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return comSemana ? `${DIAS_SEMANA[d.getDay()].toLowerCase()}, ${data}` : data
}
