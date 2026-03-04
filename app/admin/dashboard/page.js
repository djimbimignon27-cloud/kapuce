'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, FileText, DollarSign, AlertTriangle, 
  LogOut, Settings, Shield, TrendingUp, Eye, CheckCircle, XCircle,
  Menu, X, Clock, Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    if (!token || !user.id) {
      router.push('/admin/login');
      return;
    }

    setAdminUser(user);
    fetchStats(token);
  }, []);

  const fetchStats = async (token) => {
    try {
      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les statistiques',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'users', label: 'Utilisateurs', icon: Users, badge: stats?.users?.total || 0 },
    { id: 'listings', label: 'Annonces', icon: FileText, badge: stats?.listings?.pending || 0, color: 'yellow' },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, badge: stats?.transactions?.total || 0 },
    { id: 'reports', label: 'Signalements', icon: AlertTriangle, badge: stats?.reports?.pending || 0, color: 'red' },
  ];

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">KAMA Admin</h2>
                <p className="text-gray-400 text-xs">Panneau d'administration</p>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="p-4 bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {adminUser.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{adminUser.fullName}</p>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  {adminUser.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <Badge className={`${
                      item.color === 'yellow' ? 'bg-yellow-500' :
                      item.color === 'red' ? 'bg-red-500' :
                      'bg-blue-500'
                    } text-white border-0`}>
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800">
                <Home className="w-5 h-5 mr-3" />
                Retour au site
              </Button>
            </Link>
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  Gérez votre plateforme KAMA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{adminUser.fullName}</p>
                <p className="text-xs text-gray-600">{adminUser.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Total Utilisateurs
                        </CardTitle>
                        <Users className="w-4 h-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.users.total}</div>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="text-green-600 font-semibold">+{stats.users.newToday}</span> aujourd'hui
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Utilisateurs Vérifiés
                        </CardTitle>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.users.verified}</div>
                        <p className="text-xs text-gray-600 mt-1">
                          {((stats.users.verified / stats.users.total) * 100).toFixed(1)}% du total
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Annonces en Attente
                        </CardTitle>
                        <Clock className="w-4 h-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.listings.pending}</div>
                        <p className="text-xs text-gray-600 mt-1">
                          {stats.listings.active} actives
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-kama-gold">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          Revenus (Commission)
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-kama-gold" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XAF',
                            maximumFractionDigits: 0,
                          }).format(stats.revenue.totalCommission)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Commission 7%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions Rapides</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                          onClick={() => setActiveTab('listings')}
                          className="h-24 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 flex flex-col gap-2"
                        >
                          <FileText className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-lg">{stats.listings.pending}</div>
                            <div className="text-xs">Annonces à valider</div>
                          </div>
                        </Button>
                        
                        <Button 
                          onClick={() => setActiveTab('reports')}
                          className="h-24 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex flex-col gap-2"
                        >
                          <AlertTriangle className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-lg">{stats.reports.pending}</div>
                            <div className="text-xs">Signalements</div>
                          </div>
                        </Button>
                        
                        <Button 
                          onClick={() => setActiveTab('users')}
                          className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex flex-col gap-2"
                        >
                          <Users className="w-8 h-8" />
                          <div>
                            <div className="font-bold text-lg">{stats.users.total}</div>
                            <div className="text-xs">Gérer utilisateurs</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Utilisateurs Récents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.recentActivity.users.map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {user.fullName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{user.fullName}</p>
                                  <p className="text-xs text-gray-600">{user.email}</p>
                                </div>
                              </div>
                              <Badge className={user.emailVerified ? 'bg-green-500' : 'bg-gray-400'}>
                                {user.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Transactions Récentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.recentActivity.transactions.map((tx) => (
                            <div key={tx._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{tx.listingId?.title || 'N/A'}</p>
                                <p className="text-xs text-gray-600">
                                  Commission: {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'XAF',
                                    maximumFractionDigits: 0,
                                  }).format(tx.commissionAmount)}
                                </p>
                              </div>
                              <Badge className={tx.status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'}>
                                {tx.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab !== 'dashboard' && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 className="text-2xl font-bold mb-2">Section en construction</h3>
                    <p className="text-gray-600">
                      La section {menuItems.find(item => item.id === activeTab)?.label} est en cours de développement.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
