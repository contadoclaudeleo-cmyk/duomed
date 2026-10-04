# DuoMed

App de estudo para estudantes de medicina no estilo do Duolingo: trilhas por matéria, lições curtas, XP, vidas, ofensiva diária, níveis, conquistas, revisão espaçada e ranking semanal.

Tem dois modos de estudo, que a pessoa escolhe no cadastro e pode trocar no perfil ou na tela de matérias:

- **Graduação:** a grade curricular completa, com 39 matérias separadas em três ciclos:
  - **Ciclo básico (14):** Anatomia, Histologia e Embriologia, Biologia Celular, Genética, Fisiologia, Bioquímica, Imunologia, Microbiologia, Parasitologia, Patologia, Farmacologia, Saúde Coletiva, Psicologia Médica, Bioética e Medicina Legal.
  - **Ciclo clínico (23):** Semiologia, Cardiologia, Pneumologia, Gastroenterologia, Nefrologia, Endocrinologia, Hematologia, Reumatologia, Infectologia, Neurologia, Psiquiatria, Dermatologia, Oncologia, Geriatria, Clínica Cirúrgica, Ortopedia, Urologia, Otorrinolaringologia, Oftalmologia, Anestesiologia, Radiologia, Pediatria e Ginecologia e Obstetrícia.
  - **Internato (2):** Urgência e Emergência e Medicina de Família e Comunidade.
- **Residência:** as grandes áreas das provas de residência (Clínica Médica, Cirurgia Geral, Pediatria, Ginecologia e Obstetrícia, Medicina Preventiva e Psiquiatria), com foco em casos clínicos.

Cada matéria tem **duas trilhas**:

- **Fácil:** conceitos básicos, para aprender e fixar.
- **Difícil:** questões no estilo de prova, com casos clínicos mais longos e alternativas parecidas.

Logo depois do cadastro, a pessoa faz um **teste de nível** com 8 questões de matérias variadas. Quem acerta 6 ou mais recebe a sugestão do nível difícil, mas sempre pode escolher. O nível pode ser trocado a qualquer momento na trilha ou no perfil, e o teste pode ser refeito pelo perfil.

**Conteúdo atual:** 13.680 questões em 1.710 lições (cada lição tem 8 questões). Na graduação, cada matéria tem 15 lições no nível fácil e 15 no difícil (1.170 lições). Na residência, cada área tem pelo menos 42 lições em cada nível (540 lições); Clínica Médica tem 54 (com geriatria, oncologia clínica, dermatologia, hipófise e adrenal) e Cirurgia tem 48 (com ortopedia).

As alternativas são escritas com tamanhos parecidos, para que a certa não seja sempre a mais longa. Evite alternativas de enfeite como "Nada" ou "Nenhum".

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

### Versão publicada

O app está no ar em **https://contadoclaudeleo-cmyk.github.io/duomed/**

Toda vez que um commit é enviado (push) para a branch `main` do repositório no GitHub, o site se atualiza sozinho em cerca de 1 minuto (veja `.github/workflows/publicar.yml`).

### Instalar no celular (PWA)

Abra o link da versão publicada no celular:

- **Android (Chrome):** menu de três pontos, "Instalar app" ou "Adicionar à tela inicial".
- **iPhone (Safari):** botão de compartilhar, "Adicionar à Tela de Início".

## Como adicionar questões

Todo o conteúdo fica em duas pastas, um arquivo `.json` por matéria. Você não precisa mexer em nenhum código para adicionar conteúdo.

- `src/data/graduacao/`: matérias do modo Graduação
- `src/data/residencia/`: áreas do modo Residência

A pasta onde o arquivo está decide em qual modo a matéria aparece. O formato dos arquivos é o mesmo nas duas.

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

O campo `creditoImagem` (opcional) aparece em letras pequenas embaixo da imagem. Ele é **obrigatório** quando a imagem tem licença Creative Commons (CC BY ou CC BY-SA), como as do Wikimedia Commons. Prefira imagens sem legendas escritas, para não entregar a resposta.

