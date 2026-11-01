# Acrescenta questões novas (adaptadas de provas) nas lições.
# Mesmo formato de substituir.py: "@residencia/area", "=> id-licao[, outra]" e linhas CC/ME/VF.
# Ocupa o lugar de uma questão sem prova, se houver; senão acrescenta na lição com menos questões
# entre as candidatas (id "<licao>-nK"). Ignora questões repetidas (mesmo texto).
# python scripts/provas/colocar.py arquivo.txt [...]
import json, sys, re, importlib.util, os
aqui = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('s', os.path.join(aqui, 'substituir_lib.py')); s = importlib.util.module_from_spec(spec); spec.loader.exec_module(s)
materias, alvo, licoes, total, novas, repetidas = {}, None, [], 0, 0, 0
def chave(q): return re.sub(r'\W+', '', s.texto(q).lower())[:80]
for arq in sys.argv[1:]:
    for n, bruta in enumerate(open(arq, encoding='utf-8'), 1):
        linha = bruta.strip(); onde = f'{arq}:{n}'
        if not linha or linha.startswith('//'): continue
        if linha.startswith('@'):
            alvo = linha[1:].strip()
            if alvo not in materias: materias[alvo] = json.load(open(f'{s.RAIZ}/{alvo}.json', encoding='utf-8'))
            continue
        if linha.startswith('=>'):
            licoes = []
            for lid in [x.strip() for x in linha[2:].split(',') if x.strip()]:
                l = next((l for u in materias[alvo]['unidades'] for l in u['licoes'] if l['id'] == lid), None)
                if l is None: raise SystemExit(f'{onde}: lição {lid} não existe em {alvo}')
                licoes.append(l)
            continue
        q = s.questao(linha, onde)
        todas = [x for u in materias[alvo]['unidades'] for l in u['licoes'] for x in l['questoes']]
        if any(chave(x) == chave(q) for x in todas): repetidas += 1; print('repetida:', onde); continue
        for l in licoes:
            livre = next((i for i, x in enumerate(l['questoes']) if not x.get('fonte')), None)
            if livre is not None:
                l['questoes'][livre] = {'id': l['questoes'][livre]['id'], **q}; break
        else:
            l = min(licoes, key=lambda x: len(x['questoes'])); ids = {x['id'] for x in todas}; k = 1
            while f"{l['id']}-n{k}" in ids: k += 1
            l['questoes'].append({'id': f"{l['id']}-n{k}", **q}); novas += 1
        total += 1
for alvo, m in materias.items():
    with open(f'{s.RAIZ}/{alvo}.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(m, f, ensure_ascii=False, indent=2); f.write('\n')
print(f'colocadas {total} (acrescentadas {novas}), repetidas ignoradas {repetidas}')
