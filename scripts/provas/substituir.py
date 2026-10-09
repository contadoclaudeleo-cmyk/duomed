# Coloca questões adaptadas de provas dentro das lições existentes.
# Cada questão adaptada ocupa o lugar da primeira questão da lição que ainda
# não veio de prova (mantém o id, então a revisão de quem já estudou continua).
# Se a lição já tem 8 de prova, a questão entra como extra (até 10).
#
# Formato do arquivo:
#   @residencia/clinica-medica
#   => cm-u2-l3
#   CC[AMRIGS 2025]: caso | pergunta | *certa | errada | errada | errada | explicação
#   ME[AMRIGS 2025]: enunciado | *certa | ... | explicação
#   VF[AMRIGS 2025]: afirmação | V ou F | explicação
import json, re, sys

RAIZ = 'C:/Users/leogo/OneDrive/Área de Trabalho/claude/duomed/conteudo'


def opcoes(campos, onde):
    certas = [c for c in campos if c.startswith('*')]
    if len(certas) != 1:
        raise SystemExit(f'{onde}: precisa de exatamente 1 opção com *')
    return [c.lstrip('*').strip() for c in campos], certas[0].lstrip('*').strip()


def quebrar(t):
    t = re.sub(r' (?=(?:I|II|III|IV|V)\. )', '\n', t)
    return re.sub(r' (?=(?:Quais|Qual|Como) [^\n]*\?$)', '\n', t) if '\n' in t else t


def questao(linha, onde):
    cab, resto = linha.split(':', 1)
    m = re.fullmatch(r'(ME|CC|VF|LA|PA)\[(.+)\]', cab.strip())
    if not m:
        raise SystemExit(f'{onde}: cabeçalho inválido {cab}')
    tipo, fonte = m.groups()
    f = [x.strip() for x in resto.split(' | ')]
    q = {}
    if tipo in ('ME', 'LA'):
        ops, certa = opcoes(f[1:-1], onde)
        q.update(tipo='multipla_escolha' if tipo == 'ME' else 'completar_lacuna', enunciado=f[0], opcoes=ops, resposta=certa)
    elif tipo == 'VF':
        if f[1] not in ('V', 'F'):
            raise SystemExit(f'{onde}: VF precisa de V ou F')
        q.update(tipo='verdadeiro_falso', enunciado=f[0], resposta=f[1] == 'V')
    elif tipo == 'PA':
        pares = [dict(zip(('esquerda', 'direita'), [x.strip() for x in p.split(' = ')])) for p in f[1].split(' ; ')]
        q.update(tipo='associar_pares', enunciado=f[0], pares=pares)
    else:
        ops, certa = opcoes(f[2:-1], onde)
        q.update(tipo='caso_clinico', caso=f[0], enunciado=f[1], opcoes=ops, resposta=certa)
    q['explicacao'] = f[-1]
    q['revisado'] = False
    q['fonte'] = fonte
    for campo in ('enunciado', 'caso'):
        if campo in q:
            q[campo] = quebrar(q[campo])
    return q


def texto(q):
    return (q.get('caso', '') + ' ' + q['enunciado'] + str(q.get('pares', ''))).strip()


import os
SOBRAS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sobras.txt')
materias, alvo, licoes, total, sobras = {}, None, [], 0, []
for arq in sys.argv[1:]:
    for n, bruta in enumerate(open(arq, encoding='utf-8'), 1):
        linha = bruta.strip()
        onde = f'{arq}:{n}'
        if not linha or linha.startswith('//'):
            continue
        if linha.startswith('@'):
            alvo = linha[1:].strip()
            if alvo not in materias:
                materias[alvo] = json.load(open(f'{RAIZ}/{alvo}.json', encoding='utf-8'))
            continue
        if linha.startswith('=>'):
            # Uma ou mais lições candidatas, separadas por vírgula, em ordem de preferência
            licoes = []
            for lid in [x.strip() for x in linha[2:].split(',') if x.strip()]:
                licao = next((l for u in materias[alvo]['unidades'] for l in u['licoes'] if l['id'] == lid), None)
                if licao is None:
                    raise SystemExit(f'{onde}: lição {lid} não existe em {alvo}')
                licoes.append(licao)
            continue
        q = questao(linha, onde)
        todas = [x for u in materias[alvo]['unidades'] for l in u['licoes'] for x in l['questoes']]
        if any(texto(x) == texto(q) for x in todas):
            continue  # já foi colocada antes
        colocada = False
        for licao in licoes:
            qs = licao['questoes']
            livre = next((i for i, x in enumerate(qs) if not x.get('fonte')), None)
            if livre is not None:
                qs[livre] = {'id': qs[livre]['id'], **q}
                colocada = True
                break
        if colocada:
            total += 1
        else:
            sobras.append(f"@{alvo}\n=> {', '.join(l['id'] for l in licoes)}\n{linha}\n")
if sobras:
    with open(SOBRAS, 'a', encoding='utf-8') as f:
        f.write('\n'.join(sobras))
    print(f'sem lugar (foram para sobras.txt): {len(sobras)}')

for alvo, materia in materias.items():
    with open(f'{RAIZ}/{alvo}.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(materia, f, ensure_ascii=False, indent=2)
        f.write('\n')
    de_prova = sum(1 for u in materia['unidades'] for l in u['licoes'] for q in l['questoes'] if q.get('fonte'))
    print(f'{alvo}: {de_prova} questões de prova no total')
print(f'colocadas agora: {total}')
