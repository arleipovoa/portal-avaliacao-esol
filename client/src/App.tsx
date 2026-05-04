import { Switch, Route, Redirect } from "wouter";

import MainLayout from "@/components/layout/MainLayout";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

// Modulo 360
import Home from "@/pages/Home";
import Evaluations from "@/pages/Evaluations";

// Modulo Obras
import ObrasDashboard from "@/pages/ObrasDashboard";
import ObrasEvaluation from "@/pages/ObrasEvaluation";
import AvaliacaoCruzada from "@/pages/AvaliacaoCruzada";
import ObrasRegras from "@/pages/ObrasRegras";

// Modulo NPS
import NpsDashboard from "@/pages/NpsDashboard";
import NpsResponses from "@/pages/NpsResponses";

// Admin
import { UsersTab as AdminUsers } from "@/pages/admin/UsersTab";
import { EditUserForm } from "@/pages/admin/EditUserForm";
import { AreasTab as AdminAreas } from "@/pages/admin/AreasTab";
import { CyclesTab as AdminCycles } from "@/pages/admin/CyclesTab";
import { CalculateTab as AdminCalculate } from "@/pages/admin/CalculateTab";
import InstaladoresTab from "@/pages/admin/InstaladoresTab";
import VeiculosTab from "@/pages/admin/VeiculosTab";

import { WarningCircle } from "@phosphor-icons/react";

export default function App() {
  return (
    <MainLayout>
      <Switch>
        {/* Landing */}
        <Route path="/" component={Landing} />
        <Route path="/dashboard" component={Dashboard} />

        {/* Modulo 360 */}
        <Route path="/360"><Redirect to="/360/dashboard" /></Route>
        <Route path="/360/dashboard" component={Home} />
        <Route path="/360/avaliacoes" component={Evaluations} />

        {/* Modulo Obras */}
        <Route path="/obras"><Redirect to="/obras/dashboard" /></Route>
        <Route path="/obras/dashboard" component={ObrasDashboard} />
        <Route path="/obras/avaliacao" component={ObrasEvaluation} />
        <Route path="/obras/avaliacao-cruzada" component={AvaliacaoCruzada} />
        <Route path="/obras/regras" component={ObrasRegras} />

        {/* Modulo NPS */}
        <Route path="/nps"><Redirect to="/nps/dashboard" /></Route>
        <Route path="/nps/dashboard" component={NpsDashboard} />
        <Route path="/nps/respostas" component={NpsResponses} />

        {/* Admin */}
        <Route path="/admin"><Redirect to="/admin/users" /></Route>
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/users/:id" component={EditUserForm} />
        <Route path="/admin/areas" component={AdminAreas} />
        <Route path="/admin/cycles" component={AdminCycles} />
        <Route path="/admin/calculate" component={AdminCalculate} />
        <Route path="/admin/instaladores" component={InstaladoresTab} />
        <Route path="/admin/veiculos" component={VeiculosTab} />

        {/* 404 */}
        <Route>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="rounded-2xl border border-border p-12 text-center max-w-md bg-card">
              <WarningCircle size={48} weight="duotone" className="mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-5xl font-bold text-foreground mb-2">404</p>
              <h2 className="text-lg text-muted-foreground mb-4">Pagina nao encontrada</h2>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-all"
              >
                Voltar ao inicio
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </MainLayout>
  );
}
