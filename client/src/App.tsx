import { Switch, Route, Redirect } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

// ── Layouts ──
import MainLayout from '@/components/layout/MainLayout';

// ── Pages: Auth ──
import Login from '@/pages/Login';

// ── Pages: Core ──
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';

// ── Pages: 360 ──
import Home from '@/pages/Home';
import Evaluation360 from '@/pages/Evaluation360';
import Evaluations from '@/pages/Evaluations';

// ── Pages: Obras ──
import ObrasDashboard from '@/pages/ObrasDashboard';
import ObrasEvaluation from '@/pages/ObrasEvaluation';

// ── Pages: NPS ──
import NpsDashboard from '@/pages/NpsDashboard';
import NpsResponses from '@/pages/NpsResponses';

// ── Pages: Admin ──
import { UsersTab as AdminUsers } from '@/pages/admin/UsersTab';
import { EditUserForm } from '@/pages/admin/EditUserForm';
import Profile from '@/pages/Profile';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'solar:home-bold-duotone', href: '/dashboard' },
  { id: '360', label: 'Avaliação 360°', icon: 'solar:chart-bold-duotone', href: '/360/dashboard' },
  { id: 'obras', label: 'Obras', icon: 'solar:buildings-bold-duotone', href: '/obras/dashboard' },
  { id: 'nps', label: 'NPS', icon: 'solar:star-bold-duotone', href: '/nps/dashboard' },
  { id: 'admin', label: 'Admin', icon: 'solar:settings-bold-duotone', href: '/admin/users' },
];

// ── Protected Route ──
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType; path: string }) {
  const { user, loading: isLoading } = useAuth({ redirectOnUnauthenticated: false });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-flux-orange/30 border-t-flux-orange rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-display">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

// ── App ──
export default function App() {
  return (
    <Switch>
      {/* ── Public Routes ── */}
      <Route path="/login" component={Login} />

      {/* ── Protected Routes (with MainLayout) ── */}
      <Route path="/">
        <MainLayout>
          <Switch>
            {/* Landing / Home */}
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={Dashboard} />

            {/* ── Modulo 360 ── */}
            <Route path="/360">
              <Redirect to="/360/dashboard" />
            </Route>
            <Route path="/360/dashboard">
              <ProtectedRoute path="/360/dashboard" component={Home} />
            </Route>
            <Route path="/360/avaliacoes">
              <ProtectedRoute path="/360/avaliacoes" component={Evaluations} />
            </Route>
            <Route path="/360/avaliar/:userId">
              <ProtectedRoute path="/360/avaliar/:userId" component={Evaluation360} />
            </Route>

            {/* ── Modulo Obras ── */}
            <Route path="/obras">
              <Redirect to="/obras/dashboard" />
            </Route>
            <Route path="/obras/dashboard">
              <ProtectedRoute path="/obras/dashboard" component={ObrasDashboard} />
            </Route>
            <Route path="/obras/avaliacao">
              <ProtectedRoute path="/obras/avaliacao" component={ObrasEvaluation} />
            </Route>

            {/* ── Modulo NPS ── */}
            <Route path="/nps">
              <Redirect to="/nps/dashboard" />
            </Route>
            <Route path="/nps/dashboard">
              <ProtectedRoute path="/nps/dashboard" component={NpsDashboard} />
            </Route>
            <Route path="/nps/respostas">
              <ProtectedRoute path="/nps/respostas" component={NpsResponses} />
            </Route>

            {/* ── Admin ── */}
            <Route path="/admin/users">
              <ProtectedRoute path="/admin/users" component={AdminUsers} />
            </Route>
            <Route path="/admin/users/:id">
              <ProtectedRoute path="/admin/users/:id" component={EditUserForm} />
            </Route>

            {/* ── Perfil ── */}
            <Route path="/perfil">
              <ProtectedRoute path="/perfil" component={Profile} />
            </Route>

            {/* ── Fallback ── */}
            <Route>
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass rounded-2xl border border-white/5 p-12 text-center max-w-md">
                  <p className="text-5xl mb-4">404</p>
                  <h2 className="text-xl font-semibold text-white mb-2">Pagina nao encontrada</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    A pagina que voce esta procurando nao existe ou foi movida.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-flux-orange text-void font-semibold text-sm rounded-lg hover:bg-flux-orange/90 transition-all"
                  >
                    Voltar ao Inicio
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}
