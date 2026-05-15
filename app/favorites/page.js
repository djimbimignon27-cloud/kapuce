'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Eye, Home, Car, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function FavoritesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchFavorites(token);
  }, []);

  const fetchFavorites = async (token) => {
    try {
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (listingId) => {
    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`/api/favorites/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setFavorites(favorites.filter(f => f.listing?._id !== listingId));
        toast({
          title: 'Favori supprimé',
          description: 'L\'annonce a été retirée de vos favoris',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
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
              <Link href="/dashboard">
                <Button variant="ghost">Mon compte</Button>
              </Link>
              <Link href="/listings">
                <Button variant="ghost">Annonces</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            Mes Favoris
          </h1>
          <p className="text-gray-600">
            {favorites.length} annonce{favorites.length > 1 ? 's' : ''} sauvegardée{favorites.length > 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun favori</h3>
              <p className="text-gray-600 mb-8">
                Vous n'avez pas encore ajouté d'annonces à vos favoris
              </p>
              <Link href="/listings">
                <Button className="bg-gradient-to-r from-kama-blue to-blue-600 text-white rounded-xl">
                  Explorer les annonces
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const listing = fav.listing;
              if (!listing) return null;
              
              return (
                <Card 
                  key={fav._id}
                  className="group border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={listing.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onClick={() => router.push(`/listings/${listing._id}`)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(listing._id);
                      }}
                      className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <Badge className="absolute top-3 left-3 bg-kama-gold/90 text-white border-0">
                      {listing.category === 'SALE' ? 'Vente' : 'Location'}
                    </Badge>
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat('fr-FR').format(listing.price)} FCFA
                      </p>
                    </div>
                  </div>
                  
                  <CardContent 
                    className="p-5"
                    onClick={() => router.push(`/listings/${listing._id}`)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-kama-blue/10 rounded-lg">
                        {getTypeIcon(listing.type)}
                      </div>
                      <span className="text-xs text-kama-blue font-semibold uppercase">
                        {listing.type === 'HOUSE' ? 'Immobilier' : listing.type === 'CAR' ? 'Véhicule' : 'Terrain'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-kama-blue transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1.5 text-kama-gold" />
                      <span className="truncate">{listing.city}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
