import type { StateStorage } from 'zustand/middleware'

// ============================================================
// Persistência
// Hoje o progresso fica salvo no localStorage do navegador.
//
// Para trocar por Supabase no futuro: crie outro objeto com os mesmos
// três métodos (getItem, setItem, removeItem). Eles podem ser async,
// por exemplo lendo e gravando uma linha na tabela "progresso" do
// usuário logado. Depois troque a exportação "armazenamento" abaixo.
// Nenhuma tela precisa mudar.
// ============================================================

const armazenamentoLocal: StateStorage = {
  getItem: (chave) => {
    try {
      return localStorage.getItem(chave)
    } catch {
      return null
    }
  },
  setItem: (chave, valor) => {
    try {
      localStorage.setItem(chave, valor)
    } catch {
      // navegador sem espaço ou em modo privado: segue sem salvar
    }
  },
  removeItem: (chave) => {
    try {
      localStorage.removeItem(chave)
    } catch {
      // ignorado
    }
  },
}

export const armazenamento: StateStorage = armazenamentoLocal
