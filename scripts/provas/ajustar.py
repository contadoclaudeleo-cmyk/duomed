# Troca só algumas alternativas de questões já existentes (a ordem e a resposta certa são mantidas).
# Cada linha: id | N=novo texto | N=novo texto   (N = posição da alternativa, a partir de 1)
# Se a alternativa trocada for a certa, a resposta acompanha. uso: python ajustar.py arquivo.txt
import json, glob, sys
RAIZ = 'C:/Users/leogo/OneDrive/Área de Trabalho/claude/duomed/conteudo/residencia'
novo = {}
for l in open(sys.argv[1], encoding='utf-8'):
    l = l.strip()
    if not l or l.startswith('#'): continue
    p = [x.strip() for x in l.split(' | ')]
    mud = {}
    for x in p[1:]:
        n, t = x.split('=', 1)
        mud[int(n) - 1] = t.strip()
    novo[p[0]] = mud
feitos = 0
for f in glob.glob(RAIZ + '/*.json'):
    m = json.load(open(f, encoding='utf-8')); alterou = False
    for u in m['unidades']:
        for le in u['licoes']:
            for q in le['questoes']:
                if q['id'] not in novo: continue
                mud = novo.pop(q['id'])
                ops = list(q['opcoes']); ic = ops.index(q['resposta'])
                for i, t in mud.items():
                    if i >= len(ops): raise SystemExit('posição inexistente em ' + q['id'])
                    ops[i] = t
                if len(set(ops)) != len(ops): raise SystemExit('opções repetidas em ' + q['id'])
                q['opcoes'], q['resposta'] = ops, ops[ic]; alterou = True; feitos += 1
    if alterou: json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ajustadas', feitos, 'não achadas', list(novo)[:5])
