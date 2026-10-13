import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Contadores,
  EstatisticaMateria,
  IdConquista,
  ItemRevisao,
  LicaoConcluida,
  MetaDiaria,
  ModoEstudo,
  NivelDificuldade,
  ModoSessao,
  Ofensiva,
  Questao,
  ResultadoSessao,
  Tema,
  Usuario,
} from "../types";
import { armazenamento } from "../lib/armazenamento";
import {
  buscarLicao,
  buscarMateria,
  buscarQuestao,
  primeiraMateria,
} from "../data";
import { chaveDia } from "../lib/datas";
import {
  recarregarVidas,
  VIDAS_INICIAIS,
  VIDAS_MAX,
} from "../lib/vidas";
import { calcularXpSessao, nivelDoXp, type RespostaDada } from "../lib/xp";
import { atualizarOfensiva } from "../lib/ofensiva";
import {
  avaliarNaFila,
  registrarAcertoNaLicao,
  registrarAcertoNaRevisao,
  registrarErroNaFila,
  type NotaRevisao,
} from "../lib/revisao";
import { verificarConquistas } from "../lib/conquistas";
import { metaDeXpParaMinutos, TEMPO_MAX_POR_QUESTAO } from "../lib/metas";

// ============================================================
// Estado global do jogador.
// Tudo que está em "DadosJogo" é salvo automaticamente (ver lib/armazenamento.ts).
// As regras de jogo ficam em src/lib; aqui só juntamos as peças.
// ============================================================

export interface DadosJogo {
  usuario: Usuario | null;
  xpTotal: number;
  vidas: number;
  ultimaRecargaVida: number;
  ofensiva: Ofensiva;
  /** XP ganho em cada dia, ex.: { "2026-10-02": 25 } */
  xpPorDia: Record<string, number>;
  /** Tempo de estudo de cada dia, em milissegundos (é o que conta para a meta diária) */
  tempoPorDia: Record<string, number>;
  licoesConcluidas: Record<string, LicaoConcluida>;
  filaRevisao: Record<string, ItemRevisao>;
  questoesRespondidas: number;
  acertosTotais: number;
  estatisticasPorMateria: Record<string, EstatisticaMateria>;
  conquistas: Partial<Record<IdConquista, number>>;
  contadores: Contadores;
  /** Sempre 'residencia' (a parte de graduação saiu do app; o campo ficou por compatibilidade) */
  modo: ModoEstudo;
  /** Trilha fácil ou difícil, escolhida pelo teste de nível ou pelo usuário */
  nivel: NivelDificuldade;
  /** true logo após o cadastro, até a pessoa fazer ou pular o teste de nível */
  testeNivelPendente: boolean;
  materiaAtual: string;
  tema: Tema;
  /** Efeitos sonoros ligados */
  sons: boolean;
  /** A meta diária já está em minutos (antes era em XP) */
  metaEmMinutos: boolean;
  /** Quem já usava o app escolhe de novo a meta, agora em minutos */
  avisoMetaMinutos: boolean;
}

interface ConclusaoSessao {
  modo: ModoSessao;
  titulo: string;
  licaoId?: string;
  /** No treino por prova: a banca escolhida (null = misturado) */
  banca?: string | null;
  respostas: RespostaDada[];
  tempoMs: number;
}

interface AcoesJogo {
  /** Resultado da última sessão, mostrado na tela de resultado (não é salvo) */
  ultimoResultado: ResultadoSessao | null;
  criarUsuario: (
    nome: string,
    semestre: number | null,
    metaDiaria: MetaDiaria,
    modo: ModoEstudo,
  ) => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
  definirTema: (tema: Tema) => void;
  definirSons: (sons: boolean) => void;
  /** Vidas que o servidor informou (quem conta as vidas é o servidor; aqui é só para a tela) */
  definirVidas: (vidas: number, ultimaRecarga: number) => void;
  escolherMateria: (materiaId: string) => void;
  definirNivel: (nivel: NivelDificuldade) => void;
  sincronizarVidas: () => void;
  responder: (dados: {
    questao: Questao;
    materiaId: string;
    acertou: boolean;
    modo: ModoSessao;
    /** Quanto tempo a pessoa levou nesta questão (conta para a meta do dia) */
    tempoMs: number;
  }) => void;
  /** Troca a nota da última resposta de revisão (Difícil, Bom ou Fácil) */
  avaliarRevisao: (questaoId: string, nota: NotaRevisao) => void;
  concluirSessao: (dados: ConclusaoSessao) => ResultadoSessao;
  resetarTudo: () => void;
}

