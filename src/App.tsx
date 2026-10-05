import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useJogo } from './store/useJogo'
import { useConta } from './lib/nuvem'
import { ContaObrigatoria } from './screens/ContaObrigatoria'
import { Layout } from './components/Layout'
import { BoasVindas } from './screens/BoasVindas'
import { Home } from './screens/Home'
import { Materias } from './screens/Materias'
import { Licao } from './screens/Licao'
import { Resultado } from './screens/Resultado'
import { Revisao } from './screens/Revisao'
import { RevisaoPratica } from './screens/RevisaoPratica'
import { Ranking } from './screens/Ranking'
import { Loja } from './screens/Loja'
import { Feedback } from './screens/Feedback'
import { Perfil } from './screens/Perfil'
import { Nivelamento } from './screens/Nivelamento'
import { RevisaoComentada } from './screens/RevisaoComentada'

/** Aplica claro/escuro no <html> conforme a escolha do usuário */
function useTema() {
  const tema = useJogo((s) => s.tema)
  useEffect(() => {
    const midia = matchMedia('(prefers-color-scheme: dark)')
    const aplicar = () => {
      const escuro = tema === 'escuro' || (tema === 'sistema' && midia.matches)
      document.documentElement.classList.toggle('dark', escuro)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#141817' : '#14B8A6')
    }
    aplicar()
    midia.addEventListener('change', aplicar)
    return () => midia.removeEventListener('change', aplicar)
  }, [tema])
}

/** Recarrega vidas de tempos em tempos e quando o app volta a ficar visível */
function useRecargaDeVidas() {
  const sincronizar = useJogo((s) => s.sincronizarVidas)
  useEffect(() => {
    sincronizar()
    const id = setInterval(sincronizar, 15_000)
    document.addEventListener('visibilitychange', sincronizar)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', sincronizar)
    }
  }, [sincronizar])
}

export function App() {
  useTema()
  useRecargaDeVidas()

  return (
    <Routes>
      <Route path="/boas-vindas" element={<SoSemUsuario />} />
      <Route element={<ExigeUsuario />}>
        {/* Telas com a barra de navegação */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="materias" element={<Materias />} />
          <Route path="revisao" element={<Revisao />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="loja" element={<Loja />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>
        {/* Telas em tela cheia */}
        <Route path="licao/:licaoId" element={<Licao />} />
        <Route path="revisao/praticar" element={<RevisaoPratica />} />
        <Route path="resultado" element={<Resultado />} />
        <Route path="nivelamento" element={<Nivelamento />} />
        <Route path="comentada" element={<RevisaoComentada />} />
        <Route path="comentada/:licaoId" element={<RevisaoComentada />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** Sem cadastro, todas as telas mandam para as boas-vindas. A conta é obrigatória. */
function ExigeUsuario() {
  const temUsuario = useJogo((s) => !!s.usuario)
  const testePendente = useJogo((s) => s.testeNivelPendente)
  const logado = useConta((s) => !!s.sessao)
  const verificada = useConta((s) => s.verificada)
  const { pathname } = useLocation()
  if (!temUsuario) return <Navigate to="/boas-vindas" replace />
  // Quem começou antes da conta ser obrigatória entra agora; o progresso do aparelho vai junto
  if (verificada && !logado) return <ContaObrigatoria />
  // Logo após o cadastro, a pessoa passa pelo teste de nível (pode pular)
  if (testePendente && pathname !== '/nivelamento') return <Navigate to="/nivelamento" replace />
  return <Outlet />
}

function SoSemUsuario() {
  const temUsuario = useJogo((s) => !!s.usuario)
  return temUsuario ? <Navigate to="/" replace /> : <BoasVindas />
}
