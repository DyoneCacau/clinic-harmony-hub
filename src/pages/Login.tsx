import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || "Erro ao fazer login");
      setIsLoading(false);
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">
            ClinSoft
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-primary-foreground">
            Gestão odontológica
            <br />
            simplificada.
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            Controle sua clínica odontológica de forma eficiente com nosso sistema completo de
            gestão. Agendamentos, pacientes, financeiro e muito mais.
          </p>
          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold text-primary-foreground">500+</p>
              <p className="text-sm text-primary-foreground/70">
                Clínicas ativas
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">50k+</p>
              <p className="text-sm text-primary-foreground/70">
                Pacientes gerenciados
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-foreground">99.9%</p>
              <p className="text-sm text-primary-foreground/70">Uptime</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2025 ClinSoft. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">ClinSoft</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-muted-foreground">
              Entre com suas credenciais para acessar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Lembrar de mim
                </Label>
              </div>
              <a
                href="#"
                className="text-sm font-medium text-primary hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <a href="#" className="font-medium text-primary hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
