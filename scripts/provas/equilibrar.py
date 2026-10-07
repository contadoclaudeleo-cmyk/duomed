# Aplica alternativas reescritas: cada linha "id | opção | *certa | opção | opção"
import json, glob, sys
RAIZ = 'C:/Users/leogo/OneDrive/Área de Trabalho/claude/duomed/src/data/residencia'
novo = {}
for l in open(sys.argv[1], encoding='utf-8'):
    l = l.strip()
    if not l or l.startswith('#'): continue
    p = [x.strip() for x in l.split(' | ')]
    certas = [x for x in p[1:] if x.startswith('*')]
    if len(certas) != 1: raise SystemExit('sem certa única: ' + l)
    novo[p[0]] = ([x.lstrip('*').strip() for x in p[1:]], certas[0].lstrip('*').strip())
feitos = 0
for f in glob.glob(RAIZ + '/*.json'):
    m = json.load(open(f, encoding='utf-8')); mud = False
    for u in m['unidades']:
        for le in u['licoes']:
            for q in le['questoes']:
                if q['id'] in novo:
                    ops, c = novo.pop(q['id'])
                    if len(set(ops)) != len(ops): raise SystemExit('opções repetidas ' + q['id'])
                    q['opcoes'], q['resposta'] = ops, c; mud = True; feitos += 1
    if mud: json.dump(m, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('aplicados', feitos, 'não achados', list(novo)[:5])
