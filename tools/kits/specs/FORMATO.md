# Formato da especificação de um kit (uma por subdivisão)

Arquivo: `tools/kits/specs/<slug>.json`, onde `<slug>` é o nome da subdivisão em minúsculas, sem acento,
com hífens (ex.: "Criação de SOPs/procedimentos" → `criacao-de-sops-procedimentos`).

Público: dono de pequena empresa brasileira, sem jargão. Tudo em português do Brasil. Conteúdo PRÁTICO e
específico do problema, que a pessoa consegue aplicar hoje (não "contrate um consultor").

```json
{
  "slug": "analise-swot",
  "titulo": "Análise SWOT",
  "area": "gestao",
  "subdivisoes": ["Análise SWOT"],
  "resumo": "1 a 2 frases: o que o kit resolve e o resultado que a pessoa terá ao final.",
  "como_usar": ["passo 1 curto", "passo 2", "... (4 a 6 passos)"],
  "diagnostico": ["pergunta de sim/não que revela o problema", "... (6 a 10 perguntas)"],
  "plano": [
    {"etapa": "Semana 1", "acao": "ação concreta", "responsavel": "Dono", "prazo_dias": 7},
    "... (6 a 12 ações, prazos crescentes de 1 a 90 dias)"
  ],
  "procedimento": [
    {"passo": "nome curto", "como": "como fazer, 1 a 2 frases", "cuidado": "erro comum a evitar"},
    "... (5 a 10 passos)"
  ],
  "abas": [
    {
      "nome": "Nome da aba (até 28 caracteres, sem / \\ ? * [ ] :)",
      "descricao": "para que serve, 1 frase",
      "colunas": [
        {"nome": "Coluna", "tipo": "texto"},
        {"nome": "Valor", "tipo": "moeda"},
        {"nome": "Quantidade", "tipo": "numero"},
        {"nome": "Data", "tipo": "data"},
        {"nome": "Status", "tipo": "lista", "opcoes": ["Opção A", "Opção B"]}
      ],
      "exemplos": [["linha de exemplo realista", 150.0, 3, "+5", "Opção A"]]
    }
  ],
  "dicas": ["dica prática 1", "... (3 a 5)"]
}
```

Regras:
- `abas`: 1 a 3 abas de controle/modelo específicas do problema, 3 a 8 colunas cada, 2 a 4 linhas de exemplo.
  Datas nos exemplos são deslocamentos em dias a partir de hoje, como texto: "+5", "-3", "0".
  Cada valor do exemplo deve casar com o tipo da coluna; em colunas `lista`, o valor deve estar em `opcoes`.
- Nada de fórmula: o gerador cria as fórmulas.
- Nomes de pessoas e empresas nos exemplos: fictícios e genéricos ("Fornecedor A", "Cliente B").
- Sem promessa legal/fiscal absoluta: em temas tributários/legais, oriente a validar com o contador/advogado no
  último passo do plano.
- JSON válido (UTF-8), sem comentários.
