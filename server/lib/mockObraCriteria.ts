// Critérios de avaliação de obras — alinhados com a planilha
// "Avaliação de Qualidade de Obras 2025" (aba Notas, linha 3).
// Segurança: 5 itens (G-K) | Funcionalidade: 5 itens (M-Q) | Estética: 10 itens (S-AB)

export interface MockObraCriterion {
  id: number;
  name: string;
  description: string;
  category: string;
  weight: number;
  active: boolean;
}

export const MOCK_OBRA_CRITERIA_GROUPED: Record<string, MockObraCriterion[]> = {
  seguranca: [
    { id: 1, name: "Uso de EPI/EPC",       description: "Capacete, luvas, óculos e cinto de segurança utilizados corretamente.", category: "seguranca", weight: 1, active: true },
    { id: 2, name: "APR INV.",              description: "Análise Preliminar de Risco dos Inversores realizada.", category: "seguranca", weight: 1, active: true },
    { id: 3, name: "APR MOD.",              description: "Análise Preliminar de Risco dos Módulos realizada.", category: "seguranca", weight: 1, active: true },
    { id: 4, name: "Acidente / Avaria",     description: "Ausência de acidentes ou avarias durante a instalação.", category: "seguranca", weight: 1, active: true },
    { id: 5, name: "Esquecimento",          description: "Nenhum item esquecido ou pendente no local.", category: "seguranca", weight: 1, active: true },
  ],
  funcionalidade: [
    { id: 6,  name: "Identificação",         description: "Cabos e equipamentos corretamente identificados.", category: "funcionalidade", weight: 1, active: true },
    { id: 7,  name: "Configuração INV",      description: "Inversor configurado conforme projeto e manual.", category: "funcionalidade", weight: 1, active: true },
    { id: 8,  name: "Placa Adv.",            description: "Placa de advertência instalada e legível.", category: "funcionalidade", weight: 1, active: true },
    { id: 9,  name: "Prejuízo Financeiro",   description: "Ausência de danos, perdas ou prejuízo financeiro.", category: "funcionalidade", weight: 1, active: true },
    { id: 10, name: "Lacre",                 description: "Lacres aplicados corretamente nos equipamentos.", category: "funcionalidade", weight: 1, active: true },
  ],
  estetica: [
    { id: 11, name: "Montagem MOD.",         description: "Módulos alinhados, nivelados e sem desvios.", category: "estetica", weight: 1, active: true },
    { id: 12, name: "Montagem INV",          description: "Inversor montado conforme norma, com ventilação adequada.", category: "estetica", weight: 1, active: true },
    { id: 13, name: "Cabeamento",            description: "Cabos organizados, fixados e sem exposição.", category: "estetica", weight: 1, active: true },
    { id: 14, name: "Eletroduto / Corrugado",description: "Corrugados e eletrodutos sem cortes, bem fixados.", category: "estetica", weight: 1, active: true },
    { id: 15, name: "Telhado / Estrutura",   description: "Telhado e estrutura preservados após a instalação.", category: "estetica", weight: 1, active: true },
    { id: 16, name: "Ponto de Conexão",      description: "Ponto de conexão executado conforme norma.", category: "estetica", weight: 1, active: true },
    { id: 17, name: "Aterramento",           description: "Sistema de aterramento instalado corretamente.", category: "estetica", weight: 1, active: true },
    { id: 18, name: "Quadros",               description: "Quadros elétricos organizados e identificados.", category: "estetica", weight: 1, active: true },
    { id: 19, name: "Imagens Drone",         description: "Imagens aéreas registradas com qualidade.", category: "estetica", weight: 1, active: true },
    { id: 20, name: "Limpeza Instalação",    description: "Local entregue limpo e sem resíduos de material.", category: "estetica", weight: 1, active: true },
  ],
};
