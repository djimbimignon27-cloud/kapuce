'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, AlertTriangle, Shield, Eye, Ban, CheckCircle,
  MessageCircle, Search, Filter, User, Clock, XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function AdminAlertsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchAlerts(token);
  }, [filter]);

  const fetchAlerts = async (token) => {
    try {
      const response = await fetch(`/api/admin/alerts?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('adminAccessToken')}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setStats(data.stats || {});
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (alertId, action) => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ alertId, action }),
      });

      if (response.ok) {
        toast({
          title: '✅ Action effectuée',
          description: action === 'block_user' ? 'Utilisateur bloqué' : 'Alerte traitée',
        });
        fetchAlerts(token);
        setSelectedAlert(null);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Action impossible',
        variant: 'destructive',
      });
    }
  };

  const getTypeBadge = (type) => {
    const types = {
      PHONE_NUMBER: { label: 'Numéro de téléphone', color: 'bg-red-500' },
      EMAIL: { label: 'Email', color: 'bg-orange-500' },
      WHATSAPP: { label: 'WhatsApp/Telegram', color: 'bg-green-500' },
      EXTERNAL_PAYMENT: { label: 'Paiement externe', color: 'bg-purple-500' },
      MEET_OUTSIDE: { label: 'Rencontre externe', color: 'bg-blue-500' },
      OTHER: { label: 'Autre', color: 'bg-gray-500' },
    };
    const t = types[type] || types.OTHER;
    return <Badge className={`${t.color} text-white`}>{t.label}</Badge>;
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      LOW: 'bg-green-100 text-green-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      HIGH: 'bg-orange-100 text-orange-700',
      CRITICAL: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[severity] || colors.LOW}>{severity}</Badge>;
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
                  Retour
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alertes Anti-Fraude
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-yellow-500">{stats.PENDING || 0}</p>
              <p className="text-sm text-gray-400">En attente</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-blue-500">{stats.REVIEWED || 0}</p>
              <p className="text-sm text-gray-400">Examinées</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-green-500">{stats.DISMISSED || 0}</p>
              <p className="text-sm text-gray-400">Rejetées</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-red-500">{stats.ACTION_TAKEN || 0}</p>
              <p className="text-sm text-gray-400">Actions prises</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className={filter === status ? 'bg-kama-gold text-white' : 'border-gray-600 text-gray-400'}
            >
              {status === 'PENDING' ? 'En attente' : 
               status === 'REVIEWED' ? 'Examinées' :
               status === 'DISMISSED' ? 'Rejetées' : 'Actions prises'}
            </Button>
          ))}
        </div>

        {/* Liste des alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Liste */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
              </div>
            ) : alerts.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Aucune alerte {filter === 'PENDING' ? 'en attente' : ''}</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card 
                  key={alert._id}
                  className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-kama-gold ${
                    selectedAlert?._id === alert._id ? 'border-kama-gold' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(alert.type)}
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-white font-semibold">{alert.user?.fullName}</span>
                      {alert.user?.isBanned && (
                        <Badge className="bg-red-500/20 text-red-400">Bloqué</Badge>
                      )}
                      {alert.user?.fraudRiskLevel && alert.user.fraudRiskLevel !== 'NONE' && (
                        <Badge className="bg-orange-500/20 text-orange-400">
                          Risque: {alert.user.fraudRiskLevel}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm line-clamp-2 bg-gray-900 p-2 rounded">
                      "{alert.originalContent}"
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Détail */}
          {selectedAlert && (
            <Card className="bg-gray-800 border-gray-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Détail de l'alerte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Utilisateur</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-10 h-10 bg-kama-gold rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{selectedAlert.user?.fullName?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{selectedAlert.user?.fullName}</p>
                      <p className="text-gray-400 text-sm">{selectedAlert.user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {selectedAlert.user?.fraudAlertCount || 0} alertes
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Contenu original</p>
                  <div className="mt-1 p-3 bg-gray-900 rounded-lg">
                    <p className="text-white">{selectedAlert.originalContent}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Pattern détecté</p>
                  <p className="text-orange-400 mt-1">{selectedAlert.detectedPattern}</p>
                </div>

                {selectedAlert.status === 'PENDING' && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleAction(selectedAlert._id, 'dismiss')}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-400"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button 
                      onClick={() => handleAction(selectedAlert._id, 'review')}
                      className="flex-1 bg-blue-600 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Marquer vu
                    </Button>
                    <Button 
                      onClick={() => handleAction(selectedAlert._id, 'block_user')}
                      className="flex-1 bg-red-600 text-white"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Bloquer
                    </Button>
                  </div>
                )}

                <Link href={`/admin/messages?conversation=${selectedAlert.conversationId}`}>
                  <Button variant="outline" className="w-full mt-2 border-gray-600 text-gray-400">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Voir la conversation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
