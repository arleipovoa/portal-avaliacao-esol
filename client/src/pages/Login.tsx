import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AppModule,
  DEFAULT_MODULE,
  getDashboardPathForModule,
  persistModule,
  resolveActiveModule,
} from "@/lib/moduleRouting";
import { trpc } from "@/lib/trpc";
import { BASE_PATH } from "@shared/const";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MODULE_COPY: Record<AppModule, { title: string; subtitle: string }> = {
  obras: {
    title: "Acesso | Avaliação de Obras",
    subtitle: "Área restrita para avaliação técnica de instalações e obras",
  },
  "360": {
    title: "Acesso | Avaliação 360º",
    subtitle: "Área restrita para avaliação de desempenho entre colaboradores",
  },
  nps: {
    title: "Acesso | NPS",
    subtitle: "Área restrita para pesquisas de satisfação e Net Promoter Score",
  },
};

export default function Login() {
  const [location, setLocation] = useLocation();

  const activeModule = useMemo(
    () => resolveActiveModule(location || "/login"),
    [location]
  );

  useEffect(() => {
    persistModule(activeModule);
  }, [activeModule]);

  const moduleCopy = MODULE_COPY[activeModule] ?? MODULE_COPY[DEFAULT_MODULE];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#12110f] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#ffcc29] flex items-center justify-center">
              <span className="text-[#12110f] font-bold text-lg">E</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Portal <span className="text-[#ffcc29]">E-sol</span>
            </h1>
          </div>
          <p className="text-gray-300 text-sm mt-2">{moduleCopy.title}</p>
          <p className="text-gray-500 text-xs mt-1">{moduleCopy.subtitle}</p>
        </div>

        <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
          <CardContent className="pt-6">
            <LoginForm activeModule={activeModule} />
          </CardContent>
        </Card>

        <div className="text-center mt-4 space-y-2">
          <p className="text-gray-600 text-xs">
            Grupo E-sol &mdash; Portal de Avaliações &copy; 2026
          </p>
          <button
            onClick={() => setLocation("/")}
            className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
          >
            ← Voltar ao Portal
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ activeModule }: { activeModule: AppModule }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      persistModule(activeModule);
      window.location.href = `${BASE_PATH}${getDashboardPathForModule(activeModule)}`;
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email || !password) {
          toast.error("Preencha todos os campos.");
          return;
        }
        loginMutation.mutate({ email, password });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29]"
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29] pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold h-11"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        )}
        Entrar
      </Button>
    </form>
  );
}
