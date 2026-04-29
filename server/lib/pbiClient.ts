const PBI_API_URL = process.env.PBI_API_URL ?? 'http://localhost:8000';
const PBI_API_KEY = process.env.PBI_API_KEY ?? '';

export interface PbiProject {
  codigoProjeto: string;
  clientName: string;
  address: string;
  city: string;
  state: string;
  powerKwp: number;
  category: 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7';
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  moduleCount: number;
  startDate: string | null;
  endDate: string | null;
  vendedor: string;
}

let _cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchPbiProjects(): Promise<PbiProject[]> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.data.map(mapRawProject);
  }

  const resp = await fetch(`${PBI_API_URL}/projetos?limit=2000&offset=0`, {
    headers: { 'x-api-key': PBI_API_KEY },
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) throw new Error(`PBI API ${resp.status}: ${resp.statusText}`);

  const raw = await resp.json();
  const items: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
  _cache = { data: items, ts: Date.now() };
  return items.map(mapRawProject);
}

export function clearPbiCache() {
  _cache = null;
}

function mapStatus(s = ''): 'planning' | 'in_progress' | 'completed' | 'cancelled' {
  const lower = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (lower.includes('instalac') || lower.includes('andamento') || lower.includes('execucao')) return 'in_progress';
  if (lower.includes('concluid') || lower.includes('operac') || lower.includes('finaliz')) return 'completed';
  if (lower.includes('cancelad')) return 'cancelled';
  return 'planning';
}

function mapCategory(kwp: number): 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' {
  if (kwp <= 5) return 'B1';
  if (kwp <= 10) return 'B2';
  if (kwp <= 20) return 'B3';
  if (kwp <= 30) return 'B4';
  if (kwp <= 50) return 'B5';
  if (kwp <= 75) return 'B6';
  return 'B7';
}

function mapRawProject(p: any): PbiProject {
  const rawCode = String(p['Código P'] ?? p['Codigo P'] ?? p.p ?? p.P ?? p['A2'] ?? '').trim();
  const codigoProjeto = /^P\d/i.test(rawCode) ? rawCode.toUpperCase() : rawCode ? `P${rawCode}` : `P${Math.random().toString(36).slice(2, 7)}`;

  const kwpRaw = p['Potência (kWp)'] ?? p['Potencia (kWp)'] ?? 0;
  const powerKwp = parseFloat(String(kwpRaw).replace(',', '.')) || 0;

  return {
    codigoProjeto,
    clientName: p['Apelido da Usina'] || p['Titular do Projeto'] || 'Sem Nome',
    address: p['Logradouro/Córrego'] || '',
    city: p['Cidade'] || '',
    state: p['UF'] || '',
    powerKwp,
    category: mapCategory(powerKwp),
    status: mapStatus(p['Status da Usina']),
    moduleCount: Number(p['Qnt. de Módulos']) || 0,
    startDate: p['Instalação Iniciada'] || null,
    endDate: p['Instalação Finalizada'] || null,
    vendedor: p['Vendedor'] || '',
  };
}
