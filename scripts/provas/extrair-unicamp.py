# Uso: python extrair-unicamp.py un-cg.txt ung-cg.txt > q/unicamp-2026-cg.json
import re, sys, json
txt = open(sys.argv[1], encoding='utf-8').read()
gab = open(sys.argv[2], encoding='utf-8').read()
key = {int(n): l for n, l in re.findall(r'(?<![\d.])(\d{1,2})\s+([ABCD])\b', gab)}
txt = re.sub(r'RESIDÊNCIA MÉDICA 2026[^\n]*\n', '\n', txt)
txt = re.sub(r'\n(ESPECIALIDADES CIRÚRGICAS|ÁREAS PEDIÁTRICAS|ÁREAS CLÍNICAS)\n', '\n', txt)
txt = re.sub(r'\n\d{1,2}\n', '\n', txt)
partes = re.split(r'\n(\d{1,2})\. ', '\n' + txt)
qs = []
for i in range(1, len(partes), 2):
    n = int(partes[i]); corpo = ' '.join(partes[i + 1].split())
    m = re.split(r'\s?\b([a-d])\) ', corpo)
    if len(m) < 9: continue
    enun = m[0]; ops = {m[j].upper(): m[j + 1].strip() for j in range(1, len(m) - 1, 2)}
    fig = bool(re.search(r'imagem|anexo|figura|abaixo:', enun, re.I))
    qs.append({'n': n, 'prova': 'Unicamp 2026', 'enunciado': 'UNICAMP 2026 | R+ ' + enun, 'opcoes': ops, 'resposta': key.get(n), 'figura': fig})
print(json.dumps(qs, ensure_ascii=False, indent=1))
