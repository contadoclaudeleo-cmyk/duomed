# Mostra questões de uma prova extraída que ainda NÃO estão no app (compara com as da mesma banca/ano).
# python novas.py prova.json "BANCA ANO" [ini fim]
import json, sys, re, glob, unicodedata, os
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'conteudo', 'residencia')
STOP = set('a o e de da do das dos em no na nos nas um uma com por para que se ao é foi tem há ou mais menos sem seu sua como qual quais pelo pela os as mas não'.split())
def norm(t): return ''.join(c for c in unicodedata.normalize('NFD', t.lower()) if unicodedata.category(c) != 'Mn')
def tok(t):
    t = norm(t); return set(re.findall(r'\d+(?:[.,]\d+)?', t)), set(w for w in re.findall(r'[a-z]{5,}', t) if w not in STOP)
qs = json.load(open(sys.argv[1], encoding='utf-8')); rot = sys.argv[2]
a = int(sys.argv[3]) if len(sys.argv) > 3 else 1; b = int(sys.argv[4]) if len(sys.argv) > 4 else 999
app = []
for f in glob.glob(RAIZ + '/*.json'):
    for u in json.load(open(f, encoding='utf-8'))['unidades']:
        for l in u['licoes']:
            for q in l['questoes']:
                if q.get('fonte', '').replace(' R+', '') == rot:
                    app.append(tok(q.get('caso', '') + ' ' + q['enunciado'] + ' ' + ' '.join(q.get('opcoes') or [])))
livres = 0
for q in qs:
    if not (a <= q['n'] <= b) or not q.get('resposta') or q.get('figura'): continue
    nq, pq = tok(q['enunciado'] + ' ' + ' '.join(q['opcoes'].values()))
    sim = max([ (0.5 * len(nq & na) / max(1, len(nq)) + len(pq & pa) / max(1, min(len(pq), len(pa)))) if nq else 1.2 * len(pq & pa) / max(1, min(len(pq), len(pa))) for na, pa in app] or [0])
    if sim >= 0.45: continue
    livres += 1
    ops = ' | '.join(('*' if l == q['resposta'] else '') + o for l, o in q['opcoes'].items())
    print(f"{q['n']}: {q['enunciado']} || {ops}\n")
print('livres', livres, 'no app', len(app), file=sys.stderr)