export const estadoInicial = (): DadosJogo => ({
  usuario: null,
  xpTotal: 0,
  vidas: VIDAS_MAX,
  ultimaRecargaVida: Date.now(),
  ofensiva: { atual: 0, recorde: 0, ultimoDiaMeta: null },
  xpPorDia: {},
  tempoPorDia: {},
  licoesConcluidas: {},
  filaRevisao: {},
  questoesRespondidas: 0,
  acertosTotais: 0,
  estatisticasPorMateria: {},
  conquistas: {},
  contadores: { licoesPerfeitas: 0, revisoes: 0, treinos: 0, bancasTreinadas: [] },
  modo: "residencia",
  nivel: "facil",
  testeNivelPendente: false,
  materiaAtual: "clinica-medica",
  tema: "sistema",
  sons: true,
  metaEmMinutos: true,
  avisoMetaMinutos: false,
});

/**
 * Como cada questão estava na fila antes da última resposta (não é salvo).
 * Serve para recalcular quando a pessoa escolhe Difícil/Bom/Fácil depois de acertar.
 */
const antesDaResposta = new Map<string, ItemRevisao | undefined>();

/** Estado da questão na fila antes da última resposta (para mostrar os prazos nos botões) */
export const itemAntesDaResposta = (questaoId: string) =>
  antesDaResposta.get(questaoId);

// A meta do dia pode ser batida no meio da sessão; o resultado mostra isso no fim (não é salvo)
let metaBatidaNaSessao = false;

