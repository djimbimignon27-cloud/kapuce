'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({
          title: '🎉 Connexion réussie!',
          description: `Bienvenue ${data.user.fullName}`,
        });
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        toast({
          title: 'Erreur de connexion',
          description: data.error || 'Identifiants incorrects',
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3MjU5NjExM3ww&ixlib=rb-4.1.0&q=85')] bg-cover bg-center opacity-10"></div>
      </div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <Toaster />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>

          <Card className="backdrop-blur-xl bg-white/95 shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-kama-gold to-yellow-500 blur-2xl opacity-30 group-hover:opacity-50 transition-all rounded-full"></div>
                  <div className="relative z-10 flex items-center justify-center h-24 w-24 bg-gradient-to-br from-kama-blue to-blue-700 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform">
                    <span className="text-white font-black text-3xl">K.G</span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-black text-gray-900">
                Bon retour! 👋
              </CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Connectez-vous pour accéder à votre espace
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-kama-blue" />
                    Adresse email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="exemple@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`h-14 pl-4 text-base rounded-xl border-2 transition-all ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-kama-blue focus:ring-kama-blue/20'}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

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
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={`h-14 pl-4 pr-12 text-base rounded-xl border-2 transition-all ${errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-kama-blue focus:ring-kama-blue/20'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-sm text-kama-blue hover:text-kama-gold transition font-medium">
                    Mot de passe oublié?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-kama-blue via-blue-600 to-kama-blue hover:shadow-lg hover:shadow-kama-blue/30 text-white font-bold text-base rounded-xl transition-all hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connexion en cours...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-gray-600">
                  Pas encore de compte?{' '}
                  <Link href="/auth/choose-account" className="text-kama-gold font-bold hover:text-kama-blue transition">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connexion sécurisée</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-kama-gold" />
              <span>SSL 256-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}