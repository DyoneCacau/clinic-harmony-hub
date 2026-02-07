import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  QrCode, 
  Check, 
  Loader2, 
  Crown, 
  Sparkles, 
  Zap,
  Copy,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePayment } from '@/hooks/usePayment';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  max_users: number | null;
  max_patients: number | null;
}

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanSlug?: string;
  onSuccess?: () => void;
}

const featureLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  agenda: 'Agenda de Consultas',
  pacientes: 'Gestão de Pacientes',
  profissionais: 'Gestão de Profissionais',
  financeiro: 'Módulo Financeiro',
  comissoes: 'Sistema de Comissões',
  estoque: 'Controle de Estoque',
  relatorios: 'Relatórios Avançados',
  termos: 'Termos e Documentos',
  ponto: 'Controle de Ponto',
  administracao: 'Administração',
  configuracoes: 'Configurações',
};

const planIcons: Record<string, React.ReactNode> = {
  basico: <Zap className="h-6 w-6" />,
  profissional: <Sparkles className="h-6 w-6" />,
  premium: <Crown className="h-6 w-6" />,
};

const planColors: Record<string, string> = {
  basico: 'border-blue-500/30 bg-blue-500/5',
  profissional: 'border-purple-500/30 bg-purple-500/5',
  premium: 'border-amber-500/30 bg-amber-500/5',
};

