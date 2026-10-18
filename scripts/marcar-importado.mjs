// Depois de colar os arquivos SQL no Supabase: marca o conteúdo atual como o que está no servidor.
// Assim, na próxima vez, "npm run estrutura" gera em mudancas-N.sql só o que mudou depois disso.
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const atual = join(raiz, 'supabase', 'importar', 'assinaturas.json')
if (!existsSync(atual)) {
  console.error('Rode "npm run estrutura" antes.')
  process.exit(1)
}
copyFileSync(atual, join(raiz, 'supabase', 'ultima-importacao.json'))
console.log('[DuoMed] Pronto: o conteúdo atual ficou marcado como importado no Supabase.')
