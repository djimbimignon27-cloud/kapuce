'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, Calendar, 
  User, MapPin, Home, MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function VisitRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [visitRequests, setVisitRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchVisitRequests(token);
  }, []);

  const fetchVisitRequests = async (token) => {
    try {
      const response = await fetch('/api/visit-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisitRequests(data.visitRequests || []);
      } else if (response.status === 401) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (visitRequestId, action) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    setProcessingId(visitRequestId);

    try {
      const response = await fetch('/api/visit-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitRequestId,
          action,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Succès',
          description: data.message,
        });
        // Recharger les demandes
        fetchVisitRequests(token);
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Une erreur est survenue',
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
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Acceptée</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Refusée</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="w-3 h-3 mr-1" />Complétée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Demandes de visite
          </h1>
          <p className="text-gray-600">
            Gérez les demandes de visite pour vos annonces
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : visitRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune demande</h3>
              <p className="text-gray-600">Vous n'avez pas encore reçu de demandes de visite</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visitRequests.map((request) => (
              <Card key={request._id} className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Home className="w-5 h-5 text-kama-blue" />
                        <h3 className="font-bold text-lg text-gray-900">
                          {request.listingId?.title || 'Annonce supprimée'}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      {request.listingId && (
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{request.listingId.city}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <User className="w-4 h-4" />
                        <span>
                          Demandeur: {request.requesterId?.fullName || 'Utilisateur inconnu'}
                        </span>
                      </div>

                      {request.message && (
                        <div className="p-3 bg-gray-50 rounded-lg mb-3">
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        Reçue le {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="ml-6 space-y-2">
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handleAction(request._id, 'ACCEPT')}
                            disabled={processingId === request._id}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {processingId === request._id ? 'En cours...' : 'Accepter'}
                          </Button>
                          <Button
                            onClick={() => handleAction(request._id, 'REJECT')}
                            disabled={processingId === request._id}
                            variant="outline"
                            className="w-full border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {processingId === request._id ? 'En cours...' : 'Refuser'}
                          </Button>
                        </>
                      )}
                      
                      {request.status === 'ACCEPTED' && (
                        <Link href={`/messages?conversation=${request.conversationId || ''}`}>
                          <Button className="w-full bg-kama-blue hover:bg-kama-blue/90">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Discuter
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
