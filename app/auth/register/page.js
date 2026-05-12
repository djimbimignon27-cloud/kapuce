'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, User, Phone, AlertCircle, ArrowLeft, CheckCircle, Shield, Home, Building2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    USER: { icon: User, title: 'Utilisateur', gradient: 'from-blue-500 to-blue-600' },
    OWNER: { icon: Home, title: 'Propriétaire', gradient: 'from-kama-gold to-yellow-600' },
    AGENCY: { icon: Building2, title: 'Agence', gradient: 'from-kama-blue to-blue-700' },
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
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone) newErrors.phone = 'Téléphone requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
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
          title: '🎉 Inscription réussie!',
          description: 'Bienvenue sur KAPUCE.G! Votre compte a été créé.',
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        toast({
          title: 'Erreur d\'inscription',
          description: data.error || 'Une erreur est survenue',
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523217582562-09d0def993a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85')] bg-cover bg-center opacity-10"></div>
      </div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <Toaster />

      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom duration-700">
          {/* Back Button */}
          <Link href="/auth/choose-account">
            <Button variant="ghost" className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Changer de type de compte
            </Button>
          </Link>

          <Card className="backdrop-blur-xl bg-white/95 shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-8 border-b border-gray-100">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-kama-gold to-yellow-500 blur-2xl opacity-30 group-hover:opacity-50 transition-all rounded-full"></div>
                  <div className="relative z-10 flex items-center justify-center h-20 w-20 bg-gradient-to-br from-kama-blue to-blue-700 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform">
                    <span className="text-white font-black text-2xl">K.G</span>
                  </div>
                </div>
              </div>
              
              {/* Account Type Badge */}
              <div className="flex justify-center mb-4">
                <div className={`flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r ${accountTypeInfo[accountType].gradient} rounded-full`}>
                  <AccountIcon className="w-5 h-5 text-white" />
                  <span className="font-bold text-white">
                    Compte {accountTypeInfo[accountType].title}
                  </span>
                </div>
              </div>

              <CardTitle className="text-2xl font-black text-gray-900">
                Créez votre compte
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Rejoignez la communauté KAPUCE.G
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8 pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700 font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-kama-blue" />
                    Nom complet
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Jean Dupont"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`h-12 rounded-xl border-2 transition-all ${errors.fullName ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
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
                    <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-2">
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
                      className={`h-12 rounded-xl border-2 transition-all ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold flex items-center gap-2">
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
                      className={`h-12 rounded-xl border-2 transition-all ${errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
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
                    <Label htmlFor="password" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-kama-blue" />
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 caractères"
                        value={formData.password}
                        onChange={handleChange}
                        className={`h-12 pr-10 rounded-xl border-2 transition-all ${errors.password ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-kama-blue" />
                      Confirmer
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Retaper le mot de passe"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`h-12 rounded-xl border-2 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-kama-blue'}`}
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
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
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
                      conditions générales
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
                  className="w-full h-14 bg-gradient-to-r from-kama-gold via-yellow-500 to-kama-gold hover:shadow-lg hover:shadow-kama-gold/30 text-white font-bold text-base rounded-xl transition-all hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création en cours...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Créer mon compte
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-gray-600">
                  Déjà inscrit?{' '}
                  <Link href="/auth/login" className="text-kama-blue font-bold hover:text-kama-gold transition">
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center text-white/80 text-xs">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span>Gratuit</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <span>Sécurisé</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-kama-gold" />
              </div>
              <span>Instant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}