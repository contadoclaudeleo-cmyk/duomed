import { Check, Flame, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buscarMateria, MATERIAS, materiaDisponivel } from '../data'
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

/** Curva do caminho: cada lição se desloca um pouco para os lados */
const deslocamentoDoNo = (indiceGlobal: number) => Math.round(Math.sin(indiceGlobal * 0.95) * 64)

export function Home() {
  const navegar = useNavigate()
  const materiaId = useJogo((s) => s.materiaAtual)
  const concluidas = useJogo((s) => s.licoesConcluidas)
  const fila = useJogo((s) => s.filaRevisao)
  const meta = useJogo((s) => s.usuario?.metaDiaria ?? 20)
  const xpHoje = useJogo((s) => s.xpPorDia[chaveDia()] ?? 0)
  const [aberta, setAberta] = useState<string | null>(null)
  const [semVidas, setSemVidas] = useState(false)

  const atual = buscarMateria(materiaId)
  const materia = atual && materiaDisponivel(atual) ? atual : MATERIAS.find(materiaDisponivel)!
  const status = statusDasLicoes(materia, concluidas)
  const pendentes = questoesParaRevisar(fila).length

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
          <Flame
            className={`h-9 w-9 shrink-0 ${xpHoje >= meta ? 'text-laranja' : 'text-apagado-texto'}`}
            fill="currentColor"
            strokeWidth={1.5}
          />
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

        {/* Trilha: unidades e lições */}
        {materia.unidades.map((unidade, ui) => {
          const feitas = unidade.licoes.filter((l) => concluidas[l.id]).length
          const liberada = unidade.licoes.some((l) => status[l.id] !== 'bloqueada')
          const completa = feitas === unidade.licoes.length

          return (
            <section key={unidade.id} className="mt-8">
              <div
                className={`flex items-center gap-4 rounded-2xl p-4 ${liberada ? 'bg-agua text-white' : 'bg-apagado text-apagado-texto'}`}
              >
                <div className="flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">Unidade {ui + 1}</p>
                  <h2 className="text-xl font-extrabold">{unidade.titulo}</h2>
                  <p className="text-sm opacity-90">{unidade.descricao}</p>
                </div>
                <span className="flex items-center gap-1 rounded-xl border-2 border-current/30 px-2.5 py-1 text-sm font-extrabold">
                  {completa && <Check className="h-4 w-4" strokeWidth={3.5} />}
                  {feitas}/{unidade.licoes.length}
                </span>
              </div>

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
                    />
                  )
                })}
              </div>
            </section>
          )
        })}

        <div className="mt-10 flex flex-col items-center gap-2 pb-6 text-center">
          <Lapio altura={90} />
          <p className="max-w-60 text-sm font-semibold text-texto-suave">Novas unidades de {materia.nome} em breve.</p>
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
