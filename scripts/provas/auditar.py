# Procura questões que podem ter ficado sem informação depois da adaptação.
# python scripts/provas/auditar.py [saida.txt]
import json, glob, os, re, sys

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'conteudo', 'residencia')
REFS = re.compile(r'\b(abaixo|acima|a seguir|figura|imagem|quadro|tabela|gráfico|texto|neste caso|nesse caso|deste caso|desse caso|do caso|o caso|essa paciente|esse paciente|este paciente|esta paciente|o exame mostra)\b', re.I)
CONDUTA = re.compile(r'\b(conduta|diagnóstico|próximo passo|tratamento|hipótese|exame|classifica|estadiamento|causa)\b', re.I)

itens = []
for c in sorted(glob.glob(os.path.join(RAIZ, '*.json'))):
    mat = os.path.basename(c)[:-5]
    for u in json.load(open(c, encoding='utf-8'))['unidades']:
        for l in u['licoes']:
            for q in l['questoes']:
                if q.get('tipo') not in ('multipla_escolha', 'caso_clinico'):
                    continue
                caso = q.get('caso', '') or ''
                en = q.get('enunciado', '') or ''
                motivos = []
                if q['tipo'] == 'caso_clinico' and len(caso) < 90 and CONDUTA.search(en):
                    motivos.append(f'caso curto ({len(caso)})')
                if q['tipo'] == 'multipla_escolha' and REFS.search(en) and not caso:
                    motivos.append('cita caso/figura que não existe')
                if q['tipo'] == 'multipla_escolha' and len(en) < 70 and re.search(r'\b(paciente|criança|mulher|homem|gestante|lactente|recém-nascido)\b', en, re.I):
                    motivos.append(f'cenário clínico curto ({len(en)})')
                if motivos:
                    itens.append((mat, q['id'], q.get('fonte', ''), '; '.join(motivos), caso, en, q['opcoes'], q['resposta']))

out = open(sys.argv[1], 'w', encoding='utf-8') if len(sys.argv) > 1 else sys.stdout
for mat, id_, fonte, mot, caso, en, ops, resp in itens:
    print(f'## {id_} [{fonte}] {mot}', file=out)
    if caso:
        print('CASO:', caso, file=out)
    print('PERG:', en, file=out)
    print('OPÇ:', ' | '.join(('*' if o == resp else '') + o for o in ops), file=out)
    print(file=out)
print(len(itens), 'suspeitas', file=sys.stderr)