```json
{
  "id": "anat-u1-l3-q6",
  "tipo": "identificar_imagem",
  "enunciado": "A seta indica o osso longo do braço. Qual é?",
  "imagem": "/questoes/umero.webp",
  "creditoImagem": "Imagem: Anatomography, CC BY-SA 2.1 JP, via Wikimedia Commons",
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
- **Unidade do nível difícil:** igual a uma unidade comum, com o campo `"nivel": "dificil"`. Unidades sem esse campo são do nível fácil. Por organização, os ids das unidades difíceis usam a letra `d` (por exemplo `anat-d1`, com lições `anat-d1-l1`).
- **Matéria nova:** crie um arquivo novo em `src/data/graduacao/` ou `src/data/residencia/` (por exemplo `histologia.json`). Ela aparece sozinha na tela de matérias. Uma matéria com `"unidades": []` aparece como "Em breve".

Ícones disponíveis para o campo `icone` (a lista completa está em `src/components/IconeMateria.tsx`): `osso`, `coracao`, `pulso`, `frasco`, `pilula`, `microscopio`, `estetoscopio`, `bisturi`, `bebe`, `gestante`, `comunidade`, `camadas`, `atomo`, `dna`, `escudo`, `microbio`, `inseto`, `conversa`, `balanca`, `pulmao`, `digestivo`, `rim`, `seringa`, `sangue`, `mao`, `termometro`, `cerebro`, `mente`, `pele`, `laco`, `poltrona`, `ondas`, `ouvido`, `olho`, `sono`, `imagem`, `sirene`, `casa`.

No modo Graduação, o campo `ciclo` (`basico`, `clinico` ou `internato`) decide em qual grupo a matéria aparece na tela de matérias.

## Regras do jogo

| Mecânica | Regra | Onde mudar |
| --- | --- | --- |
| Vidas | Começa com 5, perde 1 por erro em lição, recupera 1 a cada 5 minutos. O botão + ao lado do coração abre a loja (DuoMed Plus e recarga; preços em src/lib/planos.ts, pagamento ainda não ligado). Sem vidas, só a revisão fica liberada. | `src/lib/vidas.ts` |
| XP | 10 por lição concluída, +5 se não errar nada, +2 por caso clínico acertado. A revisão segue a mesma regra. | `src/lib/xp.ts` |
| Níveis | Sobe um nível a cada 100 XP | `src/lib/xp.ts` |
| Ofensiva | Dias seguidos batendo a meta diária (10, 20 ou 30 XP). Zera se pular um dia. | `src/lib/ofensiva.ts` |
| Revisão | Duas filas. **Erros:** questão errada entra na hora e, a cada acerto na revisão, volta depois de 1, 3 e 7 dias; no acerto seguinte sai da fila. **Acertos:** questão acertada na lição volta depois de 3 e 7 dias e depois sai. Errou, vai para os erros e volta ao começo. | `src/lib/revisao.ts` |
| Conquistas | Primeira lição, lição perfeita, unidade completa, 7 dias de ofensiva, 100 questões | `src/lib/conquistas.ts` |
| Ranking | Ranking semanal com os jogadores reais que têm conta (primeiro nome + inicial e XP da semana). Reinicia toda segunda. Precisa da função do arquivo `supabase/ranking.sql` instalada no Supabase | `src/lib/ranking.ts`, `supabase/ranking.sql` |
| Resolução | Depois de responder uma questão, o comentário (campo `explicacao`) fica escondido. Ele só aparece se a pessoa tocar em "Ver resolução". | `src/components/PainelFeedback.tsx` |
| Revisão comentada | Ao fim de cada lição ou revisão, o botão "Ver revisão comentada" mostra cada questão com a resposta certa, o que a pessoa marcou e o comentário (campo `explicacao`). Nas lições já concluídas da trilha, o balão da lição também abre o gabarito comentado. | `src/screens/RevisaoComentada.tsx` |
| Trilha | Na graduação, cada lição libera a próxima. Na residência, todas as lições ficam liberadas (tudo cai na mesma prova) e a trilha tem botões para trocar de área; a próxima lição pendente fica destacada como sugestão. | `src/lib/progresso.ts` |
| Teste de nível | 8 questões, sem gastar vidas e sem ganhar XP. 6 acertos ou mais sugerem o nível difícil. | `src/screens/Nivelamento.tsx` |
| Sons e animações | Sons de clique, acerto, erro, acertos seguidos (3, 5 e 8), fim de lição e conquista. Os arquivos ficam em `public/sons/` (clique e fim de lição da Mixkit, com licença gratuita para apps; os outros da Kenney, domínio público CC0). Dá para desligar no Perfil. As animações somem se o aparelho estiver com "reduzir movimento" ligado. | `src/lib/sons.ts` e `src/components/Animacoes.tsx` |

## Organização do código

```
src/
  components/   botões, barras, modal, logo, Lápio, nós da trilha
    questoes/   um componente para cada tipo de questão
  screens/      as telas (boas-vindas, teste de nível, trilha, lição, resultado, revisão comentada, perfil, revisão, ranking)
  data/         conteúdo em JSON (graduacao/ e residencia/) e funções para buscar lições e questões
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
