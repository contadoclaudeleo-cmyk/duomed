import { limparDadosAntigos, type DadosJogo } from "../store/useJogo";

// ============================================================
// Junta o progresso deste aparelho com o que está na nuvem.
// Usado quando a pessoa entra na conta ou abre o app em outro aparelho.
// Regra geral: nada se perde. Fica o maior XP, todas as lições feitas,
// todas as conquistas e, em cada item, a versão mais avançada.
// Preferências (tema, sons, matéria aberta) ficam as deste aparelho.
// ============================================================

export function mesclarProgresso(
  local: DadosJogo,
  nuvem: DadosJogo,
): DadosJogo {
  // Aparelho novo, sem cadastro: usa tudo da nuvem
  if (!local.usuario) return limparDadosAntigos({ ...nuvem });
  if (!nuvem.usuario) return limparDadosAntigos({ ...local });

  const ofensivaMaisRecente =
    (local.ofensiva.ultimoDiaMeta ?? "") >= (nuvem.ofensiva.ultimoDiaMeta ?? "")
      ? local.ofensiva
      : nuvem.ofensiva;

  return limparDadosAntigos({
    ...local,
    usuario: {
      ...local.usuario,
      criadoEm: Math.min(local.usuario.criadoEm, nuvem.usuario.criadoEm),
    },
    xpTotal: Math.max(local.xpTotal, nuvem.xpTotal),
    ofensiva: {
      ...ofensivaMaisRecente,
      recorde: Math.max(local.ofensiva.recorde, nuvem.ofensiva.recorde),
    },
    xpPorDia: juntar(local.xpPorDia, nuvem.xpPorDia, (a, b) => Math.max(a, b)),
    licoesConcluidas: juntar(
      local.licoesConcluidas,
      nuvem.licoesConcluidas,
      (a, b) => ({
        vezes: Math.max(a.vezes, b.vezes),
        melhorPrecisao: Math.max(a.melhorPrecisao, b.melhorPrecisao),
        ultimaEm: Math.max(a.ultimaEm, b.ultimaEm),
      }),
    ),
    // Na revisão, vale o item que foi mexido por último
    filaRevisao: juntar(local.filaRevisao, nuvem.filaRevisao, (a, b) =>
      a.proximaEm >= b.proximaEm ? a : b,
    ),
    questoesRespondidas: Math.max(
      local.questoesRespondidas,
      nuvem.questoesRespondidas,
    ),
    acertosTotais: Math.max(local.acertosTotais, nuvem.acertosTotais),
    estatisticasPorMateria: juntar(
      local.estatisticasPorMateria,
      nuvem.estatisticasPorMateria,
      (a, b) => (a.respondidas >= b.respondidas ? a : b),
    ),
    // Conquista ganha em qualquer aparelho vale, com a data mais antiga
    conquistas: juntar(local.conquistas, nuvem.conquistas, (a, b) =>
      Math.min(a ?? b ?? 0, b ?? a ?? 0),
    ),
    testeNivelPendente: local.testeNivelPendente && nuvem.testeNivelPendente,
  });
}

/** Junta dois mapas; quando a chave existe nos dois, decide com "escolher" */
function juntar<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  escolher: (x: T, y: T) => T,
): Record<string, T> {
  const resultado: Record<string, T> = { ...b };
  for (const [chave, valor] of Object.entries(a)) {
    resultado[chave] = chave in b ? escolher(valor, b[chave]) : valor;
  }
  return resultado;
}
