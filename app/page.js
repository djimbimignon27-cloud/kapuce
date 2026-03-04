'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Home, Car, MapPin, Heart, User, LogOut, PlusCircle, Shield, Menu, X, TrendingUp, CheckCircle, Star, Eye, Sparkles, ArrowRight, Building2, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { NotificationBell } from '@/components/NotificationBell';

// Demo images from vision agent
const DEMO_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1694771170091-849084a0d677?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBhZnJpY2FuJTIwcmVhbCUyMGVzdGF0ZXxlbnwwfHx8fDE3NzI1OTYxMTB8MA&ixlib=rb-4.1.0&q=85',
  properties: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
  ]
};

export default function App() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
    fetchListings();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    router.push(`/listings?${params.toString()}`);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster />
      
      {/* Premium Navbar with Glass Effect */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-2xl border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-kama-gold/30 blur-2xl rounded-full group-hover:bg-kama-gold/50 transition-all duration-500"></div>
                <img 
                  src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                  alt="KAMA Logo" 
                  className="h-14 w-auto relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl"
                />
              </div>
              <div className="hidden sm:block">
                <span className={`font-bold text-xl ${scrolled ? 'text-kama-blue' : 'text-white'} transition-colors`}>KAMA</span>
                <p className={`text-xs ${scrolled ? 'text-gray-500' : 'text-white/70'} transition-colors`}>Transactions Sécurisées</p>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/listings" className={`relative font-medium transition-all px-4 py-2 rounded-full ${scrolled ? 'text-gray-700 hover:text-kama-gold hover:bg-kama-gold/10' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
                Annonces
              </Link>
              {user ? (
                <>
                  <Link href="/listings/create">
                    <Button className="bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/30 text-white font-semibold px-6 transition-all duration-300 hover:scale-105">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Publier
                    </Button>
                  </Link>
                  <NotificationBell />
                  <Link href="/favorites" className={`${scrolled ? 'text-gray-700 hover:text-red-500' : 'text-white hover:text-red-400'} transition-colors`}>
                    <Heart className="w-6 h-6" />
                  </Link>
                  <Link href="/dashboard" className={`${scrolled ? 'text-gray-700 hover:text-kama-blue' : 'text-white hover:text-kama-gold'} transition-colors`}>
                    <User className="w-6 h-6" />
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link href="/admin/dashboard">
                      <Badge className="bg-red-500 hover:bg-red-600 cursor-pointer transition-colors">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="ghost" size="sm" className={`${scrolled ? 'text-gray-700 hover:text-red-500' : 'text-white/90 hover:text-red-400'}`}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className={`${scrolled ? 'text-gray-700 hover:text-kama-blue' : 'text-white hover:bg-white/10'}`}>
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/choose-account">
                    <Button className="bg-gradient-to-r from-kama-blue via-blue-600 to-kama-blue hover:shadow-lg hover:shadow-kama-blue/30 text-white font-semibold px-6 transition-all duration-300 hover:scale-105">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Inscription
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-100 py-6 px-4 space-y-4 animate-in slide-in-from-top duration-300">
              <Link href="/listings" className="block py-3 px-4 text-gray-700 hover:text-kama-gold hover:bg-kama-gold/5 rounded-xl transition font-medium">
                Annonces
              </Link>
              {user ? (
                <>
                  <Link href="/listings/create" className="block py-3 px-4 text-gray-700 hover:text-kama-gold hover:bg-kama-gold/5 rounded-xl transition">
                    Publier une annonce
                  </Link>
                  <Link href="/favorites" className="block py-3 px-4 text-gray-700 hover:text-kama-gold hover:bg-kama-gold/5 rounded-xl transition">
                    Mes favoris
                  </Link>
                  <Link href="/dashboard" className="block py-3 px-4 text-gray-700 hover:text-kama-gold hover:bg-kama-gold/5 rounded-xl transition">
                    Mon compte
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left py-3 px-4 text-red-500 hover:bg-red-50 rounded-xl transition">
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block py-3 px-4 text-gray-700 hover:text-kama-gold hover:bg-kama-gold/5 rounded-xl transition">
                    Connexion
                  </Link>
                  <Link href="/auth/choose-account" className="block py-3 px-4 bg-gradient-to-r from-kama-blue to-blue-600 text-white text-center rounded-xl font-semibold">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Full Background Image */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={DEMO_IMAGES.hero}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-kama-blue/90 via-kama-blue/80 to-blue-900/90"></div>
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Premium Badge */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-700">
              <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 px-6 py-2 text-sm">
                <Star className="w-4 h-4 mr-2 text-kama-gold" />
                Plateforme N°1 de confiance au Gabon
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 text-white leading-tight animate-in fade-in slide-in-from-bottom duration-700" style={{animationDelay: '200ms'}}>
              Trouvez votre
              <span className="block text-gradient-gold">bien idéal</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-blue-100/90 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-700" style={{animationDelay: '400ms'}}>
              Immobilier • Véhicules • Terrains — Des transactions sécurisées avec vérification complète
            </p>

            {/* Premium Search Bar */}
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-700" style={{animationDelay: '600ms'}}>
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-4 md:p-6 border border-white/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Que recherchez-vous?"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 text-gray-900 border-gray-200 rounded-xl focus:border-kama-blue focus:ring-2 focus:ring-kama-blue/20 text-base"
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-14 text-gray-900 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Type de bien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-14 text-gray-900 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Vente & Location</SelectItem>
                      <SelectItem value="SALE">🏷️ Vente</SelectItem>
                      <SelectItem value="RENT">🏠 Location</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} className="h-14 bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/40 text-white font-bold text-base rounded-xl transition-all duration-300 hover:scale-[1.02]">
                    <Search className="w-5 h-5 mr-2" />
                    Rechercher
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700" style={{animationDelay: '800ms'}}>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-2">500+</div>
                <div className="text-blue-200 text-sm">Annonces Vérifiées</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-4xl font-black text-kama-gold mb-2">98%</div>
                <div className="text-blue-200 text-sm">Clients Satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white mb-2">24/7</div>
                <div className="text-blue-200 text-sm">Support Client</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-kama-gold to-transparent"></div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-kama-gold/10 text-kama-gold border-kama-gold/30 mb-4 px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              Pourquoi KAMA
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              La confiance au cœur de
              <span className="text-gradient-gold"> chaque transaction</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Une plateforme pensée pour votre sécurité et votre réussite
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Sécurité Maximale',
                description: 'Vérification complète de chaque annonce et utilisateur pour des transactions en toute confiance',
                gradient: 'from-kama-blue to-blue-600',
                delay: '0ms'
              },
              {
                icon: CheckCircle,
                title: 'Confiance Garantie',
                description: 'Système d\'avis et badges vérifiés pour identifier les vendeurs de confiance',
                gradient: 'from-kama-gold to-yellow-600',
                delay: '100ms'
              },
              {
                icon: TrendingUp,
                title: 'Simplicité & Rapidité',
                description: 'Interface intuitive et recherche avancée pour trouver votre bien en quelques clics',
                gradient: 'from-green-500 to-emerald-600',
                delay: '200ms'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-kama-gold/30 overflow-hidden"
                style={{animationDelay: feature.delay}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kama-gold to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <Badge className="bg-kama-gold/10 text-kama-gold border-kama-gold/30 mb-3">
                <TrendingUp className="w-4 h-4 mr-2" />
                Nouvelles annonces
              </Badge>
              <h2 className="text-4xl font-black text-gray-900">Découvrez nos biens</h2>
            </div>
            <Link href="/listings">
              <Button className="bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg hover:shadow-kama-blue/30 text-white px-8 transition-all duration-300 hover:scale-105">
                Voir toutes les annonces
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
                <Home className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-kama-gold" />
              </div>
              <p className="mt-6 text-gray-600 text-lg">Chargement des annonces...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
              <div className="w-24 h-24 bg-gradient-to-br from-kama-gold/10 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-12 h-12 text-kama-gold" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune annonce pour le moment</h3>
              <p className="text-gray-600 mb-8">Soyez le premier à publier une annonce!</p>
              <Link href="/listings/create">
                <Button className="bg-gradient-to-r from-kama-gold to-yellow-600 hover:shadow-lg text-white px-8">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Publier une annonce
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.slice(0, 8).map((listing, index) => (
                <Card 
                  key={listing._id} 
                  className="group bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg rounded-2xl overflow-hidden"
                  onClick={() => router.push(`/listings/${listing._id}`)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={listing.images?.[0] || DEMO_IMAGES.properties[index % DEMO_IMAGES.properties.length]}
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
                    
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-2xl font-bold text-white drop-shadow-lg">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XAF',
                          maximumFractionDigits: 0,
                        }).format(listing.price)}
                      </p>
                    </div>
                    
                    <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 text-white text-xs">
                      <Eye className="w-3.5 h-3.5" />
                      {listing.viewsCount || 0}
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-kama-blue/10 rounded-lg">
                        {getTypeIcon(listing.type)}
                      </div>
                      <span className="text-xs text-kama-blue font-semibold uppercase">
                        {listing.type === 'HOUSE' ? 'Immobilier' : listing.type === 'CAR' ? 'Véhicule' : 'Terrain'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-kama-blue transition-colors min-h-[3.5rem]">
                      {listing.title}
                    </h3>
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

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Prêt à commencer?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui font confiance à KAMA pour leurs transactions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/choose-account">
              <Button className="bg-white text-kama-blue hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                <User className="w-5 h-5 mr-2" />
                Créer un compte gratuit
              </Button>
            </Link>
            <Link href="/listings">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-kama-blue font-bold px-8 py-6 text-lg rounded-xl transition-all">
                <Search className="w-5 h-5 mr-2" />
                Explorer les annonces
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                  alt="KAMA Logo" 
                  className="h-12 w-auto brightness-0 invert"
                />
                <div>
                  <span className="font-bold text-xl">KAMA</span>
                  <p className="text-gray-500 text-xs">Transactions Sécurisées</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                La plateforme de confiance pour toutes vos transactions immobilières au Gabon.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-kama-gold">Navigation</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/" className="hover:text-kama-gold transition">Accueil</Link></li>
                <li><Link href="/listings" className="hover:text-kama-gold transition">Annonces</Link></li>
                <li><Link href="/about" className="hover:text-kama-gold transition">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-kama-gold transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-kama-gold">Catégories</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/listings?type=HOUSE" className="hover:text-kama-gold transition flex items-center gap-2"><Home className="w-4 h-4" /> Immobilier</Link></li>
                <li><Link href="/listings?type=CAR" className="hover:text-kama-gold transition flex items-center gap-2"><Car className="w-4 h-4" /> Véhicules</Link></li>
                <li><Link href="/listings?type=LAND" className="hover:text-kama-gold transition flex items-center gap-2"><MapPin className="w-4 h-4" /> Terrains</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4 text-kama-gold">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-kama-gold" />
                  contact@kama-gabon.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-kama-gold" />
                  +241 XX XX XX XX
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-kama-gold" />
                  Libreville, Gabon
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 KAMA. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Fait avec</span>
              <span className="text-red-500">❤️</span>
              <span>au Gabon</span>
              <span className="ml-2">🇬🇦</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}