import { motion } from 'framer-motion'
import { ArrowLeft, Check, Clock, Heart, Infinity as Infinito, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { carregarPlus, ehPlus, iniciarPagamento, usarRecarga, usePlus } from '../lib/plus'
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

/** Loja: DuoMed Plus (vidas infinitas) e recarga de vidas */
export function Loja() {
  const navegar = useNavigate()
  const [plano, setPlano] = useState<IdPlano>('anual')
  // Compra em andamento: abre a janela que pede nome e CPF
  const [compra, setCompra] = useState<IdPlano | 'recarga' | null>(null)
  const [usando, setUsando] = useState(false)
  const vidas = useJogo((s) => s.vidas)
  const ultimaRecarga = useJogo((s) => s.ultimaRecargaVida)
  const encherVidas = useJogo((s) => s.encherVidas)
  const agora = useAgora(1000)
  const falta = tempoParaProximaVida({ vidas, ultimaRecarga }, agora)
  const validoAte = usePlus((p) => p.validoAte)
  const recargas = usePlus((p) => p.recargas)
  const plus = validoAte !== null && validoAte > agora

  // Ao abrir a loja (e ao voltar da página de pagamento), confere se o pagamento já caiu
  useEffect(() => {
    const conferir = () => carregarPlus().then(() => ehPlus() && useJogo.getState().encherVidas())
    conferir()
    const aoVoltar = () => document.visibilityState === 'visible' && conferir()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [])

  async function gastarRecarga() {
    setUsando(true)
    try {
      if (await usarRecarga()) encherVidas()
    } finally {
      setUsando(false)
    }
  }

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

      {/* Recarga avulsa (quem é Plus não precisa) */}
      {!plus && (
      <>
      <h2 className="mb-3 mt-8 text-xl font-extrabold">Recarregar vidas</h2>
      <div className="rounded-2xl border-2 border-borda bg-superficie p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-label={`${vidas} de ${VIDAS_MAX} vidas`}>
            {Array.from({ length: VIDAS_MAX }, (_, i) => (
              <Heart
                key={i}
                className={`h-7 w-7 ${i < vidas ? 'text-erro' : 'text-apagado'}`}
                fill="currentColor"
                strokeWidth={0}
              />
            ))}
          </div>
          {vidas < VIDAS_MAX ? (
            <span className="flex items-center gap-1 text-sm font-bold text-texto-suave tabular-nums">
              <Clock className="h-4 w-4" /> +1 em {formatarDuracao(falta)}
            </span>
          ) : (
            <span className="text-sm font-bold text-acerto-texto">Vidas cheias!</span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-superficie-2 p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-erro/15 text-erro">
            <Zap className="h-6 w-6" fill="currentColor" strokeWidth={0} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold">Recarga completa</p>
            <p className="text-sm text-texto-suave">Volta para {VIDAS_MAX} vidas na hora</p>
          </div>
          <button
            type="button"
            disabled={vidas >= VIDAS_MAX}
            onClick={() => setCompra('recarga')}
            className="shrink-0 rounded-xl bg-erro px-3 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_0_var(--color-erro-escura)] transition-transform active:translate-y-0.5 active:shadow-none disabled:bg-apagado disabled:text-apagado-texto disabled:shadow-none"
          >
            {reais(PRECO_RECARGA)}
          </button>
        </div>

        {/* Recargas já pagas e guardadas */}
        {recargas > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-erro/40 p-3">
            <Heart className="h-6 w-6 shrink-0 text-erro" fill="currentColor" strokeWidth={0} />
            <p className="flex-1 text-sm font-bold">
              Você tem {recargas} {recargas === 1 ? 'recarga guardada' : 'recargas guardadas'}
            </p>
            <button
              type="button"
              disabled={usando || vidas >= VIDAS_MAX}
              onClick={gastarRecarga}
              className="shrink-0 rounded-xl border-2 border-erro px-3 py-1.5 text-sm font-extrabold text-erro disabled:border-borda disabled:text-apagado-texto"
            >
              {usando ? 'Usando...' : 'Usar agora'}
            </button>
          </div>
        )}

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
  recarga: `Recarga completa de vidas: ${reais(PRECO_RECARGA)}`,
}

/** "12345678901" vira "123.456.789-01" enquanto a pessoa digita */
function mascaraCpf(valor: string) {
  const n = valor.replace(/\D/g, '').slice(0, 11)
  return n
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

/** Pede nome e CPF (o Asaas exige para emitir a cobrança) e leva para a fatura */
function JanelaCompra({ tipo, aoCancelar }: { tipo: IdPlano | 'recarga'; aoCancelar: () => void }) {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function pagar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const url = await iniciarPagamento(tipo, nome, cpf)
      // Vai para a fatura do Asaas (PIX, cartão ou boleto). Ao voltar, a loja confere o pagamento.
      window.location.href = url
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não deu certo. Tente de novo.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={pagar} className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 text-center">
        <Lapio humor="festa" altura={80} />
        <h2 className="text-xl font-extrabold">Quase lá!</h2>
        <p className="text-sm font-bold">{DESCRICAO_COMPRA[tipo]}</p>
        <p className="text-sm text-texto-suave">
          O pagamento é feito pelo Asaas, com PIX, cartão ou boleto. Ele pede seu nome completo e CPF para emitir a cobrança.
        </p>
      </div>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome completo"
        autoComplete="name"
        className="rounded-2xl border-2 border-borda bg-superficie px-4 py-3 font-semibold outline-none focus:border-agua"
      />
      <input
        value={cpf}
        onChange={(e) => setCpf(mascaraCpf(e.target.value))}
        placeholder="CPF"
        inputMode="numeric"
        className="rounded-2xl border-2 border-borda bg-superficie px-4 py-3 font-semibold tabular-nums outline-none focus:border-agua"
      />
      {erro && <p className="text-center text-sm font-bold text-erro-texto">{erro}</p>}
      <Botao larguraTotal type="submit" disabled={enviando || !nome.trim() || cpf.replace(/\D/g, '').length !== 11}>
        {enviando ? 'Abrindo pagamento...' : 'Ir para o pagamento'}
      </Botao>
      <Botao larguraTotal variante="contorno" type="button" onClick={aoCancelar}>
        Cancelar
      </Botao>
      <p className="text-center text-xs text-texto-suave">
        Não guardamos seu CPF: ele vai direto para o Asaas. Cancele a assinatura quando quiser.
      </p>
    </form>
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
