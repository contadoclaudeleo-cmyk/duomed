# Cria unidades extras ("Questões de prova") com as questões que ficaram em sobras.txt.
import json, re, math, sys, importlib.util, collections
spec = importlib.util.spec_from_file_location('s', 'substituir_lib.py'); s = importlib.util.module_from_spec(spec); spec.loader.exec_module(s)
RAIZ = s.RAIZ
blocos = [b.strip().split('\n') for b in open('sobras.txt', encoding='utf-8').read().split('\n\n') if b.strip()]
por_mat = collections.defaultdict(list)
for b in blocos:
    alvo = b[0][1:].strip(); ids = [x.strip() for x in b[1][2:].split(',')]; linha = b[2].strip()
    por_mat[alvo].append((ids, linha))
for alvo, itens in por_mat.items():
    cam = f'{RAIZ}/{alvo}.json'
    m = json.load(open(cam, encoding='utf-8'))
    ordem_u = {u['id']: i for i, u in enumerate(m['unidades'])}
    tit_u = {u['id']: u['titulo'] for u in m['unidades']}
    tit_l = {l['id']: l['titulo'] for u in m['unidades'] for l in u['licoes']}
    pref = m['unidades'][0]['id'].split('-')[0]
    m['unidades'] = [u for u in m['unidades'] if not re.fullmatch(rf'{pref}-q\d+', u['id'])]
    vistos = {s.texto(q) for u in m['unidades'] for l in u['licoes'] for q in l['questoes']}
    grupos = collections.defaultdict(list)
    for ids, linha in itens:
        q = s.questao(linha, alvo)
        t = s.texto(q)
        if t in vistos: continue
        vistos.add(t)
        base = ids[0].rsplit('-', 1)[0]
        grupos[base].append((ids[0], q))
    pref = m['unidades'][0]['id'].split('-')[0]
    licoes, pool = [], []
    bases = sorted(grupos, key=lambda b: ordem_u.get(b, 999))
    for b in bases:
        qs = pool + sorted(grupos[b], key=lambda x: x[0]); pool = []
        k = len(qs)
        if k < 8: pool = qs; continue
        n = 1 if k <= 12 else math.ceil(k / 10)
        tam = [k // n + (1 if i < k % n else 0) for i in range(n)]
        i = 0
        for t in tam:
            licoes.append((b, qs[i:i + t])); i += t
    if pool:
        if licoes and len(licoes[-1][1]) + len(pool) <= 12: licoes[-1] = (licoes[-1][0], licoes[-1][1] + pool)
        else: licoes.append((pool[0][0].rsplit('-', 1)[0], pool))
    novas = []
    for ui in range(0, len(licoes), 3):
        grupo = licoes[ui:ui + 3]; uid = f'{pref}-q{ui // 3 + 1}'
        temas = []
        for b, _ in grupo:
            t = re.sub(r' de prova( II| III)?$', '', tit_u.get(b, 'Questões variadas'))
            if t not in temas: temas.append(t)
        unidade = {'id': uid, 'titulo': f'Mais questões de prova {ui // 3 + 1}', 'descricao': '', 'nivel': 'dificil', 'licoes': []}
        for li, (b, qs) in enumerate(grupo):
            lid = f'{uid}-l{li + 1}'
            cont = collections.Counter(x[0] for x in qs).most_common(1)[0][0]
            titulo = re.sub(r' em casos$', '', tit_l.get(cont, tit_u.get(b, 'Questões de prova')))
            questoes = []
            for qi, (_, q) in enumerate(qs):
                q = {'id': f'{lid}-q{qi + 1}', **q}; questoes.append(q)
            unidade['licoes'].append({'id': lid, 'titulo': titulo, 'questoes': questoes})
        nomes = []
        for l in unidade['licoes']:
            if l['titulo'] not in nomes: nomes.append(l['titulo'])
        unidade['descricao'] = ', '.join(nomes)
        novas.append(unidade)
    m['unidades'] = [u for u in m['unidades'] if not re.fullmatch(rf'{pref}-q\d+', u['id'])] + novas
    json.dump(m, open(cam, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(alvo, 'unidades extras:', len(novas), 'lições:', len(licoes), 'questões:', sum(len(x[1]) for x in licoes))
