'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Home, Car, MapPin, Heart, Share2,
  MessageCircle, CheckCircle, Eye, Calendar, User, Shield, 
  ChevronLeft, ChevronRight, Star, Building2, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzI1OTYxMTd8MA&ixlib=rb-4.1.0&q=85',
];

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setListing(data.listing);
      } else {
        toast({
          title: 'Erreur',
          description: 'Annonce non trouvée',
          variant: 'destructive',
        });
        router.push('/listings');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'annonce',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  const images = listing?.images?.length > 0 ? listing.images : DEMO_IMAGES;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleContact = (method) => {
    toast({
      title: 'Contact',
      description: `Vous allez contacter le vendeur par ${method}`,
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
      description: isFavorite ? 'Cette annonce a été retirée de vos favoris' : 'Cette annonce a été ajoutée à vos favoris',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
            <Home className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-kama-gold" />
          </div>
          <p className="mt-6 text-gray-600 text-lg">Chargement de l'annonce...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 text-center p-8">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-2">Annonce non trouvée</h2>
          <p className="text-gray-600 mb-6">Cette annonce n'existe pas ou a été supprimée</p>
          <Link href="/listings">
            <Button className="bg-kama-blue hover:bg-kama-blue/90">Retour aux annonces</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-gray-700 hover:text-kama-blue"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleFavorite}
                className={isFavorite ? 'text-red-500 border-red-500' : ''}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="aspect-[16/10] relative">
                <img
                  src={images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-kama-gold text-white border-0 shadow-lg px-4 py-1.5">
                    {listing.category === 'SALE' ? '🏷️ Vente' : '🏠 Location'}
                  </Badge>
                  {listing.verified && (
                    <Badge className="bg-green-500 text-white border-0 shadow-lg">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 right-20 flex gap-2 overflow-x-auto py-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-kama-gold shadow-lg scale-110' 
                          : 'border-white/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Info */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-kama-blue/10 rounded-xl">
                    {getTypeIcon(listing.type)}
                  </div>
                  <Badge variant="outline" className="text-kama-blue border-kama-blue">
                    {getTypeLabel(listing.type)}
                  </Badge>
                  <div className="ml-auto flex items-center gap-1 text-gray-500 text-sm">
                    <Eye className="w-4 h-4" />
                    {listing.viewsCount || 0} vues
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
                
                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <MapPin className="w-5 h-5 text-kama-gold" />
                  <span className="text-lg">{listing.address}, {listing.city}</span>
                </div>

                <div className="p-6 bg-gradient-to-r from-kama-gold/10 to-yellow-50 rounded-2xl mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    {listing.category === 'RENT' ? 'Loyer mensuel' : 'Prix de vente'}
                  </p>
                  <p className="text-4xl font-black text-gradient-gold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XAF',
                      maximumFractionDigits: 0,
                    }).format(listing.price)}
                    {listing.category === 'RENT' && <span className="text-lg font-normal text-gray-600">/mois</span>}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-kama-blue to-blue-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{listing.ownerId?.fullName || 'Propriétaire'}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/20 text-white border-0 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Compte vérifié
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <Button 
                  onClick={() => router.push(`/pay-listing?listingId=${listing._id}`)}
                  className="w-full h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-xl shadow-xl"
                >
                  <DollarSign className="w-6 h-6 mr-2" />
                  {listing.category === 'SALE' ? 'Acheter ce Bien' : 'Louer ce Bien'}
                </Button>

                <Button 
                  onClick={() => router.push(`/messages?newConversation=true&receiverId=${listing.ownerId?._id}&listingId=${listing._id}&listingTitle=${encodeURIComponent(listing.title)}`)}
                  variant="outline"
                  className="w-full h-14 border-2 border-kama-gold text-kama-gold hover:bg-kama-gold/5 font-semibold rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contacter via Messagerie
                </Button>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-900">
                      <strong>Communication sécurisée :</strong> Utilisez uniquement la messagerie KAPUCE.G
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    ⚠️ Ne partagez jamais vos coordonnées personnelles (téléphone, email, WhatsApp) dans les messages
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-kama-gold" />
                  Conseils de sécurité
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Visitez le bien avant tout paiement
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Vérifiez les documents de propriété
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Méfiez-vous des offres trop alléchantes
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Utilisez les paiements sécurisés KAMA
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}