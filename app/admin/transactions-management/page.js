'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, DollarSign, Edit, Eye, Filter, RefreshCw,
  TrendingUp, Clock, CheckCircle, XCircle, User,
  Calendar, FileText, Percent, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState(7);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchTransactions(token);
  }, [filter]);

  const fetchTransactions = async (token) => {
    try {
      let url = '/api/admin/transactions';
      if (filter !== 'ALL') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('adminAccessToken')}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || {});
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setNewCommissionRate(transaction.commissionRate);
    setAdminNotes('');
    setEditDialogOpen(true);
  };

  const handleUpdateCommission = async () => {
    if (!selectedTransaction) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: selectedTransaction._id,
          action: 'update_commission',
          commissionRate: newCommissionRate,
          adminNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Commission mise à jour',
          description: `Nouveau taux: ${newCommissionRate}% - Commission: ${Math.round(selectedTransaction.amount * newCommissionRate / 100)} FCFA`,
        });
        setEditDialogOpen(false);
        fetchTransactions(token);
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de mettre à jour la commission',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      INITIATED: 'bg-blue-100 text-blue-700',
      PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      PROCESSING: 'bg-purple-100 text-purple-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-orange-100 text-orange-700',
      DISPUTED: 'bg-pink-100 text-pink-700',
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge>;
  };

  const calculateNewCommission = () => {
    if (!selectedTransaction) return { amount: 0, seller: 0 };
    const commissionAmount = Math.round(selectedTransaction.amount * newCommissionRate / 100);
    const sellerReceives = selectedTransaction.amount - commissionAmount;
    return { amount: commissionAmount, seller: sellerReceives };
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster />
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-kama-gold" />
                Gestion des Transactions
              </h1>
            </div>
            <Button onClick={() => fetchTransactions(localStorage.getItem('adminAccessToken'))} variant="ghost" className="text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Info Commission */}
        <Card className="bg-gradient-to-r from-kama-gold/10 to-yellow-900/10 border-kama-gold/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Percent className="w-5 h-5 text-kama-gold mt-0.5" />
              <div>
                <p className="text-yellow-100 font-semibold">Modification des Commissions par Transaction</p>
                <p className="text-yellow-300 text-sm">
                  Vous pouvez ajuster le taux de commission pour chaque transaction individuellement avant validation finale. 
                  Le taux par défaut est de 7% mais peut être modifié selon les négociations ou cas particuliers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {['ALL', 'INITIATED', 'PENDING_PAYMENT', 'PAID', 'COMPLETED', 'CANCELLED'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              size="sm"
              className={filter === status ? 'bg-kama-gold text-white' : 'border-gray-600 text-gray-400'}
            >
              {status === 'ALL' ? 'Toutes' : status}
            </Button>
          ))}
        </div>

        {/* Liste des transactions */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-16 text-center">
              <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucune transaction</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx._id} className="bg-gray-800 border-gray-700 hover:border-kama-gold/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(tx.status)}
                        <Badge variant="outline" className="border-gray-600 text-gray-400">
                          {tx.paymentMethod}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{tx.listing?.title || 'Annonce supprimée'}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Acheteur: {tx.buyer?.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Vendeur: {tx.seller?.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Montant Total</p>
                      <p className="text-lg font-black text-white">
                        {new Intl.NumberFormat('fr-FR').format(tx.amount)} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Taux Commission
                      </p>
                      <p className="text-lg font-black text-kama-gold">{tx.commissionRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Commission KAPUCE.G</p>
                      <p className="text-lg font-black text-kama-gold">
                        {new Intl.NumberFormat('fr-FR').format(tx.commissionAmount)} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vendeur Reçoit</p>
                      <p className="text-lg font-black text-green-400">
                        {new Intl.NumberFormat('fr-FR').format(tx.sellerReceives || (tx.amount - tx.commissionAmount))} FCFA
                      </p>
                    </div>
                  </div>

                  {tx.notes && (
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-400 mb-1">Notes Admin :</p>
                      <p className="text-sm text-blue-200">{tx.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => openEditDialog(tx)}
                      className="bg-kama-gold hover:bg-kama-gold/80 text-white gap-2"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier Commission
                    </Button>
                    {tx.adminModified && (
                      <Badge className="bg-purple-500/20 text-purple-400">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Modifié par admin
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog Modification Commission */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Percent className="w-5 h-5 text-kama-gold" />
              Modifier la Commission
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Ajustez le taux de commission pour cette transaction spécifique
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* Info Transaction */}
              <div className="p-4 bg-gray-900 rounded-xl space-y-2">
                <p className="text-sm text-gray-400">Transaction : <span className="text-white font-semibold">{selectedTransaction.listing?.title}</span></p>
                <p className="text-sm text-gray-400">Montant : <span className="text-2xl font-black text-white">{new Intl.NumberFormat('fr-FR').format(selectedTransaction.amount)} FCFA</span></p>
              </div>

              {/* Slider Commission */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center justify-between">
                  <span>Nouveau Taux de Commission</span>
                  <span className="text-2xl font-black text-kama-gold">{newCommissionRate}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-kama-gold"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Calcul en temps réel */}
              <div className="p-4 bg-gradient-to-r from-kama-gold/10 to-yellow-900/10 border border-kama-gold/30 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Commission KAPUCE.G :</span>
                  <span className="text-lg font-bold text-kama-gold">
                    {new Intl.NumberFormat('fr-FR').format(calculateNewCommission().amount)} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Vendeur Recevra :</span>
                  <span className="text-lg font-bold text-green-400">
                    {new Intl.NumberFormat('fr-FR').format(calculateNewCommission().seller)} FCFA
                  </span>
                </div>
              </div>

              {/* Notes Admin */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (Raison de la modification)
                </label>
                <Textarea
                  placeholder="Ex: Négociation spéciale, client fidèle, promotion..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="border-gray-600 text-gray-400"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateCommission}
              disabled={processing}
              className="bg-kama-gold hover:bg-kama-gold/80 text-white"
            >
              {processing ? 'Mise à jour...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
