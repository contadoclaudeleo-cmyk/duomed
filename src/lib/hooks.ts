import { useEffect, useState } from 'react'

/** Devolve o horário atual e atualiza a cada "intervalo" ms (para cronômetros na tela) */
export function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervalo)
    return () => clearInterval(id)
  }, [intervalo])
  return agora
}
