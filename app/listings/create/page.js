'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, PlusCircle, AlertCircle, Home, Car, MapPin, Image, Video, X, Upload, Sparkles, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function CreateListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'HOUSE',
    category: 'SALE',
    city: '',
    address: '',
    images: '',
    video: '',
  });
  const [errors, setErrors] = useState({});

  const typeOptions = [
    { value: 'HOUSE', label: 'Immobilier', icon: Home, description: 'Maisons, appartements, bureaux' },
    { value: 'CAR', label: 'Véhicule', icon: Car, description: 'Voitures, motos, camions' },
    { value: 'LAND', label: 'Terrain', icon: MapPin, description: 'Terrains, parcelles' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Titre requis';
    if (!formData.description) newErrors.description = 'Description requise';
    if (!formData.price || isNaN(formData.price)) newErrors.price = 'Prix valide requis';
    if (!formData.city) newErrors.city = 'Ville requise';
    if (!formData.address) newErrors.address = 'Adresse requise';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast({
        title: 'Non authentifié',
        description: 'Veuillez vous connecter pour publier une annonce',
        variant: 'destructive',
      });
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const images = formData.images ? formData.images.split(',').map(url => url.trim()).filter(url => url) : [];
      
      if (images.length > 5) {
        toast({
          title: 'Trop d\'images',
          description: 'Maximum 5 photos autorisées par annonce',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images,
          video: formData.video || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🎉 Annonce créée avec succès!',
          description: 'Votre annonce est en attente de validation par notre équipe.',
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors de la création',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const imageCount = formData.images ? formData.images.split(',').filter(url => url.trim()).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster />
      
      {/* Header */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
              <PlusCircle className="w-8 h-8 text-kama-gold" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">Publier une annonce</h1>
              <p className="text-blue-100 text-lg mt-1">Partagez votre bien avec des milliers d'acheteurs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step 
                      ? 'bg-gradient-to-r from-kama-gold to-yellow-500 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-20 h-1 mx-2 rounded ${
                      currentStep > step ? 'bg-kama-gold' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-2 text-xs text-gray-500">
              <span>Type de bien</span>
              <span>Détails</span>
              <span>Médias</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Type Selection */}
            {currentStep === 1 && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
                  <CardTitle className="text-2xl">Quel type de bien proposez-vous?</CardTitle>
                  <CardDescription>Sélectionnez la catégorie qui correspond à votre annonce</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {typeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.type === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: option.value })}
                          className={`p-6 rounded-2xl border-2 transition-all text-left ${
                            isSelected 
                              ? 'border-kama-gold bg-kama-gold/5 shadow-lg' 
                              : 'border-gray-200 hover:border-kama-gold/50 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-kama-gold to-yellow-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <h3 className="font-bold text-lg mb-1">{option.label}</h3>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'SALE' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.category === 'SALE'
                          ? 'border-kama-blue bg-kama-blue/5'
                          : 'border-gray-200 hover:border-kama-blue/50'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">🏷️</span>
                      <span className="font-bold">Vente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, category: 'RENT' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.category === 'RENT'
                          ? 'border-kama-blue bg-kama-blue/5'
                          : 'border-gray-200 hover:border-kama-blue/50'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">🏠</span>
                      <span className="font-bold">Location</span>
                    </button>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg text-white px-8 h-12 rounded-xl"
                    >
                      Continuer
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
                  <CardTitle className="text-2xl">Détails de l'annonce</CardTitle>
                  <CardDescription>Renseignez les informations de votre bien</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-gray-700 font-semibold">Titre de l'annonce *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Ex: Belle villa 4 chambres avec piscine"
                      value={formData.title}
                      onChange={handleChange}
                      className={`h-12 mt-2 rounded-xl border-2 ${errors.title ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-700 font-semibold">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Décrivez votre bien en détail: état, équipements, avantages..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      className={`mt-2 rounded-xl border-2 ${errors.description ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-gray-700 font-semibold">
                      Prix (FCFA) {formData.category === 'RENT' && '/ mois'} *
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="500000"
                      value={formData.price}
                      onChange={handleChange}
                      className={`h-12 mt-2 rounded-xl border-2 ${errors.price ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="city" className="text-gray-700 font-semibold">Ville *</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Libreville"
                        value={formData.city}
                        onChange={handleChange}
                        className={`h-12 mt-2 rounded-xl border-2 ${errors.city ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-gray-700 font-semibold">Adresse / Quartier *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Quartier, rue..."
                        value={formData.address}
                        onChange={handleChange}
                        className={`h-12 mt-2 rounded-xl border-2 ${errors.address ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="px-8 h-12 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg text-white px-8 h-12 rounded-xl"
                    >
                      Continuer
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
                  <CardTitle className="text-2xl">Photos et vidéo</CardTitle>
                  <CardDescription>Ajoutez des médias pour rendre votre annonce attrayante</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold mb-1">Règles des médias</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Maximum <strong>5 photos</strong> par annonce</li>
                        <li>Maximum <strong>1 vidéo</strong> par annonce</li>
                        <li>Les médias seront validés par notre équipe</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="images" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Photos ({imageCount}/5)
                    </Label>
                    <Textarea
                      id="images"
                      name="images"
                      placeholder="Entrez les URLs de vos images, séparées par des virgules:
https://exemple.com/photo1.jpg,
https://exemple.com/photo2.jpg"
                      value={formData.images}
                      onChange={handleChange}
                      rows={4}
                      className="mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                    />
                    {imageCount > 5 && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Maximum 5 photos autorisées
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Ajoutez des URLs d'images de haute qualité pour attirer plus d'acheteurs
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="video" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Vidéo (optionnel)
                    </Label>
                    <Input
                      id="video"
                      name="video"
                      placeholder="https://exemple.com/video.mp4"
                      value={formData.video}
                      onChange={handleChange}
                      className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Une vidéo de présentation augmente vos chances de vente
                    </p>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="px-8 h-12 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/30 text-white px-8 h-14 rounded-xl font-bold"
                      disabled={loading || imageCount > 5}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Publication en cours...
                        </div>
                      ) : (
                        <>
                          <PlusCircle className="w-5 h-5 mr-2" />
                          Publier l'annonce
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}