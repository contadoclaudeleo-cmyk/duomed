import { buscarQuestao } from "./index";

// ============================================================
// Bibliografia de referência de cada matéria: os livros-texto e
// diretrizes mais usados nas faculdades e nas provas de residência.
// Aparece junto da resolução de cada questão.
//
// Importante: as questões são adaptadas de provas reais de residência
// (a prova aparece em cada questão). A bibliografia é a de referência
// da matéria, sem citar página ou capítulo.
//
// Para uma unidade ou matéria específica, dá para colocar o campo
// "fontes": ["..."] direto no JSON, que tem prioridade sobre esta lista.
// ============================================================

const FONTES: Record<string, string[]> = {
  "clinica-medica": [
    "Harrison – Medicina Interna",
    "Goldman-Cecil – Medicina",
    "Diretrizes brasileiras (SBC, SBD, SBPT, SBR)",
  ],
  cirurgia: [
    "Sabiston – Tratado de Cirurgia",
    "Schwartz – Princípios de Cirurgia",
    "ATLS",
  ],
  pediatria: [
    "Nelson – Tratado de Pediatria",
    "Tratado de Pediatria (SBP)",
    "Calendário de Vacinação do Ministério da Saúde",
  ],
  "ginecologia-obstetricia": [
    "Williams – Obstetrícia",
    "Rezende – Obstetrícia Fundamental",
    "Berek & Novak – Tratado de Ginecologia",
    "Manuais da FEBRASGO",
  ],
  preventiva: [
    "Rouquayrol – Epidemiologia & Saúde",
    "Gordis – Epidemiologia",
    "Gusso & Lopes – Tratado de MFC",
    "Legislação do SUS (Lei 8.080/90 e 8.142/90)",
  ],
  "psiquiatria-residencia": [
    "Kaplan & Sadock – Compêndio de Psiquiatria",
    "DSM-5-TR (APA)",
    "Stahl – Psicofarmacologia",
  ],
};

/** Bibliografia que vale para uma questão: a da unidade, se houver; senão, a da matéria */
export function fontesDaQuestao(questaoId: string): string[] {
  const local = buscarQuestao(questaoId);
  if (!local) return [];
  return (
    local.unidade.fontes ??
    local.materia.fontes ??
    FONTES[local.materia.id] ??
    []
  );
}

/** Prova de residência de onde a questão foi adaptada (quando houver) */
export function provaDaQuestao(questaoId: string): string | undefined {
  return buscarQuestao(questaoId)?.questao.fonte;
}

/** Lista para conferir se toda matéria tem bibliografia (usado no validador) */
export const MATERIAS_COM_FONTES = Object.keys(FONTES);
