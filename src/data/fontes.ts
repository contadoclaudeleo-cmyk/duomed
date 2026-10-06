import { buscarQuestao } from './index'

// ============================================================
// Bibliografia de referência de cada matéria: os livros-texto e
// diretrizes mais usados nas faculdades e nas provas de residência.
// Aparece junto da resolução de cada questão.
//
// Importante: as questões foram escritas a partir do conhecimento
// geral dessas referências, sem citar página ou capítulo, e ainda
// aguardam revisão médica. Por isso o app mostra "Bibliografia da
// matéria", e não "fonte exata da questão".
//
// Para uma unidade ou matéria específica, dá para colocar o campo
// "fontes": ["..."] direto no JSON, que tem prioridade sobre esta lista.
// ============================================================

const FONTES: Record<string, string[]> = {
  // ---------- Graduação: ciclo básico ----------
  anatomia: ['Moore – Anatomia Orientada para a Clínica', 'Netter – Atlas de Anatomia Humana'],
  'histologia-embriologia': ['Junqueira & Carneiro – Histologia Básica', 'Moore – Embriologia Clínica'],
  'biologia-celular': ['Alberts – Biologia Molecular da Célula', 'Junqueira & Carneiro – Biologia Celular e Molecular'],
  bioquimica: ['Lehninger – Princípios de Bioquímica', 'Marks – Bioquímica Médica Básica'],
  fisiologia: ['Guyton & Hall – Tratado de Fisiologia Médica', 'Berne & Levy – Fisiologia'],
  genetica: ['Thompson & Thompson – Genética Médica'],
  imunologia: ['Abbas – Imunologia Celular e Molecular'],
  microbiologia: ['Murray – Microbiologia Médica', 'Trabulsi – Microbiologia'],
  parasitologia: ['Neves – Parasitologia Humana', 'Rey – Parasitologia'],
  patologia: ['Robbins & Cotran – Patologia: Bases Patológicas das Doenças', 'Bogliolo – Patologia'],
  farmacologia: ['Goodman & Gilman – As Bases Farmacológicas da Terapêutica', 'Katzung – Farmacologia Básica e Clínica'],
  'saude-coletiva': ['Rouquayrol – Epidemiologia & Saúde', 'Campos – Tratado de Saúde Coletiva', 'Ministério da Saúde – Guia de Vigilância em Saúde'],
  'psicologia-medica': ['Mello Filho – Psicossomática Hoje', 'Balint – O Médico, seu Paciente e a Doença'],
  'bioetica-medicina-legal': ['Código de Ética Médica (CFM)', 'França – Medicina Legal', 'Hércules – Medicina Legal'],

  // ---------- Graduação: ciclo clínico e internato ----------
  semiologia: ['Porto – Semiologia Médica', 'Bates – Propedêutica Médica'],
  cardiologia: ['Braunwald – Tratado de Doenças Cardiovasculares', 'Diretrizes da Sociedade Brasileira de Cardiologia (SBC)'],
  pneumologia: ['Diretrizes da SBPT', 'GINA (asma) e GOLD (DPOC)', 'Harrison – Medicina Interna'],
  nefrologia: ['Diretrizes KDIGO', 'Riella – Princípios de Nefrologia e Distúrbios Hidroeletrolíticos'],
  gastroenterologia: ['Sleisenger & Fordtran – Doenças Gastrointestinais e Hepáticas', 'Harrison – Medicina Interna'],
  endocrinologia: ['Diretrizes da Sociedade Brasileira de Diabetes (SBD)', 'Williams – Tratado de Endocrinologia', 'Vilar – Endocrinologia Clínica'],
  hematologia: ['Hoffbrand – Fundamentos em Hematologia', 'Zago – Tratado de Hematologia'],
  infectologia: ['Veronesi – Tratado de Infectologia', 'Ministério da Saúde – PCDT de HIV e Manual de Tuberculose'],
  reumatologia: ['Kelley & Firestein – Tratado de Reumatologia', 'Recomendações da Sociedade Brasileira de Reumatologia (SBR)'],
  neurologia: ['Adams & Victor – Princípios de Neurologia', 'Diretrizes da Academia Brasileira de Neurologia (ABN)'],
  dermatologia: ['Azulay – Dermatologia', 'Fitzpatrick – Tratado de Dermatologia'],
  oncologia: ['DeVita – Cancer: Principles & Practice of Oncology', 'INCA – Estimativa e diretrizes de rastreamento'],
  geriatria: ['Freitas – Tratado de Geriatria e Gerontologia', 'Critérios de Beers (AGS)'],
  'medicina-familia': ['Gusso & Lopes – Tratado de Medicina de Família e Comunidade', 'Duncan – Medicina Ambulatorial'],
  psiquiatria: ['Kaplan & Sadock – Compêndio de Psiquiatria', 'DSM-5-TR (APA)'],
  'clinica-cirurgica': ['Sabiston – Tratado de Cirurgia', 'Schwartz – Princípios de Cirurgia'],
  'urgencia-emergencia': ['ATLS (Colégio Americano de Cirurgiões)', 'Diretrizes de RCP da AHA', 'Tintinalli – Medicina de Emergência'],
  anestesiologia: ['Miller – Anestesia', 'Manual de Anestesiologia da SBA'],
  ortopedia: ['Rockwood & Green – Fraturas em Adultos', 'Hebert – Ortopedia e Traumatologia'],
  urologia: ['Campbell-Walsh – Urologia', 'Diretrizes da Sociedade Brasileira de Urologia (SBU)'],
  otorrinolaringologia: ['Tratado de Otorrinolaringologia (ABORL-CCF)'],
  oftalmologia: ['Kanski – Oftalmologia Clínica'],
  radiologia: ['Novelline – Fundamentos de Radiologia de Squire', 'Critérios de Adequação do ACR'],
  'pediatria-geral': ['Nelson – Tratado de Pediatria', 'Tratado de Pediatria (SBP)'],
  'ginecologia-obstetricia-geral': ['Rezende – Obstetrícia Fundamental', 'Berek & Novak – Tratado de Ginecologia', 'Manuais da FEBRASGO'],

  // ---------- Residência ----------
  'clinica-medica': ['Harrison – Medicina Interna', 'Goldman-Cecil – Medicina', 'Diretrizes brasileiras (SBC, SBD, SBPT, SBR)'],
  cirurgia: ['Sabiston – Tratado de Cirurgia', 'Schwartz – Princípios de Cirurgia', 'ATLS'],
  pediatria: ['Nelson – Tratado de Pediatria', 'Tratado de Pediatria (SBP)', 'Calendário de Vacinação do Ministério da Saúde'],
  'ginecologia-obstetricia': ['Williams – Obstetrícia', 'Rezende – Obstetrícia Fundamental', 'Berek & Novak – Tratado de Ginecologia', 'Manuais da FEBRASGO'],
  preventiva: ['Rouquayrol – Epidemiologia & Saúde', 'Gordis – Epidemiologia', 'Gusso & Lopes – Tratado de MFC', 'Legislação do SUS (Lei 8.080/90 e 8.142/90)'],
  'psiquiatria-residencia': ['Kaplan & Sadock – Compêndio de Psiquiatria', 'DSM-5-TR (APA)', 'Stahl – Psicofarmacologia'],
}

/** Bibliografia que vale para uma questão: a da unidade, se houver; senão, a da matéria */
export function fontesDaQuestao(questaoId: string): string[] {
  const local = buscarQuestao(questaoId)
  if (!local) return []
  return local.unidade.fontes ?? local.materia.fontes ?? FONTES[local.materia.id] ?? []
}

/** Prova de residência de onde a questão foi adaptada (quando houver) */
export function provaDaQuestao(questaoId: string): string | undefined {
  return buscarQuestao(questaoId)?.questao.fonte
}

/** Lista para conferir se toda matéria tem bibliografia (usado no validador) */
export const MATERIAS_COM_FONTES = Object.keys(FONTES)
