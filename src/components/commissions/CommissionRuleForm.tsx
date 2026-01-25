import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CommissionRule, DayOfWeek, CalculationType, daysOfWeekLabels } from '@/types/commission';
import { mockProfessionals } from '@/data/mockAgenda';
import { mockClinics } from '@/data/mockClinics';
import { mockProcedurePrices } from '@/data/mockCommissions';

const formSchema = z.object({
  clinicId: z.string().min(1, 'Selecione uma clínica'),
  professionalId: z.string().min(1, 'Selecione um profissional'),
  procedure: z.string().min(1, 'Selecione um procedimento'),
  dayOfWeek: z.string().min(1, 'Selecione o dia'),
  calculationType: z.enum(['percentage', 'fixed']),
  value: z.number().min(0.01, 'Valor deve ser maior que zero'),
  priority: z.number().min(1).max(100),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CommissionRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingRule?: CommissionRule | null;
  selectedClinicId?: string;
}

export function CommissionRuleForm({
  open,
  onOpenChange,
  onSave,
  editingRule,
  selectedClinicId,
}: CommissionRuleFormProps) {
  const [selectedClinic, setSelectedClinic] = useState(selectedClinicId || '');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clinicId: selectedClinicId || '',
      professionalId: 'all',
      procedure: 'all',
      dayOfWeek: 'all',
      calculationType: 'percentage',
      value: 30,
      priority: 1,
      isActive: true,
      notes: '',
    },
  });

  useEffect(() => {
    if (editingRule) {
      form.reset({
        clinicId: editingRule.clinicId,
        professionalId: editingRule.professionalId,
        procedure: editingRule.procedure,
        dayOfWeek: editingRule.dayOfWeek,
        calculationType: editingRule.calculationType,
        value: editingRule.value,
        priority: editingRule.priority,
        isActive: editingRule.isActive,
        notes: editingRule.notes || '',
      });
      setSelectedClinic(editingRule.clinicId);
    } else {
      form.reset({
        clinicId: selectedClinicId || '',
        professionalId: 'all',
        procedure: 'all',
        dayOfWeek: 'all',
        calculationType: 'percentage',
        value: 30,
        priority: 1,
        isActive: true,
        notes: '',
      });
      setSelectedClinic(selectedClinicId || '');
    }
  }, [editingRule, selectedClinicId, form]);

  const watchCalculationType = form.watch('calculationType');

  // Get unique procedures for the selected clinic
  const procedures = mockProcedurePrices
    .filter((p) => p.clinicId === selectedClinic || !selectedClinic)
    .map((p) => p.name);
  const uniqueProcedures = [...new Set(procedures)];

  const handleSubmit = (values: FormValues) => {
    onSave({
      clinicId: values.clinicId,
      professionalId: values.professionalId as string | 'all',
      procedure: values.procedure as string | 'all',
      dayOfWeek: values.dayOfWeek as DayOfWeek,
      calculationType: values.calculationType as CalculationType,
      value: values.value,
      priority: values.priority,
      isActive: values.isActive,
      notes: values.notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clinicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clínica</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setSelectedClinic(v);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a clínica" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockClinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="professionalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos os Profissionais</SelectItem>
                        {mockProfessionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos os Procedimentos</SelectItem>
                        {uniqueProcedures.map((proc) => (
                          <SelectItem key={proc} value={proc}>
                            {proc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia da Semana</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(daysOfWeekLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Aplica a regra apenas no dia selecionado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calculationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cálculo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchCalculationType === 'percentage' ? 'Percentual' : 'Valor'}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step={watchCalculationType === 'percentage' ? '1' : '0.01'}
                          min="0"
                          max={watchCalculationType === 'percentage' ? '100' : undefined}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className={watchCalculationType === 'percentage' ? 'pr-8' : 'pl-9'}
                        />
                        {watchCalculationType === 'percentage' ? (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        ) : (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade (1-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Regras com maior prioridade são aplicadas primeiro quando há conflito
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Regra Ativa</FormLabel>
                    <FormDescription>
                      Regras inativas não são aplicadas nos cálculos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre esta regra (opcional)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingRule ? 'Salvar' : 'Criar Regra'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
