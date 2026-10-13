# Kits de Arranque

Planilhas prontas que o cliente baixa logo após pagar a solução completa, enquanto a equipe monta a versão final.

- `gerar_kits.py` gera os `.xlsx` em `apps/api/kits/` (`pip install openpyxl`, depois `python tools/kits/gerar_kits.py`).
- Cada kit tem: aba "Como usar", abas de cadastro com listas suspensas, fórmulas prontas, cores de alerta e um Painel.
- Só funções que funcionam igual no Excel, Google Sheets e LibreOffice. Datas de exemplo são `HOJE()±n` para a demonstração nunca ficar velha.

## Adicionar um kit novo

1. Escreva a função do kit em `gerar_kits.py` e registre em `KITS`.
2. Rode o gerador.
3. Mapeie as subdivisões (nomes exatos de `apps/web/src/data/hub.js`) em `apps/api/src/constants/kits.js` e em `KIT_SUBDIVISIONS` no `hub.js`.

Kits atuais: Controle de Estoque (também Gestão de estoque), Gestão de Pedidos, Controle de Vencimentos.

## Kits gerados a partir de especificação (todas as 97 subdivisões)

- `specs/<slug>.json` descreve o conteúdo de cada kit (formato em `specs/FORMATO.md`): resumo, passo a passo,
  diagnóstico, plano de ação, procedimento (POP) e as abas de controle próprias do problema.
- `gerar_kits_genericos.py` valida todas as especificações (tipos, opções, nomes de aba, subdivisões existentes
  em `hub.js`) e só grava se não houver erro. Gera os `.xlsx` em `apps/api/kits/`, o índice
  `apps/api/kits/indice.json` (lido pela API) e `apps/web/src/data/kitSubdivisions.json` (lido pelo site).
- Os 3 kits feitos à mão em `gerar_kits.py` têm prioridade sobre os gerados.

```
pip install openpyxl
python tools/kits/gerar_kits_genericos.py
```