export function UpgradePlanDialog({ 
  open, 
  onOpenChange, 
  currentPlanSlug,
  onSuccess 
}: UpgradePlanDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'pix' | 'success'>('select');
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  
  const { 
    isLoading, 
    pixData, 
    createPixPayment, 
    createCardPayment, 
    checkPixStatus,
    clearPaymentData 
  } = usePayment();

  useEffect(() => {
    if (open) {
      fetchPlans();
      setPaymentStep('select');
      setSelectedPlan(null);
      clearPaymentData();
    }
  }, [open]);

  // Poll PIX status when in PIX step
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (paymentStep === 'pix' && pixData?.pix_id) {
      setIsPolling(true);
      interval = setInterval(async () => {
        const status = await checkPixStatus(pixData.pix_id);
        if (status === 'PAID') {
          setPaymentStep('success');
          setIsPolling(false);
          toast.success('Pagamento confirmado!');
          onSuccess?.();
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
      setIsPolling(false);
    };
  }, [paymentStep, pixData?.pix_id]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .neq('slug', 'trial')
        .order('price_monthly');

      if (error) throw error;

      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) 
          ? plan.features 
          : JSON.parse(plan.features as unknown as string || '[]')
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentStep('payment');
  };

  const handlePixPayment = async () => {
    if (!selectedPlan) return;

    const result = await createPixPayment(selectedPlan.id);
    if (result) {
      setPaymentStep('pix');
    }
  };

  const handleCardPayment = async () => {
    if (!selectedPlan) return;

    const result = await createCardPayment(selectedPlan.id);
    if (result?.checkout_url) {
      // Open AbacatePay checkout in new tab
      window.open(result.checkout_url, '_blank');
      toast.info('Você será redirecionado para o checkout seguro');
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {paymentStep === 'select' && 'Escolha seu Plano'}
            {paymentStep === 'payment' && 'Forma de Pagamento'}
            {paymentStep === 'pix' && 'Pagamento via PIX'}
            {paymentStep === 'success' && 'Pagamento Confirmado!'}
          </DialogTitle>
          <DialogDescription>
            {paymentStep === 'select' && 'Selecione o plano ideal para sua clínica'}
            {paymentStep === 'payment' && `Plano selecionado: ${selectedPlan?.name}`}
            {paymentStep === 'pix' && 'Escaneie o QR Code ou copie o código PIX'}
            {paymentStep === 'success' && 'Seu plano foi ativado com sucesso!'}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Selection */}
        {paymentStep === 'select' && (
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            {isLoadingPlans ? (
              <div className="col-span-3 flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              plans.map((plan) => {
                const isCurrentPlan = plan.slug === currentPlanSlug;
                const isPopular = plan.slug === 'profissional';

                return (
                  <Card 
                    key={plan.id} 
                    className={cn(
                      'relative cursor-pointer transition-all hover:shadow-lg',
                      planColors[plan.slug] || 'border-border',
                      isCurrentPlan && 'opacity-60 cursor-not-allowed'
                    )}
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                        Mais Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-2">
                      <div className={cn(
                        "mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-2",
                        plan.slug === 'premium' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                      )}>
                        {planIcons[plan.slug]}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <span className="text-3xl font-bold">
                          {formatPrice(plan.price_monthly)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        {plan.max_users && (
                          <p className="text-sm text-muted-foreground">
                            Até {plan.max_users} usuários
                          </p>
                        )}
                        {plan.max_patients && (
                          <p className="text-sm text-muted-foreground">
                            Até {plan.max_patients} pacientes
                          </p>
                        )}
                        {!plan.max_users && !plan.max_patients && (
                          <p className="text-sm text-muted-foreground">
                            Usuários e pacientes ilimitados
                          </p>
                        )}
                      </div>

                      <Separator />

                      <ul className="space-y-2">
                        {plan.features.slice(0, 6).map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{featureLabels[feature] || feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 6 && (
                          <li className="text-sm text-muted-foreground">
                            + {plan.features.length - 6} mais...
                          </li>
                        )}
                      </ul>

                      <Button 
                        className="w-full" 
                        variant={isPopular ? 'default' : 'outline'}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Plano Atual' : 'Selecionar'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Payment Method Selection */}
        {paymentStep === 'payment' && selectedPlan && (
          <div className="space-y-6 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    selectedPlan.slug === 'premium' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                  )}>
                    {planIcons[selectedPlan.slug]}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedPlan.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatPrice(selectedPlan.price_monthly)}</p>
                  <p className="text-sm text-muted-foreground">/mês</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="pix" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pix" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  PIX
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pix" className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 bg-green-500/5 border-green-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-700 dark:text-green-400">Pagamento via PIX</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pagamento instantâneo. Seu plano será ativado automaticamente após a confirmação.
                  </p>
                </div>

                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handlePixPayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Gerar QR Code PIX
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="card" className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold text-blue-700 dark:text-blue-400">Cartão de Crédito/Débito</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você será redirecionado para o checkout seguro da AbacatePay.
                  </p>
                </div>

                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleCardPayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pagar com Cartão
                      <ExternalLink className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setPaymentStep('select')}
            >
              Voltar para Planos
            </Button>
          </div>
        )}

        {/* PIX QR Code Display */}
        {paymentStep === 'pix' && pixData && (
          <div className="space-y-6 mt-4">
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={pixData.qr_code_base64} 
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>

              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Valor a pagar:</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(pixData.amount / 100)}
                </p>
              </div>

              {/* Copy Code */}
              <div className="w-full max-w-md">
                <p className="text-sm text-muted-foreground mb-2 text-center">
                  Ou copie o código PIX:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixData.qr_code}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs border rounded-md bg-muted truncate"
                  />
                  <Button variant="outline" size="icon" onClick={copyPixCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isPolling ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Aguardando pagamento...</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Expira em 1 hora</span>
                  </>
                )}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setPaymentStep('payment');
                clearPaymentData();
              }}
            >
              Voltar
            </Button>
          </div>
        )}

        {/* Success */}
        {paymentStep === 'success' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Pagamento Confirmado!</h3>
              <p className="text-muted-foreground">
                Seu plano {selectedPlan?.name} foi ativado com sucesso.
              </p>
            </div>

            <Button 
              className="w-full max-w-xs"
              onClick={() => {
                onOpenChange(false);
                window.location.reload();
              }}
            >
              Continuar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
