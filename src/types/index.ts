// ============================================================
// Conteúdo (o que fica nos arquivos JSON de src/data/materias)
// ============================================================

export type TipoQuestao =
  | 'multipla_escolha'
  | 'verdadeiro_falso'
  | 'completar_lacuna'
  | 'associar_pares'
  | 'caso_clinico'
  | 'identificar_imagem'

interface QuestaoBase {
  id: string
  tipo: TipoQuestao
  enunciado: string
  explicacao: string
  /** Fica false até o conteúdo passar por revisão médica */
  revisado: boolean
  /** Prova de onde a questão foi adaptada, ex.: "AMRIGS 2025" */
  fonte?: string
}

export interface QuestaoMultiplaEscolha extends QuestaoBase {
  tipo: 'multipla_escolha'
  opcoes: string[]
  resposta: string
}

export interface QuestaoVerdadeiroFalso extends QuestaoBase {
  tipo: 'verdadeiro_falso'
  resposta: boolean
}

/** O enunciado precisa conter "___" no lugar da lacuna */
export interface QuestaoCompletarLacuna extends QuestaoBase {
  tipo: 'completar_lacuna'
  opcoes: string[]
  resposta: string
}

export interface Par {
  esquerda: string
  direita: string
}

export interface QuestaoAssociarPares extends QuestaoBase {
  tipo: 'associar_pares'
  pares: Par[]
}

export interface QuestaoCasoClinico extends QuestaoBase {
  tipo: 'caso_clinico'
  /** Enunciado do caso, de 2 a 4 linhas */
  caso: string
  opcoes: string[]
  resposta: string
}

export interface QuestaoIdentificarImagem extends QuestaoBase {
  tipo: 'identificar_imagem'
  /** Caminho dentro de public/. Se não existir, aparece um placeholder */
  imagem?: string
  /** Autor e licença da imagem, aparece embaixo dela (obrigatório em imagens CC BY-SA) */
  creditoImagem?: string
  opcoes: string[]
  resposta: string
}

export type Questao =
  | QuestaoMultiplaEscolha
  | QuestaoVerdadeiroFalso
  | QuestaoCompletarLacuna
  | QuestaoAssociarPares
  | QuestaoCasoClinico
  | QuestaoIdentificarImagem

export interface Licao {
  id: string
  titulo: string
  questoes: Questao[]
}

/** Fácil (conceitos) ou Difícil (questões no estilo das provas) */
export type NivelDificuldade = 'facil' | 'dificil'

export interface Unidade {
  id: string
  titulo: string
  descricao: string
  /** Trilha em que a unidade aparece. Se faltar, é 'facil'. */
  nivel?: NivelDificuldade
  /** Bibliografia desta unidade (tem prioridade sobre a da matéria) */
  fontes?: string[]
  licoes: Licao[]
}

/** Graduação (matérias do curso) ou Residência (grandes áreas das provas) */
export type ModoEstudo = 'graduacao' | 'residencia'

/** Etapa do curso em que a matéria costuma ser vista (só no modo Graduação) */
export type CicloCurso = 'basico' | 'clinico' | 'internato'

/** Matéria como está escrita no arquivo JSON */
export interface MateriaJson {
  id: string
  nome: string
  descricao: string
  /** Nome do ícone (ver src/components/IconeMateria.tsx) */
  icone: string
  ordem: number
  ciclo?: CicloCurso
  /** Bibliografia da matéria (se faltar, usa a lista de src/data/fontes.ts) */
  fontes?: string[]
  /** Matéria sem unidades aparece como "em breve" */
  unidades: Unidade[]
}

/** Matéria já carregada no app. O modo vem da pasta onde está o arquivo. */
export interface Materia extends MateriaJson {
  modo: ModoEstudo
}

// ============================================================
// Respostas do usuário
// ============================================================

/** Alternativa escolhida (texto), verdadeiro/falso, ou mapa esquerda -> direita nos pares */
export type Resposta = string | boolean | Record<string, string>

// ============================================================
// Estado do jogador (o que é salvo no localStorage)
// ============================================================

export type MetaDiaria = 10 | 20 | 30
export type Tema = 'claro' | 'escuro' | 'sistema'

export interface Usuario {
  nome: string
  /** null para quem escolheu o modo residência no cadastro */
  semestre: number | null
  metaDiaria: MetaDiaria
  criadoEm: number
}

export interface Ofensiva {
  atual: number
  recorde: number
  /** Último dia (AAAA-MM-DD) em que a meta diária foi batida */
  ultimoDiaMeta: string | null
}

export interface ItemRevisao {
  questaoId: string
  /** Acertos seguidos (o mesmo que "repeticoes"; mantido para o progresso antigo) */
  etapa: number
  /** SM-2 (Anki): facilidade, intervalo atual em dias, acertos seguidos e quantas vezes errou */
  facilidade?: number
  intervalo?: number
  repeticoes?: number
  lapsos?: number
  /** Timestamp a partir do qual a questão volta a aparecer */
  proximaEm: number
  adicionadaEm: number
  /** Por que entrou na fila. Itens antigos, sem esse campo, são erros. */
  origem?: OrigemRevisao
}

/** Erro: entrou porque a pessoa errou. Acerto: entrou para reforçar o que ela acertou. */
export type OrigemRevisao = 'erro' | 'acerto'

export interface LicaoConcluida {
  vezes: number
  melhorPrecisao: number
  ultimaEm: number
}

export interface EstatisticaMateria {
  respondidas: number
  acertos: number
}

export type IdConquista =
  | 'primeira_licao'
  | 'ofensiva_7'
  | 'questoes_100'
  | 'licao_perfeita'
  | 'unidade_completa'

/** 'nivelamento' é o teste de nível: não gasta vidas nem dá XP */
export type ModoSessao = 'licao' | 'revisao' | 'nivelamento'

/** Uma questão respondida numa sessão, com o que a pessoa marcou */
export interface RespostaDada {
  questao: Questao
  acertou: boolean
  resposta: Resposta | null
}

export interface ResultadoSessao {
  modo: ModoSessao
  titulo: string
  xp: { base: number; perfeita: number; casos: number; total: number }
  acertos: number
  total: number
  precisao: number
  tempoMs: number
  conquistasNovas: IdConquista[]
  /** Novo nível, se subiu */
  subiuParaNivel: number | null
  /** true se esta sessão fez a meta do dia ser batida agora */
  bateuMetaAgora: boolean
  ofensiva: number
  /** Questões da sessão, para a revisão comentada */
  respostas: RespostaDada[]
}
