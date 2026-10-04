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
