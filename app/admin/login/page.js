'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLoginPage() {
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
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminAccessToken', data.accessToken);
        localStorage.setItem('adminRefreshToken', data.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        toast({
          title: '🔐 Connexion admin réussie',
          description: `Bienvenue ${data.user.fullName}`,
        });
        
        setTimeout(() => router.push('/admin/dashboard'), 1000);
      } else {
        toast({
          title: 'Erreur d\'authentification',
          description: data.error || 'Identifiants invalides',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster />
      
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
        <Card className="backdrop-blur-lg bg-gray-900/90 shadow-2xl border-2 border-red-500/20">
          <CardHeader className="text-center pb-8 border-b border-gray-700">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Administration KAMA
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Accès réservé aux administrateurs
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-400" />
                  Email administrateur
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@kama-gabon.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-400" />
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
                    className={`h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5" />
                  <span>Connexion surveillée et enregistrée. Votre adresse IP sera enregistrée.</span>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all text-base font-bold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Accéder au panneau admin
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700 text-center">
              <Link href="/" className="text-gray-400 text-sm hover:text-white transition">
                Retour au site principal
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-6 text-center text-gray-400 text-sm space-y-2">
          <p className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Connexion SSL sécurisée
          </p>
          <p>© 2024 KAMA - Système d'administration sécurisé</p>
        </div>
      </div>
    </div>
  );
}
