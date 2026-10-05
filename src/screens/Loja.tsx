import { motion } from 'framer-motion'
import { ArrowLeft, Check, Clock, Heart, Infinity as Infinito, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { linkDeCompra, usePlus } from '../lib/plus'
import { atualizarCompras, useConta } from '../lib/nuvem'
import { useNavigate } from 'react-router-dom'
import { useJogo } from '../store/useJogo'
import { useAgora } from '../lib/hooks'
import { tempoParaProximaVida, VIDAS_MAX } from '../lib/vidas'
import { formatarDuracao } from '../lib/datas'
import {
  ANO_NO_MENSAL,
  ANUAL_POR_MES,
  DESCONTO_ANUAL,
  DESCONTO_PRIMEIRO_MES,
  PRECO_ANUAL,
  PRECO_MENSAL,
  PRECO_PRIMEIRO_MES,
  PRECO_RECARGA,
  VIDAS_POR_PACOTE,
  reais,
  type IdPlano,
} from '../lib/planos'
import { Botao } from '../components/Botao'
import { Modal } from '../components/Modal'
import { Lapio } from '../components/Lapio'

const VANTAGENS = [
  'Vidas infinitas: erre à vontade enquanto aprende',
  'Nunca mais espere o coração recarregar',
  'Todas as trilhas, fácil e difícil, sem pausa',
  'Apoie um app feito por e para estudantes',
]

/** Loja: DuoMed Plus (vidas infinitas) e pacote de vidas */
export function Loja() {
  const navegar = useNavigate()
  const [plano, setPlano] = useState<IdPlano>('anual')
  // Compra em andamento: abre a janela que leva para a Kiwify
  const [compra, setCompra] = useState<IdPlano | 'recarga' | null>(null)
  const vidas = useJogo((s) => s.vidas)
  const ultimaRecarga = useJogo((s) => s.ultimaRecargaVida)
  const agora = useAgora(1000)
  const falta = tempoParaProximaVida({ vidas, ultimaRecarga }, agora)
  const validoAte = usePlus((p) => p.validoAte)
  const plus = validoAte !== null && validoAte > agora

  // Ao abrir a loja (e ao voltar da página de pagamento), confere se o pagamento já caiu
  useEffect(() => {
    const conferir = () => {
      atualizarCompras()
    }
    conferir()
    const aoVoltar = () => document.visibilityState === 'visible' && conferir()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navegar(-1)}
          className="rounded-lg p-1 text-texto-suave hover:bg-superficie-2"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.6} />
        </button>
        <h1 className="text-2xl font-extrabold">Loja</h1>
      </div>

      {/* Destaque do Plus */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_6px_0_0_#5b21b6]"
        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 55%, #ec4899 100%)' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden />
        <span className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-center gap-4">
          <motion.span
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart className="h-12 w-12 text-[#ff4d6d]" fill="currentColor" strokeWidth={0} />
            <Infinito className="absolute h-6 w-6 text-white" strokeWidth={3} />
          </motion.span>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest opacity-90">
              <Sparkles className="h-4 w-4" /> DuoMed Plus
            </p>
            <h2 className="text-2xl font-extrabold leading-tight">Vidas infinitas para estudar sem parar</h2>
          </div>
        </div>
        <ul className="relative mt-5 space-y-2">
          {VANTAGENS.map((v) => (
            <li key={v} className="flex items-start gap-2 font-semibold">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#6d28d9]">
                <Check className="h-3.5 w-3.5" strokeWidth={4} />
              </span>
              {v}
            </li>
          ))}
        </ul>
      </motion.div>

      {plus ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-[#7c3aed] bg-[#7c3aed]/10 p-4">
          <Sparkles className="h-7 w-7 shrink-0 text-[#7c3aed]" />
          <div>
            <p className="font-extrabold">Você é Plus!</p>
            <p className="text-sm text-texto-suave">
              Vidas infinitas até {new Date(validoAte!).toLocaleDateString('pt-BR')}. A renovação é automática.
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* Planos */}
        <h2 className="mb-3 mt-7 text-xl font-extrabold">Escolha seu plano</h2>
        <div className="flex flex-col gap-4" role="radiogroup" aria-label="Plano">
          <CartaoPlano
            ativo={plano === 'anual'}
            aoEscolher={() => setPlano('anual')}
            faixa="Mais vantajoso"
            titulo="Plano anual"
            selo={`-${DESCONTO_ANUAL}%`}
            preco={reais(PRECO_ANUAL)}
            periodo="/ano"
            riscado={reais(ANO_NO_MENSAL)}
            detalhe={`Só ${reais(ANUAL_POR_MES)} por mês. Economize ${reais(ANO_NO_MENSAL - PRECO_ANUAL)} no ano.`}
          />
          <CartaoPlano
            ativo={plano === 'mensal'}
            aoEscolher={() => setPlano('mensal')}
            faixa="Promoção de boas-vindas"
            faixaCor="laranja"
            titulo="Plano mensal"
            selo={`-${DESCONTO_PRIMEIRO_MES}% no 1º mês`}
            preco={reais(PRECO_PRIMEIRO_MES)}
            periodo="no 1º mês"
            riscado={reais(PRECO_MENSAL)}
            detalhe={`Depois, ${reais(PRECO_MENSAL)} por mês. Cancele quando quiser.`}
          />
        </div>
  
        <div className="mt-5">
          <Botao larguraTotal onClick={() => setCompra(plano)}>
            {plano === 'anual' ? `Assinar por ${reais(PRECO_ANUAL)}/ano` : `Começar por ${reais(PRECO_PRIMEIRO_MES)}`}
          </Botao>
          <p className="mt-2 text-center text-xs text-texto-suave">
            {plano === 'anual'
              ? `Equivale a ${DESCONTO_ANUAL}% de desconto em relação a pagar o mensal por 12 meses.`
              : `${reais(PRECO_PRIMEIRO_MES)} no primeiro mês e ${reais(PRECO_MENSAL)} nos seguintes.`}
          </p>
        </div>
  
        </>
      )}

      {/* Pacote de vidas avulso (quem é Plus não precisa) */}
      {!plus && (
        <>
          <h2 className="mb-3 mt-8 text-xl font-extrabold">Comprar vidas</h2>
          <div className="rounded-2xl border-2 border-borda bg-superficie p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-lg font-extrabold">
                <Heart className="h-7 w-7 text-erro" fill="currentColor" strokeWidth={0} />
                {vidas} {vidas === 1 ? 'vida' : 'vidas'} agora
              </span>
              {vidas < VIDAS_MAX && (
                <span className="flex items-center gap-1 text-sm font-bold text-texto-suave tabular-nums">
                  <Clock className="h-4 w-4" /> +1 em {formatarDuracao(falta)}
                </span>
              )}
            </div>

            <div className="relative mt-4 overflow-hidden rounded-2xl border-[3px] border-erro bg-superficie shadow-[0_4px_0_0_var(--color-erro-escura)]">
              <div className="bg-erro px-4 py-1.5 text-center text-xs font-extrabold uppercase tracking-widest text-white">
                Pagamento único
              </div>
              <div className="flex items-center gap-4 p-4">
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-erro/15">
                  <Heart className="h-12 w-12 text-erro" fill="currentColor" strokeWidth={0} />
                  <span className="absolute text-sm font-extrabold text-white">+{VIDAS_POR_PACOTE}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold">Pacote de {VIDAS_POR_PACOTE} vidas</p>
                  <p className="text-sm text-texto-suave">Somam às suas vidas e não vencem</p>
                  <p className="mt-1 text-2xl font-extrabold">{reais(PRECO_RECARGA)}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => setCompra('recarga')}
                  className="w-full rounded-2xl bg-erro py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_var(--color-erro-escura)] transition-transform active:translate-y-1 active:shadow-none"
                >
                  Comprar {VIDAS_POR_PACOTE} vidas
                </button>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-sm text-texto-suave">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" />
              De graça: cada vida volta sozinha em 5 minutos, e a revisão nunca gasta vidas.
            </p>
          </div>
        </>
      )}

      <Modal aberto={compra !== null} aoFechar={() => setCompra(null)}>
        {compra && <JanelaCompra tipo={compra} aoCancelar={() => setCompra(null)} />}
      </Modal>
    </div>
  )
}

