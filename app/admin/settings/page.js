'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Percent, Save, TrendingUp, Users, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientRate, setClientRate] = useState(7);
  const [ownerRate, setOwnerRate] = useState(7);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientRate(data.settings.commissionRates.client);
        setOwnerRate(data.settings.commissionRates.owner);
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (clientRate < 0 || clientRate > 50 || ownerRate < 0 || ownerRate > 50) {
      toast({
        title: 'Erreur',
        description: 'Les taux doivent être entre 0% et 50%',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          commissionRates: {
            client: parseFloat(clientRate),
            owner: parseFloat(ownerRate),
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Paramètres sauvegardés',
          description: 'Les nouveaux taux de commission sont actifs',
        });
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de sauvegarder',
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
      setSaving(false);
    }
  };

  const calculateExample = () => {
    const price = 100000;
    const clientCommission = Math.round(price * (clientRate / 100));
    const ownerCommission = Math.round(price * (ownerRate / 100));
    const clientPays = price + clientCommission;
    const ownerReceives = price - ownerCommission;
    const kapuceTotal = clientCommission + ownerCommission;

    return {
      price,
      clientCommission,
      ownerCommission,
      clientPays,
      ownerReceives,
      kapuceTotal,
    };
  };

  const example = calculateExample();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster />
      
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
                <Percent className="w-5 h-5 text-kama-gold" />
                Paramètres de Commission
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-gradient-to-br from-kama-gold/10 to-yellow-900/10 border-kama-gold/30 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-6 h-6 text-kama-gold mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Taux de Commission Globaux</h3>
                <p className="text-gray-300 text-sm">
                  Ces taux s'appliquent à toutes les nouvelles transactions. 
                  KAPUCE.G prélève une commission chez le client ET chez le propriétaire.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Commission Client */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Commission Client
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Taux (%) ajouté au prix pour le client
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={clientRate}
                  onChange={(e) => setClientRate(e.target.value)}
                  className="h-16 text-3xl font-bold text-center bg-gray-900 border-gray-700 text-white pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-kama-gold">%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={clientRate}
                onChange={(e) => setClientRate(e.target.value)}
                className="w-full mt-4 accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </CardContent>
          </Card>

          {/* Commission Propriétaire */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700">
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="w-5 h-5" />
                Commission Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Taux (%) prélevé sur le montant du propriétaire
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={ownerRate}
                  onChange={(e) => setOwnerRate(e.target.value)}
                  className="h-16 text-3xl font-bold text-center bg-gray-900 border-gray-700 text-white pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-kama-gold">%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={ownerRate}
                onChange={(e) => setOwnerRate(e.target.value)}
                className="w-full mt-4 accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exemple de Calcul */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Exemple de Calcul (Prix annonce: 100,000 FCFA)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <p className="text-xs text-blue-400 mb-2">Commission Client ({clientRate}%)</p>
                <p className="text-2xl font-black text-blue-300">
                  {new Intl.NumberFormat('fr-FR').format(example.clientCommission)} FCFA
                </p>
              </div>
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                <p className="text-xs text-green-400 mb-2">Commission Propriétaire ({ownerRate}%)</p>
                <p className="text-2xl font-black text-green-300">
                  {new Intl.NumberFormat('fr-FR').format(example.ownerCommission)} FCFA
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-kama-gold/20 to-yellow-900/20 border border-kama-gold/30 rounded-xl">
                <p className="text-xs text-kama-gold mb-2">Total KAPUCE.G</p>
                <p className="text-2xl font-black text-kama-gold">
                  {new Intl.NumberFormat('fr-FR').format(example.kapuceTotal)} FCFA
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gray-900 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Prix annonce</span>
                <span className="text-white font-bold">{new Intl.NumberFormat('fr-FR').format(example.price)} FCFA</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                <span className="text-blue-300">Client paie</span>
                <span className="text-blue-300 font-black text-xl">{new Intl.NumberFormat('fr-FR').format(example.clientPays)} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-300">Propriétaire reçoit</span>
                <span className="text-green-300 font-black text-xl">{new Intl.NumberFormat('fr-FR').format(example.ownerReceives)} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90 text-white font-bold text-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}
        </Button>
      </main>
    </div>
  );
}
