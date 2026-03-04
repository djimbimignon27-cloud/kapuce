'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Car, MapPin, Search, Filter, ArrowLeft } from 'lucide-react';
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
    minPrice: '',
    maxPrice: '',
    verified: false,
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
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <div className="bg-kama-blue text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:text-kama-gold mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Toutes les annonces</h1>
          <p className="text-gray-200 mt-2">Découvrez nos offres vérifiées</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filtres */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-kama-blue" />
              <h2 className="text-lg font-semibold">Filtres de recherche</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
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
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="SALE">Vente</SelectItem>
                  <SelectItem value="RENT">Location</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="bg-kama-blue hover:bg-kama-blue/90">
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kama-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucune annonce trouvée</p>
            <Link href="/listings/create">
              <Button className="mt-4 bg-kama-gold hover:bg-kama-gold/90">
                Publier une annonce
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              {listings.length} annonce(s) trouvée(s)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Card 
                  key={listing._id} 
                  className="hover:shadow-lg transition cursor-pointer"
                  onClick={() => router.push(`/listings/${listing._id}`)}
                >
                  <div className="aspect-video bg-gray-200 relative">
                    {listing.images && listing.images[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {getTypeIcon(listing.type)}
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-kama-gold">
                      {listing.category === 'SALE' ? 'Vente' : 'Location'}
                    </Badge>
                    {listing.verified && (
                      <Badge className="absolute top-2 left-2 bg-green-500">
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(listing.type)}
                      <span className="text-xs text-gray-500">
                        {listing.type === 'HOUSE' ? 'Immobilier' : listing.type === 'CAR' ? 'Véhicule' : 'Terrain'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{listing.title}</h3>
                    <p className="text-2xl font-bold text-kama-blue mb-2">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XAF',
                        maximumFractionDigits: 0,
                      }).format(listing.price)}
                    </p>
                    <div className="flex items-center text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.city}
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
