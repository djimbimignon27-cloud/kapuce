'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Home, Car, MapPin, Heart, User, LogOut, PlusCircle, Shield, Menu, X, TrendingUp, CheckCircle, Star, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings');
      const data = await response.json();
      if (response.ok) {
        setListings(data.listings || []);
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
    setUser(null);
    toast({
      title: 'Déconnexion réussie',
      description: 'À bientôt!',
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedType !== 'all') params.append('type', selectedType);
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedCity) params.append('city', selectedCity);
    router.push(`/listings?${params.toString()}`);
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
      
      {/* Enhanced Navbar with Glass Effect */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo avec image */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img 
                  src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                  alt="KAMA Logo" 
                  className="h-12 w-auto transition-transform group-hover:scale-105"
                />
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/listings" className="text-gray-700 hover:text-kama-gold transition-all font-medium relative group">
                Annonces
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-kama-gold transition-all group-hover:w-full"></span>
              </Link>
              {user ? (
                <>
                  <Link href="/listings/create">
                    <Button className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90 text-white shadow-lg hover:shadow-xl transition-all">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Publier
                    </Button>
                  </Link>
                  <Link href="/favorites" className="text-gray-700 hover:text-red-500 transition">
                    <Heart className="w-6 h-6" />
                  </Link>
                  <Link href="/dashboard" className="text-gray-700 hover:text-kama-blue transition">
                    <User className="w-6 h-6" />
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin">
                      <Badge className="bg-kama-gold hover:bg-kama-gold/90 cursor-pointer">
                        Admin
                      </Badge>
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-700 hover:text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="text-gray-700 hover:text-kama-blue">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="bg-gradient-to-r from-kama-blue to-blue-600 hover:from-kama-blue/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all">
                      Inscription
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-gray-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 animate-in slide-in-from-top">
              <Link href="/listings" className="block py-2 text-gray-700 hover:text-kama-gold transition">
                Annonces
              </Link>
              {user ? (
                <>
                  <Link href="/listings/create" className="block py-2 text-gray-700 hover:text-kama-gold transition">
                    Publier une annonce
                  </Link>
                  <Link href="/favorites" className="block py-2 text-gray-700 hover:text-kama-gold transition">
                    Mes favoris
                  </Link>
                  <Link href="/dashboard" className="block py-2 text-gray-700 hover:text-kama-gold transition">
                    Mon compte
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="block py-2 text-kama-gold font-semibold">
                      Administration
                    </Link>
                  )}
                  <button onClick={handleLogout} className="block py-2 text-red-500 hover:text-red-600 transition">
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block py-2 text-gray-700 hover:text-kama-gold transition">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="block py-2 text-kama-blue font-semibold">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-kama-gold rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-1000">
              <Badge className="bg-kama-gold/20 text-kama-gold border-kama-gold mb-4">
                <Star className="w-3 h-3 mr-1" />
                Plateforme N°1 au Gabon
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white animate-in fade-in slide-in-from-bottom duration-1000" style={{animationDelay: '200ms'}}>
              Transactions <span className="text-kama-gold">Sécurisées</span> au Gabon
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-blue-100 animate-in fade-in slide-in-from-bottom duration-1000" style={{animationDelay: '400ms'}}>
              Immobilier • Véhicules • Terrains - La confiance avant tout
            </p>

            {/* Enhanced Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom duration-1000" style={{animationDelay: '600ms'}}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-gray-900 border-gray-300 focus:border-kama-blue focus:ring-kama-blue"
                />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="text-gray-900 border-gray-300">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    <SelectItem value="HOUSE">Immobilier</SelectItem>
                    <SelectItem value="CAR">Véhicules</SelectItem>
                    <SelectItem value="LAND">Terrains</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="text-gray-900 border-gray-300">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="SALE">Vente</SelectItem>
                    <SelectItem value="RENT">Location</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90 text-white shadow-lg hover:shadow-xl transition-all">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-kama-gold/10 text-kama-gold border-kama-gold mb-4">
              Nos Avantages
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir <span className="text-kama-gold">KAMA</span> ?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Une plateforme conçue pour votre sécurité et votre tranquillité d'esprit
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-kama-gold">
              <div className="absolute inset-0 bg-gradient-to-br from-kama-blue/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-kama-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Sécurité Maximale</h3>
                <p className="text-gray-600 leading-relaxed">
                  Transactions sécurisées avec vérification complète des annonces et des utilisateurs pour votre tranquillité
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-kama-gold">
              <div className="absolute inset-0 bg-gradient-to-br from-kama-gold/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Confiance Totale</h3>
                <p className="text-gray-600 leading-relaxed">
                  Système d'évaluations et avis pour garantir la qualité et la fiabilité de chaque transaction
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-kama-gold">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Simplicité</h3>
                <p className="text-gray-600 leading-relaxed">
                  Recherche avancée et navigation intuitive pour trouver exactement ce que vous cherchez
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Listings Section */}
      <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <Badge className="bg-kama-gold/10 text-kama-gold border-kama-gold mb-3">
                Nouveautés
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900">Annonces Récentes</h2>
            </div>
            <Link href="/listings">
              <Button className="bg-gradient-to-r from-kama-blue to-blue-600 hover:from-kama-blue/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl">
                Voir tout
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-kama-blue"></div>
              <p className="mt-4 text-gray-600 text-lg">Chargement des annonces...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 text-xl mb-6">Aucune annonce disponible pour le moment</p>
              <Link href="/listings/create">
                <Button className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Publier la première annonce
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.slice(0, 8).map((listing, index) => (
                <Card 
                  key={listing._id} 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-kama-gold overflow-hidden"
                  onClick={() => router.push(`/listings/${listing._id}`)}
                  style={{animationDelay: `${index * 100}ms`}}
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
          )}
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <img 
                src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                alt="KAMA Logo" 
                className="h-12 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 leading-relaxed">
                La plateforme de confiance pour vos transactions sécurisées au Gabon.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-kama-gold">Liens Rapides</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/listings" className="hover:text-kama-gold transition">Annonces</Link></li>
                <li><Link href="/about" className="hover:text-kama-gold transition">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-kama-gold transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-kama-gold">Catégories</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/listings?type=HOUSE" className="hover:text-kama-gold transition">Immobilier</Link></li>
                <li><Link href="/listings?type=CAR" className="hover:text-kama-gold transition">Véhicules</Link></li>
                <li><Link href="/listings?type=LAND" className="hover:text-kama-gold transition">Terrains</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-kama-gold">Contact</h4>
              <p className="text-gray-400 leading-relaxed">
                Email: contact@kama-gabon.com<br />
                Tél: +241 XX XX XX XX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 KAMA. Tous droits réservés. Fait avec ❤️ au Gabon 🇬🇦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
