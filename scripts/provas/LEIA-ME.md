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
