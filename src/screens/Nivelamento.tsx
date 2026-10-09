import { motion } from "framer-motion";
import { SignalHigh, SignalLow } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NivelDificuldade } from "../types";
import { NOMES_NIVEL } from "../data";
import { useJogo } from "../store/useJogo";
import { iniciarNivelamento } from "../lib/estudo";
import type { RespostaDada } from "../lib/xp";
import { Botao } from "../components/Botao";
import { CarregarSessao } from "../components/CarregarSessao";
import { Lapio } from "../components/Lapio";
import { Sessao } from "./Sessao";

// ============================================================
// Teste de nível
// 8 questões da trilha difícil, de matérias variadas (o servidor sorteia).
// Quem acerta 6 ou mais começa no nível difícil.
// ============================================================

export const QUESTOES_NO_TESTE = 8;
export const ACERTOS_PARA_DIFICIL = 6;

export function Nivelamento() {
  const navegar = useNavigate();
  const definirNivel = useJogo((s) => s.definirNivel);
  const [fase, setFase] = useState<"inicio" | "teste" | "resultado">("inicio");
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(QUESTOES_NO_TESTE);

  function escolher(nivel: NivelDificuldade) {
    definirNivel(nivel);
    navegar("/", { replace: true });
  }

  function terminar(respostas: RespostaDada[]) {
    setAcertos(respostas.filter((r) => r.acertou).length);
    setTotal(respostas.length);
    setFase("resultado");
  }

  if (fase === "teste") {
    return (
      <CarregarSessao abrir={iniciarNivelamento} voltarPara="/nivelamento">
        {(s) => (
          <Sessao
            modo="nivelamento"
            titulo="Teste de nível"
            sessaoId={s.sessao}
            itens={s.questoes}
            aoTerminar={terminar}
          />
        )}
      </CarregarSessao>
    );
  }

  if (fase === "resultado") {
    const recomendado: NivelDificuldade =
      acertos >= ACERTOS_PARA_DIFICIL ? "dificil" : "facil";
    const outro: NivelDificuldade =
      recomendado === "dificil" ? "facil" : "dificil";
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-12">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <Lapio
            humor={recomendado === "dificil" ? "festa" : "parado"}
            altura={140}
          />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-texto-suave">
              Resultado do teste
            </p>
            <h1 className="mt-1 text-3xl font-extrabold">
              {acertos} de {total} acertos
            </h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-agua bg-agua/10 p-4 text-left"
          >
            {recomendado === "dificil" ? (
              <SignalHigh
                className="h-9 w-9 shrink-0 text-agua"
                strokeWidth={2.4}
              />
            ) : (
              <SignalLow
                className="h-9 w-9 shrink-0 text-agua"
                strokeWidth={2.4}
              />
            )}
            <div>
              <p className="font-extrabold">
                Recomendamos o nível {NOMES_NIVEL[recomendado].toLowerCase()}
              </p>
              <p className="text-sm text-texto-suave">
                {recomendado === "dificil"
                  ? "Você foi bem nas questões de prova. Comece direto nos casos mais desafiadores."
                  : "Comece pelos conceitos e passe para o nível difícil quando se sentir pronto."}
              </p>
            </div>
          </motion.div>
          <p className="text-xs text-texto-suave">
            Você pode trocar de nível a qualquer momento, na trilha ou no
            perfil.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Botao larguraTotal onClick={() => escolher(recomendado)}>
            Começar no nível {NOMES_NIVEL[recomendado].toLowerCase()}
          </Botao>
          <Botao
            larguraTotal
            variante="contorno"
            onClick={() => escolher(outro)}
          >
            Prefiro o nível {NOMES_NIVEL[outro].toLowerCase()}
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Lapio altura={140} />
        <h1 className="text-2xl font-extrabold">Vamos descobrir seu nível?</h1>
        <p className="text-texto-suave">
          São {QUESTOES_NO_TESTE} questões de provas de residência, de matérias
          variadas. O teste não gasta vidas. Se acertar {ACERTOS_PARA_DIFICIL}{" "}
          ou mais, você começa no nível difícil.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Botao
          larguraTotal
          onClick={() => setFase("teste")}
        >
          Fazer o teste
        </Botao>
        <Botao
          larguraTotal
          variante="contorno"
          onClick={() => escolher("facil")}
        >
          Pular e começar no fácil
        </Botao>
      </div>
    </div>
  );
}
