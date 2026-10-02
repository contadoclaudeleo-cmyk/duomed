import type { Questao, Resposta } from '../types'

/** Confere se a resposta do usuário está certa */
export function corrigir(questao: Questao, resposta: Resposta | null): boolean {
  if (resposta === null) return false

  switch (questao.tipo) {
    case 'verdadeiro_falso':
      return resposta === questao.resposta

    case 'associar_pares': {
      if (typeof resposta !== 'object') return false
      // Todos os pares precisam estar ligados corretamente
      return questao.pares.every((par) => resposta[par.esquerda] === par.direita)
    }

    default:
      return resposta === questao.resposta
  }
}

/** Texto da resposta certa, para mostrar no feedback de erro */
export function textoRespostaCorreta(questao: Questao, resposta: Resposta | null = null): string {
  switch (questao.tipo) {
    case 'verdadeiro_falso':
      return questao.resposta ? 'Verdadeiro' : 'Falso'
    case 'associar_pares': {
      // Mostra só os pares que o usuário ligou errado
      const ligacoes = resposta && typeof resposta === 'object' ? resposta : {}
      const errados = questao.pares.filter((p) => ligacoes[p.esquerda] !== p.direita)
      return errados.map((p) => `${p.esquerda} com ${p.direita}`).join('; ')
    }
    default:
      return questao.resposta
  }
}

/** Se o usuário já escolheu algo suficiente para poder clicar em "Verificar" */
export function respostaCompleta(questao: Questao, resposta: Resposta | null): boolean {
  if (resposta === null) return false
  if (questao.tipo === 'associar_pares') {
    return typeof resposta === 'object' && Object.keys(resposta).length === questao.pares.length
  }
  return true
}
