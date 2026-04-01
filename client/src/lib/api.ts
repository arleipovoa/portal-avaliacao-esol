import axios, { type AxiosInstance, type AxiosError } from 'axios';

// ── Base Config ──

const BASE_URL = import.meta.env.VITE_API_URL || '';

function createClient(prefix: string): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}${prefix}`,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// ── API Clients (one per module) ──

export const api360 = createClient('/api/360');
export const apiObras = createClient('/api/obras');
export const apiNps = createClient('/api/nps');
export const apiAuth = createClient('/api/auth');
export const apiAdmin = createClient('/api/admin');

// ── 360° Endpoints ──

export const evaluation360Api = {
  getCycles: () => api360.get('/cycles'),
  getCriteria: () => api360.get('/criteria'),
  getEvaluations: (cycleId: number, userId: number) =>
    api360.get(`/evaluations/${cycleId}/${userId}`),
  submitEvaluation: (data: any) => api360.post('/evaluations', data),
  finalizeEvaluation: (id: number) => api360.put(`/evaluations/${id}/submit`),
  getAggregates: (cycleId: number, userId: number) =>
    api360.get(`/aggregates/${cycleId}/${userId}`),
  getPodium: (cycleId: number) => api360.get(`/podium/${cycleId}`),
};

// ── Obras Endpoints ──

export const obrasApi = {
  getProjects: () => apiObras.get('/projects'),
  getProject: (id: number) => apiObras.get(`/projects/${id}`),
  createProject: (data: any) => apiObras.post('/projects', data),
  updateProject: (id: number, data: any) => apiObras.put(`/projects/${id}`, data),
  addMember: (projectId: number, data: any) =>
    apiObras.post(`/projects/${projectId}/members`, data),
  removeMember: (projectId: number, memberId: number) =>
    apiObras.delete(`/projects/${projectId}/members/${memberId}`),
  getCriteria: () => apiObras.get('/criteria'),
  submitEvaluation: (projectId: number, data: any) =>
    apiObras.post(`/projects/${projectId}/evaluations`, data),
  calculateScores: (projectId: number) =>
    apiObras.post(`/projects/${projectId}/scores`),
  getScores: (projectId: number) => apiObras.get(`/projects/${projectId}/scores`),
};

// ── NPS Endpoints ──

export const npsApi = {
  getSurveys: () => apiNps.get('/surveys'),
  getSurvey: (id: number) => apiNps.get(`/surveys/${id}`),
  createSurvey: (data: any) => apiNps.post('/surveys', data),
  updateSurvey: (id: number, data: any) => apiNps.put(`/surveys/${id}`, data),
  submitResponse: (surveyId: number, data: any) =>
    apiNps.post(`/surveys/${surveyId}/responses`, data),
  getResponses: (surveyId: number) => apiNps.get(`/surveys/${surveyId}/responses`),
  getAggregates: (surveyId: number) =>
    apiNps.get(`/surveys/${surveyId}/aggregates`),
};
