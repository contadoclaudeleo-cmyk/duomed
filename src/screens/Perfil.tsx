import { Award, Flame, Lock, Medal, Target, Zap, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MetaDiaria, Tema } from '../types'
import { MATERIAS, materiaDisponivel } from '../data'
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

export function Perfil() {
  const navegar = useNavigate()
  const jogo = useJogo()
  const [confirmarReset, setConfirmarReset] = useState(false)
  const usuario = jogo.usuario!
  const nivel = nivelDoXp(jogo.xpTotal)
  const ofensiva = ofensivaVigente(jogo.ofensiva)
  const desde = new Date(usuario.criadoEm).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Logo altura={76} className="flex justify-center" />

      {/* Quem é o usuário */}
      <div className="mt-6 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-agua text-2xl font-extrabold text-white">
          {usuario.nome[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold">{usuario.nome}</h1>
          <p className="text-texto-suave">
            {usuario.semestre}º semestre · estudando desde {desde}
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
        {CONQUISTAS.map((c) => {
          const quando = jogo.conquistas[c.id]
          return (
            <div key={c.id} className="flex items-center gap-4 border-b-2 border-borda px-4 py-3 last:border-b-0">
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
            </div>
          )
        })}
      </div>

      {/* Por matéria */}
      <Titulo>Por matéria</Titulo>
      <div className="flex flex-col gap-3">
        {MATERIAS.filter(materiaDisponivel).map((m) => {
          const stats = jogo.estatisticasPorMateria[m.id] ?? { respondidas: 0, acertos: 0 }
          const { feitas, total } = contarConcluidas(m, jogo.licoesConcluidas)
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

      {/* Configurações */}
      <Titulo>Configurações</Titulo>
      <div className="flex flex-col gap-5 rounded-2xl border-2 border-borda bg-superficie p-4">
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
          <p className="text-texto-suave">XP, ofensiva, conquistas e revisões serão apagados deste aparelho. Não dá para desfazer.</p>
          <Botao
            larguraTotal
            variante="perigo"
            onClick={() => {
              jogo.resetarTudo()
              navegar('/boas-vindas', { replace: true })
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
        <p className="text-xl font-extrabold leading-tight">{valor}</p>
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
