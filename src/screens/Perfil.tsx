import { motion } from 'framer-motion'
import {
  Award,
  BookOpenCheck,
  Check,
  Cloud,
  CloudOff,
  Feather,
  Flame,
  Gauge,
  GraduationCap,
  Lock,
  Medal,
  MonitorSmartphone,
  Moon,
  Palette,
  RefreshCw,
  Rocket,
  Sun,
  Target,
  Trash2,
  Volume2,
  VolumeX,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { METAS } from '../lib/metas'
import { materiasDoSemestre } from '../data/semestres'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MetaDiaria, Tema } from '../types'
import { materiaDisponivel, materiasDoModo } from '../data'
import { useJogo } from '../store/useJogo'
import { nivelDoXp, progressoNoNivel, XP_POR_NIVEL } from '../lib/xp'
import { ofensivaVigente } from '../lib/ofensiva'
import { CONQUISTAS } from '../lib/conquistas'
import { contarConcluidas } from '../lib/progresso'
import { Logo } from '../components/Logo'
import { BarraProgresso } from '../components/BarraProgresso'
import { IconeMateria } from '../components/IconeMateria'
import { Botao } from '../components/Botao'
import { Modal } from '../components/Modal'
import { AbasModo, AbasNivel } from '../components/AbasModo'
import { NumeroAnimado } from '../components/Animacoes'
import { tocarSom } from '../lib/sons'
import { apagarConta, apagarProgressoNaNuvem, sair, useConta } from '../lib/nuvem'