export const useJogo = create<DadosJogo & AcoesJogo>()(
  persist(
    (set, get) => ({
      ...estadoInicial(),
      ultimoResultado: null,

      criarUsuario: (nome, semestre, metaDiaria, modo) =>
        set({
          usuario: {
            nome: nome.trim(),
            semestre,
            metaDiaria,
            criadoEm: Date.now(),
          },
          modo,
          materiaAtual: primeiraMateria().id,
          testeNivelPendente: true,
          // Boas-vindas: começa com 10 vidas (depois a recarga só vai até 5)
          vidas: VIDAS_INICIAIS,
          ultimaRecargaVida: Date.now(),
        }),

      atualizarUsuario: (dados) => {
        const usuario = get().usuario;
        if (usuario) set({ usuario: { ...usuario, ...dados } });
      },

      definirTema: (tema) => set({ tema }),

      definirSons: (sons) => set({ sons }),

      definirNivel: (nivel) => set({ nivel, testeNivelPendente: false }),

      definirVidas: (vidas, ultimaRecargaVida) => set({ vidas, ultimaRecargaVida }),

      escolherMateria: (materiaAtual) =>
        set({ materiaAtual, modo: "residencia" }),

      sincronizarVidas: () => {
        const { vidas, ultimaRecargaVida } = get();
        const novo = recarregarVidas({
          vidas,
          ultimaRecarga: ultimaRecargaVida,
        });
        if (novo.vidas !== vidas)
          set({ vidas: novo.vidas, ultimaRecargaVida: novo.ultimaRecarga });
      },

      // Chamado a cada questão corrigida pelo servidor (as vidas já vêm do servidor)
      responder: ({ questao, materiaId, acertou, modo, tempoMs }) => {
        const s = get();
        const agora = Date.now();
        const hoje = chaveDia(agora);

        // Tempo de estudo do dia e ofensiva (a meta é em minutos)
        const tempoHoje =
          (s.tempoPorDia[hoje] ?? 0) +
          Math.min(Math.max(tempoMs, 0), TEMPO_MAX_POR_QUESTAO);
        const meta = s.usuario?.metaDiaria ?? 10;
        const { ofensiva, bateuMetaAgora } = atualizarOfensiva(
          s.ofensiva,
          tempoHoje,
          meta * 60 * 1000,
          agora,
        );
        if (bateuMetaAgora) metaBatidaNaSessao = true;
        const statsMateria = s.estatisticasPorMateria[materiaId] ?? {
          respondidas: 0,
          acertos: 0,
        };

        // Fila de revisão: erro entra (ou volta ao início); acerto na revisão avança
        let filaRevisao = s.filaRevisao;
        // Guarda como a questão estava, para a pessoa poder trocar a nota (Difícil/Bom/Fácil) logo depois
        antesDaResposta.set(questao.id, s.filaRevisao[questao.id]);
        if (!acertou)
          filaRevisao = registrarErroNaFila(filaRevisao, questao.id, agora);
        else if (modo === "revisao")
          filaRevisao = registrarAcertoNaRevisao(
            filaRevisao,
            questao.id,
            agora,
          );
        else if (modo === "licao" || modo === "treino")
          filaRevisao = registrarAcertoNaLicao(filaRevisao, questao.id, agora);

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
          tempoPorDia: { ...s.tempoPorDia, [hoje]: tempoHoje },
          ofensiva,
        });
      },

      // Na revisão, depois de acertar: a pessoa escolhe Difícil, Bom ou Fácil (o padrão já aplicado é Bom)
      avaliarRevisao: (questaoId, nota) => {
        if (!antesDaResposta.has(questaoId)) return;
        const anterior = antesDaResposta.get(questaoId);
        const base = { ...get().filaRevisao };
        if (anterior) base[questaoId] = anterior;
        else delete base[questaoId];
        set({ filaRevisao: avaliarNaFila(base, questaoId, nota) });
      },

      // Chamado quando o jogador termina todas as questões de uma sessão
      concluirSessao: ({ modo, titulo, licaoId, banca, respostas, tempoMs }) => {
        const s = get();
        const agora = Date.now();
        const hoje = chaveDia(agora);
        const acertos = respostas.filter((r) => r.acertou).length;
        const precisao = respostas.length
          ? Math.round((acertos / respostas.length) * 100)
          : 0;

        // XP (lição e revisão seguem a mesma regra)
        const xp = calcularXpSessao(respostas);
        const xpTotal = s.xpTotal + xp.total;
        const nivelAntes = nivelDoXp(s.xpTotal);
        const nivelDepois = nivelDoXp(xpTotal);

        // XP do dia (a ofensiva já foi atualizada a cada resposta, pelo tempo de estudo)
        const xpHoje = (s.xpPorDia[hoje] ?? 0) + xp.total;
        const ofensiva = s.ofensiva;
        const bateuMetaAgora = metaBatidaNaSessao;
        metaBatidaNaSessao = false;
        const perfeita = (modo === "licao" || modo === "treino") && xp.perfeita > 0;

        // Contadores das conquistas
        const contadores: Contadores = {
          licoesPerfeitas: s.contadores.licoesPerfeitas + (perfeita ? 1 : 0),
          revisoes: s.contadores.revisoes + (modo === "revisao" ? 1 : 0),
          treinos: s.contadores.treinos + (modo === "treino" ? 1 : 0),
          bancasTreinadas:
            modo === "treino" && banca && !s.contadores.bancasTreinadas.includes(banca)
              ? [...s.contadores.bancasTreinadas, banca]
              : s.contadores.bancasTreinadas,
        };

        // Lição concluída (a revisão não conta como lição da trilha)
        let licoesConcluidas = s.licoesConcluidas;
        if (modo === "licao" && licaoId) {
          const anterior = licoesConcluidas[licaoId];
          licoesConcluidas = {
            ...licoesConcluidas,
            [licaoId]: {
              vezes: (anterior?.vezes ?? 0) + 1,
              melhorPrecisao: Math.max(anterior?.melhorPrecisao ?? 0, precisao),
              ultimaEm: agora,
            },
          };
        }

        // Conquistas novas
        const conquistasNovas = verificarConquistas(
          {
            licoesConcluidas,
            questoesRespondidas: s.questoesRespondidas,
            ofensivaAtual: ofensiva.atual,
            sessaoPerfeita: perfeita,
            contadores,
            modo,
            respostas,
            tempoMs,
            agora,
            tempoPorDia: s.tempoPorDia,
            materiasRespondidas: Object.keys(s.estatisticasPorMateria).filter(
              (id) => s.estatisticasPorMateria[id].respondidas > 0,
            ),
            nivel: nivelDepois,
            metaDiaria: s.usuario?.metaDiaria ?? 10,
            metaBatidaHoje: ofensiva.ultimoDiaMeta === hoje,
          },
          s.conquistas,
        );
        const conquistas = { ...s.conquistas };
        for (const id of conquistasNovas) conquistas[id] = agora;

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
          respostas,
        };

        set({
          xpTotal,
          xpPorDia: { ...s.xpPorDia, [hoje]: xpHoje },
          licoesConcluidas,
          conquistas,
          contadores,
          ultimoResultado: resultado,
        });
        return resultado;
      },

      resetarTudo: () => set({ ...estadoInicial(), ultimoResultado: null }),
    }),
    {
      name: "duomed",
      version: 4,
      storage: createJSONStorage(() => armazenamento),
      migrate: (salvo, versao) => {
        const dados = salvo as DadosJogo;
        // Versão 2: acertos também vão para a revisão. Quem já jogava recebe,
        // liberadas na hora, as questões das lições que já tinha concluído.
        if (versao < 2) {
          const agora = Date.now();
          let fila = dados.filaRevisao ?? {};
          for (const licaoId of Object.keys(dados.licoesConcluidas ?? {})) {
            for (const questaoId of buscarLicao(licaoId)?.licao.questoes ?? []) {
              if (fila[questaoId]) continue;
              const item = registrarAcertoNaLicao({}, questaoId, agora)[
                questaoId
              ];
              fila = { ...fila, [questaoId]: { ...item, proximaEm: agora } };
            }
          }
          dados.filaRevisao = fila;
        }
        // Versão 3: o app ficou só com residência e só com questões de prova.
        // Sai da fila de revisão o que não existe mais e a matéria aberta passa a ser da residência.
        // Versão 4: a meta diária passou de XP para minutos (limparDadosAntigos converte)
        if (versao < 4) return limparDadosAntigos(dados);
        return dados;
      },
      // Salva só os dados do jogador (sem o resultado temporário e sem as funções)
      partialize: (estado): DadosJogo => dadosDoJogo(estado),
    },
  ),
);

