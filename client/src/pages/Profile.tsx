import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearStoredProfilePhoto,
  getStoredProfilePhoto,
  setStoredProfilePhoto,
} from "@/lib/profilePhoto";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2, Save, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

export default function Profile() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setPhotoData(getStoredProfilePhoto(user.id));
  }, [user?.id, user?.name]);

  const isNameChanged = useMemo(() => {
    if (!user) return false;
    return name.trim() !== (user.name || "").trim();
  }, [name, user]);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      await utils.auth.me.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Informe um nome válido.");
      return;
    }
    updateProfileMutation.mutate({ name: trimmedName });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error("A foto deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : null;
      if (!data) {
        toast.error("Não foi possível processar a imagem.");
        return;
      }
      setPhotoData(data);
      setStoredProfilePhoto(user.id, data);
      toast.success("Foto atualizada.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!user) return;
    clearStoredProfilePhoto(user.id);
    setPhotoData(null);
    toast.success("Foto removida.");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Atualize seu nome, senha e foto de perfil.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Gerencie suas informações de identificação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-20 w-20 border">
              {photoData ? (
                <AvatarImage src={photoData} alt="Foto de perfil" />
              ) : null}
              <AvatarFallback className="bg-[#ffcc29] text-[#12110f] text-xl font-semibold">
                {(name || user.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="profile-photo">Foto de perfil</Label>
              <Input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {photoData && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover foto
                </Button>
              )}
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input id="profile-email" value={user.email || ""} disabled />
            </div>
            <Button
              type="submit"
              disabled={
                updateProfileMutation.isPending || !name.trim() || !isNameChanged
              }
            >
              {updateProfileMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Salvar dados
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Atualize sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>

            <Button
              type="submit"
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changePasswordMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              <User className="h-4 w-4 mr-2" />
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
