import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommissionRule, daysOfWeekLabels, calculationTypeLabels } from '@/types/commission';
import { mockProfessionals } from '@/data/mockAgenda';
import { cn } from '@/lib/utils';

interface CommissionRulesListProps {
  rules: CommissionRule[];
  onEdit: (rule: CommissionRule) => void;
  onDelete: (ruleId: string) => void;
  onToggleActive: (ruleId: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CommissionRulesList({
  rules,
  onEdit,
  onDelete,
  onToggleActive,
}: CommissionRulesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const getProfessionalName = (id: string) => {
    if (id === 'all') return 'Todos';
    const prof = mockProfessionals.find((p) => p.id === id);
    return prof?.name || id;
  };

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      onDelete(ruleToDelete);
    }
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Dia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Prioridade</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  Nenhuma regra de comissão cadastrada
                </TableCell>
              </TableRow>
            ) : (
              sortedRules.map((rule) => (
                <TableRow
                  key={rule.id}
                  className={cn(!rule.isActive && 'opacity-50 bg-muted/30')}
                >
                  <TableCell className="font-medium">
                    {getProfessionalName(rule.professionalId)}
                  </TableCell>
                  <TableCell>
                    {rule.procedure === 'all' ? (
                      <Badge variant="outline">Todos</Badge>
                    ) : (
                      rule.procedure
                    )}
                  </TableCell>
                  <TableCell>{daysOfWeekLabels[rule.dayOfWeek]}</TableCell>
                  <TableCell>
                    <Badge
                      variant={rule.calculationType === 'percentage' ? 'default' : 'secondary'}
                    >
                      {calculationTypeLabels[rule.calculationType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {rule.calculationType === 'percentage'
                      ? `${rule.value}%`
                      : formatCurrency(rule.value)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {rule.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleActive(rule.id)}
                          className={cn(
                            'h-8 w-8',
                            rule.isActive
                              ? 'text-emerald-600 hover:text-emerald-700'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {rule.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {rule.isActive ? 'Desativar regra' : 'Ativar regra'}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(rule)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Regra de Comissão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.
              As comissões já calculadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