export function Perfil() {
  const navegar = useNavigate()
  const jogo = useJogo()
  const [confirmarReset, setConfirmarReset] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erroReset, setErroReset] = useState<string | null>(null)
  const logado = useConta((s) => !!s.sessao)
  const usuario = jogo.usuario!
  const nivel = nivelDoXp(jogo.xpTotal)
  const ofensiva = ofensivaVigente(jogo.ofensiva)
  const desde = new Date(usuario.criadoEm).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Logo altura={76} className="flex justify-center" />

      {/* Quem é o usuário */}
      <div className="mt-6 flex items-center gap-4">
        <motion.span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-agua text-2xl font-extrabold text-white"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
        >
          {usuario.nome[0]?.toUpperCase()}
        </motion.span>
        <div>
          <h1 className="text-2xl font-extrabold">{usuario.nome}</h1>
          <p className="text-texto-suave">
            {jogo.modo === 'residencia'
              ? 'Preparação para residência'
              : usuario.semestre
                ? `${usuario.semestre}º semestre`
                : 'Graduação'}{' '}
            · estudando desde {desde}
          </p>
        </div>
      </div>

      {/* Nível */}
      <div className="mt-6 rounded-2xl border-2 border-borda bg-superficie p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-lg font-extrabold">Nível {nivel}</p>
          <p className="text-sm font-bold text-texto-suave">
            {progressoNoNivel(jogo.xpTotal)} / {XP_POR_NIVEL} XP para o nível {nivel + 1}
          </p>
        </div>
        <BarraProgresso valor={progressoNoNivel(jogo.xpTotal) / XP_POR_NIVEL} rotulo="Progresso do nível" />
      </div>

      {/* Números principais */}
      <Titulo>Estatísticas</Titulo>
      <div className="grid grid-cols-2 gap-3">
        <Numero Icone={Zap} cor="text-laranja" valor={jogo.xpTotal} rotulo="XP total" preencher />
        <Numero Icone={Target} cor="text-agua" valor={jogo.questoesRespondidas} rotulo="Questões respondidas" />
        <Numero Icone={Flame} cor="text-laranja" valor={ofensiva} rotulo="Ofensiva atual" preencher />
        <Numero Icone={Medal} cor="text-agua" valor={jogo.ofensiva.recorde} rotulo="Recorde de ofensiva" />
      </div>

      {/* Conquistas */}
      <Titulo>Conquistas</Titulo>
      <div className="overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
        {CONQUISTAS.map((c, i) => {
          const quando = jogo.conquistas[c.id]
          return (
            <motion.div
              key={c.id}
              className="flex items-center gap-4 border-b-2 border-borda px-4 py-3 last:border-b-0"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  quando ? 'bg-laranja text-white shadow-[0_3px_0_0_var(--color-laranja-escura)]' : 'bg-apagado text-apagado-texto'
                }`}
              >
                {quando ? <Award className="h-6 w-6" strokeWidth={2.4} /> : <Lock className="h-5 w-5" strokeWidth={2.4} />}
              </span>
              <div className="flex-1">
                <p className={`font-extrabold ${quando ? '' : 'text-texto-suave'}`}>{c.titulo}</p>
                <p className="text-sm text-texto-suave">{c.descricao}</p>
              </div>
              {quando && (
                <span className="text-xs font-semibold text-texto-suave">
                  {new Date(quando).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Por matéria */}
      <Titulo>{jogo.modo === 'residencia' ? 'Por área' : 'Por matéria'}</Titulo>
      <div className="flex flex-col gap-3">
        {materiasDoModo(jogo.modo).filter(materiaDisponivel).map((m) => {
          const stats = jogo.estatisticasPorMateria[m.id] ?? { respondidas: 0, acertos: 0 }
          const { feitas, total } = contarConcluidas(m, jogo.licoesConcluidas, jogo.nivel)
          const precisao = stats.respondidas ? Math.round((stats.acertos / stats.respondidas) * 100) : 0
          return (
            <div key={m.id} className="rounded-2xl border-2 border-borda bg-superficie p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-agua text-white">
                  <IconeMateria nome={m.icone} className="h-5 w-5" />
                </span>
                <p className="flex-1 font-extrabold">{m.nome}</p>
                <p className="text-sm font-bold text-texto-suave">
                  {feitas}/{total} lições
                </p>
              </div>
              <BarraProgresso valor={feitas / total} altura="fina" rotulo={`Lições de ${m.nome}`} />
              <div className="mt-3 flex justify-between text-sm text-texto-suave">
                <span>
                  <strong className="text-texto">{stats.respondidas}</strong> questões respondidas
                </span>
                <span>
                  <strong className="text-texto">{precisao}%</strong> de acerto
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conta e nuvem */}
      <Titulo>Conta</Titulo>
      <SecaoConta />

      {/* Configurações */}
      <Titulo>Configurações</Titulo>
      <div className="divide-y-2 divide-borda overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
        <Ajuste Icone={BookOpenCheck} titulo="Modo de estudo" descricao="Matérias do curso ou preparação para a prova de residência">
          <AbasModo valor={jogo.modo} aoMudar={jogo.escolherModo} />
        </Ajuste>

        <Ajuste Icone={Gauge} titulo="Nível" descricao="Trilha fácil para aprender, difícil para treinar no estilo de prova">
          <AbasNivel valor={jogo.nivel} aoMudar={jogo.definirNivel} />
          <button
            type="button"
            onClick={() => navegar('/nivelamento')}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-agua-texto underline-offset-4 hover:underline dark:text-menta"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2.6} />
            Refazer o teste de nível
          </button>
        </Ajuste>

        {jogo.modo === 'graduacao' && (
          <Ajuste Icone={GraduationCap} titulo="Semestre" descricao="A trilha mostra primeiro as matérias do seu semestre">
            <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Semestre">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => {
                const ativo = usuario.semestre === s
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    onClick={() => {
                      jogo.atualizarUsuario({ semestre: s })
                      // Se a matéria aberta não é do novo semestre, abre a primeira dele
                      const novas = materiasDoSemestre(s)
                      if (novas.length > 0 && !novas.some((m) => m.id === jogo.materiaAtual)) jogo.escolherMateria(novas[0].id)
                    }}
                    className={`rounded-xl border-2 py-2 text-sm font-extrabold transition-colors ${
                      ativo
                        ? 'border-agua bg-agua text-white shadow-[0_3px_0_0_var(--color-agua-escura)]'
                        : 'border-borda text-texto-suave shadow-[0_3px_0_0_var(--borda)] hover:bg-superficie-2'
                    }`}
                  >
                    {s}º
                  </button>
                )
              })}
            </div>
          </Ajuste>
        )}

        <Ajuste Icone={Target} titulo="Meta diária" descricao="Quanto você quer estudar por dia">
          <Opcoes<MetaDiaria>
            valor={usuario.metaDiaria}
            opcoes={METAS.map((m) => ({
              valor: m.valor,
              rotulo: m.nome,
              detalhe: m.descricao.replace('Cerca de ', '').replace(' por dia', '/dia'),
              Icone: ICONES_META[m.valor],
            }))}
            aoMudar={(metaDiaria) => jogo.atualizarUsuario({ metaDiaria })}
          />
        </Ajuste>

        <Ajuste Icone={Palette} titulo="Aparência" descricao="Automático segue o modo do seu celular ou computador">
          <Opcoes<Tema>
            valor={jogo.tema}
            opcoes={[
              { valor: 'claro', rotulo: 'Claro', Icone: Sun },
              { valor: 'escuro', rotulo: 'Escuro', Icone: Moon },
              { valor: 'sistema', rotulo: 'Automático', Icone: MonitorSmartphone },
            ]}
            aoMudar={jogo.definirTema}
          />
        </Ajuste>

        <Ajuste Icone={Volume2} titulo="Efeitos sonoros" descricao="Sons de acerto, erro e fim de lição">
          <Opcoes<'sim' | 'nao'>
            valor={jogo.sons ? 'sim' : 'nao'}
            opcoes={[
              { valor: 'sim', rotulo: 'Ligados', Icone: Volume2 },
              { valor: 'nao', rotulo: 'Desligados', Icone: VolumeX },
            ]}
            aoMudar={(v) => {
              jogo.definirSons(v === 'sim')
              // Toca um exemplo ao ligar
              if (v === 'sim') tocarSom('acerto')
            }}
          />
        </Ajuste>

        <div className="flex items-center gap-3 bg-erro-fundo/40 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-erro-fundo text-erro-texto">
            <Trash2 className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">Apagar todo o progresso</p>
            <p className="text-sm text-texto-suave">XP, ofensiva, conquistas e revisões. Não dá para desfazer.</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            className="shrink-0 rounded-xl border-2 border-erro/40 px-3 py-2 text-sm font-extrabold text-erro-texto transition-colors hover:bg-erro-fundo"
          >
            Apagar
          </button>
        </div>
      </div>

      <Modal aberto={confirmarReset} aoFechar={() => setConfirmarReset(false)}>
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-xl font-extrabold">Apagar tudo?</h2>
          <p className="text-texto-suave">
            XP, ofensiva, conquistas e revisões serão apagados {logado ? 'deste aparelho e da sua conta' : 'deste aparelho'}.
            Não dá para desfazer.
          </p>
          {erroReset && <p className="text-sm font-bold text-erro-texto">{erroReset}</p>}
          <Botao
            larguraTotal
            variante="perigo"
            disabled={apagando}
            onClick={async () => {
              setErroReset(null)
              setApagando(true)
              try {
                // Com conta, apaga também a cópia da nuvem (senão ela voltaria na próxima sincronização)
                if (logado) await apagarProgressoNaNuvem()
                jogo.resetarTudo()
                navegar('/boas-vindas', { replace: true })
              } catch (e) {
                setErroReset(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.')
              } finally {
                setApagando(false)
              }
            }}
          >
            Apagar progresso
          </Botao>
          <Botao larguraTotal variante="contorno" onClick={() => setConfirmarReset(false)}>
            Cancelar
          </Botao>
        </div>
      </Modal>
    </div>
  )
}

/** Criar conta, ver se o progresso está salvo na nuvem, sair ou apagar a conta */
function SecaoConta() {
  const navegar = useNavigate()
  const sessao = useConta((s) => s.sessao)
  const status = useConta((s) => s.status)
  const [confirmarApagar, setConfirmarApagar] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function executar(acao: () => Promise<void>) {
    setErro(null)
    setOcupado(true)
    try {
      await acao()
      navegar('/boas-vindas', { replace: true })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu certo. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  // A conta é obrigatória (ver App.tsx); sem sessão aqui, nada a mostrar
  if (!sessao) return null

  const textoStatus = {
    'sem-conta': '',
    sincronizando: 'Sincronizando...',
    salvo: 'Progresso salvo na nuvem',
    offline: 'Sem internet: salva quando a conexão voltar',
  }[status]
  const IconeStatus = status === 'offline' ? CloudOff : status === 'sincronizando' ? RefreshCw : Cloud

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-borda bg-superficie p-4">
      <div className="flex items-start gap-3">
        <IconeStatus
          className={`mt-0.5 h-6 w-6 shrink-0 ${status === 'offline' ? 'text-laranja' : 'text-agua'} ${
            status === 'sincronizando' ? 'animate-spin' : ''
          }`}
          strokeWidth={2.4}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate font-extrabold">{sessao.user.email}</p>
          <p className="text-sm text-texto-suave" aria-live="polite">
            {textoStatus}
          </p>
        </div>
      </div>
      {erro && <p className="text-sm font-bold text-erro-texto">{erro}</p>}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => executar(sair)}
          className="text-sm font-bold text-agua-texto underline-offset-4 hover:underline dark:text-menta"
        >
          Sair da conta
        </button>
        <button
          type="button"
          onClick={() => setConfirmarApagar(true)}
          className="text-sm font-bold text-erro-texto underline-offset-4 hover:underline"
        >
          Apagar minha conta
        </button>
      </div>

      <Modal aberto={confirmarApagar} aoFechar={() => setConfirmarApagar(false)}>
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-xl font-extrabold">Apagar a conta?</h2>
          <p className="text-texto-suave">
            A conta e todo o progresso salvo nela serão apagados para sempre, em todos os aparelhos. Não dá para desfazer.
          </p>
          {erro && <p className="text-sm font-bold text-erro-texto">{erro}</p>}
          <Botao larguraTotal variante="perigo" disabled={ocupado} onClick={() => executar(apagarConta)}>
            Apagar conta
          </Botao>
          <Botao larguraTotal variante="contorno" onClick={() => setConfirmarApagar(false)}>
            Cancelar
          </Botao>
        </div>
      </Modal>
    </div>
  )
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 mt-8 text-xl font-extrabold">{children}</h2>
}

function Numero({
  Icone,
  cor,
  valor,
  rotulo,
  preencher,
}: {
  Icone: LucideIcon
  cor: string
  valor: number
  rotulo: string
  preencher?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-borda bg-superficie p-4">
      <Icone
        className={`h-7 w-7 shrink-0 ${cor}`}
        fill={preencher ? 'currentColor' : 'none'}
        strokeWidth={preencher ? 1.5 : 2.4}
        aria-hidden
      />
      <div>
        <p className="text-xl font-extrabold leading-tight">
          <NumeroAnimado valor={valor} duracao={1} />
        </p>
        <p className="text-xs font-semibold text-texto-suave">{rotulo}</p>
      </div>
    </div>
  )
}

const ICONES_META: Record<MetaDiaria, LucideIcon> = { 10: Feather, 20: Flame, 30: Rocket }

/** Um bloco das configurações: ícone, título, explicação curta e o controle embaixo */
function Ajuste({
  Icone,
  titulo,
  descricao,
  children,
}: {
  Icone: LucideIcon
  titulo: string
  descricao: string
  children: ReactNode
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agua/10 text-agua-texto dark:text-menta">
          <Icone className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <p className="font-extrabold leading-tight">{titulo}</p>
          <p className="text-sm text-texto-suave">{descricao}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

/** Opções lado a lado em cartões com ícone; a escolhida fica destacada */
function Opcoes<T extends string | number>({
  valor,
  opcoes,
  aoMudar,
}: {
  valor: T
  opcoes: { valor: T; rotulo: string; detalhe?: string; Icone: LucideIcon }[]
  aoMudar: (v: T) => void
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }} role="radiogroup">
      {opcoes.map(({ valor: v, rotulo, detalhe, Icone }) => {
        const ativo = v === valor
        return (
          <motion.button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(v)}
            whileTap={{ scale: 0.96 }}
            className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
              ativo
                ? 'border-agua bg-agua/10 text-agua-texto shadow-[0_3px_0_0_var(--color-agua)] dark:text-menta'
                : 'border-borda text-texto-suave shadow-[0_3px_0_0_var(--borda)] hover:bg-superficie-2'
            }`}
          >
            {ativo && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-agua text-white">
                <Check className="h-3 w-3" strokeWidth={4} />
              </span>
            )}
            <Icone className="h-6 w-6" strokeWidth={2.4} />
            <span className="text-sm font-extrabold">{rotulo}</span>
            {detalhe && <span className="text-xs font-semibold leading-tight opacity-80">{detalhe}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}
