export const AREAS = [
    {
        id: 'gestao',
        icon: '📊',
        name: 'Gestão & Estratégia',
        tagline: 'Direção clara, metas medidas e decisões sem achismo.',
        items: [
            'Planejamento empresarial', 'Definição de metas', 'KPIs', 'Indicadores de desempenho',
            'Dashboard gerencial', 'Análise de resultados', 'Planejamento estratégico', 'Análise SWOT',
            'Plano de ação', 'Organização de tarefas', 'Gestão do tempo', 'Gestão de projetos',
            'Tomada de decisão', 'Análise de concorrentes', 'Análise de mercado', 'Expansão do negócio',
        ],
    },
    {
        id: 'operacoes',
        icon: '⚙️',
        name: 'Operações & Processos',
        tagline: 'Processos padronizados, menos retrabalho, mais previsibilidade.',
        items: [
            'Organização de processos', 'Padronização de tarefas', 'Criação de SOPs/procedimentos',
            'Automatização de processos', 'Redução de retrabalho', 'Redução de erros', 'Gestão de pedidos',
            'Gestão de estoque', 'Controle de produção', 'Controle de qualidade', 'Logística', 'Entregas',
            'Compras', 'Gestão de fornecedores', 'Organização interna',
        ],
    },
    {
        id: 'contabil',
        icon: '🧾',
        name: 'Contábil & Tributário',
        tagline: 'Fiscal em ordem, imposto sob controle, contador feliz.',
        items: [
            'Organização fiscal', 'Regime tributário', 'Planejamento tributário', 'Emissão de notas',
            'Controle de impostos', 'Obrigações fiscais', 'Organização para contador', 'Simulação tributária',
            'Adequação à legislação', 'Reforma tributária', 'Controle de documentos fiscais',
        ],
    },
    {
        id: 'administrativo',
        icon: '⚖️',
        name: 'Administrativo & Burocracia',
        tagline: 'Documentos, contratos e prazos sem sustos.',
        items: [
            'Organização documental', 'Contratos', 'Emissão de documentos', 'Gestão de notas fiscais',
            'Obrigações administrativas', 'Organização societária', 'Processos internos', 'Compliance',
            'LGPD', 'Políticas internas', 'Controle de vencimentos', 'Gestão de contratos',
        ],
    },
    {
        id: 'tecnologia',
        icon: '💻',
        name: 'Tecnologia & Digitalização',
        tagline: 'Do site ao BI: a empresa rodando em sistemas, não em papel.',
        items: [
            'Criar site', 'Criar landing page', 'Criar loja virtual', 'Implementar CRM', 'Implementar ERP',
            'Integrar sistemas', 'Criar banco de dados', 'Digitalizar processos', 'Segurança da informação',
            'Backup', 'Organização de arquivos', 'Integração WhatsApp + sistemas', 'Integração marketplaces',
            'Integração de pagamentos', 'Dashboards', 'BI',
        ],
    },
    {
        id: 'estoque',
        icon: '📦',
        name: 'Estoque & Compras',
        tagline: 'Nem falta, nem sobra: giro saudável e compra inteligente.',
        items: [
            'Controle de estoque', 'Previsão de demanda', 'Estoque mínimo', 'Estoque máximo',
            'Produtos parados', 'Ruptura de estoque', 'Inventário', 'Controle de validade', 'Compras',
            'Cotação com fornecedores', 'Comparação de fornecedores', 'Negociação', 'Previsão de reposição',
        ],
    },
    {
        id: 'pessoas',
        icon: '👥',
        name: 'Pessoas & RH',
        tagline: 'Time certo, contratado, treinado e engajado.',
        items: [
            'Recrutamento', 'Seleção', 'Descrição de vagas', 'Triagem de currículos', 'Onboarding',
            'Treinamento', 'Avaliação de desempenho', 'Gestão de funcionários', 'Escalas',
            'Controle de férias', 'Comunicação interna', 'Retenção de talentos', 'Clima organizacional',
            'Definição de cargos', 'Plano de carreira',
        ],
    },
];

// Subdivisões que já têm Kit de Arranque (planilha entregue na hora da compra).
// Manter em sincronia com apps/api/src/constants/kits.js.
export const KIT_SUBDIVISIONS = new Set(['Controle de estoque', 'Gestão de estoque', 'Gestão de pedidos', 'Controle de vencimentos']);

export const hasKit = (subdivision) => KIT_SUBDIVISIONS.has(subdivision);

export const TOTAL_SOLUTIONS = AREAS.reduce((sum, area) => sum + area.items.length, 0);

export const getArea = (id) => AREAS.find((area) => area.id === id) ?? null;

// Distinct gradient + glow per area, used across the hub cards and headers.
export const AREA_GRADIENTS = {
    gestao: { gradient: 'bg-gradient-blue-purple', glow: 'rgba(99,102,241,0.45)', text: 'text-gradient-blue-purple' },
    operacoes: { gradient: 'bg-gradient-cyan-blue', glow: 'rgba(6,182,212,0.45)', text: 'text-gradient-green-blue' },
    contabil: { gradient: 'bg-gradient-green-blue', glow: 'rgba(16,185,129,0.45)', text: 'text-gradient-green-blue' },
    administrativo: { gradient: 'bg-gradient-purple-pink', glow: 'rgba(168,85,247,0.45)', text: 'text-gradient-blue-purple' },
    tecnologia: { gradient: 'bg-gradient-blue-purple', glow: 'rgba(59,130,246,0.45)', text: 'text-gradient-blue-purple' },
    estoque: { gradient: 'bg-gradient-orange-pink', glow: 'rgba(245,158,11,0.45)', text: 'text-gradient-orange-pink' },
    pessoas: { gradient: 'bg-gradient-orange-pink', glow: 'rgba(236,72,153,0.45)', text: 'text-gradient-orange-pink' },
};

export const getAreaGradient = (id) => AREA_GRADIENTS[id] ?? AREA_GRADIENTS.gestao;
