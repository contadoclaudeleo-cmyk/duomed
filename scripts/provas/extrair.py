# Separa uma prova (texto do pdftotext) em questões com alternativas e resposta do gabarito.
# Uso: python extrair.py raw-2025.txt "AMRIGS 2025" > q-2025.json
import re, sys, json

texto = open(sys.argv[1], encoding='utf-8').read()
nome = sys.argv[2]
texto = texto.replace('\f', '\n')
# Remove cabeçalhos e rodapés repetidos
texto = re.sub(r'Medway - [^\n]*Páginas \d+/\d+', '', texto)
texto = re.sub(r'[A-Z][A-Za-z -]*?\d{4}(?:-Objetiva)? - (?:Objetiva - )?[A-Z]{2} \| R\d', '', texto)
texto = re.sub(r'Páginas \d+/\d+', '', texto)

corpo, _, resto = texto.partition('\nGABARITO')
_, _, respostas = resto.partition('RESPOSTAS')

# Gabarito: só aceita "NN. X" com uma letra única; ambíguos e anulados ficam de fora
gab = {}
tokens = respostas.split()
i = 0
while i < len(tokens):
    m = re.fullmatch(r'(\d{1,3})\.', tokens[i])
    if m and i + 1 < len(tokens) and re.fullmatch(r'[ABCD]', tokens[i + 1]):
        prox = tokens[i + 2] if i + 2 < len(tokens) else ''
        if not re.fullmatch(r'[ABCD]', prox):
            gab[int(m.group(1))] = tokens[i + 1]
    i += 1

partes = re.split(r'QUESTÃO (\d+)\.', corpo)
questoes = []
for k in range(1, len(partes), 2):
    n = int(partes[k])
    bloco = ' '.join(partes[k + 1].split())
    m = re.search(r'\sA\.\s(.*?)\sB\.\s(.*?)\sC\.\s(.*?)\sD\.\s(.*)$', ' ' + bloco)
    if not m:
        continue
    enunciado = bloco[: bloco.find(' A. ')] if ' A. ' in bloco else bloco
    questoes.append({
        'n': n,
        'prova': nome,
        'enunciado': enunciado.strip(),
        'opcoes': {l: m.group(j + 1).strip() for j, l in enumerate('ABCD')},
        'resposta': gab.get(n),
        'figura': bool(re.search(r'figura|imagem|imagens|fotos?|gr[aá]fico|tabela|radiografia abaixo|eletrocardiograma abaixo|a seguir:|exames complementares.', bloco, re.I)),
    })
json.dump(questoes, sys.stdout, ensure_ascii=False, indent=1)
sys.stderr.write(f'{nome}: {len(questoes)} questões, {sum(1 for q in questoes if q["resposta"])} com gabarito, {sum(q["figura"] for q in questoes)} com figura\n')
