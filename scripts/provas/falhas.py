# Dos ids de um arquivo de ajustes, mostra os que ainda têm a certa como a mais longa
import json, glob, sys
ids = [l.split(' | ')[0] for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
for f in sorted(glob.glob('conteudo/residencia/*.json')):
    for u in json.load(open(f, encoding='utf-8'))['unidades']:
        for l in u['licoes']:
            for q in l['questoes']:
                if q['id'] in ids:
                    s = sorted(len(x) for x in q['opcoes'])
                    if len(q['resposta']) == s[-1] and s[-1] > s[-2]:
                        print('##', q['id'], '|', q['enunciado'][-70:].replace('\n', ' '))
                        for i, x in enumerate(q['opcoes'], 1): print(f"  {i}{'*' if x == q['resposta'] else ' '}[{len(x)}] {x}")
