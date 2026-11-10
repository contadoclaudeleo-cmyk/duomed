# Lista as questões em que a alternativa certa é a mais longa (para equilibrar com ajustar.py)
# uso: python longas.py [margem_minima] [quantas] [pular]
import json, glob, sys
RAIZ = 'C:/Users/leogo/OneDrive/Área de Trabalho/claude/duomed/conteudo/residencia'
margem = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
quantas = int(sys.argv[2]) if len(sys.argv) > 2 else 10**9
pular = int(sys.argv[3]) if len(sys.argv) > 3 else 0
L = []
for f in sorted(glob.glob(RAIZ + '/*.json')):
    for u in json.load(open(f, encoding='utf-8'))['unidades']:
        for l in u['licoes']:
            for q in l['questoes']:
                o = q.get('opcoes')
                if not o or len(o) < 3: continue
                if all(x.replace(' e ', ',').replace(',', '').replace(' ', '') in ('I','II','III','IV','V','IIIeIV') or set(x) <= set('IVX, e') for x in o): continue
                s = sorted(len(x) for x in o)
                if len(q['resposta']) == s[-1] and s[-1] > s[-2] and s[-1] / max(1, s[-2]) >= margem:
                    L.append((s[-1] / max(1, s[-2]), q))
L.sort(key=lambda x: -x[0])
if quantas == 10**9 and pular == 0:
    print(len(L)); sys.exit()
for m, q in L[pular:pular + quantas]:
    e = q['enunciado'].replace('\n', ' ')
    c = (q.get('caso') or '').replace('\n', ' ')
    print(f"## {q['id']}  (x{m:.2f})  CASO: {c[:90]}\n   PERGUNTA: {e[-110:]}")
    for i, x in enumerate(q['opcoes'], 1):
        print(f"  {i}{'*' if x == q['resposta'] else ' '} [{len(x)}] {x}")
