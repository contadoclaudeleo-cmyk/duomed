// Datas sempre no fuso do aparelho do usuário, no formato AAAA-MM-DD.
// Usamos esse formato como "chave do dia" para XP diário e ofensiva.

export const UM_MINUTO = 60 * 1000
export const UMA_HORA = 60 * UM_MINUTO
export const UM_DIA = 24 * UMA_HORA

export function chaveDia(data: Date | number = Date.now()): string {
  const d = new Date(data)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Soma (ou subtrai) dias de calendário, sem se confundir com horário de verão */
export function somarDias(data: Date | number, dias: number): Date {
  const d = new Date(data)
  d.setDate(d.getDate() + dias)
  return d
}

/** Segunda-feira 00:00 da semana da data informada */
export function inicioDaSemana(data: Date | number = Date.now()): Date {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  const diaSemana = (d.getDay() + 6) % 7 // segunda = 0 ... domingo = 6
  d.setDate(d.getDate() - diaSemana)
  return d
}

export function formatarDuracao(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}

/** "hoje", "amanhã", "em 3 dias" */
export function quandoRelativo(timestamp: number, agora = Date.now()): string {
  const dias = Math.round((new Date(timestamp).setHours(0, 0, 0, 0) - new Date(agora).setHours(0, 0, 0, 0)) / UM_DIA)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  return `em ${dias} dias`
}
