'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit, LogOut, 
  FileText, Heart, Eye, Settings, ChevronRight, 
  PlusCircle, Home, Car, Shield, Bell, TrendingUp,
  CheckCircle, Clock, XCircle, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchUserListings(token);
  }, []);

  const fetchUserListings = async (token) => {
    try {
      const response = await fetch('/api/listings/my-listings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
        
        // Calculate stats
        const total = data.listings?.length || 0;
        const active = data.listings?.filter(l => l.status === 'ACTIVE').length || 0;
        const pending = data.listings?.filter(l => l.status === 'PENDING').length || 0;
        const rejected = data.listings?.filter(l => l.status === 'REJECTED').length || 0;
        setStats({ total, active, pending, rejected });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toast({
      title: 'Déconnexion réussie',
      description: 'À bientôt sur KAPUCE.G!',
    });
    router.push('/');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOUSE': return <Home className="w-4 h-4" />;
      case 'CAR': return <Car className="w-4 h-4" />;
      case 'LAND': return <MapPin className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  if (!user) return null;

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
            
            <div className="flex items-center gap-4">
              <Link href="/listings">
                <Button variant="ghost">Annonces</Button>
              </Link>
              <Link href="/favorites">
                <Button variant="ghost" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="text-red-500">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Bienvenue, {user.fullName}! 👋
          </h1>
          <p className="text-gray-600">
            Gérez vos annonces et votre profil depuis votre tableau de bord
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-kama-blue to-blue-600"></div>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="flex flex-col items-center -mt-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-kama-gold to-yellow-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white font-black text-3xl">
                      {user.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">{user.fullName}</h2>
                  <Badge className="mt-2 bg-kama-blue/10 text-kama-blue border-kama-blue/20">
                    {user.role === 'OWNER' ? 'Propriétaire' : user.role === 'AGENCY' ? 'Agence' : 'Utilisateur'}
                  </Badge>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4 text-kama-gold" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4 text-kama-gold" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="w-4 h-4 text-kama-gold" />
                    <span className="text-sm">
                      Membre depuis {new Date(user.createdAt || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <Link href="/dashboard/profile">
                  <Button className="w-full mt-6 bg-gradient-to-r from-kama-blue to-blue-600 text-white rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/listings/create" className="block">
                  <Button className="w-full justify-start bg-gradient-to-r from-kama-gold to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all">
                    <PlusCircle className="w-5 h-5 mr-3" />
                    Publier une annonce
                  </Button>
                </Link>
                <Link href="/favorites" className="block">
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <Heart className="w-5 h-5 mr-3 text-red-500" />
                    Mes favoris
                  </Button>
                </Link>
                <Link href="/dashboard/settings" className="block">
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <Settings className="w-5 h-5 mr-3" />
                    Paramètres
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Listings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total annonces</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stats.active}</p>
                  <p className="text-sm text-gray-500">Actives</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stats.pending}</p>
                  <p className="text-sm text-gray-500">En attente</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stats.rejected}</p>
                  <p className="text-sm text-gray-500">Rejetées</p>
                </CardContent>
              </Card>
            </div>

            {/* My Listings */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">Mes annonces</CardTitle>
                <Link href="/listings/create">
                  <Button size="sm" className="bg-kama-gold text-white rounded-lg">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Nouvelle
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aucune annonce</h3>
                    <p className="text-gray-500 mb-6">Vous n'avez pas encore publié d'annonce</p>
                    <Link href="/listings/create">
                      <Button className="bg-gradient-to-r from-kama-gold to-yellow-500 text-white rounded-xl">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Publier ma première annonce
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.slice(0, 5).map((listing) => (
                      <div 
                        key={listing._id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/listings/${listing._id}`)}
                      >
                        <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getTypeIcon(listing.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(listing.status)}
                          </div>
                          <h4 className="font-bold text-gray-900 truncate">{listing.title}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-kama-gold">
                            {new Intl.NumberFormat('fr-FR').format(listing.price)} FCFA
                          </p>
                          <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.viewsCount || 0} vues
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                    
                    {listings.length > 5 && (
                      <Button variant="outline" className="w-full rounded-xl">
                        Voir toutes mes annonces ({listings.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
