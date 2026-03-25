import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { BASE_PATH } from "@shared/const";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Evaluations from "./pages/Evaluations";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import SubObrasDashboard from "./pages/SubObrasDashboard";
import Sub360Dashboard from "./pages/Sub360Dashboard";
import SubNpsDashboard from "./pages/SubNpsDashboard";

function AuthenticatedRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Home} />
        <Route path="/avaliacoes" component={Evaluations} />
        <Route path="/admin" component={Admin} />
        <Route path="/perfil" component={Profile} />
        <Route path="/modulo-obras/dashboard" component={SubObrasDashboard} />
        <Route path="/modulo-360/dashboard" component={Sub360Dashboard} />
        <Route path="/modulo-nps/dashboard" component={SubNpsDashboard} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route component={AuthenticatedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <WouterRouter base={BASE_PATH}>
            <AppRouter />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
