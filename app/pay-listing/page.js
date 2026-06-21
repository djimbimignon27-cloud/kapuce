'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Smartphone, Copy, CheckCircle, AlertCircle,
  Shield, Phone, Info, Upload, DollarSign, Clock, Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function PayListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('AIRTEL_MONEY');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const listingId = searchParams.get('listingId');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    
    if (listingId) {
      fetchListing();
    } else {
      router.push('/listings');
    }
  }, [listingId]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${listingId}`);
      const data = await response.json();
      if (response.ok) {
        setListing(data.listing);
      } else {
        toast({
          title: 'Erreur',
          description: 'Annonce non trouvée',
          variant: 'destructive',
        });
        router.push('/listings');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Copié !',
      description: `${label} copié dans le presse-papier`,
    });
  };

  const handleSubmitPayment = async () => {
    if (!paymentReference.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer la référence de paiement',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing._id,
          amount: listing.price,
          paymentMethod,
          paymentReference,
          paymentProof,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Paiement enregistré',
          description: 'Votre paiement est en cours de validation (24-48h)',
        });
        setTimeout(() => {
          router.push('/dashboard?tab=transactions');
        }, 2000);
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible d\'enregistrer le paiement',
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
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!listing) return null;

  const commission = Math.round(listing.price * 0.07);
  const ownerReceives = listing.price - commission;

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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link href={`/listings/${listing._id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'annonce
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
                    Paiement Sécurisé via KAPUCE.G
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-2">
                    ✅ Vous avez visité le bien et il vous plaît ? Effectuez le paiement à KAPUCE.G.
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    🔒 KAPUCE.G prélève sa commission (7%) et envoie le reste au propriétaire sous 24h.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annonce Info */}
          <Card className="mb-6">
            <CardHeader className="bg-gradient-to-r from-kama-blue to-blue-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <Home className="w-6 h-6" />
                Bien à {listing.category === 'SALE' ? 'Acheter' : 'Louer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">{listing.title}</h2>
              <p className="text-gray-600 mb-4">{listing.address}, {listing.city}</p>
              
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Montant Total</p>
                  <p className="text-2xl font-black text-gray-900">
                    {new Intl.NumberFormat('fr-FR').format(listing.price)} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Commission KAPUCE.G (7%)</p>
                  <p className="text-xl font-bold text-kama-gold">
                    {new Intl.NumberFormat('fr-FR').format(commission)} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Propriétaire Reçoit</p>
                  <p className="text-xl font-bold text-green-600">
                    {new Intl.NumberFormat('fr-FR').format(ownerReceives)} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comptes Mobile Money */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Airtel Money */}
            <Card 
              className={`border-2 cursor-pointer transition-all ${
                paymentMethod === 'AIRTEL_MONEY' 
                  ? 'border-red-500 shadow-xl' 
                  : 'border-red-200 hover:border-red-400'
              }`}
              onClick={() => setPaymentMethod('AIRTEL_MONEY')}
            >
              <CardHeader className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Airtel Money</p>
                    <p className="text-red-100 text-sm font-normal">KAPUCE.G Officiel</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard('077347262', 'Numéro Airtel Money');
                    }}
                    className="text-kama-gold hover:text-kama-gold"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Moov Money */}
            <Card 
              className={`border-2 cursor-pointer transition-all ${
                paymentMethod === 'MOOV_MONEY' 
                  ? 'border-blue-500 shadow-xl' 
                  : 'border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setPaymentMethod('MOOV_MONEY')}
            >
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Moov Money</p>
                    <p className="text-blue-100 text-sm font-normal">KAPUCE.G Officiel</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard('065216069', 'Numéro Moov Money');
                    }}
                    className="text-kama-gold hover:text-kama-gold"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-kama-gold" />
                Confirmer le Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Référence de Transaction (Code reçu par SMS) *
                </label>
                <Input
                  placeholder="Ex: TXN123456789"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Commentaire (optionnel)
                </label>
                <Textarea
                  placeholder="Informations supplémentaires..."
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-900 flex items-start gap-2">
                  <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Validation sous 24-48h :</strong> Notre équipe vérifiera votre paiement. 
                    Le propriétaire recevra son argent sous 24h après validation.
                  </span>
                </p>
              </div>

              <Button
                onClick={handleSubmitPayment}
                disabled={submitting || !paymentReference.trim()}
                className="w-full h-14 bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90 text-white font-bold text-lg"
              >
                {submitting ? 'Envoi en cours...' : 'Confirmer le Paiement'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
