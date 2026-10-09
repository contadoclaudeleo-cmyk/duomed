// Gera os dois arquivos que saem do conteúdo (conteudo/residencia/*.json):
//
// 1) src/data/estrutura.json: o "mapa" do app (matérias, unidades, lições e os ids das questões).
//    NÃO tem enunciado, alternativas, resposta nem explicação. É isso que vai para o site.
//
// 2) supabase/importar/questoes-1.sql, questoes-2.sql...: as questões completas, para colar
//    no SQL Editor do Supabase (tabela "questoes"). O app só recebe as questões pelo servidor,
//    que confere as vidas. Pode rodar de novo quando mudar alguma questão: atualiza o que mudou
//    e o último arquivo apaga do servidor as questões que saíram do conteúdo.
//
// Roda sozinho antes de "npm run dev" e "npm run build". Rode à mão com: npm run estrutura
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const pasta = join(raiz, 'conteudo', 'residencia')

const materias = readdirSync(pasta)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(pasta, f), 'utf8')))
  .sort((a, b) => a.ordem - b.ordem)

const estrutura = []
const linhas = []

for (const m of materias) {
  const { unidades, ...resto } = m
  estrutura.push({
    ...resto,
    unidades: unidades.map(({ licoes, ...u }) => ({
      ...u,
      licoes: licoes.map((l) => {
        l.questoes.forEach((q, ordem) => {
          linhas.push([q.id, m.id, l.id, u.nivel ?? 'facil', ordem, JSON.stringify(q)])
        })
        return { id: l.id, titulo: l.titulo, questoes: l.questoes.map((q) => q.id) }
      }),
    })),
  })
}

writeFileSync(join(raiz, 'src', 'data', 'estrutura.json'), JSON.stringify(estrutura))

// SQL em partes de até ~400 KB (o SQL Editor do Supabase não aceita textos muito grandes)
const texto = (v) => `'${String(v).replaceAll("'", "''")}'`
const pastaSql = join(raiz, 'supabase', 'importar')
rmSync(pastaSql, { recursive: true, force: true })
mkdirSync(pastaSql, { recursive: true })
const partes = []
let atual = []
let tamanho = 0
for (const [id, materia, licao, nivel, ordem, dados] of linhas) {
  const valor = `(${texto(id)}, ${texto(materia)}, ${texto(licao)}, ${texto(nivel)}, ${ordem}, ${texto(dados)}::jsonb)`
  if (tamanho + valor.length > 400_000 && atual.length) {
    partes.push(atual)
    atual = []
    tamanho = 0
  }
  atual.push(valor)
  tamanho += valor.length
}
if (atual.length) partes.push(atual)
partes.forEach((valores, i) => {
  const ultimo = i === partes.length - 1
  const sql = [
    `-- Questões do DuoMed, parte ${i + 1} de ${partes.length}. Cole no Supabase: SQL Editor > New query > Run.`,
    '-- Gerado por scripts/gerar-estrutura.mjs (não edite à mão).',
    'insert into public.questoes (id, materia_id, licao_id, nivel, ordem, dados) values',
    valores.join(',\n'),
    'on conflict (id) do update set materia_id = excluded.materia_id, licao_id = excluded.licao_id,',
    '  nivel = excluded.nivel, ordem = excluded.ordem, dados = excluded.dados;',
    ...(ultimo
      ? [
          '',
          '-- Última parte: tira do servidor as questões que saíram do conteúdo',
          `delete from public.questoes where id not in (${linhas.map((l) => texto(l[0])).join(', ')});`,
          '',
          `select count(*) as questoes_no_servidor from public.questoes; -- deve dar ${linhas.length}`,
        ]
      : []),
  ].join('\n')
  writeFileSync(join(pastaSql, `questoes-${i + 1}.sql`), sql + '\n')
})

console.log(`[DuoMed] Estrutura gerada (${linhas.length} questões em ${partes.length} arquivos SQL; o site recebe só os ids).`)
