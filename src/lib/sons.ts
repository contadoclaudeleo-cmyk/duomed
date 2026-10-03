import { useJogo } from '../store/useJogo'
import { arquivoPublico } from './caminho'

/**
 * Efeitos sonoros do app. Os arquivos ficam em public/sons/:
 * - toque e conclusao: Mixkit (mixkit.co), licença gratuita da Mixkit
 * - acerto, erro, sequencia e conquista: Kenney (kenney.nl), domínio público (CC0)
 *
 * Os sons são carregados uma vez na memória e tocados pela Web Audio API,
 * que responde na hora (a tag <audio> atrasa no celular).
 */
export type Som = 'toque' | 'acerto' | 'erro' | 'sequencia' | 'conclusao' | 'conquista'

const SONS: Som[] = ['toque', 'acerto', 'erro', 'sequencia', 'conclusao', 'conquista']

/** Volume de cada som (0 a 1), para nenhum ficar alto demais perto dos outros */
const VOLUME: Record<Som, number> = {
  toque: 0.5,
  acerto: 0.7,
  erro: 0.6,
  sequencia: 0.6,
  conclusao: 0.8,
  conquista: 0.6,
}

let contexto: AudioContext | null = null
const buffers = new Map<Som, AudioBuffer>()
let carregando: Promise<void> | null = null

function pegarContexto() {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  contexto ??= new AudioContext()
  return contexto
}

/** Baixa e prepara todos os sons (uma vez só) */
function carregarSons() {
  const ctx = pegarContexto()
  if (!ctx) return Promise.resolve()
  carregando ??= Promise.all(
    SONS.map(async (som) => {
      try {
        const resposta = await fetch(arquivoPublico(`sons/${som}.mp3`))
        buffers.set(som, await ctx.decodeAudioData(await resposta.arrayBuffer()))
      } catch {
        // Sem esse som: o app segue normalmente, só sem ele
      }
    }),
  ).then(() => undefined)
  return carregando
}

/** Toca um efeito sonoro, se a pessoa não desligou os sons no perfil */
export function tocarSom(som: Som) {
  if (!useJogo.getState().sons) return
  const ctx = pegarContexto()
  if (!ctx) return
  // Celulares só liberam o áudio depois de um toque; retoma se estiver pausado
  if (ctx.state === 'suspended') void ctx.resume()

  const tocar = () => {
    const buffer = buffers.get(som)
    if (!buffer) return
    const fonte = ctx.createBufferSource()
    const volume = ctx.createGain()
    fonte.buffer = buffer
    volume.gain.value = VOLUME[som]
    fonte.connect(volume)
    volume.connect(ctx.destination)
    fonte.start()
  }

  if (buffers.has(som)) tocar()
  else void carregarSons().then(tocar)
}

// Já deixa os sons prontos no primeiro toque na tela, para o primeiro clique não atrasar
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => void carregarSons(), { once: true, capture: true })
}
