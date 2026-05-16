'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Camera, Save, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    bio: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData({
      fullName: parsedUser.fullName || '',
      phone: parsedUser.phone || '',
      address: parsedUser.address || '',
      city: parsedUser.city || '',
      bio: parsedUser.bio || '',
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Mettre à jour le localStorage
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        toast({
          title: '✅ Profil mis à jour',
          description: 'Vos informations ont été enregistrées avec succès.',
        });
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 bg-gradient-to-br from-kama-blue to-blue-700 rounded-xl">
                <span className="text-white font-black text-sm">K.G</span>
              </div>
              <span className="font-bold text-xl text-kama-blue">KAPUCE.G</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </Link>

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          {/* Header with Avatar */}
          <div className="h-32 bg-gradient-to-r from-kama-blue to-blue-600 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-kama-gold to-yellow-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white font-black text-3xl">
                    {user.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <CardHeader className="pt-16 pb-2">
            <CardTitle className="text-2xl font-bold">Modifier mon profil</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (non modifiable) */}
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="h-12 mt-2 rounded-xl bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              {/* Nom complet */}
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" /> Nom complet *
                </Label>
                <Input
                  type="text"
                  placeholder="Votre nom complet"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                  required
                />
              </div>

              {/* Téléphone */}
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Téléphone
                </Label>
                <Input
                  type="tel"
                  placeholder="+241 XX XX XX XX"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>

              {/* Ville */}
              <div>
                <Label className="text-gray-700 font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Ville
                </Label>
                <Input
                  type="text"
                  placeholder="Libreville"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>

              {/* Adresse */}
              <div>
                <Label className="text-gray-700 font-semibold">Adresse</Label>
                <Input
                  type="text"
                  placeholder="Votre adresse complète"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="h-12 mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue"
                />
              </div>

              {/* Bio */}
              <div>
                <Label className="text-gray-700 font-semibold">À propos de moi</Label>
                <Textarea
                  placeholder="Présentez-vous en quelques mots..."
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="mt-2 rounded-xl border-2 border-gray-200 focus:border-kama-blue min-h-[100px]"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full h-12 rounded-xl">
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-r from-kama-gold to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
