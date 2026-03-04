'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Home, Building2, ArrowLeft, CheckCircle, Shield } from 'lucide-react';

export default function ChooseAccountPage() {
  const router = useRouter();

  const accountTypes = [
    {
      type: 'USER',
      icon: User,
      title: 'Utilisateur',
      subtitle: 'Acheter ou louer',
      description: 'Naviguez et trouvez votre bien idéal',
      features: [
        'Accès à toutes les annonces',
        'Sauvegarder vos favoris',
        'Contacter les vendeurs',
        'Laisser des avis',
      ],
      color: 'from-blue-500 to-blue-600',
      badge: 'Populaire',
    },
    {
      type: 'OWNER',
      icon: Home,
      title: 'Propriétaire',
      subtitle: 'Vendre ou louer',
      description: 'Publiez vos biens et gérez vos annonces',
      features: [
        'Publier des annonces',
        'Gérer vos biens',
        'Statistiques détaillées',
        'Badge vérifié',
      ],
      color: 'from-kama-gold to-yellow-600',
      badge: 'Recommandé',
    },
    {
      type: 'AGENCY',
      icon: Building2,
      title: 'Agence / Garage',
      subtitle: 'Professionnel',
      description: 'Solution complète pour les professionnels',
      features: [
        'Annonces illimitées',
        'Page agence dédiée',
        'Outils de gestion avancés',
        'Support prioritaire',
      ],
      color: 'from-kama-blue to-blue-700',
      badge: 'Pro',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-kama-blue via-blue-700 to-kama-blue relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-kama-gold rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="text-white hover:text-kama-gold hover:bg-white/10 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-kama-blue via-kama-gold to-blue-600 blur-3xl opacity-40 group-hover:opacity-60 transition-all rounded-full animate-pulse"></div>
              <img 
                src="https://customer-assets.emergentagent.com/job_trusted-transactions/artifacts/edwa4pun_IMG-20260221-WA0185.jpg" 
                alt="KAMA Logo" 
                className="h-32 w-auto relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform brightness-0 invert"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choisissez votre type de compte
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Sélectionnez le type de compte qui correspond à vos besoins
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {accountTypes.map((account, index) => {
            const Icon = account.icon;
            return (
              <Card 
                key={account.type}
                className="group relative overflow-hidden bg-white/95 backdrop-blur-lg border-2 border-transparent hover:border-kama-gold transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105"
                onClick={() => router.push(`/auth/register?type=${account.type}`)}
                style={{animationDelay: `${index * 150}ms`}}
              >
                {/* Badge */}
                {account.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className={`bg-gradient-to-r ${account.color} text-white border-0 shadow-lg`}>
                      {account.badge}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8">
                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${account.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {account.title}
                  </h3>
                  <p className="text-kama-gold font-semibold mb-3">
                    {account.subtitle}
                  </p>
                  <p className="text-gray-600 mb-6">
                    {account.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {account.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button 
                    className={`w-full h-12 bg-gradient-to-r ${account.color} hover:opacity-90 text-white shadow-lg text-base font-semibold`}
                  >
                    Choisir {account.title}
                  </Button>
                </CardContent>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-kama-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="text-center text-white/80">
          <div className="flex items-center justify-center gap-8 mb-6">
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
            <Link href="/auth/login" className="text-kama-gold font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
