import type {
  Licao,
  Materia,
  MateriaJson,
  NivelDificuldade,
  Unidade,
} from "../types";
// Gerado por scripts/gerar-estrutura.mjs a partir de conteudo/residencia.
// Só tem matérias, unidades, lições e os ids das questões: o enunciado, a
// resposta e a explicação ficam no Supabase (ver lib/estudo.ts).
import estrutura from "./estrutura.json";

export const MATERIAS: Materia[] = (estrutura as MateriaJson[])
  .map((m) => ({ ...m, modo: "residencia" as const }))
  .sort((a, b) => a.ordem - b.ordem);

export interface LocalQuestao {
  questaoId: string;
  materia: Materia;
  unidade: Unidade;
  licao: Licao;
}

export interface LocalLicao {
  licao: Licao;
  materia: Materia;
  unidade: Unidade;
  /** Posição da lição dentro da unidade (começa em 0) */
  indiceNaUnidade: number;
}

// Índices para achar rápido qualquer lição ou questão pelo id
const questoesPorId = new Map<string, LocalQuestao>();
const licoesPorId = new Map<string, LocalLicao>();

for (const materia of MATERIAS) {
  for (const unidade of materia.unidades) {
    unidade.licoes.forEach((licao, indiceNaUnidade) => {
      licoesPorId.set(licao.id, { licao, materia, unidade, indiceNaUnidade });
      for (const questaoId of licao.questoes) {
        questoesPorId.set(questaoId, { questaoId, materia, unidade, licao });
      }
    });
  }
}

export const buscarMateria = (id: string) => MATERIAS.find((m) => m.id === id);
export const buscarLicao = (id: string) => licoesPorId.get(id);
/** Onde a questão fica (matéria, unidade e lição). O conteúdo vem do servidor. */
export const buscarQuestao = (id: string) => questoesPorId.get(id);
export const materiaDisponivel = (m: Materia) => m.unidades.length > 0;
/** Primeira matéria com conteúdo */
export const primeiraMateria = () => MATERIAS.find(materiaDisponivel)!;

export const nivelDaUnidade = (u: Unidade): NivelDificuldade =>
  u.nivel ?? "facil";

/** Unidades de uma das trilhas (fácil ou difícil) da matéria */
export const unidadesDoNivel = (m: Materia, nivel: NivelDificuldade) =>
  m.unidades.filter((u) => nivelDaUnidade(u) === nivel);

/** Lista de lições de uma matéria, na ordem da trilha. Sem nível, traz as duas trilhas. */
export const licoesDaMateria = (m: Materia, nivel?: NivelDificuldade) =>
  (nivel ? unidadesDoNivel(m, nivel) : m.unidades).flatMap((u) => u.licoes);

export const NOMES_NIVEL: Record<NivelDificuldade, string> = {
  facil: "Fácil",
  dificil: "Difícil",
};