const DESCRICAO_COMPRA = {
  anual: `DuoMed Plus anual: ${reais(PRECO_ANUAL)} por ano`,
  mensal: `DuoMed Plus mensal: ${reais(PRECO_PRIMEIRO_MES)} no 1º mês, depois ${reais(PRECO_MENSAL)} por mês`,
  recarga: `Pacote de ${VIDAS_POR_PACOTE} vidas: ${reais(PRECO_RECARGA)}`,
}

/** Confirma a compra e leva para o checkout da Kiwify (lá a pessoa paga com PIX, cartão ou boleto) */
function JanelaCompra({ tipo, aoCancelar }: { tipo: IdPlano | 'recarga'; aoCancelar: () => void }) {
  const sessao = useConta((s) => s.sessao)
  const email = sessao?.user.email
  const link = sessao ? linkDeCompra(tipo, sessao.user.id, email) : null

  if (!link) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Lapio humor="festa" altura={100} />
        <h2 className="text-xl font-extrabold">Pagamento chegando em breve!</h2>
        <p className="text-texto-suave">
          Estamos finalizando o pagamento por PIX e cartão. Enquanto isso, suas vidas recarregam sozinhas a cada 5 minutos.
        </p>
        <Botao larguraTotal onClick={aoCancelar}>
          Entendi
        </Botao>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 text-center">
        <Lapio humor="festa" altura={80} />
        <h2 className="text-xl font-extrabold">Quase lá!</h2>
        <p className="text-sm font-bold">{DESCRICAO_COMPRA[tipo]}</p>
        <p className="text-sm text-texto-suave">
          Você vai para a página segura da Kiwify, onde paga com PIX, cartão ou boleto. Assim que o pagamento cair, é
          liberado aqui no app.
        </p>
      </div>
      {email && (
        <p className="rounded-2xl bg-laranja/15 p-3 text-center text-sm font-semibold text-laranja-escura dark:text-laranja">
          Use o mesmo e-mail da sua conta: <strong className="break-all">{email}</strong>
        </p>
      )}
      <Botao larguraTotal onClick={() => (window.location.href = link)}>
        Ir para o pagamento
      </Botao>
      <Botao larguraTotal variante="contorno" onClick={aoCancelar}>
        Cancelar
      </Botao>
    </div>
  )
}

