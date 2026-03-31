import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BuildingIcon, UserIcon, ShieldAlertIcon, CheckCircleIcon, BrushIcon, FileTextIcon, ZapIcon, SmileIcon, Loader2, InfoIcon } from "lucide-react";

export default function ObrasEvaluations() {
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.users.listAll.useQuery();
  const submitMutation = trpc.projects.submitScores.useMutation();

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [scores, setScores] = useState({
    notaSeguranca: 10,
    notaFuncionalidade: 10,
    notaEstetica: 10,
    mediaOs: 10,
    eficiencia: 10,
    npsCliente: 10,
  });

  const handleScoreChange = (field: keyof typeof scores, value: number[]) => {
    setScores(prev => ({ ...prev, [field]: value[0] }));
  };

  const calculateLivePreview = () => {
    const { notaSeguranca, notaFuncionalidade, notaEstetica, mediaOs, eficiencia, npsCliente } = scores;
    const baseScore = ((notaSeguranca * 2 + notaFuncionalidade * 2 + notaEstetica * 1) / 5);
    const result = (baseScore * 0.5) + (mediaOs * 0.2) + (eficiencia * 0.15) + (npsCliente * 0.15);
    return Math.max(0, Math.min(100, result * 10)).toFixed(1); // Assuming standardizing to 0-100%
  };

  const handleSubmit = async () => {
    if (!selectedProjectId || !selectedUserId) {
      alert("Selecione uma obra e um colaborador!");
      return;
    }
    
    try {
      await submitMutation.mutateAsync({
        projectId: selectedProjectId,
        userId: selectedUserId,
        ...scores
      });
      alert("Avaliação submetida com sucesso!");
      setScores({
        notaSeguranca: 10, notaFuncionalidade: 10, notaEstetica: 10,
        mediaOs: 10, eficiencia: 10, npsCliente: 10
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao submeter avaliação da obra.");
    }
  };

  if (projectsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
          <BuildingIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliações de Obras</h1>
          <p className="text-muted-foreground mt-1">
            Lance as avaliações técnicas e pontuações das obras realizadas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <InfoIcon className="w-5 h-5 text-slate-500" />
              Seleção
            </CardTitle>
            <CardDescription>
              Selecione a obra finalizada e o colaborador avaliado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="project">Obra</Label>
              <Select onValueChange={(v) => setSelectedProjectId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.code} - {p.clientName} ({p.city}/{p.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Colaborador / Instalador</Label>
              <Select onValueChange={(v) => setSelectedUserId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} - {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-100 shadow-inner">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm ring-4 ring-blue-50">
              <BuildingIcon className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                Nota Prevista (0-100%)
              </p>
              <h2 className="text-6xl font-black text-slate-800 mt-2">
                {calculateLivePreview()}%
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              O cálculo reflete os pesos definidos (Segurança 2x, Funcionalidade 2x, Estética 1x, etc).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            Critérios de Avaliação
          </CardTitle>
          <CardDescription>
            Atribua notas de 0 a 10 para cada critério técnico avaliado na obra.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <ScoreSlider 
            icon={<ShieldAlertIcon className="w-5 h-5 text-red-500" />}
            label="Segurança" 
            field="notaSeguranca" 
            value={scores.notaSeguranca} 
            onChange={handleScoreChange} 
            description="EPI, EPIs, cordas, andaimes, protocolos de risco elétrico (Peso 2.0)"
          />
          <ScoreSlider 
            icon={<ZapIcon className="w-5 h-5 text-amber-500" />}
            label="Funcionalidade" 
            field="notaFuncionalidade" 
            value={scores.notaFuncionalidade} 
            onChange={handleScoreChange}
            description="Funcionamento correto do inversor, monitoramento, tensão, fixação (Peso 2.0)" 
          />
          <ScoreSlider 
            icon={<BrushIcon className="w-5 h-5 text-fuchsia-500" />}
            label="Estética" 
            field="notaEstetica" 
            value={scores.notaEstetica} 
            onChange={handleScoreChange}
            description="Acabamento, alinhamento dos módulos, passagens de cabos ocultas (Peso 1.0)" 
          />
          <ScoreSlider 
            icon={<FileTextIcon className="w-5 h-5 text-blue-500" />}
            label="Média de OS" 
            field="mediaOs" 
            value={scores.mediaOs} 
            onChange={handleScoreChange}
            description="Qualidade do preenchimento da Ordem de Serviço pelo líder (Peso 0.2)" 
          />
          <ScoreSlider 
            icon={<CheckCircleIcon className="w-5 h-5 text-emerald-500" />}
            label="Eficiência / Prazo" 
            field="eficiencia" 
            value={scores.eficiencia} 
            onChange={handleScoreChange}
            description="Cumprimento do cronograma esperado (Peso 0.15)" 
          />
          <ScoreSlider 
            icon={<SmileIcon className="w-5 h-5 text-indigo-500" />}
            label="NPS Cliente" 
            field="npsCliente" 
            value={scores.npsCliente} 
            onChange={handleScoreChange}
            description="Nota atribuída pelo cliente sobre a equipe e o serviço (Peso 0.15)" 
          />
        </CardContent>
        <CardFooter className="bg-slate-50 border-t p-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            size="lg" 
            disabled={submitMutation.isPending || !selectedProjectId || !selectedUserId}
            className="w-full md:w-auto font-semibold px-8 shadow-sm"
          >
            {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar e Salvar Avaliação
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function ScoreSlider({ icon, label, field, value, onChange, description }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">{icon}</div>
          <div>
            <Label className="text-base font-semibold text-slate-800">{label}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div className="w-14 items-center flex justify-end">
          <span className="text-2xl font-bold font-mono text-slate-800">{value}</span>
        </div>
      </div>
      <div className="px-2">
        <Slider
          defaultValue={[10]}
          max={10}
          step={0.1}
          value={[value]}
          onValueChange={(v) => onChange(field, v)}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
          <span>0 (Ruim)</span>
          <span>5 (Médio)</span>
          <span>10 (Excelente)</span>
        </div>
      </div>
    </div>
  );
}