/**
 * Deixa os dados compatíveis com o conteúdo atual: modo residência, matéria aberta
 * que existe e fila de revisão só com questões que ainda estão no app.
 */
export function limparDadosAntigos(dados: DadosJogo): DadosJogo {
  const filaRevisao = Object.fromEntries(
    Object.entries(dados.filaRevisao ?? {}).filter(([questaoId]) =>
      buscarQuestao(questaoId),
    ),
  );
  const materiaAtual = buscarMateria(dados.materiaAtual)
    ? dados.materiaAtual
    : primeiraMateria().id;
  // Progresso de antes da meta em minutos (aparelho ou nuvem): converte e pede para escolher de novo
  let { usuario, avisoMetaMinutos } = dados;
  if (!dados.metaEmMinutos && usuario) {
    usuario = { ...usuario, metaDiaria: metaDeXpParaMinutos(usuario.metaDiaria) };
    avisoMetaMinutos = true;
  }
  return {
    ...estadoInicial(),
    ...dados,
    usuario,
    avisoMetaMinutos: avisoMetaMinutos ?? false,
    metaEmMinutos: true,
    contadores: { ...estadoInicial().contadores, ...dados.contadores },
    tempoPorDia: dados.tempoPorDia ?? {},
    modo: "residencia",
    materiaAtual,
    filaRevisao,
  };
}

/** Só os dados do jogador, sem funções nem estado temporário (é o que vai para a nuvem) */
export function dadosDoJogo(estado: DadosJogo): DadosJogo {
  const dados: Record<string, unknown> = {};
  for (const chave of Object.keys(estadoInicial()))
    dados[chave] = estado[chave as keyof DadosJogo];
  return dados as unknown as DadosJogo;
}
