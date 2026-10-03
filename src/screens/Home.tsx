import { motion } from 'framer-motion'
import { Check, Flame, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buscarMateria, materiaDisponivel, materiasDoModo, NOMES_NIVEL, primeiraMateriaDoModo, unidadesDoNivel } from '../data'
import { useJogo } from '../store/useJogo'
import { statusDasLicoes } from '../lib/progresso'
import { questoesParaRevisar } from '../lib/revisao'
import { chaveDia } from '../lib/datas'
import { BarraStatus } from '../components/BarraStatus'
import { BarraProgresso } from '../components/BarraProgresso'
import { NoLicao } from '../components/NoLicao'
import { Modal } from '../components/Modal'
import { AvisoSemVidas } from '../components/AvisoSemVidas'
import { Lapio } from '../components/Lapio'
import { AbasNivel } from '../components/AbasModo'
import { Botao } from '../components/Botao'
import { IconeMateria } from '../components/IconeMateria'

/** Curva do caminho: cada lição se desloca um pouco para os lados */
const deslocamentoDoNo = (indiceGlobal: number) => Math.round(Math.sin(indiceGlobal * 0.95) * 64)

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
      <div className="mx-auto max-w-2xl px-4 pt-5">
        {/* Meta do dia */}
        <div className="flex items-center gap-4 rounded-2xl border-2 border-borda bg-superficie p-4">
          <motion.span
            className="shrink-0"
            style={{ transformOrigin: '50% 90%' }}
            animate={xpHoje >= meta ? { scaleY: [1, 1.12, 0.95, 1], rotate: [0, -5, 4, 0] } : { scaleY: 1, rotate: 0 }}
            transition={xpHoje >= meta ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          >
            <Flame
              className={`h-9 w-9 ${xpHoje >= meta ? 'text-laranja' : 'text-apagado-texto'}`}
              fill="currentColor"
              strokeWidth={1.5}
            />
          </motion.span>
          <div className="flex-1">
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="font-extrabold">{xpHoje >= meta ? 'Meta do dia batida!' : 'Meta do dia'}</p>
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
            className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-borda bg-superficie p-4 font-bold transition-colors hover:bg-superficie-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-laranja/15 text-laranja-escura">
              <RotateCcw className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <span className="flex-1">
              {pendentes} {pendentes === 1 ? 'questão esperando' : 'questões esperando'} revisão
            </span>
            <span className="text-sm font-extrabold uppercase text-agua-texto dark:text-menta">Revisar</span>
          </Link>
        )}

        {/* Escolha da trilha: fácil ou difícil */}
        <div className="mt-3">
          <AbasNivel valor={nivel} aoMudar={definirNivel} />
        </div>

        {/* Residência: troca de área com um toque, e todas as lições ficam liberadas */}
        {modo === 'residencia' && (
          <div className="mt-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="radiogroup" aria-label="Área de estudo">
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
                      className={`flex shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                        ativa
                          ? 'border-agua bg-agua/10 text-agua-texto dark:text-menta'
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

          return (
            <section key={unidade.id} className="mt-8">
              <motion.div
                className={`flex items-center gap-4 rounded-2xl p-4 ${liberada ? 'bg-agua text-white' : 'bg-apagado text-apagado-texto'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                    Unidade {ui + 1}
                    {nivel === 'dificil' && ' · nível difícil'}
                  </p>
                  <h2 className="text-xl font-extrabold">{unidade.titulo}</h2>
                  <p className="text-sm opacity-90">{unidade.descricao}</p>
                </div>
                <span className="flex items-center gap-1 rounded-xl border-2 border-current/30 px-2.5 py-1 text-sm font-extrabold">
                  {completa && <Check className="h-4 w-4" strokeWidth={3.5} />}
                  {feitas}/{unidade.licoes.length}
                </span>
              </motion.div>

              <div className="flex flex-col items-center gap-7 pb-4 pt-14">
                {unidade.licoes.map((licao, li) => {
                  const desloc = deslocamentoDoNo(indiceGlobal++)
                  return (
                    <NoLicao
                      key={licao.id}
                      titulo={licao.titulo}
                      numero={li + 1}
                      totalNaUnidade={unidade.licoes.length}
                      status={status[licao.id]}
                      deslocamento={desloc}
                      aberto={aberta === licao.id}
                      aoAlternar={() => setAberta(aberta === licao.id ? null : licao.id)}
                      aoComecar={() => comecar(licao.id)}
                      aoVerComentada={() => navegar(`/comentada/${licao.id}`)}
                      recemConcluida={recentes.has(licao.id)}
                    />
                  )
                })}
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

      {/* Toque fora do balão fecha o balão */}
      {aberta && <div className="fixed inset-0 z-10" onClick={() => setAberta(null)} aria-hidden />}

      <Modal aberto={semVidas} aoFechar={() => setSemVidas(false)}>
        <AvisoSemVidas aoVoltar={() => setSemVidas(false)} />
      </Modal>
    </>
  )
}
