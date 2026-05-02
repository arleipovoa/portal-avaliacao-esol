// Criterios mockados de avaliacao de obras — usados quando rodando em modo dev
// (sem PBI_API_URL configurada). Ao integrar a API real, esses dados devem vir
// da tabela `obra_criteria` no banco de obras.

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
    { id: 1, name: "EPI utilizado corretamente", description: "Capacete, luvas, oculos e cinto.", category: "seguranca", weight: 1, active: true },
    { id: 2, name: "Sinalizacao da area de trabalho", description: "Cones e fitas isolando perimetro.", category: "seguranca", weight: 1, active: true },
    { id: 3, name: "Manuseio de cargas", description: "Tecnica adequada de levantamento.", category: "seguranca", weight: 1, active: true },
  ],
  funcionalidade: [
    { id: 4, name: "Modulos alinhados", description: "Sem desvios na fileira.", category: "funcionalidade", weight: 1, active: true },
    { id: 5, name: "Conexoes eletricas firmes", description: "Sem mau contato.", category: "funcionalidade", weight: 1, active: true },
    { id: 6, name: "Inversor instalado conforme manual", description: "Distancia de paredes, ventilacao.", category: "funcionalidade", weight: 1, active: true },
    { id: 7, name: "Aterramento verificado", description: "Resistencia dentro do esperado.", category: "funcionalidade", weight: 1, active: true },
  ],
  estetica: [
    { id: 8, name: "Cabos organizados", description: "Sem cabos pendurados ou expostos.", category: "estetica", weight: 1, active: true },
    { id: 9, name: "Limpeza pos-obra", description: "Local entregue sem restos de material.", category: "estetica", weight: 1, active: true },
  ],
};
