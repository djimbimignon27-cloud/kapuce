'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, PlusCircle, AlertCircle, Home, Car, MapPin, Image, Video, 
  X, Upload, Sparkles, CheckCircle, Info, FileText, ChevronRight,
  Building2, Truck, Trees, Ruler, Calendar, Fuel, Settings, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import FileUploader from '@/components/FileUploader';

export default function CreateListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [constants, setConstants] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    // Base
    title: '',
    description: '',
    price: '',
    type: '',
    subCategory: '',
    category: 'SALE',
    city: '',
    address: '',
    neighborhood: '',
    
    // Rental specific (Location)
    rentalDetails: {
      // Immobilier
      monthlyRent: '',
      charges: '',
      deposit: '',
      minDuration: '',
      availableDate: '',
      petsAllowed: false,
      smokingAllowed: false,
      // Véhicule (location par jour)
      weekendRate: '',
      vehicleDeposit: '',
      dailyKm: '',
      minRentalDays: '',
      extraKmRate: '',
      withDriver: false,
      deliveryAvailable: false,
      insuranceIncluded: false,
      // Terrain
      leaseType: '',
      constructionAllowed: false,
      agricultureAllowed: false,
    },
    
    // Land specific
    landDetails: {
      surface: '',
      length: '',
      width: '',
      topography: '',
      accessibility: [],
      boundaryMarked: false,
      hasWater: false,
      hasElectricity: false,
      hasRoad: false,
      documentType: '',
    },
    
    // Property specific
    propertyDetails: {
      surface: '',
      bedrooms: '',
      bathrooms: '',
      floors: '',
      yearBuilt: '',
      condition: '',
      furnished: 'UNFURNISHED',
      parking: '',
      amenities: [],
      hasWater: true,
      hasElectricity: true,
      hasInternet: false,
    },
    
    // Vehicle specific
    vehicleDetails: {
      brand: '',
      model: '',
      year: '',
      mileage: '',
      fuel: '',
      transmission: '',
      color: '',
      doors: '',
      seats: '',
      condition: '',
      features: [],
      firstHand: false,
      hasInsurance: false,
      hasTechnicalControl: false,
    },
    
    // Media - stockage des fichiers uploadés
    uploadedImages: [],
    uploadedVideo: null,
  });

  const [errors, setErrors] = useState({});

  // Total steps - 3 étapes pour Location, 4 pour Vente
  const totalSteps = formData.category === 'RENT' ? 3 : 4;
  
  // Labels des étapes selon la catégorie
  const getStepLabels = () => {
    if (formData.category === 'RENT') {
      return ['Type', 'Détails & Location', 'Médias'];
    }
    return ['Type', 'Détails', 'Spécificités', 'Médias'];
  };

  // Handlers pour le téléversement
  const handleImagesUpload = (files) => {
    setFormData(prev => ({
      ...prev,
      uploadedImages: files,
    }));
  };

  const handleVideoUpload = (files) => {
    setFormData(prev => ({
      ...prev,
      uploadedVideo: files.length > 0 ? files[0] : null,
    }));
  };

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    try {
      const response = await fetch('/api/listings/constants');
      const data = await response.json();
      if (data.success) {
        setConstants(data.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const typeOptions = [
    { value: 'LAND', label: 'Terrain', icon: Trees, description: 'Terrains et parcelles' },
    { value: 'HOUSE', label: 'Immobilier', icon: Building2, description: 'Maisons, appartements, bureaux' },
    { value: 'CAR', label: 'Véhicule', icon: Truck, description: 'Voitures, motos, camions' },
  ];

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNestedChange = (parent, name, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [name]: value,
      },
    }));
  };

  const handleArrayToggle = (parent, name, value) => {
    setFormData(prev => {
      const currentArray = prev[parent][name] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [parent]: {
          ...prev[parent],
          [name]: newArray,
        },
      };
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.type) newErrors.type = 'Sélectionnez un type de bien';
        if (!formData.subCategory) newErrors.subCategory = 'Sélectionnez une sous-catégorie';
        if (!formData.category) newErrors.category = 'Sélectionnez vente ou location';
        break;
      case 2:
        if (!formData.title) newErrors.title = 'Titre requis';
        if (!formData.description) newErrors.description = 'Description requise';
        if (!formData.price) newErrors.price = 'Prix requis';
        if (!formData.city) newErrors.city = 'Ville requise';
        if (!formData.address) newErrors.address = 'Adresse requise';
        break;
      case 3:
        // Pour la Location, l'étape 3 est Médias (pas de validation spécifique)
        // Pour la Vente, l'étape 3 est Spécificités
        if (formData.category === 'SALE') {
          // Validation spécifique selon le type (uniquement pour Vente)
          if (formData.type === 'LAND') {
            if (!formData.landDetails.surface) newErrors.surface = 'Superficie requise';
          } else if (formData.type === 'HOUSE') {
            if (!formData.propertyDetails.surface) newErrors.surface = 'Surface requise';
          } else if (formData.type === 'CAR') {
            if (!formData.vehicleDetails.brand) newErrors.brand = 'Marque requise';
            if (!formData.vehicleDetails.year) newErrors.year = 'Année requise';
          }
        }
        // Pour la Location, étape 3 = Médias, pas de validation requise
        break;
      case 4:
        // Étape 4 = Médias (uniquement pour Vente)
        // Pas de validation obligatoire pour les médias
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

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
      // Préparer les images depuis les fichiers uploadés
      const images = formData.uploadedImages.map(file => ({
        url: file.url,
        publicId: file.publicId,
      }));
      
      if (images.length > 5) {
        toast({
          title: 'Trop d\'images',
          description: 'Maximum 5 photos autorisées par annonce',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Préparer la vidéo
      const video = formData.uploadedVideo ? {
        url: formData.uploadedVideo.url,
        publicId: formData.uploadedVideo.publicId,
      } : null;

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        images,
        video,
      };

      // Nettoyer les champs non nécessaires
      delete payload.uploadedImages;
      delete payload.uploadedVideo;

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🎉 Annonce créée avec succès!',
          description: 'Votre annonce est en attente de validation.',
        });
        setTimeout(() => router.push('/dashboard'), 1500);
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

  const renderStepIndicator = () => {
    const stepLabels = getStepLabels();
    const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                currentStep >= step 
                  ? 'bg-gradient-to-r from-kama-gold to-yellow-500 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 rounded ${
                  currentStep > step ? 'bg-kama-gold' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-16 mt-2 text-xs text-gray-500">
          {stepLabels.map((label, index) => (
            <span key={index} className={currentStep === index + 1 ? 'text-kama-gold font-semibold' : ''}>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Step 1: Type Selection
  const renderStep1 = () => (
    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-kama-gold/10 rounded-xl flex items-center justify-center">
            <span className="text-xl">1️⃣</span>
          </div>
          Type de bien
        </CardTitle>
        <CardDescription>Sélectionnez la catégorie de votre annonce</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  handleChange('type', option.value);
                  handleChange('subCategory', '');
                }}
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
        {errors.type && (
          <p className="text-red-500 text-sm flex items-center gap-1 mb-4">
            <AlertCircle className="w-4 h-4" />
            {errors.type}
          </p>
        )}

        {/* Sub Category */}
        {formData.type && constants?.subCategories[formData.type] && (
          <div className="mb-6">
            <Label className="text-gray-700 font-semibold mb-3 block">Sous-catégorie *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {constants.subCategories[formData.type].map((sub) => (
                <button
                  key={sub.value}
                  type="button"
                  onClick={() => handleChange('subCategory', sub.value)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    formData.subCategory === sub.value
                      ? 'border-kama-blue bg-kama-blue/5 text-kama-blue'
                      : 'border-gray-200 hover:border-kama-blue/50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
            {errors.subCategory && (
              <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                <AlertCircle className="w-4 h-4" />
                {errors.subCategory}
              </p>
            )}
          </div>
        )}

        {/* Transaction Type */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleChange('category', 'SALE')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
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
            onClick={() => handleChange('category', 'RENT')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              formData.category === 'RENT'
                ? 'border-kama-blue bg-kama-blue/5'
                : 'border-gray-200 hover:border-kama-blue/50'
            }`}
          >
            <span className="text-2xl mb-2 block">🏠</span>
            <span className="font-bold">Location</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Basic Details
  const renderStep2 = () => (
    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-kama-gold/10 rounded-xl flex items-center justify-center">
            <span className="text-xl">2️⃣</span>
          </div>
          Informations générales
        </CardTitle>
        <CardDescription>Décrivez votre bien</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Title */}
        <div>
          <Label className="text-gray-700 font-semibold">Titre de l'annonce *</Label>
          <Input
            placeholder="Ex: Belle villa 4 chambres avec piscine"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`h-12 mt-2 rounded-xl border-2 ${errors.title ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <Label className="text-gray-700 font-semibold">Description détaillée *</Label>
          <Textarea
            placeholder="Décrivez votre bien en détail..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={5}
            className={`mt-2 rounded-xl border-2 ${errors.description ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Price */}
        <div>
          <Label className="text-gray-700 font-semibold">
            {formData.category === 'RENT' 
              ? (formData.type === 'CAR' ? 'Tarif journalier (FCFA/jour) *' : 'Loyer mensuel (FCFA/mois) *')
              : 'Prix de vente (FCFA) *'
            }
          </Label>
          <Input
            type="number"
            placeholder={formData.category === 'RENT' ? (formData.type === 'CAR' ? '25000' : '150000') : '50000000'}
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className={`h-12 mt-2 rounded-xl border-2 ${errors.price ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        {/* Rental Specific Fields - IMMOBILIER */}
        {formData.category === 'RENT' && formData.type === 'HOUSE' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
            <h4 className="font-bold text-blue-800 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Détails de la location immobilière
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Charges mensuelles (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={formData.rentalDetails.charges}
                  onChange={(e) => handleNestedChange('rentalDetails', 'charges', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Caution (mois de loyer)</Label>
                <Select 
                  value={formData.rentalDetails.deposit} 
                  onValueChange={(v) => handleNestedChange('rentalDetails', 'deposit', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="2">2 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="4">4 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Durée minimale</Label>
                <Select 
                  value={formData.rentalDetails.minDuration} 
                  onValueChange={(v) => handleNestedChange('rentalDetails', 'minDuration', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mois</SelectItem>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">1 an</SelectItem>
                    <SelectItem value="24">2 ans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Disponible à partir du</Label>
                <Input
                  type="date"
                  value={formData.rentalDetails.availableDate}
                  onChange={(e) => handleNestedChange('rentalDetails', 'availableDate', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.rentalDetails.petsAllowed}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'petsAllowed', checked)}
                />
                <span className="text-sm">🐕 Animaux acceptés</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.rentalDetails.smokingAllowed}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'smokingAllowed', checked)}
                />
                <span className="text-sm">🚬 Fumeurs acceptés</span>
              </label>
            </div>
          </div>
        )}

        {/* Rental Specific Fields - VÉHICULE (Location par jour) */}
        {formData.category === 'RENT' && formData.type === 'CAR' && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-4">
            <h4 className="font-bold text-orange-800 flex items-center gap-2">
              <Car className="w-5 h-5" />
              Détails de la location de véhicule
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Tarif week-end (FCFA/jour)</Label>
                <Input
                  type="number"
                  placeholder="30000"
                  value={formData.rentalDetails.weekendRate}
                  onChange={(e) => handleNestedChange('rentalDetails', 'weekendRate', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
                <span className="text-xs text-gray-500">Tarif Sam-Dim (optionnel)</span>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Caution (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={formData.rentalDetails.vehicleDeposit}
                  onChange={(e) => handleNestedChange('rentalDetails', 'vehicleDeposit', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Kilométrage inclus/jour</Label>
                <Select 
                  value={formData.rentalDetails.dailyKm} 
                  onValueChange={(v) => handleNestedChange('rentalDetails', 'dailyKm', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 km/jour</SelectItem>
                    <SelectItem value="150">150 km/jour</SelectItem>
                    <SelectItem value="200">200 km/jour</SelectItem>
                    <SelectItem value="unlimited">Illimité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Durée minimum de location</Label>
                <Select 
                  value={formData.rentalDetails.minRentalDays} 
                  onValueChange={(v) => handleNestedChange('rentalDetails', 'minRentalDays', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jour</SelectItem>
                    <SelectItem value="2">2 jours</SelectItem>
                    <SelectItem value="3">3 jours</SelectItem>
                    <SelectItem value="7">1 semaine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Frais par km supplémentaire (FCFA)</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={formData.rentalDetails.extraKmRate}
                  onChange={(e) => handleNestedChange('rentalDetails', 'extraKmRate', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition">
                <Checkbox
                  checked={formData.rentalDetails.withDriver}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'withDriver', checked)}
                />
                <span className="text-sm">👨‍✈️ Avec chauffeur disponible</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition">
                <Checkbox
                  checked={formData.rentalDetails.deliveryAvailable}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'deliveryAvailable', checked)}
                />
                <span className="text-sm">🚚 Livraison possible</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition">
                <Checkbox
                  checked={formData.rentalDetails.insuranceIncluded}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'insuranceIncluded', checked)}
                />
                <span className="text-sm">🛡️ Assurance incluse</span>
              </label>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>💡 Conseil :</strong> Pour les locations longue durée (1 semaine+), pensez à proposer un tarif dégressif dans la description.
              </p>
            </div>
          </div>
        )}

        {/* Rental Specific Fields - TERRAIN */}
        {formData.category === 'RENT' && formData.type === 'LAND' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-4">
            <h4 className="font-bold text-green-800 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Détails de la location de terrain
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Type de bail</Label>
                <Select 
                  value={formData.rentalDetails.leaseType} 
                  onValueChange={(v) => handleNestedChange('rentalDetails', 'leaseType', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                    <SelectItem value="longterm">Bail emphytéotique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Durée minimale</Label>
                <Select 
                  value={formData.rentalDetails.minDuration} 
                  onValueChange={(v) => handleNestedChange('rentalDetails', 'minDuration', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">1 an</SelectItem>
                    <SelectItem value="24">2 ans</SelectItem>
                    <SelectItem value="60">5 ans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.rentalDetails.constructionAllowed}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'constructionAllowed', checked)}
                />
                <span className="text-sm">🏗️ Construction autorisée</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.rentalDetails.agricultureAllowed}
                  onCheckedChange={(checked) => handleNestedChange('rentalDetails', 'agricultureAllowed', checked)}
                />
                <span className="text-sm">🌾 Agriculture autorisée</span>
              </label>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700 font-semibold">Ville *</Label>
            <Select value={formData.city} onValueChange={(v) => handleChange('city', v)}>
              <SelectTrigger className={`h-12 mt-2 rounded-xl border-2 ${errors.city ? 'border-red-500' : 'border-gray-200'}`}>
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                {constants?.cities?.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>
          <div>
            <Label className="text-gray-700 font-semibold">Quartier</Label>
            <Input
              placeholder="Quartier"
              value={formData.neighborhood}
              onChange={(e) => handleChange('neighborhood', e.target.value)}
              className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-700 font-semibold">Adresse complète *</Label>
          <Input
            placeholder="Numéro, rue, repère..."
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`h-12 mt-2 rounded-xl border-2 ${errors.address ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Type-specific details
  const renderStep3 = () => (
    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-kama-gold/10 rounded-xl flex items-center justify-center">
            <span className="text-xl">3️⃣</span>
          </div>
          Caractéristiques spécifiques
        </CardTitle>
        <CardDescription>
          {formData.type === 'LAND' && 'Détails du terrain'}
          {formData.type === 'HOUSE' && 'Détails du bien immobilier'}
          {formData.type === 'CAR' && 'Détails du véhicule'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* TERRAIN */}
        {formData.type === 'LAND' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Superficie (m²) *
                </Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={formData.landDetails.surface}
                  onChange={(e) => handleNestedChange('landDetails', 'surface', e.target.value)}
                  className={`h-12 mt-2 rounded-xl border-2 ${errors.surface ? 'border-red-500' : 'border-gray-200'}`}
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Longueur (m)</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={formData.landDetails.length}
                  onChange={(e) => handleNestedChange('landDetails', 'length', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Largeur (m)</Label>
                <Input
                  type="number"
                  placeholder="20"
                  value={formData.landDetails.width}
                  onChange={(e) => handleNestedChange('landDetails', 'width', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Type de document</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {[
                  { value: 'TITRE_FONCIER', label: 'Titre foncier' },
                  { value: 'LETTRE_ATTRIBUTION', label: "Lettre d'attribution" },
                  { value: 'ACTE_VENTE', label: 'Acte de vente' },
                  { value: 'AUCUN', label: 'Aucun document' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleNestedChange('landDetails', 'documentType', opt.value)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.landDetails.documentType === opt.value
                        ? 'border-kama-blue bg-kama-blue/5 text-kama-blue'
                        : 'border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Topographie</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {constants?.conditionOptions?.LAND?.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleNestedChange('landDetails', 'topography', opt.value)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.landDetails.topography === opt.value
                        ? 'border-kama-blue bg-kama-blue/5 text-kama-blue'
                        : 'border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">Accessibilité</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {constants?.accessibilityOptions?.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.landDetails.accessibility?.includes(opt.value)
                        ? 'border-kama-gold bg-kama-gold/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.landDetails.accessibility?.includes(opt.value)}
                      onCheckedChange={() => handleArrayToggle('landDetails', 'accessibility', opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">Viabilisation</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <Checkbox
                    checked={formData.landDetails.hasWater}
                    onCheckedChange={(checked) => handleNestedChange('landDetails', 'hasWater', checked)}
                  />
                  <div>
                    <span className="font-semibold">💧 Eau</span>
                    <p className="text-xs text-gray-500">Accès à l'eau courante</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <Checkbox
                    checked={formData.landDetails.hasElectricity}
                    onCheckedChange={(checked) => handleNestedChange('landDetails', 'hasElectricity', checked)}
                  />
                  <div>
                    <span className="font-semibold">⚡ Électricité</span>
                    <p className="text-xs text-gray-500">Raccordement électrique</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <Checkbox
                    checked={formData.landDetails.hasRoad}
                    onCheckedChange={(checked) => handleNestedChange('landDetails', 'hasRoad', checked)}
                  />
                  <div>
                    <span className="font-semibold">🛣️ Route</span>
                    <p className="text-xs text-gray-500">Accès routier goudronné</p>
                  </div>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl cursor-pointer">
              <Checkbox
                checked={formData.landDetails.boundaryMarked}
                onCheckedChange={(checked) => handleNestedChange('landDetails', 'boundaryMarked', checked)}
              />
              <div>
                <span className="font-semibold text-green-800">✅ Terrain borné</span>
                <p className="text-sm text-green-600">Le terrain a été délimité par un géomètre agréé</p>
              </div>
            </label>
          </>
        )}

        {/* IMMOBILIER */}
        {formData.type === 'HOUSE' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">Surface habitable (m²) *</Label>
                <Input
                  type="number"
                  placeholder="120"
                  value={formData.propertyDetails.surface}
                  onChange={(e) => handleNestedChange('propertyDetails', 'surface', e.target.value)}
                  className={`h-12 mt-2 rounded-xl border-2 ${errors.surface ? 'border-red-500' : 'border-gray-200'}`}
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">🛏️ Chambres</Label>
                <Select 
                  value={formData.propertyDetails.bedrooms} 
                  onValueChange={(v) => handleNestedChange('propertyDetails', 'bedrooms', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} chambre{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">🚿 Salles de bain</Label>
                <Select 
                  value={formData.propertyDetails.bathrooms} 
                  onValueChange={(v) => handleNestedChange('propertyDetails', 'bathrooms', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">🏢 Étages</Label>
                <Select 
                  value={formData.propertyDetails.floors} 
                  onValueChange={(v) => handleNestedChange('propertyDetails', 'floors', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Rez-de-chaussée</SelectItem>
                    {[1,2,3,4,5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} étage{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">État du bien</Label>
                <Select 
                  value={formData.propertyDetails.condition} 
                  onValueChange={(v) => handleNestedChange('propertyDetails', 'condition', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner l'état" />
                  </SelectTrigger>
                  <SelectContent>
                    {constants?.conditionOptions?.PROPERTY?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Année de construction</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={formData.propertyDetails.yearBuilt}
                  onChange={(e) => handleNestedChange('propertyDetails', 'yearBuilt', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">🚗 Places de parking</Label>
                <Select 
                  value={formData.propertyDetails.parking} 
                  onValueChange={(v) => handleNestedChange('propertyDetails', 'parking', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pas de parking</SelectItem>
                    {[1,2,3,4,5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} place{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.category === 'RENT' && (
              <div>
                <Label className="text-gray-700 font-semibold">Ameublement</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {constants?.furnishedOptions?.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleNestedChange('propertyDetails', 'furnished', opt.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        formData.propertyDetails.furnished === opt.value
                          ? 'border-kama-blue bg-kama-blue/5 text-kama-blue'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">
                        {opt.value === 'UNFURNISHED' ? '🏠' : opt.value === 'SEMI_FURNISHED' ? '🛋️' : '🏡'}
                      </span>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">Services disponibles</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <Checkbox
                    checked={formData.propertyDetails.hasWater}
                    onCheckedChange={(checked) => handleNestedChange('propertyDetails', 'hasWater', checked)}
                  />
                  <div>
                    <span className="font-semibold">💧 Eau courante</span>
                    <p className="text-xs text-gray-500">SEEG ou forage</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <Checkbox
                    checked={formData.propertyDetails.hasElectricity}
                    onCheckedChange={(checked) => handleNestedChange('propertyDetails', 'hasElectricity', checked)}
                  />
                  <div>
                    <span className="font-semibold">⚡ Électricité</span>
                    <p className="text-xs text-gray-500">SEEG ou groupe</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <Checkbox
                    checked={formData.propertyDetails.hasInternet}
                    onCheckedChange={(checked) => handleNestedChange('propertyDetails', 'hasInternet', checked)}
                  />
                  <div>
                    <span className="font-semibold">📶 Internet/Fibre</span>
                    <p className="text-xs text-gray-500">Connexion disponible</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">Équipements et commodités</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {constants?.propertyAmenities?.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.propertyDetails.amenities?.includes(opt.value)
                        ? 'border-kama-gold bg-kama-gold/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={formData.propertyDetails.amenities?.includes(opt.value)}
                      onCheckedChange={() => handleArrayToggle('propertyDetails', 'amenities', opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* VÉHICULE */}
        {formData.type === 'CAR' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">🚗 Marque *</Label>
                <Select 
                  value={formData.vehicleDetails.brand} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'brand', v)}
                >
                  <SelectTrigger className={`h-12 mt-2 rounded-xl border-2 ${errors.brand ? 'border-red-500' : 'border-gray-200'}`}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {constants?.carBrands?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">Modèle</Label>
                <Input
                  placeholder="Ex: Corolla, Classe C, X5..."
                  value={formData.vehicleDetails.model}
                  onChange={(e) => handleNestedChange('vehicleDetails', 'model', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Année *
                </Label>
                <Select 
                  value={formData.vehicleDetails.year} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'year', v)}
                >
                  <SelectTrigger className={`h-12 mt-2 rounded-xl border-2 ${errors.year ? 'border-red-500' : 'border-gray-200'}`}>
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 30}, (_, i) => 2025 - i).map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">📏 Kilométrage</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.vehicleDetails.mileage}
                  onChange={(e) => handleNestedChange('vehicleDetails', 'mileage', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200"
                />
                <span className="text-xs text-gray-500">km</span>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Fuel className="w-4 h-4" /> Carburant
                </Label>
                <Select 
                  value={formData.vehicleDetails.fuel} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'fuel', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {constants?.fuelTypes?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Transmission
                </Label>
                <Select 
                  value={formData.vehicleDetails.transmission} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'transmission', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {constants?.transmissionTypes?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">État</Label>
                <Select 
                  value={formData.vehicleDetails.condition} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'condition', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="État" />
                  </SelectTrigger>
                  <SelectContent>
                    {constants?.conditionOptions?.VEHICLE?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-700 font-semibold">🎨 Couleur</Label>
                <Input
                  placeholder="Ex: Noir, Blanc, Gris..."
                  value={formData.vehicleDetails.color}
                  onChange={(e) => handleNestedChange('vehicleDetails', 'color', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">🚪 Portes</Label>
                <Select 
                  value={formData.vehicleDetails.doors} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'doors', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2,3,4,5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} portes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 font-semibold">💺 Places</Label>
                <Select 
                  value={formData.vehicleDetails.seats} 
                  onValueChange={(v) => handleNestedChange('vehicleDetails', 'seats', v)}
                >
                  <SelectTrigger className="h-12 mt-2 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2,4,5,6,7,8,9].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} places</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">Documents et garanties</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl cursor-pointer hover:bg-green-100 transition">
                  <Checkbox
                    checked={formData.vehicleDetails.firstHand}
                    onCheckedChange={(checked) => handleNestedChange('vehicleDetails', 'firstHand', checked)}
                  />
                  <div>
                    <span className="font-semibold text-green-800">✋ Première main</span>
                    <p className="text-xs text-green-600">Un seul propriétaire</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition">
                  <Checkbox
                    checked={formData.vehicleDetails.hasInsurance}
                    onCheckedChange={(checked) => handleNestedChange('vehicleDetails', 'hasInsurance', checked)}
                  />
                  <div>
                    <span className="font-semibold text-blue-800">🛡️ Assuré</span>
                    <p className="text-xs text-blue-600">Assurance valide</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition">
                  <Checkbox
                    checked={formData.vehicleDetails.hasTechnicalControl}
                    onCheckedChange={(checked) => handleNestedChange('vehicleDetails', 'hasTechnicalControl', checked)}
                  />
                  <div>
                    <span className="font-semibold text-amber-800">🔧 Visite technique</span>
                    <p className="text-xs text-amber-600">Contrôle à jour</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">Options et équipements</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {constants?.vehicleFeatures?.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.vehicleDetails.features?.includes(opt.value)
                        ? 'border-kama-gold bg-kama-gold/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={formData.vehicleDetails.features?.includes(opt.value)}
                      onCheckedChange={() => handleArrayToggle('vehicleDetails', 'features', opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Step 4: Media
  const renderStep4 = () => (
    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-kama-gold/10 rounded-xl flex items-center justify-center">
            <span className="text-xl">4️⃣</span>
          </div>
          Photos et vidéo
        </CardTitle>
        <CardDescription>Ajoutez des médias pour attirer plus d'acheteurs</CardDescription>
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

        {/* Photos Upload avec FileUploader */}
        <FileUploader
          label="Photos de votre bien"
          description="Glissez vos photos ici ou cliquez pour sélectionner"
          acceptedTypes="image"
          maxFiles={5}
          existingFiles={formData.uploadedImages}
          onUpload={handleImagesUpload}
        />

        {/* Video Upload avec FileUploader */}
        <FileUploader
          label="Vidéo (optionnel)"
          description="Glissez votre vidéo ici ou cliquez pour sélectionner"
          acceptedTypes="video"
          maxFiles={1}
          existingFiles={formData.uploadedVideo ? [formData.uploadedVideo] : []}
          onUpload={handleVideoUpload}
        />

        {/* Documents Info */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 mb-2">Documents requis</p>
              <p className="text-sm text-amber-700 mb-3">
                Après la création de votre annonce, vous devrez soumettre les documents suivants pour validation :
              </p>
              <ul className="text-sm text-amber-700 space-y-1">
                {constants?.requiredDocuments?.[formData.type]?.map((doc) => (
                  <li key={doc.value} className="flex items-center gap-2">
                    {doc.required ? (
                      <Badge className="bg-red-100 text-red-700 text-xs">Obligatoire</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">Optionnel</Badge>
                    )}
                    {doc.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster />
      
      {/* Header */}
      <div className="relative bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
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
              <h1 className="text-4xl font-black text-white">Publier une annonce</h1>
              <p className="text-blue-100 text-lg mt-1">Partagez votre bien avec des milliers d'acheteurs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderStepIndicator()}
          
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {/* Pour Location: étape 3 = Médias, Pour Vente: étape 3 = Spécificités */}
            {currentStep === 3 && formData.category === 'SALE' && renderStep3()}
            {currentStep === 3 && formData.category === 'RENT' && renderStep4()}
            {currentStep === 4 && formData.category === 'SALE' && renderStep4()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="px-8 h-12 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              ) : (
                <div></div>
              )}
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-kama-blue to-blue-600 hover:shadow-lg text-white px-8 h-12 rounded-xl"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/30 text-white px-8 h-14 rounded-xl font-bold"
                  disabled={loading}
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
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
