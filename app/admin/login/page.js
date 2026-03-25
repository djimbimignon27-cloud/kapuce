'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, AlertCircle, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
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
          title: '🔐 Connexion réussie',
          description: `Bienvenue ${data.user.fullName}`,
        });
        
        // Redirection immédiate après un court délai
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 500);
      } else {
        toast({
          title: 'Accès refusé',
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1612637968894-660373e23b03?crop=entropy&cs=srgb&fm=jpg')] bg-cover bg-center opacity-5"></div>
      </div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <Toaster />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom duration-700">
          <Card className="backdrop-blur-xl bg-gray-900/80 shadow-2xl border border-gray-800 rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-8 border-b border-gray-800">
              {/* Shield Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full animate-pulse"></div>
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-red-500/30">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-3xl font-black text-white">
                Administration KAMA
              </CardTitle>
              <CardDescription className="text-gray-400 text-base mt-2">
                Accès restreint - Administrateurs uniquement
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8 pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 font-semibold flex items-center gap-2">
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
                    className={`h-14 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:border-red-500 focus:ring-red-500/20 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 font-semibold flex items-center gap-2">
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
                      className={`h-14 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-xl focus:border-red-500 focus:ring-red-500/20 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
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

                {/* Security Warning */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Zone sécurisée:</strong> Toutes les tentatives de connexion sont enregistrées et surveillées.
                    </span>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-700 hover:via-red-600 hover:to-red-700 text-white font-bold text-base rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Vérification...
                    </div>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Accéder au panneau
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <Link href="/" className="text-gray-400 text-sm hover:text-white transition">
                  ← Retour au site principal
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <div className="mt-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connexion SSL/TLS chiffrée</span>
            </div>
            <p className="text-gray-600 text-xs">
              © 2024 KAMA - Système d'administration sécurisé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}