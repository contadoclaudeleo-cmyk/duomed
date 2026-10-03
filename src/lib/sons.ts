import { useJogo } from '../store/useJogo'

/**
 * Efeitos sonoros gerados na hora pelo navegador (Web Audio API).
 * Não usa arquivos de áudio: não pesa no app, funciona sem internet
 * e não tem problema de direitos autorais.
 */
export type Som = 'toque' | 'acerto' | 'erro' | 'sequencia' | 'conclusao' | 'conquista'

let contexto: AudioContext | null = null

function pegarContexto() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  contexto ??= new AudioContext()
  // Celulares só liberam o áudio depois de um toque; retoma se estiver pausado
  if (contexto.state === 'suspended') void contexto.resume()
  return contexto
}

interface Nota {
  /** Frequência em Hz */
  freq: number
  /** Quando começa, em segundos depois do início do som */
  inicio: number
  duracao: number
  volume?: number
  forma?: OscillatorType
  /** Frequência final, para notas que deslizam */
  freqFinal?: number
}

function tocarNotas(notas: Nota[]) {
  const ctx = pegarContexto()
  if (!ctx) return
  const agora = ctx.currentTime + 0.01
  const saida = ctx.createGain()
  saida.gain.value = 0.22
  saida.connect(ctx.destination)

  for (const n of notas) {
    const osc = ctx.createOscillator()
    const volume = ctx.createGain()
    const t0 = agora + n.inicio
    const t1 = t0 + n.duracao
    osc.type = n.forma ?? 'sine'
    osc.frequency.setValueAtTime(n.freq, t0)
    if (n.freqFinal) osc.frequency.exponentialRampToValueAtTime(n.freqFinal, t1)
    // Ataque rápido e queda suave, para não estalar
    volume.gain.setValueAtTime(0.0001, t0)
    volume.gain.exponentialRampToValueAtTime(n.volume ?? 1, t0 + 0.012)
    volume.gain.exponentialRampToValueAtTime(0.0001, t1)
    osc.connect(volume)
    volume.connect(saida)
    osc.start(t0)
    osc.stop(t1 + 0.02)
  }
}

// Notas musicais usadas (Hz)
const DO5 = 523.25
const MI5 = 659.25
const SOL5 = 783.99
const LA5 = 880
const DO6 = 1046.5
const MI6 = 1318.51
const SOL6 = 1567.98

const SONS: Record<Som, Nota[]> = {
  // Clique curto ao escolher uma opção
  toque: [{ freq: 1200, freqFinal: 900, inicio: 0, duracao: 0.05, volume: 0.35, forma: 'triangle' }],
  // Duas notas subindo, alegre
  acerto: [
    { freq: MI5, inicio: 0, duracao: 0.12, volume: 0.8, forma: 'triangle' },
    { freq: DO6, inicio: 0.09, duracao: 0.28, volume: 0.9, forma: 'triangle' },
    { freq: DO6 * 2, inicio: 0.09, duracao: 0.2, volume: 0.15 },
  ],
  // Duas notas graves descendo, sem ser irritante
  erro: [
    { freq: 220, freqFinal: 196, inicio: 0, duracao: 0.16, volume: 0.6, forma: 'square' },
    { freq: 174.6, freqFinal: 155, inicio: 0.14, duracao: 0.26, volume: 0.55, forma: 'square' },
  ],
  // Três notas rápidas subindo (acertos seguidos)
  sequencia: [
    { freq: SOL5, inicio: 0, duracao: 0.09, volume: 0.7, forma: 'triangle' },
    { freq: DO6, inicio: 0.07, duracao: 0.09, volume: 0.7, forma: 'triangle' },
    { freq: MI6, inicio: 0.14, duracao: 0.09, volume: 0.7, forma: 'triangle' },
    { freq: SOL6, inicio: 0.21, duracao: 0.3, volume: 0.8, forma: 'triangle' },
  ],
  // Fanfarra curta no fim da lição
  conclusao: [
    { freq: DO5, inicio: 0, duracao: 0.14, volume: 0.7, forma: 'triangle' },
    { freq: MI5, inicio: 0.12, duracao: 0.14, volume: 0.7, forma: 'triangle' },
    { freq: SOL5, inicio: 0.24, duracao: 0.14, volume: 0.7, forma: 'triangle' },
    { freq: DO6, inicio: 0.36, duracao: 0.55, volume: 0.85, forma: 'triangle' },
    { freq: MI5, inicio: 0.36, duracao: 0.55, volume: 0.35, forma: 'triangle' },
    { freq: SOL5, inicio: 0.36, duracao: 0.55, volume: 0.35, forma: 'triangle' },
  ],
  // Brilho para conquista, nível novo ou meta batida
  conquista: [
    { freq: LA5, inicio: 0, duracao: 0.1, volume: 0.5 },
    { freq: MI6, inicio: 0.08, duracao: 0.1, volume: 0.5 },
    { freq: LA5 * 2, inicio: 0.16, duracao: 0.4, volume: 0.6 },
  ],
}

/** Toca um efeito sonoro, se a pessoa não desligou os sons no perfil */
export function tocarSom(som: Som) {
  if (!useJogo.getState().sons) return
  try {
    tocarNotas(SONS[som])
  } catch {
    // Sem áudio no aparelho: segue sem som
  }
}
