'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Car, MapPin, Search, Filter, ArrowLeft, CheckCircle, Eye, TrendingUp, Sparkles, SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
  'https://images.pexels.com/photos/17174768/pexels-photo-17174768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
];

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    city: searchParams.get('city') || '',
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value.toString());
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
      case 'HOUSE': return <Home className="w-5 h-5" />;
      case 'CAR': return <Car className="w-5 h-5" />;
      case 'LAND': return <MapPin className="w-5 h-5" />;
      default: return <Home className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'HOUSE': return 'Immobilier';
      case 'CAR': return 'Véhicule';
      case 'LAND': return 'Terrain';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster />
      
      {/* Header */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <TrendingUp className="w-8 h-8 text-kama-gold" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Toutes les annonces</h1>
              <p className="text-blue-100 text-lg mt-1">Découvrez des milliers d'opportunités vérifiées</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <Card className="mb-8 shadow-xl border-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-kama-blue to-blue-600 rounded-xl shadow-lg">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Filtrer les résultats</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-12 h-12 border-gray-200 rounded-xl focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20"
                />
              </div>
              
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Type de bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="HOUSE">
                    <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Immobilier</span>
                  </SelectItem>
                  <SelectItem value="CAR">
                    <span className="flex items-center gap-2"><Car className="w-4 h-4" /> Véhicules</span>
                  </SelectItem>
                  <SelectItem value="LAND">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Terrains</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="SALE">🏷️ Vente</SelectItem>
                  <SelectItem value="RENT">🏠 Location</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleSearch} 
                className="h-12 bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/30 text-white font-bold rounded-xl transition-all"
              >
                <Search className="w-5 h-5 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            {!loading && (
              <Badge className="bg-gradient-to-r from-kama-blue to-blue-600 text-white border-0 text-sm px-4 py-1.5 shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                {listings.length} annonce{listings.length > 1 ? 's' : ''} trouvée{listings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Affichage:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
              <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-kama-gold" />
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Recherche en cours...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card className="text-center py-20 shadow-lg border-0 rounded-2xl">
            <CardContent>
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune annonce trouvée</h3>
              <p className="text-gray-600 mb-8">Essayez de modifier vos critères de recherche</p>
              <Link href="/listings/create">
                <Button className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg text-white px-8">
                  Publier une annonce
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {listings.map((listing, index) => (
              <Card 
                key={listing._id} 
                className={`group bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg rounded-2xl overflow-hidden ${
                  viewMode === 'list' ? 'flex flex-row' : ''
                }`}
                onClick={() => router.push(`/listings/${listing._id}`)}
              >
                <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-64 flex-shrink-0' : 'aspect-[4/3]'}`}>
                  <img
                    src={listing.images?.[0] || DEMO_IMAGES[index % DEMO_IMAGES.length]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {listing.verified && (
                      <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  
                  <Badge className="absolute top-3 right-3 bg-kama-gold/90 backdrop-blur-sm text-white border-0">
                    {listing.category === 'SALE' ? 'Vente' : 'Location'}
                  </Badge>
                  
                  {viewMode === 'grid' && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-2xl font-bold text-white drop-shadow-lg">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XAF',
                          maximumFractionDigits: 0,
                        }).format(listing.price)}
                      </p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 text-white text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    {listing.viewsCount || 0}
                  </div>
                </div>
                
                <CardContent className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-kama-blue/10 rounded-lg">
                      {getTypeIcon(listing.type)}
                    </div>
                    <span className="text-xs text-kama-blue font-semibold uppercase">
                      {getTypeLabel(listing.type)}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-kama-blue transition-colors">
                    {listing.title}
                  </h3>
                  
                  {viewMode === 'list' && (
                    <>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                      <p className="text-2xl font-bold text-gradient-gold mb-3">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XAF',
                          maximumFractionDigits: 0,
                        }).format(listing.price)}
                        {listing.category === 'RENT' && <span className="text-sm font-normal text-gray-500">/mois</span>}
                      </p>
                    </>
                  )}
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 mr-1.5 text-kama-gold" />
                    <span className="truncate">{listing.city}</span>
                  </div>
                </CardContent>
                
                <div className="h-1 bg-gradient-to-r from-kama-blue via-kama-gold to-kama-blue transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}