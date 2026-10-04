import { motion } from 'framer-motion'
import { Check, Flame, RotateCcw, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buscarMateria, materiaDisponivel, materiasDoModo, NOMES_NIVEL, primeiraMateriaDoModo, unidadesDoNivel } from '../data'
import { useJogo } from '../store/useJogo'
import { statusDasLicoes, type StatusLicao } from '../lib/progresso'
import { questoesParaRevisar } from '../lib/revisao'
import { chaveDia } from '../lib/datas'
import { BarraStatus } from '../components/BarraStatus'
import { BarraProgresso } from '../components/BarraProgresso'
import { NoLicao, type CorUnidade } from '../components/NoLicao'
import { Modal } from '../components/Modal'
import { AvisoSemVidas } from '../components/AvisoSemVidas'
import { Lapio } from '../components/Lapio'
import { AbasNivel } from '../components/AbasModo'
import { Botao } from '../components/Botao'
import { IconeMateria } from '../components/IconeMateria'

/** Curva do caminho: cada lição se desloca um pouco para os lados */
const deslocamentoDoNo = (indiceGlobal: number) => Math.round(Math.sin(indiceGlobal * 0.95) * 64)

// Medidas da trilha, usadas para desenhar o caminho pontilhado entre as lições
const NO_ALTURA = 90 // bolinha (70) + espaçamento e anel em volta
const NO_ESPACO = 28 // gap-7 entre as lições
const TOPO_TRILHA = 56 // pt-14 antes da primeira lição

/** Cada unidade ganha uma cor, para a trilha não ficar toda igual */
const CORES_UNIDADE: CorUnidade[] = [
  { cor: 'var(--color-agua)', escura: 'var(--color-agua-escura)' },
  { cor: '#8b5cf6', escura: '#6d28d9' },
  { cor: '#f59e0b', escura: '#c2410c' },
  { cor: '#3b82f6', escura: '#1d4ed8' },
  { cor: '#ec4899', escura: '#be185d' },
]

// Lições concluídas que a trilha já mostrou. Fica fora do componente para
// lembrar entre telas: a lição concluída agora comemora ao voltar para cá.
let concluidasJaVistas: Set<string> | null = null