function CartaoPlano({
  ativo,
  aoEscolher,
  faixa,
  faixaCor = 'roxo',
  titulo,
  selo,
  preco,
  periodo,
  riscado,
  detalhe,
}: {
  ativo: boolean
  aoEscolher: () => void
  faixa: string
  faixaCor?: 'roxo' | 'laranja'
  titulo: string
  selo: string
  preco: string
  periodo: string
  riscado: string
  detalhe: string
}) {
  const corFaixa = faixaCor === 'roxo' ? 'bg-[#7c3aed]' : 'bg-laranja'
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={aoEscolher}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-2xl border-[3px] bg-superficie text-left transition-colors ${
        ativo ? 'border-[#7c3aed] shadow-[0_4px_0_0_#5b21b6]' : 'border-borda shadow-[0_4px_0_0_var(--borda)]'
      }`}
    >
      <div className={`px-4 py-1.5 text-center text-xs font-extrabold uppercase tracking-widest text-white ${corFaixa}`}>
        {faixa}
      </div>
      <div className="flex items-center gap-4 p-4">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            ativo ? 'border-[#7c3aed] bg-[#7c3aed] text-white' : 'border-borda-forte'
          }`}
        >
          {ativo && <Check className="h-4 w-4" strokeWidth={4} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-extrabold">{titulo}</p>
            <span className="rounded-full bg-acerto-fundo px-2 py-0.5 text-xs font-extrabold text-acerto-texto">{selo}</span>
          </div>
          <p className="mt-1">
            <span className="text-2xl font-extrabold">{preco}</span>{' '}
            <span className="text-sm font-bold text-texto-suave">{periodo}</span>{' '}
            <span className="text-sm font-bold text-texto-suave line-through">{riscado}</span>
          </p>
          <p className="mt-1 text-sm text-texto-suave">{detalhe}</p>
        </div>
      </div>
    </motion.button>
  )
}
