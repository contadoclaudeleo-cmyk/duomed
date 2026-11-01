# Le prova no formato Medway (texto do pdftotext -enc UTF-8) e grava novas/q/<nome>.json
# Uso: python medway.py PASTA_SAIDA prova1.txt [...]   (txt de pdftotext -enc UTF-8)
import json, re, sys, os

def respostas(txt):
    toks = re.findall(r'\b(\d{1,3})\.|\b(ANULADA|NULADA|ULADA|[A-E])\b', txt)
    pend, res = [], {}
    for num, let in toks:
        if num:
            pend.append(int(num))
        elif pend:
            res[pend.pop(0)] = None if 'ULADA' in let else let
    return res

def opcoes(t):
    # alternativas no fim: "A. xxx B. yyy" (pode haver quebra de linha)
    m = re.search(r'(?:^|\s)A[\.\)]\s', t)
    if not m: return t, None
    # usa a ultima ocorrencia de "A." seguida de B., C. em sequencia
    cands = [x.start() for x in re.finditer(r'(?:^|\s)A[\.\)]\s', t)]
    for c in reversed(cands):
        trecho = t[c:]
        partes = re.split(r'(?:^|\s)([A-E])[\.\)]\s', trecho)
        letras = partes[1::2]
        if letras[:3] == ['A', 'B', 'C'] and letras == sorted(letras) and len(set(letras)) == len(letras):
            ops = {l: re.sub(r'\s+', ' ', x).strip() for l, x in zip(letras, partes[2::2])}
            return t[:c].strip(), ops
    return t, None

def ler(arq):
    txt = open(arq, encoding='utf-8').read().replace('\f', '\n')
    corpo, _, resp = txt.partition('\nRESPOSTAS')
    corpo = corpo.split('\nGABARITO')[0]
    corpo = re.sub(r'Medway - [^\n]*\n', ' ', corpo)
    corpo = re.sub(r'Páginas \d+/\d+', ' ', corpo)
    res = respostas(resp)
    qs = []
    blocos = re.split(r'QUESTÃO (\d{1,3})\.', corpo)
    for i in range(1, len(blocos), 2):
        n = int(blocos[i]); b = blocos[i + 1]
        b = re.sub(r'^\s*[^\n]*\| R[^\n]*\n', '', b)  # cabecalho da banca
        b = re.sub(r'\s+', ' ', b).strip()
        enun, ops = opcoes(b)
        if not ops: continue
        fig = bool(re.search(r'figura|imagem|gráfico|tabela abaixo|a seguir:|abaixo:|eletrocardiograma abaixo', enun, re.I))
        qs.append({'n': n, 'enunciado': enun, 'opcoes': ops, 'resposta': res.get(n), 'figura': fig})
    return qs

SAIDA = sys.argv[1]
for arq in sys.argv[2:]:
    qs = ler(arq)
    nome = os.path.basename(arq).replace('.txt', '.json')
    os.makedirs(SAIDA, exist_ok=True)
    json.dump(qs, open(os.path.join(SAIDA, nome), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    sem = sum(1 for q in qs if not q['resposta'])
    print(f'{nome}: {len(qs)} questoes, {sem} sem gabarito')
