import { motion } from 'framer-motion'
import { Award, Cloud, CloudOff, Flame, Lock, Medal, RefreshCw, Target, Zap, type LucideIcon } from 'lucide-react'
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
import { PainelConta } from '../components/PainelConta'
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
      <div className="flex flex-col gap-5 rounded-2xl border-2 border-borda bg-superficie p-4">
        <div>
          <p className="mb-2 font-bold">Modo de estudo</p>
          <AbasModo valor={jogo.modo} aoMudar={jogo.escolherModo} />
        </div>
        <div>
          <p className="mb-2 font-bold">Nível</p>
          <AbasNivel valor={jogo.nivel} aoMudar={jogo.definirNivel} />
          <button
            type="button"
            onClick={() => navegar('/nivelamento')}
            className="mt-2 text-sm font-bold text-agua-texto underline-offset-4 hover:underline dark:text-menta"
          >
            Refazer o teste de nível
          </button>
        </div>
        <div>
          <p className="mb-2 font-bold">Meta diária</p>
          <Segmentado<MetaDiaria>
            valor={usuario.metaDiaria}
            opcoes={[
              [10, '10 XP'],
              [20, '20 XP'],
              [30, '30 XP'],
            ]}
            aoMudar={(metaDiaria) => jogo.atualizarUsuario({ metaDiaria })}
          />
        </div>
        <div>
          <p className="mb-2 font-bold">Aparência</p>
          <Segmentado<Tema>
            valor={jogo.tema}
            opcoes={[
              ['claro', 'Claro'],
              ['escuro', 'Escuro'],
              ['sistema', 'Automático'],
            ]}
            aoMudar={jogo.definirTema}
          />
        </div>
        <div>
          <p className="mb-2 font-bold">Efeitos sonoros</p>
          <Segmentado<'sim' | 'nao'>
            valor={jogo.sons ? 'sim' : 'nao'}
            opcoes={[
              ['sim', 'Ligados'],
              ['nao', 'Desligados'],
            ]}
            aoMudar={(v) => {
              jogo.definirSons(v === 'sim')
              // Toca um exemplo ao ligar
              if (v === 'sim') tocarSom('acerto')
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setConfirmarReset(true)}
          className="self-start text-sm font-bold text-erro-texto underline-offset-4 hover:underline"
        >
          Apagar todo o progresso
        </button>
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
  const [abrirConta, setAbrirConta] = useState(false)
  const [confirmarApagar, setConfirmarApagar] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Ao entrar pela janela do perfil, ela fecha sozinha
  if (sessao && abrirConta) setAbrirConta(false)

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

  if (!sessao) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-borda bg-superficie p-4">
        <div className="flex items-start gap-3">
          <CloudOff className="mt-0.5 h-6 w-6 shrink-0 text-texto-suave" strokeWidth={2.4} aria-hidden />
          <div>
            <p className="font-extrabold">Seu progresso está só neste aparelho</p>
            <p className="text-sm text-texto-suave">
              Crie uma conta para salvar na nuvem e continuar no celular ou no computador.
            </p>
          </div>
        </div>
        <Botao larguraTotal onClick={() => setAbrirConta(true)}>
          Criar conta ou entrar
        </Botao>
        <Modal aberto={abrirConta} aoFechar={() => setAbrirConta(false)}>
          <h2 className="mb-4 text-center text-xl font-extrabold">Salvar meu progresso</h2>
          <PainelConta />
        </Modal>
      </div>
    )
  }

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

function Segmentado<T extends string | number>({
  valor,
  opcoes,
  aoMudar,
}: {
  valor: T
  opcoes: [T, string][]
  aoMudar: (v: T) => void
}) {
  return (
    <div className="grid grid-flow-col gap-2" role="radiogroup">
      {opcoes.map(([v, rotulo]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={v === valor}
          onClick={() => aoMudar(v)}
          className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
            v === valor
              ? 'border-agua bg-agua/10 text-agua-texto dark:text-menta'
              : 'border-borda text-texto-suave hover:bg-superficie-2'
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  )
}
