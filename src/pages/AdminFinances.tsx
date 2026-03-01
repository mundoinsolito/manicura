import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle, Search, Filter, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type TypeFilter = 'all' | 'income' | 'expense';

export default function AdminFinances() {
  const { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    refetch 
  } = useTransactions();
  const { appointments } = useAppointments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // Build a map of appointment_id -> client name
  const appointmentClientMap = useMemo(() => {
    const map: Record<string, string> = {};
    appointments.forEach(a => {
      if (a.client?.name) {
        map[a.id] = a.client.name;
      }
    });
    return map;
  }, [appointments]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    return transactions.filter(tx => {
      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const clientName = tx.appointment_id ? appointmentClientMap[tx.appointment_id] || '' : '';
        const matchesSearch = 
          tx.description.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        if (tx.date !== todayStr) return false;
      } else if (dateFilter === 'week') {
        const txDate = parseISO(tx.date);
        if (!isWithinInterval(txDate, { start: startOfWeek(now, { locale: es }), end: endOfWeek(now, { locale: es }) })) return false;
      } else if (dateFilter === 'month') {
        const txDate = parseISO(tx.date);
        if (!isWithinInterval(txDate, { start: startOfMonth(now), end: endOfMonth(now) })) return false;
      } else if (dateFilter === 'custom' && customFrom && customTo) {
        const txDate = parseISO(tx.date);
        if (!isWithinInterval(txDate, { start: parseISO(customFrom), end: parseISO(customTo) })) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, dateFilter, typeFilter, customFrom, customTo, appointmentClientMap]);

  // Metrics from filtered transactions
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const appointmentIncome = appointments
    .filter(a => a.payment_status === 'full' || a.payment_status === 'partial')
    .reduce((sum, a) => sum + a.payment_amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await addTransaction({
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      date: form.date,
      appointment_id: null,
    });

    if (result.success) {
      toast.success('Transacción registrada');
      setDialogOpen(false);
      setForm({ type: 'income', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    } else {
      toast.error('Error al registrar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    const result = await deleteTransaction(id);
    if (result.success) toast.success('Transacción eliminada');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Finanzas</h1>
            <p className="text-muted-foreground">Control de ingresos y gastos</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="accent-gradient border-0 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Transacción
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Transacción</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'income' | 'expense' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        <span className="flex items-center gap-2"><ArrowUpCircle className="w-4 h-4 text-green-500" /> Ingreso</span>
                      </SelectItem>
                      <SelectItem value="expense">
                        <span className="flex items-center gap-2"><ArrowDownCircle className="w-4 h-4 text-red-500" /> Gasto</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto ($)</Label>
                  <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Pago de servicio, Compra de esmaltes..." required />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full accent-gradient border-0">Registrar Transacción</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ingresos</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pagos de Citas</span>
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">${appointmentIncome.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Gastos</span>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className={netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ganancia Neta</span>
                <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netProfit.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descripción o cliente..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-10" 
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter === 'custom' && (
              <div className="flex gap-4 mt-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Desde</Label>
                  <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Hasta</Label>
                  <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Historial de Transacciones
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredTransactions.length} resultado{filteredTransactions.length !== 1 ? 's' : ''})
              </span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refetch}>Actualizar</Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const clientName = tx.appointment_id ? appointmentClientMap[tx.appointment_id] || '—' : '—';
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div>{format(parseISO(tx.date), 'dd/MM/yyyy', { locale: es })}</div>
                          <div className="text-xs text-muted-foreground">{format(parseISO(tx.date), 'EEEE', { locale: es })}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            tx.type === 'income' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }>
                            {tx.type === 'income' ? (
                              <><ArrowUpCircle className="w-3 h-3 mr-1" /> Ingreso</>
                            ) : (
                              <><ArrowDownCircle className="w-3 h-3 mr-1" /> Gasto</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{tx.description}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{clientName}</TableCell>
                        <TableCell className={`text-right font-semibold ${
                          tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(tx.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {!loading && filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No hay transacciones {searchQuery || dateFilter !== 'all' || typeFilter !== 'all' ? 'que coincidan con los filtros' : 'registradas'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
