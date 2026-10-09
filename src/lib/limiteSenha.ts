// ============================================================
// Limite de senhas erradas: depois de 5 erros seguidos no mesmo e-mail,
// o login fica travado por 15 minutos neste aparelho.
//
// Isso atrapalha quem tenta adivinhar senha pela tela. Quem programa pode
// pular o app e falar direto com o Supabase, então a proteção de verdade
// fica lá: o CAPTCHA (Cloudflare Turnstile, ver Captcha.tsx) e o limite de
// tentativas por IP do Supabase (ver supabase/LEIA-ME-ESTUDO.md).
// ============================================================

export const MAX_ERROS_SENHA = 5
export const TEMPO_BLOQUEIO_MS = 15 * 60 * 1000

const CHAVE = 'duomed-tentativas'

interface Tentativas {
  erros: number
  bloqueadoAte: number
}

function ler(): Record<string, Tentativas> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Record<string, Tentativas>
  } catch {
    return {}
  }
}

function gravar(todas: Record<string, Tentativas>) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(todas))
  } catch {
    // Sem armazenamento (aba anônima, por exemplo): o limite vale só até fechar a página
  }
}

const chaveDoEmail = (email: string) => email.trim().toLowerCase()

/** Milissegundos que faltam para poder tentar de novo (0 = liberado) */
export function tempoBloqueado(email: string, agora = Date.now()): number {
  const t = ler()[chaveDoEmail(email)]
  return t && t.bloqueadoAte > agora ? t.bloqueadoAte - agora : 0
}

/** Conta um erro de senha. Devolve quantas tentativas ainda restam (0 = acabou de travar). */
export function registrarErroDeSenha(email: string, agora = Date.now()): number {
  const todas = ler()
  const chave = chaveDoEmail(email)
  const anterior = todas[chave]
  // Depois que o bloqueio passa, a contagem recomeça
  const erros = (anterior && anterior.bloqueadoAte <= agora && anterior.erros >= MAX_ERROS_SENHA ? 0 : anterior?.erros ?? 0) + 1
  const travou = erros >= MAX_ERROS_SENHA
  todas[chave] = { erros, bloqueadoAte: travou ? agora + TEMPO_BLOQUEIO_MS : 0 }
  gravar(todas)
  return Math.max(0, MAX_ERROS_SENHA - erros)
}

/** Entrou certo: zera os erros desse e-mail */
export function limparErrosDeSenha(email: string) {
  const todas = ler()
  delete todas[chaveDoEmail(email)]
  gravar(todas)
}
