# DuoMed

App de estudo para estudantes de medicina no estilo do Duolingo: trilhas por matéria, lições curtas, XP, vidas, ofensiva diária, níveis, conquistas, revisão espaçada e ranking semanal.

Primeira versão (MVP): roda inteira no navegador e salva o progresso no próprio aparelho (localStorage). Não precisa de servidor.

## Como rodar

Você precisa do **Node.js** (versão 20 ou mais nova). Ele já foi instalado neste computador. Se o terminal disser que `npm` não existe, feche e abra o terminal de novo.

Dentro da pasta `duomed`:

```bash
npm install
```

```bash
npm run dev
```

Abra no navegador o endereço que aparecer (normalmente http://localhost:5173).

**Testar no celular:** com o celular no mesmo Wi-Fi do computador, abra o endereço que aparece na linha `Network:` do terminal (algo como `http://192.168.0.10:5173`).

### Outros comandos

| Comando | Para que serve |
| --- | --- |
| `npm run validar` | Confere os arquivos de questões e aponta erros (também roda sozinho antes do `dev` e do `build`) |
| `npm run build` | Gera a versão final otimizada na pasta `dist/` |
| `npm run preview` | Abre a versão final, onde dá para testar a instalação como app (PWA) |

### Instalar no celular (PWA)

O app é instalável. Depois de publicado em um endereço com `https` (por exemplo Vercel ou Netlify, apontando para a pasta `dist`), abra no celular:

- **Android (Chrome):** menu de três pontos, "Instalar app" ou "Adicionar à tela inicial".
- **iPhone (Safari):** botão de compartilhar, "Adicionar à Tela de Início".

## Como adicionar questões

Todo o conteúdo fica em `src/data/materias/`, um arquivo `.json` por matéria. Você não precisa mexer em nenhum código para adicionar conteúdo.

A estrutura é: **matéria > unidades > lições > questões**.

```json
{
  "id": "anatomia",
  "nome": "Anatomia",
  "descricao": "Ossos, articulações e órgãos do corpo humano",
  "icone": "osso",
  "ordem": 1,
  "unidades": [
    {
      "id": "anat-u1",
      "titulo": "Sistema esquelético",
      "descricao": "Crânio, coluna vertebral e membro superior",
      "licoes": [
        {
          "id": "anat-u1-l1",
          "titulo": "Ossos do crânio",
          "questoes": [ ... de 8 a 10 questões ... ]
        }
      ]
    }
  ]
}
```

### Campos que toda questão tem

| Campo | O que é |
| --- | --- |
| `id` | Código único. Siga o padrão `materia-unidade-licao-numero`, por exemplo `anat-u1-l1-q9`. **Nunca repita um id** e evite mudar o id de uma questão que já existe (o progresso de revisão usa ele). |
| `tipo` | Um dos 6 tipos abaixo |
| `enunciado` | A pergunta |
| `explicacao` | Texto curto que aparece depois de responder |
| `revisado` | `false` até um médico revisar o conteúdo. Depois de revisado, troque para `true`. |

### Os 6 tipos de questão

**1. Múltipla escolha** (`multipla_escolha`): a `resposta` precisa ser **igual, letra por letra**, a uma das `opcoes`. As opções aparecem embaralhadas no app, então a ordem no arquivo não importa.

```json
{
  "id": "anat-u1-l1-q1",
  "tipo": "multipla_escolha",
  "enunciado": "Qual osso forma a fronte (testa)?",
  "opcoes": ["Frontal", "Parietal", "Occipital", "Temporal"],
  "resposta": "Frontal",
  "explicacao": "O osso frontal forma a fronte e a parte superior das órbitas.",
  "revisado": false
}
```

**2. Verdadeiro ou falso** (`verdadeiro_falso`): não tem `opcoes`. A `resposta` é `true` (verdadeiro) ou `false` (falso), **sem aspas**.

```json
{
  "id": "anat-u1-l2-q3",
  "tipo": "verdadeiro_falso",
  "enunciado": "O atlas (C1) não possui corpo vertebral.",
  "resposta": true,
  "explicacao": "O atlas é um anel formado por arcos e massas laterais.",
  "revisado": false
}
```

**3. Completar lacuna** (`completar_lacuna`): escreva `___` (três sublinhados) no lugar da palavra que falta.

```json
{
  "id": "anat-u1-l1-q3",
  "tipo": "completar_lacuna",
  "enunciado": "A sutura ___ une os dois ossos parietais na linha mediana.",
  "opcoes": ["sagital", "coronal", "lambdoide", "escamosa"],
  "resposta": "sagital",
  "explicacao": "A sutura sagital une os parietais.",
  "revisado": false
}
```

**4. Associar pares** (`associar_pares`): em vez de `opcoes` e `resposta`, tem uma lista de `pares`. O app embaralha as duas colunas. Os textos não podem se repetir.

```json
{
  "id": "farm-u2-l1-q4",
  "tipo": "associar_pares",
  "enunciado": "Associe cada fármaco ao seu uso clínico.",
  "pares": [
    { "esquerda": "Pilocarpina", "direita": "Glaucoma" },
    { "esquerda": "Piridostigmina", "direita": "Miastenia gravis" },
    { "esquerda": "Betanecol", "direita": "Retenção urinária não obstrutiva" }
  ],
  "explicacao": "Todos são colinérgicos, com usos diferentes.",
  "revisado": false
}
```

**5. Caso clínico** (`caso_clinico`): igual à múltipla escolha, com um campo `caso` (2 a 4 linhas) que aparece antes da pergunta. Vale +2 XP quando acertada.

```json
{
  "id": "anat-u2-l3-q6",
  "tipo": "caso_clinico",
  "caso": "Homem de 22 anos chega após uma facada no tórax. Está hipotenso, com turgência jugular e bulhas abafadas.",
  "enunciado": "Qual é o diagnóstico mais provável?",
  "opcoes": ["Tamponamento cardíaco", "Choque hipovolêmico", "Infarto agudo do miocárdio", "Contusão pulmonar"],
  "resposta": "Tamponamento cardíaco",
  "explicacao": "É a tríade de Beck.",
  "revisado": false
}
```

**6. Identificar estrutura em imagem** (`identificar_imagem`): igual à múltipla escolha, com um campo `imagem`. Coloque a imagem dentro de `public/questoes/` e escreva o caminho começando com `/questoes/`. Se a imagem não existir, aparece o placeholder.

```json
{
  "id": "anat-u1-l3-q6",
  "tipo": "identificar_imagem",
  "enunciado": "A seta indica o osso longo do braço. Qual é?",
  "imagem": "/questoes/umero.png",
  "opcoes": ["Úmero", "Rádio", "Ulna", "Clavícula"],
  "resposta": "Úmero",
  "explicacao": "A cabeça do úmero se articula com a escápula.",
  "revisado": false
}
```

### Depois de editar

1. Rode `npm run validar`. Ele avisa, em português, se faltou uma vírgula, se a resposta não bate com as opções, se um id se repetiu etc.
2. Se o `npm run dev` estiver aberto, o app atualiza sozinho.

Dica: nos textos, prefira vírgula ou ponto em vez de travessão.

### Adicionar uma lição, unidade ou matéria

- **Lição nova:** copie um bloco `{ "id": ..., "titulo": ..., "questoes": [...] }` dentro de `licoes`. Ela entra no fim da trilha da unidade.
- **Unidade nova:** copie um bloco inteiro de unidade dentro de `unidades`.
- **Matéria nova:** crie um arquivo novo em `src/data/materias/` (por exemplo `histologia.json`). Ela aparece sozinha na tela de matérias. Uma matéria com `"unidades": []` aparece como "Em breve".

Ícones disponíveis para o campo `icone`: `osso`, `coracao`, `frasco`, `pilula`, `microscopio`, `estetoscopio`.

As matérias Fisiologia, Bioquímica, Patologia e Semiologia já têm arquivo, só falta preencher as unidades.

## Regras do jogo

| Mecânica | Regra | Onde mudar |
| --- | --- | --- |
| Vidas | Começa com 5, perde 1 por erro em lição, recupera 1 a cada 30 minutos. Sem vidas, só a revisão fica liberada. | `src/lib/vidas.ts` |
| XP | 10 por lição concluída, +5 se não errar nada, +2 por caso clínico acertado. A revisão segue a mesma regra. | `src/lib/xp.ts` |
| Níveis | Sobe um nível a cada 100 XP | `src/lib/xp.ts` |
| Ofensiva | Dias seguidos batendo a meta diária (10, 20 ou 30 XP). Zera se pular um dia. | `src/lib/ofensiva.ts` |
| Revisão | Questão errada entra na fila na hora. Cada acerto na revisão faz ela voltar depois de 1, 3 e 7 dias; no acerto seguinte ela sai da fila. Errou, volta ao começo. | `src/lib/revisao.ts` |
| Conquistas | Primeira lição, lição perfeita, unidade completa, 7 dias de ofensiva, 100 questões | `src/lib/conquistas.ts` |
| Ranking | Liga semanal com 14 jogadores fictícios que reinicia toda segunda | `src/lib/ranking.ts` |

## Organização do código

```
src/
  components/   botões, barras, modal, logo, Lápio, nós da trilha
    questoes/   um componente para cada tipo de questão
  screens/      as telas (boas-vindas, trilha, lição, resultado, perfil, revisão, ranking)
  data/         conteúdo em JSON (materias/) e funções para buscar lições e questões
  store/        estado global do jogador (Zustand), salvo automaticamente
  lib/          regras do jogo (XP, vidas, ofensiva, revisão, conquistas, ranking)
  types/        tipos TypeScript
public/
  brand/        logo, ícone, mascote Lápio e ícones do PWA
  questoes/     imagens das questões
scripts/
  validar-conteudo.mjs   conferência dos arquivos de questões
```

## Próximo passo: Supabase

O código já está preparado para trocar o localStorage por um banco de dados:

- **Progresso do jogador:** todo o salvamento passa por `src/lib/armazenamento.ts`. Basta criar uma versão desse arquivo que leia e grave no Supabase (com login), mantendo os mesmos três métodos.
- **Conteúdo:** todas as telas pegam lições e questões por `src/data/index.ts`. Para buscar do Supabase, só esse arquivo muda.
