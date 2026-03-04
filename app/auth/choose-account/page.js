'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Home, Building2, ArrowLeft, CheckCircle, Shield, Sparkles, Star, ArrowRight } from 'lucide-react';

export default function ChooseAccountPage() {
  const router = useRouter();

  const accountTypes = [
    {
      type: 'USER',
      icon: User,
      title: 'Utilisateur',
      subtitle: 'Acheter ou louer un bien',
      description: 'Naviguez parmi des milliers d\'annonces vérifiées et trouvez votre bien idéal',
      features: [
        'Accès à toutes les annonces',
        'Sauvegarde des favoris',
        'Contact direct vendeurs',
        'Alertes personnalisées',
      ],
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
      badge: 'Populaire',
      badgeColor: 'bg-blue-500',
    },
    {
      type: 'OWNER',
      icon: Home,
      title: 'Propriétaire',
      subtitle: 'Vendre ou louer votre bien',
      description: 'Publiez vos biens et gérez vos annonces en toute simplicité',
      features: [
        'Publication d\'annonces',
        'Statistiques détaillées',
        'Badge propriétaire vérifié',
        'Gestion des contacts',
      ],
      gradient: 'from-kama-gold to-yellow-600',
      bgGradient: 'from-kama-gold/10 to-yellow-600/5',
      badge: 'Recommandé',
      badgeColor: 'bg-kama-gold',
    },
    {
      type: 'AGENCY',
      icon: Building2,
      title: 'Agence / Pro',
      subtitle: 'Solution professionnelle',
      description: 'Outils avancés pour les agences immobilières et garages automobiles',
      features: [
        'Annonces illimitées',
        'Page agence dédiée',
        'Outils de gestion pro',
        'Support prioritaire',
      ],
      gradient: 'from-kama-blue to-blue-700',
      bgGradient: 'from-kama-blue/10 to-blue-700/5',
      badge: 'Pro',
      badgeColor: 'bg-kama-blue',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-kama-blue via-blue-700 to-blue-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1694771170091-849084a0d677?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBhZnJpY2FuJTIwcmVhbCUyMGVzdGF0ZXxlbnwwfHx8fDE3NzI1OTYxMTB8MA&ixlib=rb-4.1.0&q=85')] bg-cover bg-center opacity-10"></div>
      </div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kama-gold/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-kama-gold to-yellow-500 blur-3xl opacity-40 group-hover:opacity-60 transition-all rounded-full animate-pulse"></div>
              <img 
                src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                alt="KAMA Logo" 
                className="h-28 w-auto relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform"
              />
            </div>
          </div>
          <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Inscription gratuite
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Choisissez votre profil
          </h1>
          <p className="text-xl text-blue-100/90 max-w-2xl mx-auto">
            Sélectionnez le type de compte qui correspond le mieux à vos besoins
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {accountTypes.map((account, index) => {
            const Icon = account.icon;
            return (
              <Card 
                key={account.type}
                className="group relative overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl"
                onClick={() => router.push(`/auth/register?type=${account.type}`)}
                style={{animationDelay: `${index * 100}ms`}}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className={`${account.badgeColor} text-white border-0 shadow-lg font-semibold`}>
                    <Star className="w-3 h-3 mr-1" />
                    {account.badge}
                  </Badge>
                </div>

                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${account.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <CardContent className="relative z-10 p-8">
                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${account.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {account.title}
                  </h3>
                  <p className="text-kama-gold font-semibold mb-3">
                    {account.subtitle}
                  </p>
                  <p className="text-gray-600 mb-6 min-h-[3rem]">
                    {account.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {account.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${account.gradient} flex items-center justify-center flex-shrink-0`}>
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button 
                    className={`w-full h-14 bg-gradient-to-r ${account.gradient} hover:opacity-90 text-white shadow-lg font-bold text-base rounded-xl transition-all group-hover:shadow-xl`}
                  >
                    Choisir ce profil
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>

                {/* Bottom Gradient Line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${account.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}></div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="text-center text-white/80">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Inscription 100% gratuite</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>Vérification sécurisée</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-kama-gold" />
              <span>Support 24/7</span>
            </div>
          </div>
          <p className="text-sm">
            Déjà inscrit?{' '}
            <Link href="/auth/login" className="text-kama-gold font-bold hover:text-white transition">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}