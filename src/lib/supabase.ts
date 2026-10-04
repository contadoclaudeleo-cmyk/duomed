import { createClient } from '@supabase/supabase-js'

// ============================================================
// Conexão com o Supabase (contas e progresso na nuvem).
// A URL e a chave "publishable" são públicas: foram feitas para ficar
// dentro do app. A segurança vem das regras (RLS) da tabela "progresso",
// que só deixam cada pessoa ler e alterar a própria linha.
// Nunca coloque aqui a chave "secret" (service_role).
// ============================================================

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL ?? 'https://dkdizfpywyvpxhfpiivr.supabase.co'
const CHAVE_PUBLICA = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_c_9vKOgIV1Ks2bXY1ajHJg_io3htXyu'

export const supabase = createClient(URL_SUPABASE, CHAVE_PUBLICA, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    // O retorno do login com Google é tratado em lib/nuvem.ts, antes do app desenhar a tela
    detectSessionInUrl: false,
  },
})
