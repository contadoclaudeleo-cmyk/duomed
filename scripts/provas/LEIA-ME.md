# Questões adaptadas de provas de residência

Fluxo usado para trocar questões da residência por questões adaptadas de provas antigas.
Os PDFs das provas NÃO ficam no projeto (direitos das bancas); só o texto já reescrito.

1. Baixar a prova com gabarito (ex.: PDFs da Medway) e extrair o texto:
   `pdftotext -enc UTF-8 prova.pdf raw.txt`
2. Separar questões e gabarito: `python extrair.py raw.txt "USP-SP 2025" > q.json`
3. Ver as questões sem figura: `python ver.py q.json 1 40`
4. Escrever a versão adaptada em `adaptadas/*.txt` (formato no topo de `substituir.py`),
   indicando a lição de destino com `=> id-da-licao`.
5. Colocar no app: `python substituir.py adaptadas/arquivo.txt`
   (ocupa o lugar de questões que ainda não vieram de prova, mantendo os ids).
6. Rodar `node scripts/validar-conteudo.mjs` e conferir que a certa não é sempre a mais longa.

Obs.: depois de colocadas, algumas alternativas foram reequilibradas direto no JSON;
os arquivos em `adaptadas/` podem estar um pouco diferentes do app.

## Depois (outubro de 2026)

7. Questões que não couberam nas lições (cada uma tem no máximo 10) vão para `sobras.txt`.
   `python extras.py` transforma as sobras nas unidades "Mais questões de prova N"
   (ids `cir-qN`, `cm-qN`, `ped-qN`, `go-qN`). Pode rodar de novo: ele refaz as unidades.
8. Equilibrar o tamanho das alternativas: escrever linhas
   `id | opção | *certa | opção | opção` e rodar `python equilibrar.py arquivo.txt`.
   Meta: a certa não deve ser a mais longa em muito mais que 25% das questões.
9. `extrair-unicamp.py` lê o formato das provas da Unicamp ("N. texto a) b) c) d)").
