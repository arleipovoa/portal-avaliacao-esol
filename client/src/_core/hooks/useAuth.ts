// SIMPLIFICADO no reboot — sem login. Retorna sempre o admin padrao.
// Quando reativar auth, substituir por implementacao com trpc.auth.me.
export type FakeUser = {
  id: number;
  name: string;
  email: string;
  appRole: "admin";
  jobCategory: "administrativo";
  areaId: number | null;
};

const FAKE_ADMIN: FakeUser = {
  id: 1,
  name: "Arlei Povoa",
  email: "arlei@grupoesol.com.br",
  appRole: "admin",
  jobCategory: "administrativo",
  areaId: 1,
};

export function useAuth(_options?: { redirectOnUnauthenticated?: boolean }) {
  return {
    user: FAKE_ADMIN,
    loading: false,
    isAuthenticated: true,
    error: null,
    refresh: async () => {},
    logout: async () => {},
  };
}
