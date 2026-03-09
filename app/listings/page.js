'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Home, Car, MapPin, Search, Filter, ArrowLeft, CheckCircle, Eye, TrendingUp, 
  Sparkles, SlidersHorizontal, Grid3X3, List, X, ChevronDown, ChevronUp,
  Ruler, BedDouble, Bath, Calendar, Fuel, Settings, Trees
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
  'https://images.pexels.com/photos/17174768/pexels-photo-17174768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
];

// Options constantes
const CITIES = ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Lambaréné', 'Mouila'];
const CAR_BRANDS = [
  { value: 'TOYOTA', label: 'Toyota' },
  { value: 'NISSAN', label: 'Nissan' },
  { value: 'MERCEDES', label: 'Mercedes-Benz' },
  { value: 'BMW', label: 'BMW' },
  { value: 'HYUNDAI', label: 'Hyundai' },
  { value: 'KIA', label: 'Kia' },
  { value: 'FORD', label: 'Ford' },
  { value: 'PEUGEOT', label: 'Peugeot' },
  { value: 'RENAULT', label: 'Renault' },
  { value: 'OTHER', label: 'Autre' },
];
const FUEL_TYPES = [
  { value: 'GASOLINE', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'ELECTRIC', label: 'Électrique' },
];
const TRANSMISSIONS = [
  { value: 'MANUAL', label: 'Manuelle' },
  { value: 'AUTOMATIC', label: 'Automatique' },
];

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  
  // Filtres de base
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    city: searchParams.get('city') || 'all',
    minPrice: '',
    maxPrice: '',
    verified: false,
  });
  
  // Filtres avancés pour Terrains
  const [landFilters, setLandFilters] = useState({
    minSurface: '',
    maxSurface: '',
    topography: 'all',
    boundaryMarked: false,
  });
  
  // Filtres avancés pour Immobilier
  const [houseFilters, setHouseFilters] = useState({
    minSurface: '',
    maxSurface: '',
    minBedrooms: '',
    minBathrooms: '',
    furnished: 'all',
  });
  
  // Filtres avancés pour Véhicules
  const [carFilters, setCarFilters] = useState({
    brand: 'all',
    minYear: '',
    maxYear: '',
    maxMileage: '',
    fuel: 'all',
    transmission: 'all',
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    // Filtres de base
    if (filters.search) params.append('search', filters.search);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.verified) params.append('verified', 'true');
    
    // Filtres spécifiques selon le type
    if (filters.type === 'LAND') {
      if (landFilters.minSurface) params.append('minSurface', landFilters.minSurface);
      if (landFilters.maxSurface) params.append('maxSurface', landFilters.maxSurface);
      if (landFilters.topography && landFilters.topography !== 'all') params.append('topography', landFilters.topography);
      if (landFilters.boundaryMarked) params.append('boundaryMarked', 'true');
    }
    
    if (filters.type === 'HOUSE') {
      if (houseFilters.minSurface) params.append('minSurface', houseFilters.minSurface);
      if (houseFilters.maxSurface) params.append('maxSurface', houseFilters.maxSurface);
      if (houseFilters.minBedrooms) params.append('minBedrooms', houseFilters.minBedrooms);
      if (houseFilters.minBathrooms) params.append('minBathrooms', houseFilters.minBathrooms);
      if (houseFilters.furnished && houseFilters.furnished !== 'all') params.append('furnished', houseFilters.furnished);
    }
    
    if (filters.type === 'CAR') {
      if (carFilters.brand && carFilters.brand !== 'all') params.append('brand', carFilters.brand);
      if (carFilters.minYear) params.append('minYear', carFilters.minYear);
      if (carFilters.maxYear) params.append('maxYear', carFilters.maxYear);
      if (carFilters.maxMileage) params.append('maxMileage', carFilters.maxMileage);
      if (carFilters.fuel && carFilters.fuel !== 'all') params.append('fuel', carFilters.fuel);
      if (carFilters.transmission && carFilters.transmission !== 'all') params.append('transmission', carFilters.transmission);
    }
    
    return params;
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const url = params.toString() ? `/api/listings/search?${params}` : '/api/listings';
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setListings(data.listings || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
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
    fetchListings();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      city: 'all',
      minPrice: '',
      maxPrice: '',
      verified: false,
    });
    setLandFilters({
      minSurface: '',
      maxSurface: '',
      topography: 'all',
      boundaryMarked: false,
    });
    setHouseFilters({
      minSurface: '',
      maxSurface: '',
      minBedrooms: '',
      minBathrooms: '',
      furnished: 'all',
    });
    setCarFilters({
      brand: 'all',
      minYear: '',
      maxYear: '',
      maxMileage: '',
      fuel: 'all',
      transmission: 'all',
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOUSE': return <Home className="w-5 h-5" />;
      case 'CAR': return <Car className="w-5 h-5" />;
      case 'LAND': return <Trees className="w-5 h-5" />;
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

  const hasActiveFilters = () => {
    const baseActive = filters.search || filters.type !== 'all' || filters.category !== 'all' || 
                       filters.city !== 'all' || filters.minPrice || filters.maxPrice || filters.verified;
    
    if (filters.type === 'LAND') {
      return baseActive || landFilters.minSurface || landFilters.maxSurface || 
             landFilters.topography !== 'all' || landFilters.boundaryMarked;
    }
    if (filters.type === 'HOUSE') {
      return baseActive || houseFilters.minSurface || houseFilters.maxSurface || 
             houseFilters.minBedrooms || houseFilters.minBathrooms || houseFilters.furnished !== 'all';
    }
    if (filters.type === 'CAR') {
      return baseActive || carFilters.brand !== 'all' || carFilters.minYear || carFilters.maxYear || 
             carFilters.maxMileage || carFilters.fuel !== 'all' || carFilters.transmission !== 'all';
    }
    return baseActive;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster />
      
      {/* Header */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900 overflow-hidden">
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
              <h1 className="text-4xl md:text-5xl font-black text-white">Recherche avancée</h1>
              <p className="text-blue-100 text-lg mt-1">Trouvez exactement ce que vous cherchez</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & Filters Card */}
        <Card className="mb-8 shadow-xl border-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-kama-blue to-blue-600 rounded-xl shadow-lg">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Filtres de recherche</h2>
              </div>
              {hasActiveFilters() && (
                <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
            </div>
            
            {/* Filtres de base */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-12 h-12 border-gray-200 rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                    <span className="flex items-center gap-2"><Trees className="w-4 h-4" /> Terrains</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Transaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="SALE">🏷️ Vente</SelectItem>
                  <SelectItem value="RENT">🏠 Location</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.city} onValueChange={(value) => setFilters({ ...filters, city: value })}>
                <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleSearch} 
                className="h-12 bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg text-white font-bold rounded-xl"
              >
                <Search className="w-5 h-5 mr-2" />
                Rechercher
              </Button>
            </div>
            
            {/* Toggle Filtres avancés */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-kama-blue hover:text-kama-blue/80 font-medium text-sm"
            >
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvancedFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
            </button>
            
            {/* Filtres avancés */}
            {showAdvancedFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {/* Prix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">Prix min (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">Prix max (FCFA)</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <Checkbox
                        checked={filters.verified}
                        onCheckedChange={(checked) => setFilters({ ...filters, verified: checked })}
                      />
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Annonces vérifiées uniquement</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Filtres spécifiques TERRAIN */}
                {filters.type === 'LAND' && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                      <Trees className="w-5 h-5" />
                      Filtres Terrain
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Superficie min (m²)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={landFilters.minSurface}
                          onChange={(e) => setLandFilters({ ...landFilters, minSurface: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Superficie max (m²)</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={landFilters.maxSurface}
                          onChange={(e) => setLandFilters({ ...landFilters, maxSurface: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Topographie</Label>
                        <Select value={landFilters.topography} onValueChange={(value) => setLandFilters({ ...landFilters, topography: value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="FLAT">Plat</SelectItem>
                            <SelectItem value="SLOPED">En pente</SelectItem>
                            <SelectItem value="HILLY">Vallonné</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer w-full">
                          <Checkbox
                            checked={landFilters.boundaryMarked}
                            onCheckedChange={(checked) => setLandFilters({ ...landFilters, boundaryMarked: checked })}
                          />
                          <span className="text-sm font-medium">Terrain borné</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Filtres spécifiques IMMOBILIER */}
                {filters.type === 'HOUSE' && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Filtres Immobilier
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Surface min (m²)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={houseFilters.minSurface}
                          onChange={(e) => setHouseFilters({ ...houseFilters, minSurface: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Surface max (m²)</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={houseFilters.maxSurface}
                          onChange={(e) => setHouseFilters({ ...houseFilters, maxSurface: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-1">
                          <BedDouble className="w-4 h-4" /> Chambres min
                        </Label>
                        <Select value={houseFilters.minBedrooms || 'all'} onValueChange={(value) => setHouseFilters({ ...houseFilters, minBedrooms: value === 'all' ? '' : value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Toutes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                            <SelectItem value="5">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-1">
                          <Bath className="w-4 h-4" /> Salles de bain min
                        </Label>
                        <Select value={houseFilters.minBathrooms || 'all'} onValueChange={(value) => setHouseFilters({ ...houseFilters, minBathrooms: value === 'all' ? '' : value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Toutes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Meublé</Label>
                        <Select value={houseFilters.furnished} onValueChange={(value) => setHouseFilters({ ...houseFilters, furnished: value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="FURNISHED">Meublé</SelectItem>
                            <SelectItem value="SEMI_FURNISHED">Semi-meublé</SelectItem>
                            <SelectItem value="UNFURNISHED">Non meublé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Filtres spécifiques VÉHICULE */}
                {filters.type === 'CAR' && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Filtres Véhicule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Marque</Label>
                        <Select value={carFilters.brand} onValueChange={(value) => setCarFilters({ ...carFilters, brand: value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {CAR_BRANDS.map(brand => (
                              <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Année min
                        </Label>
                        <Input
                          type="number"
                          placeholder="2000"
                          value={carFilters.minYear}
                          onChange={(e) => setCarFilters({ ...carFilters, minYear: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Année max</Label>
                        <Input
                          type="number"
                          placeholder="2025"
                          value={carFilters.maxYear}
                          onChange={(e) => setCarFilters({ ...carFilters, maxYear: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block">Km max</Label>
                        <Input
                          type="number"
                          placeholder="200000"
                          value={carFilters.maxMileage}
                          onChange={(e) => setCarFilters({ ...carFilters, maxMileage: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-1">
                          <Fuel className="w-4 h-4" /> Carburant
                        </Label>
                        <Select value={carFilters.fuel} onValueChange={(value) => setCarFilters({ ...carFilters, fuel: value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            {FUEL_TYPES.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 mb-2 block flex items-center gap-1">
                          <Settings className="w-4 h-4" /> Transmission
                        </Label>
                        <Select value={carFilters.transmission} onValueChange={(value) => setCarFilters({ ...carFilters, transmission: value })}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {TRANSMISSIONS.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            {!loading && (
              <Badge className="bg-gradient-to-r from-kama-blue to-blue-600 text-white border-0 text-sm px-4 py-1.5 shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                {pagination.total || listings.length} annonce{(pagination.total || listings.length) > 1 ? 's' : ''} trouvée{(pagination.total || listings.length) > 1 ? 's' : ''}
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
              <div className="flex gap-4 justify-center">
                <Button onClick={resetFilters} variant="outline" className="px-6">
                  Réinitialiser les filtres
                </Button>
                <Link href="/listings/create">
                  <Button className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg text-white px-8">
                    Publier une annonce
                  </Button>
                </Link>
              </div>
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
                    src={listing.images?.[0]?.url || listing.images?.[0] || DEMO_IMAGES[index % DEMO_IMAGES.length]}
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
                      <p className="text-2xl font-bold text-kama-gold mb-3">
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
                  
                  {/* Détails spécifiques */}
                  {listing.type === 'HOUSE' && listing.propertyDetails && (
                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                      {listing.propertyDetails.surface && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3.5 h-3.5" />
                          {listing.propertyDetails.surface} m²
                        </span>
                      )}
                      {listing.propertyDetails.bedrooms && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          {listing.propertyDetails.bedrooms}
                        </span>
                      )}
                    </div>
                  )}
                  {listing.type === 'LAND' && listing.landDetails?.surface && (
                    <div className="flex items-center gap-1 mt-3 text-sm text-gray-500">
                      <Ruler className="w-3.5 h-3.5" />
                      {listing.landDetails.surface} m²
                    </div>
                  )}
                  {listing.type === 'CAR' && listing.vehicleDetails && (
                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                      {listing.vehicleDetails.brand && (
                        <span>{listing.vehicleDetails.brand}</span>
                      )}
                      {listing.vehicleDetails.year && (
                        <span>{listing.vehicleDetails.year}</span>
                      )}
                      {listing.vehicleDetails.mileage && (
                        <span>{listing.vehicleDetails.mileage.toLocaleString()} km</span>
                      )}
                    </div>
                  )}
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

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
