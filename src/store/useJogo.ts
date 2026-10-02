import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  EstatisticaMateria,
  IdConquista,
  ItemRevisao,
  LicaoConcluida,
  MetaDiaria,
  ModoEstudo,
  ModoSessao,
  Ofensiva,
  Questao,
  ResultadoSessao,
  Tema,
  Usuario,
} from '../types'
import { armazenamento } from '../lib/armazenamento'
import { buscarMateria, primeiraMateriaDoModo } from '../data'
import { chaveDia } from '../lib/datas'
import { perderVida, recarregarVidas, VIDAS_MAX } from '../lib/vidas'
import { calcularXpSessao, nivelDoXp, type RespostaDada } from '../lib/xp'
import { atualizarOfensiva } from '../lib/ofensiva'
import { registrarAcertoNaRevisao, registrarErroNaFila } from '../lib/revisao'
import { verificarConquistas } from '../lib/conquistas'

// ============================================================
// Estado global do jogador.
// Tudo que está em "DadosJogo" é salvo automaticamente (ver lib/armazenamento.ts).
// As regras de jogo ficam em src/lib; aqui só juntamos as peças.
// ============================================================

interface DadosJogo {
  usuario: Usuario | null
  xpTotal: number
  vidas: number
  ultimaRecargaVida: number
  ofensiva: Ofensiva
  /** XP ganho em cada dia, ex.: { "2026-10-02": 25 } */
  xpPorDia: Record<string, number>
  licoesConcluidas: Record<string, LicaoConcluida>
  filaRevisao: Record<string, ItemRevisao>
  questoesRespondidas: number
  acertosTotais: number
  estatisticasPorMateria: Record<string, EstatisticaMateria>
  conquistas: Partial<Record<IdConquista, number>>
  /** Graduação ou Residência: define quais matérias aparecem */
  modo: ModoEstudo
  materiaAtual: string
  tema: Tema
}

interface ConclusaoSessao {
  modo: ModoSessao
  titulo: string
  licaoId?: string
  respostas: RespostaDada[]
  tempoMs: number
}

interface AcoesJogo {
  /** Resultado da última sessão, mostrado na tela de resultado (não é salvo) */
  ultimoResultado: ResultadoSessao | null
  criarUsuario: (nome: string, semestre: number | null, metaDiaria: MetaDiaria, modo: ModoEstudo) => void
  atualizarUsuario: (dados: Partial<Usuario>) => void
  definirTema: (tema: Tema) => void
  escolherMateria: (materiaId: string) => void
  escolherModo: (modo: ModoEstudo) => void
  sincronizarVidas: () => void
  responder: (dados: { questao: Questao; materiaId: string; acertou: boolean; modo: ModoSessao }) => void
  concluirSessao: (dados: ConclusaoSessao) => ResultadoSessao
  resetarTudo: () => void
}

const estadoInicial = (): DadosJogo => ({
  usuario: null,
  xpTotal: 0,
  vidas: VIDAS_MAX,
  ultimaRecargaVida: Date.now(),
  ofensiva: { atual: 0, recorde: 0, ultimoDiaMeta: null },
  xpPorDia: {},
  licoesConcluidas: {},
  filaRevisao: {},
  questoesRespondidas: 0,
  acertosTotais: 0,
  estatisticasPorMateria: {},
  conquistas: {},
  modo: 'graduacao',
  materiaAtual: 'anatomia',
  tema: 'sistema',
})

