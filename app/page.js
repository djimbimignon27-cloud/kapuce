'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Home, Car, MapPin, Heart, User, LogOut, PlusCircle, Shield, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filtres de recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('accessToken');
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }

    // Charger les annonces
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
      console.error('Erreur lors du chargement des annonces:', error);
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
      case 'HOUSE':
        return <Home className="w-4 h-4" />;
      case 'CAR':
        return <Car className="w-4 h-4" />;
      case 'LAND':
        return <MapPin className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Navbar */}
      <nav className="bg-kama-blue text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-kama-gold" />
              <span className="text-2xl font-bold">KAMA</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/listings" className="hover:text-kama-gold transition">
                Annonces
              </Link>
              {user ? (
                <>
                  <Link href="/listings/create" className="hover:text-kama-gold transition">
                    <Button variant="ghost" size="sm" className="text-white hover:text-kama-gold">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Publier
                    </Button>
                  </Link>
                  <Link href="/favorites" className="hover:text-kama-gold transition">
                    <Heart className="w-5 h-5" />
                  </Link>
                  <Link href="/dashboard" className="hover:text-kama-gold transition">
                    <User className="w-5 h-5" />
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm" className="bg-kama-gold text-white hover:bg-kama-gold/90">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white hover:text-kama-gold">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-white hover:text-kama-gold">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="bg-kama-gold text-white hover:bg-kama-gold/90">
                      Inscription
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link href="/listings" className="block py-2 hover:text-kama-gold transition">
                Annonces
              </Link>
              {user ? (
                <>
                  <Link href="/listings/create" className="block py-2 hover:text-kama-gold transition">
                    Publier une annonce
                  </Link>
                  <Link href="/favorites" className="block py-2 hover:text-kama-gold transition">
                    Mes favoris
                  </Link>
                  <Link href="/dashboard" className="block py-2 hover:text-kama-gold transition">
                    Mon compte
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="block py-2 hover:text-kama-gold transition">
                      Administration
                    </Link>
                  )}
                  <button onClick={handleLogout} className="block py-2 hover:text-kama-gold transition">
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block py-2 hover:text-kama-gold transition">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="block py-2 hover:text-kama-gold transition">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-kama-blue to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transactions Sécurisées au Gabon
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              Immobilier, Véhicules, Terrains - La confiance avant tout
            </p>

            {/* Barre de recherche */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-gray-900"
                />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="text-gray-900">
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
                  <SelectTrigger className="text-gray-900">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="SALE">Vente</SelectItem>
                    <SelectItem value="RENT">Location</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} className="bg-kama-gold hover:bg-kama-gold/90">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Pourquoi choisir KAMA ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-kama-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Sécurité</h3>
              <p className="text-gray-600">
                Transactions sécurisées avec vérification des annonces et des utilisateurs
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-kama-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Confiance</h3>
              <p className="text-gray-600">
                Système d'évaluations et avis pour garantir la qualité
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-kama-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Simplicité</h3>
              <p className="text-gray-600">
                Recherche avancée et navigation intuitive
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Annonces Récentes</h2>
            <Link href="/listings">
              <Button variant="outline" className="border-kama-blue text-kama-blue hover:bg-kama-blue hover:text-white">
                Voir tout
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kama-blue mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Aucune annonce disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listings.slice(0, 8).map((listing) => (
                <Card key={listing._id} className="hover:shadow-lg transition cursor-pointer" onClick={() => router.push(`/listings/${listing._id}`)}>
                  <div className="aspect-video bg-gray-200 relative">
                    {listing.images && listing.images[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
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
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-kama-blue text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-kama-gold" />
                <span className="text-xl font-bold">KAMA</span>
              </div>
              <p className="text-gray-300">
                La plateforme de confiance pour vos transactions au Gabon.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/listings" className="hover:text-kama-gold">Annonces</Link></li>
                <li><Link href="/about" className="hover:text-kama-gold">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-kama-gold">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Catégories</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/listings?type=HOUSE" className="hover:text-kama-gold">Immobilier</Link></li>
                <li><Link href="/listings?type=CAR" className="hover:text-kama-gold">Véhicules</Link></li>
                <li><Link href="/listings?type=LAND" className="hover:text-kama-gold">Terrains</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-300">
                Email: contact@kama-gabon.com<br />
                Tél: +241 XX XX XX XX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 KAMA. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
