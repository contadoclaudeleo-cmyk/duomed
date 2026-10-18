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
// 3) supabase/importar/mudancas-1.sql...: só as questões novas ou alteradas desde a última
//    importação (e as que saíram). Bem menor: é o que se cola no dia a dia. Depois de colar,
//    rode "npm run importado" para marcar este conteúdo como o que está no servidor.
//
// Roda sozinho antes de "npm run dev" e "npm run build". Rode à mão com: npm run estrutura
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
// DUOMED_CONTEUDO: outra pasta de conteúdo (usado só para recriar a marca da última importação)
const pasta = process.env.DUOMED_CONTEUDO ?? join(raiz, 'conteudo', 'residencia')

const materias = readdirSync(pasta)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(pasta, f), 'utf8')))
  .sort((a, b) => a.ordem - b.ordem)

const estrutura = []
const linhas = []

// Banca da prova: a fonte sem o ano ("ENARE 2026 R+" vira "ENARE"). O servidor usa a mesma regra (estudo.sql).
const bancaDa = (fonte) => (fonte ?? '').replace(/\s+(19|20)\d{2}.*$/, '') || null

for (const m of materias) {
  const { unidades, ...resto } = m
  // Quantas questões a matéria tem de cada banca (para o treino por prova)
  const bancas = {}
  for (const u of unidades)
    for (const l of u.licoes)
      for (const q of l.questoes) {
        const b = bancaDa(q.fonte)
        if (b) bancas[b] = (bancas[b] ?? 0) + 1
      }
  estrutura.push({
    ...resto,
    bancas,
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

// Assinatura de cada linha da tabela "questoes": muda se qualquer coisa da questão mudar
const assinaturas = Object.fromEntries(
  linhas.map((l) => [l[0], createHash('sha1').update(JSON.stringify(l)).digest('hex').slice(0, 16)]),
)
if (process.env.DUOMED_SO_ASSINATURAS) {
  writeFileSync(process.env.DUOMED_SO_ASSINATURAS, JSON.stringify(assinaturas))
  console.log(`[DuoMed] Assinaturas de ${linhas.length} questões gravadas.`)
  process.exit(0)
}

writeFileSync(join(raiz, 'src', 'data', 'estrutura.json'), JSON.stringify(estrutura))

// SQL em partes de até ~400 KB (o SQL Editor do Supabase não aceita textos muito grandes)
const texto = (v) => `'${String(v).replaceAll("'", "''")}'`
const pastaSql = join(raiz, 'supabase', 'importar')
rmSync(pastaSql, { recursive: true, force: true })
mkdirSync(pastaSql, { recursive: true })
const valorSql = ([id, materia, licao, nivel, ordem, dados]) =>
  `(${texto(id)}, ${texto(materia)}, ${texto(licao)}, ${texto(nivel)}, ${ordem}, ${texto(dados)}::jsonb)`
const emPartes = (valores) => {
  const partes = []
  let atual = []
  let tamanho = 0
  for (const valor of valores) {
    if (tamanho + valor.length > 400_000 && atual.length) {
      partes.push(atual)
      atual = []
      tamanho = 0
    }
    atual.push(valor)
    tamanho += valor.length
  }
  if (atual.length) partes.push(atual)
  return partes
}
const INSERT = 'insert into public.questoes (id, materia_id, licao_id, nivel, ordem, dados) values'
const UPSERT = [
  'on conflict (id) do update set materia_id = excluded.materia_id, licao_id = excluded.licao_id,',
  '  nivel = excluded.nivel, ordem = excluded.ordem, dados = excluded.dados;',
]
const contagem = `select count(*) as questoes_no_servidor from public.questoes; -- deve dar ${linhas.length}`

const partes = emPartes(linhas.map(valorSql))
partes.forEach((valores, i) => {
  const ultimo = i === partes.length - 1
  const sql = [
    `-- Questões do DuoMed, parte ${i + 1} de ${partes.length}. Cole no Supabase: SQL Editor > New query > Run.`,
    '-- Gerado por scripts/gerar-estrutura.mjs (não edite à mão).',
    INSERT,
    valores.join(',\n'),
    ...UPSERT,
    ...(ultimo
      ? [
          '',
          '-- Última parte: tira do servidor as questões que saíram do conteúdo',
          `delete from public.questoes where id not in (${linhas.map((l) => texto(l[0])).join(', ')});`,
          '',
          contagem,
        ]
      : []),
  ].join('\n')
  writeFileSync(join(pastaSql, `questoes-${i + 1}.sql`), sql + '\n')
})
writeFileSync(join(pastaSql, 'assinaturas.json'), JSON.stringify(assinaturas))

console.log(`[DuoMed] Estrutura gerada (${linhas.length} questões em ${partes.length} arquivos SQL; o site recebe só os ids).`)

// Só o que mudou desde a última importação (supabase/ultima-importacao.json, gravado por "npm run importado")
const arqBase = join(raiz, 'supabase', 'ultima-importacao.json')
if (existsSync(arqBase)) {
  const base = JSON.parse(readFileSync(arqBase, 'utf8'))
  const mudaram = linhas.filter((l) => base[l[0]] !== assinaturas[l[0]])
  const sairam = Object.keys(base).filter((id) => !(id in assinaturas))
  const partesMud = emPartes(mudaram.map(valorSql))
  if (!partesMud.length && sairam.length) partesMud.push([])
  partesMud.forEach((valores, i) => {
    const ultimo = i === partesMud.length - 1
    const sql = [
      `-- Mudanças nas questões do DuoMed, parte ${i + 1} de ${partesMud.length}. Cole no Supabase: SQL Editor > New query > Run.`,
      '-- Gerado por scripts/gerar-estrutura.mjs (não edite à mão).',
      ...(valores.length ? [INSERT, valores.join(',\n'), ...UPSERT] : []),
      ...(ultimo && sairam.length ? ['', `delete from public.questoes where id in (${sairam.map(texto).join(', ')});`] : []),
      ...(ultimo ? ['', contagem] : []),
    ].join('\n')
    writeFileSync(join(pastaSql, `mudancas-${i + 1}.sql`), sql + '\n')
  })
  console.log(
    partesMud.length
      ? `[DuoMed] Desde a última importação: ${mudaram.length} questões novas ou alteradas e ${sairam.length} removidas, em ${partesMud.length} arquivo(s) mudancas-N.sql.`
      : '[DuoMed] Nenhuma mudança desde a última importação.',
  )
}