export function Home() {
  const navegar = useNavigate()
  const materiaId = useJogo((s) => s.materiaAtual)
  const modo = useJogo((s) => s.modo)
  const nivel = useJogo((s) => s.nivel)
  const definirNivel = useJogo((s) => s.definirNivel)
  const escolherMateria = useJogo((s) => s.escolherMateria)
  const concluidas = useJogo((s) => s.licoesConcluidas)
  const fila = useJogo((s) => s.filaRevisao)
  const meta = useJogo((s) => s.usuario?.metaDiaria ?? 20)
  const xpHoje = useJogo((s) => s.xpPorDia[chaveDia()] ?? 0)
  const [aberta, setAberta] = useState<string | null>(null)
  const [semVidas, setSemVidas] = useState(false)

  const atual = buscarMateria(materiaId)
  const materia = atual && materiaDisponivel(atual) && atual.modo === modo ? atual : primeiraMateriaDoModo(modo)
  const status = statusDasLicoes(materia, concluidas, nivel)
  const unidades = unidadesDoNivel(materia, nivel)
  const pendentes = questoesParaRevisar(fila).length
  const totalLicoes = unidades.reduce((n, u) => n + u.licoes.length, 0)
  const feitasNoNivel = unidades.reduce((n, u) => n + u.licoes.filter((l) => concluidas[l.id]).length, 0)
  const metaBatida = xpHoje >= meta

  // Na primeira abertura do app nada comemora; depois, só as lições novas
  const [recentes] = useState(() => {
    const novas = concluidasJaVistas ? Object.keys(concluidas).filter((id) => !concluidasJaVistas!.has(id)) : []
    return new Set(novas)
  })
  useEffect(() => {
    concluidasJaVistas = new Set(Object.keys(concluidas))
  }, [concluidas])

  function comecar(licaoId: string) {
    const jogo = useJogo.getState()
    jogo.sincronizarVidas()
    if (useJogo.getState().vidas <= 0) {
      setAberta(null)
      setSemVidas(true)
      return
    }
    navegar(`/licao/${licaoId}`)
  }

  let indiceGlobal = 0

  return (
    <>
      <BarraStatus />
      {/* No computador, o painel com a meta fica à direita; no celular, em cima da trilha */}
      <div className="mx-auto max-w-5xl px-4 pt-5 lg:flex lg:flex-row-reverse lg:items-start lg:gap-10">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
          {/* Meta do dia */}
          <div className="flex items-center gap-4 rounded-2xl border-2 border-borda bg-superficie p-4">
            <motion.span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${metaBatida ? 'bg-laranja/15' : 'bg-superficie-2'}`}
              style={{ transformOrigin: '50% 90%' }}
              animate={metaBatida ? { scaleY: [1, 1.08, 0.97, 1], rotate: [0, -4, 3, 0] } : { scaleY: 1, rotate: 0 }}
              transition={metaBatida ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
            >
              <Flame
                className={`h-7 w-7 ${metaBatida ? 'text-laranja' : 'text-apagado-texto'}`}
                fill="currentColor"
                strokeWidth={1.5}
              />
            </motion.span>
            <div className="flex-1">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-extrabold">{metaBatida ? 'Meta do dia batida!' : 'Meta do dia'}</p>
                <p className="text-sm font-bold text-texto-suave">
                  {xpHoje} / {meta} XP
                </p>
              </div>
              <BarraProgresso valor={xpHoje / meta} cor="laranja" altura="fina" rotulo="Progresso da meta diária" />
            </div>
          </div>

          {/* Atalho para a revisão */}
          {pendentes > 0 && (
            <Link
              to="/revisao"
              className="flex items-center gap-3 rounded-2xl border-2 border-borda bg-superficie p-4 font-bold transition-colors hover:bg-superficie-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-laranja/15 text-laranja-escura">
                <RotateCcw className="h-6 w-6" strokeWidth={2.6} />
              </span>
              <span className="flex-1">
                {pendentes} {pendentes === 1 ? 'questão esperando' : 'questões esperando'} revisão
              </span>
              <span className="text-sm font-extrabold uppercase text-agua-texto dark:text-menta">Revisar</span>
            </Link>
          )}

          {/* Progresso na matéria (só no computador, onde sobra espaço) */}
          {totalLicoes > 0 && (
            <div className="hidden rounded-2xl border-2 border-borda bg-superficie p-4 lg:block">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agua/15 text-agua-texto dark:text-menta">
                  <Target className="h-6 w-6" strokeWidth={2.4} />
                </span>
                <div className="flex-1">
                  <p className="font-extrabold">Seu progresso</p>
                  <p className="text-sm font-semibold text-texto-suave">
                    {materia.nome} · {NOMES_NIVEL[nivel].toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <BarraProgresso valor={feitasNoNivel / totalLicoes} altura="fina" rotulo="Lições concluídas" />
              </div>
              <p className="mt-2 text-sm font-bold text-texto-suave">
                {feitasNoNivel} de {totalLicoes} lições concluídas
              </p>
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          {/* Escolha da trilha: fácil ou difícil */}
          <div className="mt-3 lg:mt-0">
            <AbasNivel valor={nivel} aoMudar={definirNivel} />
          </div>

          {/* Residência: troca de área com um toque, e todas as lições ficam liberadas */}
          {modo === 'residencia' && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Área de estudo">
                {materiasDoModo('residencia')
                  .filter(materiaDisponivel)
                  .map((m) => {
                    const ativa = m.id === materia.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={ativa}
                        onClick={() => {
                          setAberta(null)
                          escolherMateria(m.id)
                        }}
                        className={`flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-colors ${
                          ativa
                            ? 'border-agua bg-agua text-white'
                            : 'border-borda bg-superficie text-texto-suave hover:bg-superficie-2'
                        }`}
                      >
                        <IconeMateria nome={m.icone} className="h-4 w-4" />
                        {m.nome}
                      </button>
                    )
                  })}
              </div>
              <p className="mt-2 text-xs font-semibold text-texto-suave">
                Na residência, todas as lições estão liberadas. Estude na ordem que quiser.
              </p>
            </div>
          )}

          {unidades.length === 0 && (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <Lapio altura={90} />
              <p className="max-w-72 font-semibold text-texto-suave">
                O nível {NOMES_NIVEL[nivel].toLowerCase()} de {materia.nome} ainda está em preparação.
              </p>
              <Botao tamanho="md" variante="contorno" onClick={() => definirNivel(nivel === 'facil' ? 'dificil' : 'facil')}>
                Ver o nível {nivel === 'facil' ? 'difícil' : 'fácil'}
              </Botao>
            </div>
          )}

          {/* Trilha: unidades e lições */}
          {unidades.map((unidade, ui) => {
            const feitas = unidade.licoes.filter((l) => concluidas[l.id]).length
            const liberada = unidade.licoes.some((l) => status[l.id] !== 'bloqueada')
            const completa = feitas === unidade.licoes.length
            const cor = CORES_UNIDADE[ui % CORES_UNIDADE.length]
            const deslocamentos = unidade.licoes.map(() => deslocamentoDoNo(indiceGlobal++))
            const media = deslocamentos.reduce((a, b) => a + b, 0) / deslocamentos.length

            return (
              <section key={unidade.id} className="mt-8">
                <motion.div
                  className={`relative overflow-hidden rounded-2xl p-4 ${liberada ? 'text-white' : 'bg-apagado text-apagado-texto'}`}
                  style={
                    liberada
                      ? { background: `linear-gradient(135deg, ${cor.cor}, ${cor.escura})`, boxShadow: `0 4px 0 0 ${cor.escura}` }
                      : undefined
                  }
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {/* Círculos decorativos no fundo */}
                  <span className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10" aria-hidden />
                  <span className="pointer-events-none absolute -bottom-14 right-20 h-28 w-28 rounded-full bg-white/10" aria-hidden />

                  <div className="relative flex items-center gap-4">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${liberada ? 'bg-white/20' : 'bg-black/5'}`}
                    >
                      {completa ? (
                        <Check className="h-7 w-7" strokeWidth={3.5} />
                      ) : (
                        <IconeMateria nome={materia.icone} className="h-7 w-7" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                        Unidade {ui + 1}
                        {nivel === 'dificil' && ' · nível difícil'}
                      </p>
                      <h2 className="text-xl font-extrabold leading-tight">{unidade.titulo}</h2>
                      <p className="text-sm opacity-90">{unidade.descricao}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className={`h-2 flex-1 overflow-hidden rounded-full ${liberada ? 'bg-white/25' : 'bg-black/10'}`}>
                          <motion.div
                            className={`h-full rounded-full ${liberada ? 'bg-white' : 'bg-apagado-texto'}`}
                            initial={false}
                            animate={{ width: `${(feitas / unidade.licoes.length) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                          />
                        </div>
                        <span className="text-xs font-extrabold">
                          {feitas}/{unidade.licoes.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="relative flex flex-col items-center gap-7 pb-4 pt-14">
                  <CaminhoPontilhado
                    deslocamentos={deslocamentos}
                    status={unidade.licoes.map((l) => status[l.id])}
                    cor={cor.cor}
                  />

                  {/* Lápio acompanhando a trilha, do lado onde sobra espaço */}
                  {unidade.licoes.length >= 3 && ui % 2 === 0 && (
                    <div
                      className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 sm:block"
                      style={media >= 0 ? { right: 'calc(50% + 150px)' } : { left: 'calc(50% + 150px)' }}
                      aria-hidden
                    >
                      <Lapio altura={110} />
                    </div>
                  )}

                  {unidade.licoes.map((licao, li) => (
                    <NoLicao
                      key={licao.id}
                      titulo={licao.titulo}
                      numero={li + 1}
                      totalNaUnidade={unidade.licoes.length}
                      status={status[licao.id]}
                      deslocamento={deslocamentos[li]}
                      cor={cor}
                      aberto={aberta === licao.id}
                      aoAlternar={() => setAberta(aberta === licao.id ? null : licao.id)}
                      aoComecar={() => comecar(licao.id)}
                      aoVerComentada={() => navegar(`/comentada/${licao.id}`)}
                      recemConcluida={recentes.has(licao.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {unidades.length > 0 && (
            <div className="mt-10 flex flex-col items-center gap-2 pb-6 text-center">
              <Lapio altura={90} />
              <p className="max-w-60 text-sm font-semibold text-texto-suave">Novas unidades de {materia.nome} em breve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toque fora do balão fecha o balão */}
      {aberta && <div className="fixed inset-0 z-10" onClick={() => setAberta(null)} aria-hidden />}

      <Modal aberto={semVidas} aoFechar={() => setSemVidas(false)}>
        <AvisoSemVidas aoVoltar={() => setSemVidas(false)} />
      </Modal>
    </>
  )
}

/** Linha de pontinhos ligando as lições; o trecho já percorrido fica colorido */
function CaminhoPontilhado({ deslocamentos, status, cor }: { deslocamentos: number[]; status: StatusLicao[]; cor: string }) {
  if (deslocamentos.length < 2) return null
  const pontos = deslocamentos.map((x, i) => ({ x, y: TOPO_TRILHA + NO_ALTURA / 2 + i * (NO_ALTURA + NO_ESPACO) }))
  const meio = (NO_ALTURA + NO_ESPACO) / 2
  const trecho = (ate: number) =>
    pontos
      .slice(0, ate + 1)
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${pontos[i - 1].x} ${pontos[i - 1].y + meio} ${p.x} ${p.y - meio} ${p.x} ${p.y}`))
      .join(' ')

  // Colorido até a primeira lição ainda não feita
  const primeiraPendente = status.findIndex((s) => s !== 'concluida')
  const percorrido = primeiraPendente === -1 ? pontos.length - 1 : primeiraPendente
  const altura = pontos[pontos.length - 1].y + NO_ALTURA

  return (
    <motion.svg
      className="pointer-events-none absolute left-1/2 top-0 overflow-visible"
      width="1"
      height={altura}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      aria-hidden
    >
      <path d={trecho(pontos.length - 1)} fill="none" stroke="var(--borda-forte)" strokeWidth={7} strokeLinecap="round" strokeDasharray="0.1 15" />
      {percorrido > 0 && (
        <path d={trecho(percorrido)} fill="none" stroke={cor} strokeWidth={7} strokeLinecap="round" strokeDasharray="0.1 15" />
      )}
    </motion.svg>
  )
}
