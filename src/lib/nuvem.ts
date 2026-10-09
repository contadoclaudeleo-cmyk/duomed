import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { CHAVE_PUBLICA, supabase, URL_SUPABASE } from './supabase'
import { mesclarProgresso } from './mesclar'
import { limparPlus } from './plus'
import { estadoVidas } from './estudo'
import { limparErrosDeSenha, registrarErroDeSenha, tempoBloqueado } from './limiteSenha'
import { dadosDoJogo, useJogo, type DadosJogo } from '../store/useJogo'

// ============================================================
// Conta e sincronização do progresso com a nuvem.
// O app continua funcionando sem internet: o progresso fica no aparelho
// (localStorage) e, com conta, também vai para a tabela "progresso".
// Ao entrar ou voltar ao app, junta o que está no aparelho com a nuvem.
// ============================================================

export type StatusNuvem = 'sem-conta' | 'sincronizando' | 'salvo' | 'offline'

interface EstadoConta {
  sessao: Session | null
  status: StatusNuvem
  /** Mensagem de erro do login (ex.: retorno do Google com falha) */
  erro: string | null
  /** true depois da primeira junção com a nuvem nesta abertura do app */
  carregado: boolean
  /** O botão do Google só aparece quando o login com Google está ligado no Supabase */
  googleAtivo: boolean
  /** true depois que o app descobriu se há alguém logado (lê a sessão guardada no aparelho) */
  verificada: boolean
}

export const useConta = create<EstadoConta>(() => ({
  sessao: null,
  status: 'sem-conta',
  erro: null,
  carregado: false,
  googleAtivo: false,
  verificada: false,
}))

const ESPERA_ENVIO_MS = 2_000
let temporizador: ReturnType<typeof setTimeout> | null = null
let aplicandoNuvem = false

// ---------- Leitura e escrita na tabela ----------

async function baixar(userId: string): Promise<DadosJogo | null> {
  const { data, error } = await supabase.from('progresso').select('dados').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return (data?.dados as DadosJogo | undefined) ?? null
}

async function enviar(userId: string, dados: DadosJogo) {
  const { error } = await supabase
    .from('progresso')
    .upsert({ user_id: userId, dados, atualizado_em: new Date().toISOString() })
  if (error) throw error
}

/** Envia o progresso atual agora (usado antes de sair e ao fechar o app) */
export async function enviarAgora() {
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  const sessao = useConta.getState().sessao
  const dados = dadosDoJogo(useJogo.getState())
  if (!sessao || !dados.usuario) return
  useConta.setState({ status: 'sincronizando' })
  try {
    await enviar(sessao.user.id, dados)
    useConta.setState({ status: 'salvo' })
  } catch {
    useConta.setState({ status: 'offline' })
  }
}

/** Junta aparelho e nuvem e guarda o resultado nos dois lugares */
export async function sincronizar() {
  const sessao = useConta.getState().sessao
  if (!sessao) return
  useConta.setState({ status: 'sincronizando' })
  try {
    const nuvem = await baixar(sessao.user.id)
    const local = dadosDoJogo(useJogo.getState())
    const juntos = nuvem ? mesclarProgresso(local, nuvem) : local
    aplicandoNuvem = true
    useJogo.setState(juntos)
    aplicandoNuvem = false
    if (juntos.usuario) await enviar(sessao.user.id, juntos)
    useConta.setState({ status: 'salvo', carregado: true })
    // Situação do Plus e das vidas compradas
    await atualizarCompras()
  } catch {
    aplicandoNuvem = false
    useConta.setState({ status: 'offline', carregado: true })
  }
}

/** Pergunta ao servidor as vidas e o Plus (as vidas compradas entram lá mesmo) */
export async function atualizarCompras() {
  try {
    await estadoVidas()
  } catch {
    // Sem internet: fica o que já estava na tela
  }
}

// ---------- Ações de conta ----------

const urlDeRetorno = () => window.location.origin + import.meta.env.BASE_URL

export async function entrarComGoogle() {
  useConta.setState({ erro: null })
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: urlDeRetorno() },
  })
  if (error) throw new Error(traduzirErro(error.message))
}

/** Texto "15 minutos" / "1 minuto" para o aviso de bloqueio */
const minutos = (ms: number) => {
  const m = Math.max(1, Math.ceil(ms / 60_000))
  return m === 1 ? '1 minuto' : `${m} minutos`
}

/**
 * Entra com e-mail e senha. Depois de 5 senhas erradas, trava por 15 minutos (ver lib/limiteSenha.ts).
 * captchaToken: resposta do CAPTCHA, quando ele está ligado (ver components/Captcha.tsx).
 */
export async function entrarComEmail(email: string, senha: string, captchaToken?: string) {
  const travado = tempoBloqueado(email)
  if (travado > 0) throw new Error(`Muitas senhas erradas. Tente de novo em ${minutos(travado)}.`)
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: senha,
    options: captchaToken ? { captchaToken } : undefined,
  })
  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      const restam = registrarErroDeSenha(email)
      if (restam === 0) throw new Error(`Muitas senhas erradas. Tente de novo em ${minutos(tempoBloqueado(email))}.`)
      throw new Error(`E-mail ou senha incorretos. ${restam === 1 ? 'Resta 1 tentativa' : `Restam ${restam} tentativas`}.`)
    }
    throw new Error(traduzirErro(error.message))
  }
  limparErrosDeSenha(email)
}

