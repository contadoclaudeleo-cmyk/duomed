// Confere os arquivos de src/data/materias antes de rodar o app.
// Rode com: npm run validar  (também roda sozinho antes de "npm run dev" e "npm run build")
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const PASTAS = ['residencia']
const TIPOS = ['multipla_escolha', 'verdadeiro_falso', 'completar_lacuna', 'associar_pares', 'caso_clinico', 'identificar_imagem']

const erros = []
const avisos = []
const ids = new Map()
const enunciados = new Map()
let totalQuestoes = 0
let naoRevisadas = 0

function usarId(id, onde) {
  if (!id) return erros.push(`${onde}: falta o campo "id"`)
  if (ids.has(id)) erros.push(`${onde}: id "${id}" repetido (já usado em ${ids.get(id)})`)
  ids.set(id, onde)
}

const arquivos = PASTAS.flatMap((p) =>
  readdirSync(join(raiz, 'src', 'data', p))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ arquivo: `${p}/${f}`, caminho: join(raiz, 'src', 'data', p, f) })),
)

for (const { arquivo, caminho } of arquivos) {
  let materia
  try {
    materia = JSON.parse(readFileSync(caminho, 'utf8'))
  } catch (e) {
    erros.push(`${arquivo}: JSON inválido (${e.message}). Confira vírgulas, aspas e chaves.`)
    continue
  }
  usarId(materia.id, arquivo)
  for (const campo of ['nome', 'descricao', 'icone', 'ordem', 'unidades']) {
    if (materia[campo] === undefined) erros.push(`${arquivo}: falta o campo "${campo}"`)
  }
  for (const unidade of materia.unidades ?? []) {
    usarId(unidade.id, arquivo)
    if (unidade.nivel !== undefined && !['facil', 'dificil'].includes(unidade.nivel))
      erros.push(`${arquivo} > ${unidade.id}: "nivel" deve ser "facil" ou "dificil"`)
    for (const licao of unidade.licoes ?? []) {
      usarId(licao.id, arquivo)
      const n = licao.questoes?.length ?? 0
      if (n < 8 || n > 10) avisos.push(`${licao.id}: tem ${n} questões (o ideal é de 8 a 10)`)
      for (const q of licao.questoes ?? []) {
        totalQuestoes++
        const onde = `${arquivo} > ${q.id ?? '(sem id)'}`
        usarId(q.id, arquivo)
        if (!TIPOS.includes(q.tipo)) erros.push(`${onde}: tipo "${q.tipo}" não existe. Use um de: ${TIPOS.join(', ')}`)
        if (!q.enunciado) erros.push(`${onde}: falta "enunciado"`)
        if (!q.explicacao) erros.push(`${onde}: falta "explicacao"`)
        const texto = `${q.caso ?? ''} ${q.enunciado ?? ''}`.trim().toLowerCase()
        if (enunciados.has(texto)) avisos.push(`${onde}: pergunta igual à de ${enunciados.get(texto)}`)
        else enunciados.set(texto, q.id)
        if (typeof q.revisado !== 'boolean') erros.push(`${onde}: falta "revisado": true ou false`)
        if (q.revisado === false) naoRevisadas++

        if (q.tipo === 'verdadeiro_falso') {
          if (typeof q.resposta !== 'boolean') erros.push(`${onde}: "resposta" deve ser true ou false (sem aspas)`)
        } else if (q.tipo === 'associar_pares') {
          if (!Array.isArray(q.pares) || q.pares.length < 2) erros.push(`${onde}: precisa de pelo menos 2 itens em "pares"`)
          const dir = (q.pares ?? []).map((p) => p.direita)
          const esq = (q.pares ?? []).map((p) => p.esquerda)
          if (new Set(dir).size !== dir.length || new Set(esq).size !== esq.length)
            erros.push(`${onde}: os textos dos pares não podem se repetir`)
        } else if (TIPOS.includes(q.tipo)) {
          if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) erros.push(`${onde}: precisa de "opcoes" (lista com 2 ou mais)`)
          else if (!q.opcoes.includes(q.resposta))
            erros.push(`${onde}: a "resposta" ("${q.resposta}") precisa ser igual, letra por letra, a uma das "opcoes"`)
        }
        if (q.tipo === 'completar_lacuna' && !q.enunciado?.includes('___'))
          erros.push(`${onde}: o enunciado precisa ter "___" (três sublinhados) no lugar da lacuna`)
        if (q.tipo === 'caso_clinico' && !q.caso) erros.push(`${onde}: falta o campo "caso"`)
        if (q.tipo === 'identificar_imagem' && q.imagem && !existsSync(join(raiz, 'public', q.imagem)))
          avisos.push(`${onde}: imagem "${q.imagem}" não encontrada em public/ (vai aparecer o placeholder)`)
        if (/[–—]/.test(JSON.stringify(q))) avisos.push(`${onde}: contém travessão; prefira vírgula ou ponto`)
      }
    }
  }
}

for (const a of avisos) console.warn('  aviso:', a)
if (erros.length) {
  console.error(`\n[DuoMed] Encontrei ${erros.length} problema(s) no conteúdo:\n`)
  for (const e of erros) console.error('  erro:', e)
  console.error('')
  process.exit(1)
}
console.log(`[DuoMed] Conteúdo ok: ${totalQuestoes} questões (${naoRevisadas} aguardando revisão médica).`)
