import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Stethoscope,
  Search,
  Plus,
  Edit,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Award,
} from 'lucide-react';
import { mockProfessionals } from '@/data/mockAgenda';
import { Professional } from '@/types/agenda';
import { toast } from 'sonner';
import { mockClinics } from '@/data/mockClinics';

interface ExtendedProfessional extends Professional {
  email?: string;
  phone?: string;
  clinicIds: string[];
  isActive: boolean;
  hireDate: string;
  specialties: string[];
}

const extendedProfessionals: ExtendedProfessional[] = mockProfessionals.map((p, i) => ({
  ...p,
  email: `${p.name.split(' ')[0].toLowerCase()}@clinsoft.com`,
  phone: `(11) 9${String(9000 + i).padStart(4, '0')}-${String(1000 + i * 111).padStart(4, '0')}`,
  clinicIds: i < 2 ? ['clinic1', 'clinic2'] : [i < 4 ? 'clinic1' : 'clinic3'],
  isActive: true,
  hireDate: `202${3 + Math.floor(i / 2)}-0${(i % 6) + 1}-15`,
  specialties: [p.specialty],
}));

export default function Professionals() {
  const [professionals, setProfessionals] = useState<ExtendedProfessional[]>(extendedProfessionals);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProfessional, setSelectedProfessional] = useState<ExtendedProfessional | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const specialties = useMemo(() => {
    const specs = new Set<string>();
    professionals.forEach(p => p.specialties.forEach(s => specs.add(s)));
    return Array.from(specs);
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cro.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = specialtyFilter === 'all' || p.specialties.includes(specialtyFilter);
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive);
      return matchesSearch && matchesSpecialty && matchesStatus;
    });
  }, [professionals, searchTerm, specialtyFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: professionals.length,
    active: professionals.filter(p => p.isActive).length,
    inactive: professionals.filter(p => !p.isActive).length,
    specialties: specialties.length,
  }), [professionals, specialties]);

  const handleToggleStatus = (professional: ExtendedProfessional) => {
    setProfessionals(prev => prev.map(p => 
      p.id === professional.id ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success(`Profissional ${professional.isActive ? 'desativado' : 'ativado'} com sucesso!`);
  };

  const handleViewDetails = (professional: ExtendedProfessional) => {
    setSelectedProfessional(professional);
    setDetailsOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-7 w-7 text-primary" />
              Profissionais
            </h1>
            <p className="text-muted-foreground">Gerencie os profissionais da clínica</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Especialidades</p>
                  <p className="text-2xl font-bold">{stats.specialties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CRO..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {specialties.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Professionals Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfessionals.map((professional) => (
            <Card 
              key={professional.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${!professional.isActive ? 'opacity-60' : ''}`}
              onClick={() => handleViewDetails(professional)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(professional.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{professional.name}</h3>
                        <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                      </div>
                      <Badge variant={professional.isActive ? 'default' : 'secondary'}>
                        {professional.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5" />
                        CRO: {professional.cro}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        {professional.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {professional.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Detalhes do Profissional
            </DialogTitle>
          </DialogHeader>

          {selectedProfessional && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(selectedProfessional.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedProfessional.name}</h3>
                  <p className="text-muted-foreground">{selectedProfessional.specialty}</p>
                  <Badge variant={selectedProfessional.isActive ? 'default' : 'secondary'} className="mt-1">
                    {selectedProfessional.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">CRO</Label>
                  <p className="font-medium">{selectedProfessional.cro}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Contratação</Label>
                  <p className="font-medium">{selectedProfessional.hireDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{selectedProfessional.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedProfessional.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Clínicas</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedProfessional.clinicIds.map(cId => {
                    const clinic = mockClinics.find(c => c.id === cId);
                    return clinic ? (
                      <Badge key={cId} variant="outline">{clinic.name}</Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => selectedProfessional && handleToggleStatus(selectedProfessional)}
            >
              {selectedProfessional?.isActive ? 'Desativar' : 'Ativar'}
            </Button>
            <Button onClick={() => setDetailsOpen(false)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
