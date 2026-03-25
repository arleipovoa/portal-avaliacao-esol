import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreasTab } from "./admin/AreasTab";
import { CalculateTab } from "./admin/CalculateTab";
import { CyclesTab } from "./admin/CyclesTab";
import { OverviewTab } from "./admin/OverviewTab";
import { UsersTab } from "./admin/UsersTab";

export default function Admin() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  if (!user || (user as any).appRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
        <p className="text-muted-foreground mt-1">Gerencie áreas, colaboradores, ciclos e bonificações.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Colaboradores</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="cycles">Ciclos</TabsTrigger>
          <TabsTrigger value="calculate">Cálculos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="areas"><AreasTab /></TabsContent>
        <TabsContent value="cycles"><CyclesTab /></TabsContent>
        <TabsContent value="calculate"><CalculateTab /></TabsContent>
      </Tabs>
    </div>
  );
}
