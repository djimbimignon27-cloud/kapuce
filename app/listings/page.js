'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Car, MapPin, Search, Filter, ArrowLeft, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function ListingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    city: '',
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const url = params.toString() ? `/api/listings/search?${params}` : '/api/listings';
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les annonces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchListings();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOUSE': return <Home className="w-4 h-4" />;
      case 'CAR': return <Car className="w-4 h-4" />;
      case 'LAND': return <MapPin className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster />
      
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-kama-gold rounded-full filter blur-3xl animate-pulse"></div>
        </div>
        <div className="relative container mx-auto px-4 py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:text-kama-gold hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Toutes les annonces</h1>
          <p className="text-blue-100 text-lg">Découvrez nos milliers d'offres vérifiées</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Filters */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-kama-blue/10 rounded-lg">
                <Filter className="w-5 h-5 text-kama-blue" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Filtres de recherche</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="h-12 border-gray-300 focus:border-kama-blue"
              />
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="HOUSE">Immobilier</SelectItem>
                  <SelectItem value="CAR">Véhicules</SelectItem>
                  <SelectItem value="LAND">Terrains</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="SALE">Vente</SelectItem>
                  <SelectItem value="RENT">Location</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="h-12 bg-gradient-to-r from-kama-blue to-blue-600 hover:from-kama-blue/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl">
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-kama-blue"></div>
            <p className="mt-4 text-gray-600 text-lg">Chargement des annonces...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-xl mb-6">Aucune annonce trouvée</p>
            <Link href="/listings/create">
              <Button className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90 shadow-lg">
                Publier une annonce
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Badge className="bg-kama-gold/10 text-kama-gold border-kama-gold text-base px-4 py-2">
                {listings.length} annonce(s) trouvée(s)
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing, index) => (
                <Card 
                  key={listing._id} 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-kama-gold overflow-hidden"
                  onClick={() => router.push(`/listings/${listing._id}`)}
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                    {listing.images && listing.images[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                        {getTypeIcon(listing.type)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Badge className="absolute top-3 right-3 bg-kama-gold shadow-lg">
                      {listing.category === 'SALE' ? 'Vente' : 'Location'}
                    </Badge>
                    {listing.verified && (
                      <Badge className="absolute top-3 left-3 bg-green-500 shadow-lg">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3 h-3" />
                      {listing.viewsCount || 0}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-kama-blue/10 rounded-lg">
                        {getTypeIcon(listing.type)}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {listing.type === 'HOUSE' ? 'Immobilier' : listing.type === 'CAR' ? 'Véhicule' : 'Terrain'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-kama-blue transition">
                      {listing.title}
                    </h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-kama-gold to-yellow-600 bg-clip-text text-transparent mb-3">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XAF',
                        maximumFractionDigits: 0,
                      }).format(listing.price)}
                    </p>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1 text-kama-gold" />
                      <span className="font-medium">{listing.city}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
