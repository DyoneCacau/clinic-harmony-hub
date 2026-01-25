import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle,
  DollarSign,
  Percent,
  AlertTriangle,
  User,
  Stethoscope,
  Calculator,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AgendaAppointment } from '@/types/agenda';
import { PaymentMethod } from '@/types/financial';
import { CommissionRule } from '@/types/commission';
import {
  findApplicableRule,
  calculateCommissionAmount,
  getProcedurePrice,
  formatCommissionInfo,
} from '@/services/commissionService';
import { mockCommissionRules } from '@/data/mockCommissions';
import { cn } from '@/lib/utils';

interface CompleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AgendaAppointment | null;
  onComplete: (
    appointment: AgendaAppointment,
    serviceValue: number,
    paymentMethod: PaymentMethod,
    commissionAmount: number | null
  ) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CompleteAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onComplete,
}: CompleteAppointmentDialogProps) {
  const [serviceValue, setServiceValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [applicableRule, setApplicableRule] = useState<CommissionRule | null>(null);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);

  useEffect(() => {
    if (appointment) {
      // Get suggested price from procedure table
      const suggestedPrice = getProcedurePrice(
        appointment.procedure,
        appointment.clinic.id
      );
      setServiceValue(suggestedPrice);

      // Find applicable commission rule
      const rule = findApplicableRule(
        mockCommissionRules,
        appointment.professional.id,
        appointment.clinic.id,
        appointment.procedure,
        new Date(appointment.date)
      );
      setApplicableRule(rule);

      if (rule) {
        setCommissionAmount(calculateCommissionAmount(rule, suggestedPrice));
      } else {
        setCommissionAmount(0);
      }
    }
  }, [appointment]);

  useEffect(() => {
    if (applicableRule && serviceValue > 0) {
      setCommissionAmount(calculateCommissionAmount(applicableRule, serviceValue));
    }
  }, [serviceValue, applicableRule]);

  const handleComplete = () => {
    if (!appointment) return;
    onComplete(
      appointment,
      serviceValue,
      paymentMethod,
      applicableRule ? commissionAmount : null
    );
    onOpenChange(false);
  };

  if (!appointment) return null;

  const netValue = serviceValue - commissionAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Finalizar Atendimento
          </DialogTitle>
          <DialogDescription>
            Registre o pagamento e calcule a comissão do profissional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointment.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.professional.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {appointment.procedure}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(appointment.date), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}{' '}
                às {appointment.startTime}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Info */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceValue">Valor do Atendimento</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="serviceValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceValue}
                  onChange={(e) => setServiceValue(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit">Cartão Crédito</SelectItem>
                  <SelectItem value="debit">Cartão Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Commission Calculation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="font-medium">Cálculo de Comissão</span>
            </div>

            {applicableRule ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Regra aplicada:</span>
                    <Badge variant="secondary">
                      {applicableRule.calculationType === 'percentage' ? (
                        <Percent className="mr-1 h-3 w-3" />
                      ) : (
                        <DollarSign className="mr-1 h-3 w-3" />
                      )}
                      {formatCommissionInfo(applicableRule)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-semibold text-sm">{formatCurrency(serviceValue)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700">Comissão</p>
                      <p className="font-semibold text-sm text-amber-700">
                        {formatCurrency(commissionAmount)}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-xs text-emerald-700">Líquido</p>
                      <p className="font-semibold text-sm text-emerald-700">
                        {formatCurrency(netValue)}
                      </p>
                    </div>
                  </div>

                  {applicableRule.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {applicableRule.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Nenhuma regra de comissão encontrada
                    </p>
                    <p className="text-xs text-amber-700">
                      Configure uma regra para este profissional/procedimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar e Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
