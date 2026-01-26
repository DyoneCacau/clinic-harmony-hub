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
  XCircle,
  ShieldAlert,
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
import { Checkbox } from '@/components/ui/checkbox';
import { AgendaAppointment } from '@/types/agenda';
import { PaymentMethod } from '@/types/financial';
import { CommissionRule } from '@/types/commission';
import {
  findApplicableRule,
  calculateCommissionAmount,
  getProcedurePrice,
  formatCommissionInfo,
  validateAppointmentCompletion,
  ValidationResult,
} from '@/services/commissionService';
import { mockCommissionRules, mockCommissionCalculations } from '@/data/mockCommissions';
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
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const [proceedWithoutRule, setProceedWithoutRule] = useState(false);

  useEffect(() => {
    if (appointment) {
      // Reset states
      setProceedWithoutRule(false);
      
      // Validate appointment completion
      const validationResult = validateAppointmentCompletion(
        appointment,
        mockCommissionRules,
        mockCommissionCalculations,
        true
      );
      setValidation(validationResult);

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

  const canComplete = () => {
    // If duplicate, never allow
    if (validation.errorCode === 'DUPLICATE') return false;
    
    // If no rule but user acknowledged
    if (validation.errorCode === 'NO_RULE' && proceedWithoutRule) return true;
    
    // If valid
    return validation.isValid;
  };

  const handleComplete = () => {
    if (!appointment || !canComplete()) return;
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
          {/* Validation Errors */}
          {!validation.isValid && validation.errorCode === 'DUPLICATE' && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Cálculo Duplicado Detectado
                  </p>
                  <p className="text-xs text-destructive/80">
                    {validation.error}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  disabled={validation.errorCode === 'DUPLICATE'}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                disabled={validation.errorCode === 'DUPLICATE'}
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
              <Card className={cn(
                "border-amber-200 bg-amber-50",
                validation.errorCode === 'NO_RULE' && !proceedWithoutRule && "border-destructive bg-destructive/10"
              )}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className={cn(
                      "h-5 w-5 flex-shrink-0",
                      validation.errorCode === 'NO_RULE' && !proceedWithoutRule ? "text-destructive" : "text-amber-600"
                    )} />
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        validation.errorCode === 'NO_RULE' && !proceedWithoutRule ? "text-destructive" : "text-amber-800"
                      )}>
                        Nenhuma regra de comissão encontrada
                      </p>
                      <p className={cn(
                        "text-xs",
                        validation.errorCode === 'NO_RULE' && !proceedWithoutRule ? "text-destructive/80" : "text-amber-700"
                      )}>
                        {validation.errorCode === 'NO_RULE' && !proceedWithoutRule
                          ? 'Finalize somente se tiver certeza ou configure uma regra antes.'
                          : 'O atendimento será registrado sem comissão.'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {validation.errorCode === 'NO_RULE' && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-amber-200">
                      <Checkbox
                        id="proceedWithoutRule"
                        checked={proceedWithoutRule}
                        onCheckedChange={(checked) => setProceedWithoutRule(checked === true)}
                      />
                      <label
                        htmlFor="proceedWithoutRule"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Confirmo que desejo prosseguir sem regra de comissão
                      </label>
                    </div>
                  )}
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
            disabled={!canComplete()}
            className={cn(
              "bg-emerald-600 hover:bg-emerald-700",
              !canComplete() && "opacity-50 cursor-not-allowed"
            )}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar e Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
