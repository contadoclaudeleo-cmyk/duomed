# Reescreve casos/enunciados que ficaram curtos demais (sem informação para resolver).
#
#   python completar.py listar <saida.txt> [limite]   -> casos mais curtos que ainda não foram completados
#   python completar.py aplicar <arquivo.txt>          -> aplica as reescritas
#
# Formato do arquivo de reescrita (linhas omitidas = mantém o que já existe):
#   # <id>
#   C: caso clínico completo (vira caso_clinico)
#   E: pergunta
#   O: opção | *opção certa | opção | opção   (precisa manter a mesma resposta certa, pode reescrever o texto)
#   X: explicação
import json, glob, os, sys, re

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..', 'conteudo', 'residencia')
FEITAS = os.path.join(AQUI, 'completadas.txt')

def carregar():
    arqs = {}
    for c in sorted(glob.glob(os.path.join(RAIZ, '*.json'))):
        arqs[c] = json.load(open(c, encoding='utf-8'))
    return arqs

def todas(arqs):
    for c, d in arqs.items():
        for u in d['unidades']:
            for l in u['licoes']:
                for q in l['questoes']:
                    yield c, l, q

def feitas():
    return set(open(FEITAS, encoding='utf-8').read().split()) if os.path.exists(FEITAS) else set()

def curto(q):
    if q['tipo'] == 'caso_clinico':
        return len(q.get('caso', ''))
    if q['tipo'] == 'multipla_escolha' and re.search(r'\b(paciente|criança|mulher|homem|gestante|lactente|recém-nascido|menina|menino|idos[oa]|bebê|adolescente)\b', q['enunciado'], re.I):
        return len(q['enunciado'])
    return None

def listar(saida, limite):
    arqs = carregar(); ja = feitas()
    cand = []
    for c, l, q in todas(arqs):
        if q['id'] in ja: continue
        t = curto(q)
        if t is not None and t < limite:
            cand.append((t, q))
    cand.sort(key=lambda x: x[0])
    with open(saida, 'w', encoding='utf-8') as f:
        for t, q in cand:
            f.write(f"# {q['id']} [{q.get('fonte','')}] ({q['tipo']}, {t})\n")
            if q.get('caso'): f.write('C: ' + q['caso'] + '\n')
            f.write('E: ' + q['enunciado'].replace('\n', ' / ') + '\n')
            f.write('O: ' + ' | '.join(('*' if o == q['resposta'] else '') + o for o in q['opcoes']) + '\n')
            f.write('X: ' + q.get('explicacao', '') + '\n\n')
    print(len(cand), 'candidatas em', saida)

def aplicar(arq):
    arqs = carregar()
    por_id = {q['id']: q for c, l, q in todas(arqs)}
    blocos = re.split(r'^# ', open(arq, encoding='utf-8').read(), flags=re.M)
    ok = []; erros = 0
    for b in blocos:
        b = b.strip()
        if not b: continue
        linhas = b.split('\n')
        id_ = linhas[0].split()[0]
        q = por_id.get(id_)
        if not q:
            print('id não existe:', id_); erros += 1; continue
        campos = {}
        for ln in linhas[1:]:
            m = re.match(r'^([CEOX]):\s*(.*)$', ln)
            if m: campos[m.group(1)] = m.group(2).strip()
        if 'O' in campos:
            ops = [o.strip() for o in campos['O'].split('|')]
            certas = [o[1:].strip() for o in ops if o.startswith('*')]
            ops = [o.lstrip('*').strip() for o in ops]
            if len(certas) != 1 or len(ops) != len(q['opcoes']):
                print(id_, ': opções inválidas'); erros += 1; continue
            if ops.index(certas[0]) != q['opcoes'].index(q['resposta']):
                print(id_, ': a certa mudou de posição (confira)'); erros += 1; continue
            q['opcoes'] = ops; q['resposta'] = certas[0]
            maior = max(len(o) for o in ops if o != certas[0])
            if len(certas[0]) / maior >= 1.2 and not re.fullmatch(r'[IV, e]+', certas[0]):
                print(id_, ': AVISO certa longa demais', round(len(certas[0]) / maior, 2))
        if 'C' in campos:
            q['caso'] = campos['C']
            if q['tipo'] == 'multipla_escolha':
                q['tipo'] = 'caso_clinico'
                # o tipo caso_clinico vem com caso antes do enunciado
                q2 = {k: q[k] for k in ('id', 'tipo')}
                q2['caso'] = q.pop('caso')
                for k, v in list(q.items()):
                    if k not in q2: q2[k] = v
                q.clear(); q.update(q2)
        if 'E' in campos: q['enunciado'] = campos['E'].replace(' / ', '\n')
        if 'X' in campos: q['explicacao'] = campos['X']
        ok.append(id_)
    for c, d in arqs.items():
        with open(c, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(d, f, ensure_ascii=False, indent=2); f.write('\n')
    with open(FEITAS, 'a', encoding='utf-8') as f:
        for i in ok: f.write(i + '\n')
    print(len(ok), 'reescritas aplicadas,', erros, 'com erro')

if __name__ == '__main__':
    if sys.argv[1] == 'listar':
        listar(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 150)
    else:
        aplicar(sys.argv[2])
