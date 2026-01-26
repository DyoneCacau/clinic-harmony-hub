import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';

interface FeatureBlockedScreenProps {
  featureName: string;
  planName: string;
}

/**
 * Tela de bloqueio exibida quando o usuário tenta acessar
 * uma funcionalidade não incluída no seu plano atual.
 */
export function FeatureBlockedScreen({ featureName, planName }: FeatureBlockedScreenProps) {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-10 pb-8 space-y-6 text-center">
            {/* Ícone de bloqueio */}
            <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            
            {/* Mensagem principal */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                Módulo Bloqueado
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                Seu plano atual não inclui este módulo.
              </p>
            </div>

            {/* Detalhes */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Módulo:</span>
                <span className="font-semibold text-foreground">{featureName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Plano atual:</span>
                <span className="font-semibold text-foreground">{planName}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={() => navigate('/configuracoes')}
                size="lg"
                className="gap-2 w-full"
              >
                <Sparkles className="h-5 w-5" />
                Fazer Upgrade
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                size="lg"
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>

            {/* Informação adicional */}
            <p className="text-xs text-muted-foreground pt-2">
              Entre em contato com o suporte para mais informações sobre nossos planos.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
