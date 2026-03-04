'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, User, Phone, AlertCircle, ArrowLeft, CheckCircle, Shield, Home, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('USER');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && ['USER', 'OWNER', 'AGENCY'].includes(type)) {
      setAccountType(type);
    }
  }, [searchParams]);

  const accountTypeInfo = {
    USER: { icon: User, title: 'Utilisateur', color: 'blue' },
    OWNER: { icon: Home, title: 'Propriétaire', color: 'kama-gold' },
    AGENCY: { icon: Building2, title: 'Agence', color: 'kama-blue' },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Nom complet requis';
    if (!formData.email) newErrors.email = 'Email requis';
    if (!formData.phone) newErrors.phone = 'Téléphone requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Vous devez accepter les conditions';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: accountType,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: 'Inscription réussie! 🎉',
          description: 'Un email de vérification vous a été envoyé',
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast({
          title: 'Erreur d\'inscription',
          description: data.error || 'Erreur lors de l\'inscription',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const AccountIcon = accountTypeInfo[accountType].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster />
      
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-kama-gold rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative w-full max-w-xl animate-in fade-in slide-in-from-bottom duration-700">
        {/* Back Button */}
        <Link href="/auth/choose-account">
          <Button variant="ghost" className="mb-4 text-white hover:text-kama-gold hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Choisir un autre type de compte
          </Button>
        </Link>

        <Card className="backdrop-blur-lg bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-6 border-b border-gray-100">
            <div className="flex justify-center mb-6">
              <img 
                src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                alt="KAMA Logo" 
                className="h-16 w-auto"
              />
            </div>
            
            {/* Account Type Badge */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-kama-gold/10 to-yellow-100 rounded-full border-2 border-kama-gold/20">
                <div className="p-2 bg-gradient-to-r from-kama-gold to-yellow-600 rounded-lg">
                  <AccountIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">
                  Compte {accountTypeInfo[accountType].title}
                </span>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-kama-blue to-blue-600 bg-clip-text text-transparent">
              Créez votre compte
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Inscrivez-vous en quelques secondes
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-kama-blue" />
                  Nom complet
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`h-12 ${errors.fullName ? 'border-red-500' : 'border-gray-300 focus:border-kama-blue'}`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-kama-blue" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-12 ${errors.email ? 'border-red-500' : 'border-gray-300 focus:border-kama-blue'}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-kama-blue" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+241 XX XX XX XX"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`h-12 ${errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-kama-blue'}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-kama-blue" />
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 6 caractères"
                    value={formData.password}
                    onChange={handleChange}
                    className={`h-12 ${errors.password ? 'border-red-500' : 'border-gray-300 focus:border-kama-blue'}`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-kama-blue" />
                    Confirmer
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Retaper"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`h-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-kama-blue'}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, acceptTerms: checked });
                    if (errors.acceptTerms) setErrors({ ...errors, acceptTerms: '' });
                  }}
                  className="mt-1"
                />
                <Label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  J'accepte les{' '}
                  <Link href="/terms" className="text-kama-blue font-semibold hover:underline">
                    conditions générales d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/privacy" className="text-kama-blue font-semibold hover:underline">
                    politique de confidentialité
                  </Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm flex items-center gap-1 -mt-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.acceptTerms}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-kama-gold to-yellow-600 hover:from-kama-gold/90 hover:to-yellow-600/90 text-white shadow-lg hover:shadow-xl transition-all text-base font-bold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Création en cours...
                  </div>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Créer mon compte
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600">
                Déjà inscrit?{' '}
                <Link href="/auth/login" className="text-kama-blue font-semibold hover:text-kama-gold transition">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-white/90 text-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <span>Inscription gratuite</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <span>100% sécurisé</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-kama-gold" />
            </div>
            <span>Accès immédiat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
