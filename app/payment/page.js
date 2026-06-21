'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Smartphone, Copy, CheckCircle, AlertCircle,
  Shield, CreditCard, Info, Phone, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
    
    // Récupérer les détails de la transaction depuis l'URL si disponible
    const params = new URLSearchParams(window.location.search);
    const txId = params.get('transaction');
    if (txId) {
      // TODO: Fetch transaction details
    }
  }, []);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Copié !',
      description: `${label} copié dans le presse-papier`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 bg-gradient-to-br from-kama-blue to-blue-700 rounded-xl">
                <span className="text-white font-black text-sm">K.G</span>
              </div>
              <span className="font-bold text-xl text-kama-blue">KAPUCE.G</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Mon compte</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Info Sécurité */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Paiement Sécurisé via Mobile Money
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    KAPUCE.G utilise le système de séquestre (escrow) pour sécuriser vos transactions. 
                    Votre argent est conservé en sécurité jusqu'à la validation de la transaction par les deux parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Effectuer un Paiement
            </h1>
            <p className="text-gray-600">
              Utilisez l'un de nos comptes Mobile Money officiels
            </p>
          </div>

          {/* Comptes Mobile Money */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Airtel Money */}
            <Card className="border-2 border-red-200 hover:border-red-400 hover:shadow-xl transition-all">
              <CardHeader className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Airtel Money</p>
                    <p className="text-red-100 text-sm font-normal">Compte Officiel KAPUCE.G</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Numéro de téléphone :</p>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-2xl font-black text-gray-900 tracking-wider">
                          077 347 262
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('077347262', 'Numéro Airtel Money')}
                        className="text-kama-gold hover:text-kama-gold"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800 font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Instructions
                    </p>
                    <ol className="text-sm text-red-700 space-y-1 ml-6 list-decimal">
                      <li>Composez *555# sur votre téléphone Airtel</li>
                      <li>Choisissez "Transfert d'argent"</li>
                      <li>Entrez le numéro: <strong>077347262</strong></li>
                      <li>Entrez le montant exact de votre transaction</li>
                      <li>Confirmez avec votre code PIN</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Moov Money */}
            <Card className="border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all">
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Moov Money</p>
                    <p className="text-blue-100 text-sm font-normal">Compte Officiel KAPUCE.G</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Numéro de téléphone :</p>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="text-2xl font-black text-gray-900 tracking-wider">
                          065 216 069
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('065216069', 'Numéro Moov Money')}
                        className="text-kama-gold hover:text-kama-gold"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800 font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Instructions
                    </p>
                    <ol className="text-sm text-blue-700 space-y-1 ml-6 list-decimal">
                      <li>Composez *555# sur votre téléphone Moov</li>
                      <li>Choisissez "Transfert d'argent"</li>
                      <li>Entrez le numéro: <strong>065216069</strong></li>
                      <li>Entrez le montant exact de votre transaction</li>
                      <li>Confirmez avec votre code PIN</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Après le paiement */}
          <Card className="bg-gradient-to-br from-kama-gold/10 to-yellow-50 border-kama-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CheckCircle className="w-6 h-6 text-kama-gold" />
                Après avoir effectué le paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-kama-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Conservez votre reçu de transaction</p>
                  <p className="text-sm text-gray-600">
                    Vous recevrez un SMS de confirmation de la part d'Airtel ou Moov Money
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-kama-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Notifiez le vendeur</p>
                  <p className="text-sm text-gray-600">
                    Utilisez la messagerie KAPUCE.G pour informer le vendeur que le paiement est effectué
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-kama-gold text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Validation de la transaction</p>
                  <p className="text-sm text-gray-600">
                    Un administrateur validera le paiement sous 24h. Vous recevrez une notification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-kama-blue" />
                <div>
                  <p className="font-semibold text-gray-900">Besoin d'aide ?</p>
                  <p className="text-sm text-gray-600">
                    Contactez notre support si vous rencontrez un problème avec votre paiement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
