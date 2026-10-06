import json, sys
qs = json.load(open(sys.argv[1], encoding='utf-8'))
a, b = int(sys.argv[2]), int(sys.argv[3])
for q in qs:
    if a <= q['n'] <= b and not q['figura'] and q['resposta']:
        print(f"\n#{q['n']} [{q['resposta']}]{' FIG' if q['figura'] else ''} {q['enunciado']}")
        for l, t in q['opcoes'].items(): print(f"  {l}) {t}")
