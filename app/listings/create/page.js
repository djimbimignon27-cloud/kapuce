'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function CreateListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast({
        title: 'Non authentifié',
        description: 'Veuillez vous connecter',
        variant: 'destructive',
      });
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const images = formData.images ? formData.images.split(',').map(url => url.trim()).filter(url => url) : [];
      
      // Valider le nombre d'images
      if (images.length > 5) {
        toast({
          title: 'Trop d\'images',
          description: 'Maximum 5 photos autorisées',
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
          title: 'Annonce créée!',
          description: 'Votre annonce est en attente de vérification',
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toaster />
      
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-kama-gold rounded-full filter blur-3xl animate-pulse"></div>
        </div>
        <div className="relative container mx-auto px-4 py-12">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white hover:text-kama-gold hover:bg-white/10 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Publier une annonce</h1>
          <p className="text-blue-100 text-lg">Partagez votre bien en toute sécurité</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-kama-blue/5 to-blue-50">
            <CardTitle className="text-2xl text-gray-900">Informations de l'annonce</CardTitle>
            <CardDescription className="text-base">
              Remplissez tous les champs pour créer votre annonce vérifiée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="type">Type de bien</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOUSE">Immobilier</SelectItem>
                      <SelectItem value="CAR">Véhicule</SelectItem>
                      <SelectItem value="LAND">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALE">Vente</SelectItem>
                      <SelectItem value="RENT">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Titre de l'annonce</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Villa 3 chambres avec piscine"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Décrivez votre bien en détail..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Prix (FCFA)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="500000"
                  value={formData.price}
                  onChange={handleChange}
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.price}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Libreville"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Quartier, rue..."
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="images">Images (Maximum 5 photos)</Label>
                <Textarea
                  id="images"
                  name="images"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  value={formData.images}
                  onChange={handleChange}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Entrez jusqu'à 5 URLs d'images séparées par des virgules. Photos de haute qualité requises.
                </p>
                {formData.images && formData.images.split(',').filter(url => url.trim()).length > 5 && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Maximum 5 photos autorisées
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="video">Vidéo (Optionnel - 1 maximum)</Label>
                <Input
                  id="video"
                  name="video"
                  placeholder="https://example.com/video.mp4"
                  value={formData.video || ''}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-kama-blue"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL d'une vidéo de présentation du bien (format MP4 recommandé, max 100MB)
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-kama-blue hover:bg-kama-blue/90"
                  disabled={loading}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {loading ? 'Création...' : 'Publier l\'annonce'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