export const useJogo = create<DadosJogo & AcoesJogo>()(
  persist(
    (set, get) => ({
      ...estadoInicial(),
      ultimoResultado: null,

      criarUsuario: (nome, semestre, metaDiaria, modo) =>
        set({
          usuario: { nome: nome.trim(), semestre, metaDiaria, criadoEm: Date.now() },
          modo,
          materiaAtual: primeiraMateriaDoModo(modo).id,
        }),

      atualizarUsuario: (dados) => {
        const usuario = get().usuario
        if (usuario) set({ usuario: { ...usuario, ...dados } })
      },

      definirTema: (tema) => set({ tema }),

      // Escolher uma matéria também troca o modo, se ela for do outro modo
      escolherMateria: (materiaAtual) =>
        set({ materiaAtual, modo: buscarMateria(materiaAtual)?.modo ?? get().modo }),

      // Trocar de modo leva para a primeira matéria daquele modo
      escolherModo: (modo) => {
        if (buscarMateria(get().materiaAtual)?.modo === modo) return set({ modo })
        set({ modo, materiaAtual: primeiraMateriaDoModo(modo).id })
      },

      sincronizarVidas: () => {
        const { vidas, ultimaRecargaVida } = get()
        const novo = recarregarVidas({ vidas, ultimaRecarga: ultimaRecargaVida })
        if (novo.vidas !== vidas) set({ vidas: novo.vidas, ultimaRecargaVida: novo.ultimaRecarga })
      },

      // Chamado a cada questão verificada
      responder: ({ questao, materiaId, acertou, modo }) => {
        const s = get()
        const agora = Date.now()
        const statsMateria = s.estatisticasPorMateria[materiaId] ?? { respondidas: 0, acertos: 0 }

        // Fila de revisão: erro entra (ou volta ao início); acerto na revisão avança
        let filaRevisao = s.filaRevisao
        if (!acertou) filaRevisao = registrarErroNaFila(filaRevisao, questao.id, agora)
        else if (modo === 'revisao') filaRevisao = registrarAcertoNaRevisao(filaRevisao, questao.id, agora)

        // Vidas: só se perde vida errando em lição. Revisão nunca gasta vida.
        let vidas = { vidas: s.vidas, ultimaRecarga: s.ultimaRecargaVida }
        if (!acertou && modo === 'licao') vidas = perderVida(vidas, agora)

        set({
          questoesRespondidas: s.questoesRespondidas + 1,
          acertosTotais: s.acertosTotais + (acertou ? 1 : 0),
          estatisticasPorMateria: {
            ...s.estatisticasPorMateria,
            [materiaId]: {
              respondidas: statsMateria.respondidas + 1,
              acertos: statsMateria.acertos + (acertou ? 1 : 0),
            },
          },
          filaRevisao,
          vidas: vidas.vidas,
          ultimaRecargaVida: vidas.ultimaRecarga,
        })
      },

      // Chamado quando o jogador termina todas as questões de uma sessão
      concluirSessao: ({ modo, titulo, licaoId, respostas, tempoMs }) => {
        const s = get()
        const agora = Date.now()
        const hoje = chaveDia(agora)
        const acertos = respostas.filter((r) => r.acertou).length
        const precisao = respostas.length ? Math.round((acertos / respostas.length) * 100) : 0

        // XP (lição e revisão seguem a mesma regra)
        const xp = calcularXpSessao(respostas)
        const xpTotal = s.xpTotal + xp.total
        const nivelAntes = nivelDoXp(s.xpTotal)
        const nivelDepois = nivelDoXp(xpTotal)

        // XP do dia e ofensiva
        const xpHoje = (s.xpPorDia[hoje] ?? 0) + xp.total
        const meta = s.usuario?.metaDiaria ?? 20
        const { ofensiva, bateuMetaAgora } = atualizarOfensiva(s.ofensiva, xpHoje, meta, agora)

        // Lição concluída (a revisão não conta como lição da trilha)
        let licoesConcluidas = s.licoesConcluidas
        if (modo === 'licao' && licaoId) {
          const anterior = licoesConcluidas[licaoId]
          licoesConcluidas = {
            ...licoesConcluidas,
            [licaoId]: {
              vezes: (anterior?.vezes ?? 0) + 1,
              melhorPrecisao: Math.max(anterior?.melhorPrecisao ?? 0, precisao),
              ultimaEm: agora,
            },
          }
        }

        // Conquistas novas
        const conquistasNovas = verificarConquistas(
          {
            licoesConcluidas,
            questoesRespondidas: s.questoesRespondidas,
            ofensivaAtual: ofensiva.atual,
            sessaoPerfeita: modo === 'licao' && xp.perfeita > 0,
          },
          s.conquistas,
        )
        const conquistas = { ...s.conquistas }
        for (const id of conquistasNovas) conquistas[id] = agora

        const resultado: ResultadoSessao = {
          modo,
          titulo,
          xp,
          acertos,
          total: respostas.length,
          precisao,
          tempoMs,
          conquistasNovas,
          subiuParaNivel: nivelDepois > nivelAntes ? nivelDepois : null,
          bateuMetaAgora,
          ofensiva: ofensiva.atual,
        }

        set({
          xpTotal,
          xpPorDia: { ...s.xpPorDia, [hoje]: xpHoje },
          ofensiva,
          licoesConcluidas,
          conquistas,
          ultimoResultado: resultado,
        })
        return resultado
      },

      resetarTudo: () => set({ ...estadoInicial(), ultimoResultado: null }),
    }),
    {
      name: 'duomed',
      version: 1,
      storage: createJSONStorage(() => armazenamento),
      // Salva só os dados do jogador (sem o resultado temporário e sem as funções)
      partialize: (estado): DadosJogo => {
        const dados: Record<string, unknown> = {}
        for (const chave of Object.keys(estadoInicial())) dados[chave] = estado[chave as keyof DadosJogo]
        return dados as unknown as DadosJogo
      },
    },
  ),
)
