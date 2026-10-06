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

RAIZ = 'C:/Users/leogo/OneDrive/Área de Trabalho/claude/duomed/src/data'


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


materias, alvo, licao, total = {}, None, None, 0
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
            lid = linha[2:].strip()
            licao = next((l for u in materias[alvo]['unidades'] for l in u['licoes'] if l['id'] == lid), None)
            if licao is None:
                raise SystemExit(f'{onde}: lição {lid} não existe em {alvo}')
            continue
        q = questao(linha, onde)
        qs = licao['questoes']
        if any(texto(x) == texto(q) for x in qs):
            continue  # já foi colocada antes
        livre = next((i for i, x in enumerate(qs) if not x.get('fonte')), None)
        if livre is not None:
            q = {'id': qs[livre]['id'], **q}
            qs[livre] = q
        elif len(qs) < 10:
            q = {'id': f"{licao['id']}-q{len(qs) + 1}", **q}
            qs.append(q)
        else:
            raise SystemExit(f'{onde}: lição {licao["id"]} já tem 10 questões de prova')
        total += 1

for alvo, materia in materias.items():
    with open(f'{RAIZ}/{alvo}.json', 'w', encoding='utf-8', newline='\n') as f:
        json.dump(materia, f, ensure_ascii=False, indent=2)
        f.write('\n')
    de_prova = sum(1 for u in materia['unidades'] for l in u['licoes'] for q in l['questoes'] if q.get('fonte'))
    print(f'{alvo}: {de_prova} questões de prova no total')
print(f'colocadas agora: {total}')
