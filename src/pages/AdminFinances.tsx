import { useState } from 'react';
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
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminFinances() {
  const { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    totalIncome, 
    totalExpenses, 
    netProfit,
    refetch 
  } = useTransactions();
  const { appointments } = useAppointments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // Calculate appointment-based income (paid appointments)
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
      setForm({
        type: 'income',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    } else {
      toast.error('Error al registrar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    
    const result = await deleteTransaction(id);
    if (result.success) {
      toast.success('Transacción eliminada');
    }
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
                  <Select 
                    value={form.type} 
                    onValueChange={(v) => setForm({ ...form, type: v as 'income' | 'expense' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        <span className="flex items-center gap-2">
                          <ArrowUpCircle className="w-4 h-4 text-green-500" />
                          Ingreso
                        </span>
                      </SelectItem>
                      <SelectItem value="expense">
                        <span className="flex items-center gap-2">
                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                          Gasto
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Monto ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ej: Pago de servicio, Compra de esmaltes..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full accent-gradient border-0">
                  Registrar Transacción
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ingresos Registrados</span>
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
                <span className="text-sm text-muted-foreground">Gastos Totales</span>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className={netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}>
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

        {/* Transactions Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Historial de Transacciones</CardTitle>
            <Button variant="outline" size="sm" onClick={refetch}>
              Actualizar
            </Button>
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
                    <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {format(parseISO(tx.date), 'dd/MM/yy', { locale: es })}
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
                      <TableCell className="hidden sm:table-cell text-sm">{tx.description}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(tx.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && transactions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No hay transacciones registradas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
