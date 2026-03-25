import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { BASE_PATH } from "@shared/const";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Tab = "login" | "register";

export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [, setLocation] = useLocation();

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
          <p className="text-gray-400 text-sm mt-2">Sistema de Avaliação de Desempenho</p>
        </div>

        <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex rounded-lg bg-gray-800/50 p-1">
              <button onClick={() => setTab("login")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === "login" ? "bg-[#ffcc29] text-[#12110f]" : "text-gray-400 hover:text-white"}`}>
                Entrar
              </button>
              <button onClick={() => setTab("register")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === "register" ? "bg-[#ffcc29] text-[#12110f]" : "text-gray-400 hover:text-white"}`}>
                Primeiro Acesso
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {tab === "login" ? <LoginForm /> : <RegisterForm onSuccess={() => setTab("login")} />}
          </CardContent>
        </Card>

        <div className="text-center mt-4 space-y-2">
          <p className="text-gray-600 text-xs">Grupo E-sol &mdash; Portal de Avaliações &copy; 2026</p>
          <button onClick={() => setLocation("/")} className="text-gray-500 text-xs hover:text-gray-300 transition-colors">
            ← Voltar ao Portal
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.mustChangePassword) {
        window.location.href = `${BASE_PATH}/perfil`;
        toast.info("Primeiro acesso detectado. Por favor, atualize sua senha.");
      } else {
        window.location.href = `${BASE_PATH}/dashboard`;
      }
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!email || !password) { toast.error("Preencha todos os campos."); return; } loginMutation.mutate({ email, password }); }} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">E-mail</Label>
        <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29]" autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-300">Senha</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29] pr-10" autoComplete="current-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold h-11" disabled={loginMutation.isPending}>
        {loginMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Entrar
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(e.message),
  });

  if (done) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto text-3xl">✓</div>
        <h3 className="text-white font-semibold">Cadastro enviado!</h3>
        <p className="text-gray-400 text-sm leading-relaxed">Seu cadastro foi recebido e aguarda aprovação do administrador. Você receberá acesso em breve.</p>
        <Button onClick={onSuccess} className="w-full bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold">Voltar ao Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!name || !email || !password) { toast.error("Preencha todos os campos."); return; }
      if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
      registerMutation.mutate({ name, email, password });
    }} className="space-y-4">
      <p className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 leading-relaxed">
        Preencha seus dados para solicitar acesso. O administrador irá vincular e aprovar seu cadastro.
      </p>
      <div className="space-y-2">
        <Label className="text-gray-300">Nome completo</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo"
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29]" />
      </div>
      <div className="space-y-2">
        <Label className="text-gray-300">E-mail</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29]" />
      </div>
      <div className="space-y-2">
        <Label className="text-gray-300">Senha</Label>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29] pr-10" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-gray-300">Confirmar senha</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha"
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#ffcc29]" />
      </div>
      <Button type="submit" className="w-full bg-[#ffcc29] text-[#12110f] hover:bg-[#e6b800] font-semibold h-11" disabled={registerMutation.isPending}>
        {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Solicitar Acesso
      </Button>
    </form>
  );
}