/** Cria a conta. Devolve false se o Supabase pedir confirmação por e-mail antes de entrar. */
export async function criarConta(email: string, senha: string, captchaToken?: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { emailRedirectTo: urlDeRetorno(), ...(captchaToken ? { captchaToken } : {}) },
  })
  if (error) throw new Error(traduzirErro(error.message))
  return !!data.session
}

/** Sai da conta e limpa o aparelho (o progresso continua salvo na nuvem) */
export async function sair() {
  await enviarAgora()
  await supabase.auth.signOut()
  limparPlus()
  useJogo.getState().resetarTudo()
}

/** Apaga só o progresso guardado na nuvem (a conta continua existindo) */
export async function apagarProgressoNaNuvem() {
  const sessao = useConta.getState().sessao
  if (!sessao) return
  const { error } = await supabase.from('progresso').delete().eq('user_id', sessao.user.id)
  if (error) throw new Error(traduzirErro(error.message))
}

/** Apaga a conta e tudo ligado a ela, de forma definitiva */
export async function apagarConta() {
  const { error } = await supabase.rpc('apagar_minha_conta')
  if (error) throw new Error(traduzirErro(error.message))
  await supabase.auth.signOut({ scope: 'local' })
  useJogo.getState().resetarTudo()
}

/** Nome que veio do Google, para já preencher o cadastro */
export function nomeDaConta(sessao: Session | null): string {
  const meta = sessao?.user.user_metadata ?? {}
  return String(meta.full_name ?? meta.name ?? '').trim()
}

function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Já existe uma conta com esse e-mail. Tente entrar.'
  if (m.includes('password should be') || m.includes('at least')) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('unable to validate email') || m.includes('invalid format') || m.includes('email address') && m.includes('invalid'))
    return 'Esse e-mail não parece válido.'
  if (m.includes('provider is not enabled') || m.includes('unsupported provider'))
    return 'Entrar com Google ainda não está ativado.'
  if (m.includes('captcha')) return 'Confirme que você não é um robô e tente de novo.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Espere um pouco e tente de novo.'
  if (m.includes('fetch') || m.includes('network')) return 'Sem conexão com a internet.'
  return 'Não deu certo. Tente de novo em instantes.'
}

// ---------- Início ----------

/**
 * Chamado uma vez, antes de desenhar o app.
 * Trata a volta do login com Google, acompanha a sessão e mantém a nuvem em dia.
 */
export function iniciarNuvem() {
  // Quais formas de login estão ligadas no painel do Supabase
  fetch(`${URL_SUPABASE}/auth/v1/settings`, { headers: { apikey: CHAVE_PUBLICA } })
    .then((r) => r.json())
    .then((config) => useConta.setState({ googleAtivo: config?.external?.google === true }))
    .catch(() => {})

  // Volta do Google: a URL traz ?code=... (ou ?error=...). Lê e limpa antes do roteador mexer na URL.
  const url = new URL(window.location.href)
  const codigo = url.searchParams.get('code')
  const erroOAuth = url.searchParams.get('error_description') ?? url.searchParams.get('error')
  if (codigo || erroOAuth) {
    for (const p of ['code', 'error', 'error_code', 'error_description', 'state']) url.searchParams.delete(p)
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }
  if (erroOAuth) useConta.setState({ erro: 'Não foi possível entrar com o Google. Tente de novo.' })
  if (codigo) {
    supabase.auth.exchangeCodeForSession(codigo).then(({ error }) => {
      if (error) useConta.setState({ erro: 'Não foi possível entrar com o Google. Tente de novo.' })
    })
  }

  supabase.auth.onAuthStateChange((evento, sessao) => {
    const antes = useConta.getState().sessao
    const contaNova = !!sessao && antes?.user.id !== sessao.user.id
    useConta.setState({
      sessao,
      verificada: true,
      status: sessao ? useConta.getState().status : 'sem-conta',
      // Conta recém-conectada: espera a primeira junção com a nuvem
      carregado: sessao ? !contaNova && useConta.getState().carregado : true,
    })
    // Não chamar o Supabase dentro deste aviso: agenda para logo depois
    if (contaNova && (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION')) setTimeout(sincronizar, 0)
  })

  // Cada mudança no progresso vai para a nuvem alguns segundos depois
  useJogo.subscribe(() => {
    if (aplicandoNuvem || !useConta.getState().sessao) return
    if (temporizador) clearTimeout(temporizador)
    temporizador = setTimeout(enviarAgora, ESPERA_ENVIO_MS)
  })

  // Ao voltar para o app, busca o que foi feito em outro aparelho; ao sair, envia o que falta
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sincronizar()
    else enviarAgora()
  })
  window.addEventListener('online', () => sincronizar())

  // "Estou aqui": a cada minuto, com o app aberto, avisa o servidor (estatísticas de online e acessos do dia)
  setTimeout(registrarAcesso, 3_000)
  setInterval(registrarAcesso, INTERVALO_PRESENCA_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registrarAcesso()
  })
}

const INTERVALO_PRESENCA_MS = 60_000

/** Marca que a pessoa está usando o app agora (ver supabase/estatisticas.sql) */
function registrarAcesso() {
  if (!useConta.getState().sessao || document.visibilityState !== 'visible') return
  supabase.rpc('registrar_acesso').then(
    () => {},
    () => {},
  )
}
