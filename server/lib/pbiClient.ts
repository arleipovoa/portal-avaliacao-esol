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

export async function generatePbiDocuments(codigoProjeto: string): Promise<{ contrato?: string; procuracao?: string }> {
  const numericCode = codigoProjeto.replace(/^P/i, '');
  const resp = await fetch(`${PBI_API_URL}/gerar-documentos/${numericCode}`, {
    method: 'POST',
    headers: { 'x-api-key': PBI_API_KEY },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Falha ao gerar documentos (HTTP ${resp.status}): ${body}`);
  }
  return resp.json();
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

// Nomes de campos usando Unicode escapes explícitos (evita ambiguidade de encoding)
const F_CODIGO        = 'Código P';            // "Código P"
const F_KWP           = 'Potência (kWp)';      // "Potência (kWp)"
const F_LOGRADOURO    = 'Logradouro/Córrego';  // "Logradouro/Córrego"
const F_MODULOS       = 'Qnt. de Módulos';     // "Qnt. de Módulos"
const F_INSTALACAO_INI = 'Instalação Iniciada';   // "Instalação Iniciada"
const F_INSTALACAO_FIM = 'Instalação Finalizada'; // "Instalação Finalizada"
const F_STATUS        = 'Status da Usina';
const F_APELIDO       = 'Apelido da Usina';
const F_TITULAR       = 'Titular do Projeto';

function mapRawProject(p: any): PbiProject {
  const rawCode = String(p[F_CODIGO] ?? p['Codigo P'] ?? p.p ?? p.P ?? p['A2'] ?? '').trim();
  const codigoProjeto = /^P\d/i.test(rawCode)
    ? rawCode.toUpperCase()
    : rawCode
      ? `P${rawCode}`
      : `P${Math.random().toString(36).slice(2, 7)}`;

  const kwpRaw = p[F_KWP] ?? p['Potencia (kWp)'] ?? 0;
  const powerKwp = parseFloat(String(kwpRaw).replace(',', '.')) || 0;

  return {
    codigoProjeto,
    clientName: p[F_APELIDO] || p[F_TITULAR] || 'Sem Nome',
    address: p[F_LOGRADOURO] || '',
    city: p['Cidade'] || '',
    state: p['UF'] || '',
    powerKwp,
    category: mapCategory(powerKwp),
    status: mapStatus(p[F_STATUS]),
    moduleCount: Number(p[F_MODULOS]) || 0,
    startDate: p[F_INSTALACAO_INI] || null,
    endDate: p[F_INSTALACAO_FIM] || null,
    vendedor: p['Vendedor'] || '',
  };
}
