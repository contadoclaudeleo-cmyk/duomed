import { Mountain, Sprout } from "lucide-react";
import type { NivelDificuldade } from "../types";
import { NOMES_NIVEL } from "../data";
import { Abas } from "./Abas";

/** Abas para alternar entre a trilha Fácil e a Difícil */
export function AbasNivel({
  valor,
  aoMudar,
}: {
  valor: NivelDificuldade;
  aoMudar: (nivel: NivelDificuldade) => void;
}) {
  return (
    <Abas
      rotulo="Nível de dificuldade"
      valor={valor}
      aoMudar={aoMudar}
      opcoes={[
        { valor: "facil", rotulo: NOMES_NIVEL.facil, Icone: Sprout },
        { valor: "dificil", rotulo: NOMES_NIVEL.dificil, Icone: Mountain },
      ]}
    />
  );
}
