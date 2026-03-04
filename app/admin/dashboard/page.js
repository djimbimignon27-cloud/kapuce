'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, FileText, DollarSign, AlertTriangle, 
  LogOut, Shield, TrendingUp, CheckCircle, XCircle,
  Menu, X, Clock, Home, Settings, Bell, Search,
  ChevronRight, BarChart3, Eye, UserCheck, FileWarning,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';

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
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 border-r border-gray-800`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="animate-in fade-in slide-in-from-left">
                  <h2 className="text-white font-bold text-lg">KAMA Admin</h2>
                  <p className="text-gray-500 text-xs">Panneau d'administration</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Info */}
          {sidebarOpen && (
            <div className="p-4 mx-4 mt-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {adminUser.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{adminUser.fullName}</p>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs mt-1">
                    {adminUser.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-4' : 'justify-center'} py-3.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                  {sidebarOpen && item.badge !== null && item.badge > 0 && (
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
          <div className="p-4 border-t border-gray-800 space-y-2">
            <Link href="/">
              <Button variant="ghost" className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'} text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl`}>
                <Home className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Retour au site</span>}
              </Button>
            </Link>
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'} text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">Déconnexion</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  Gérez votre plateforme KAMA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10 w-64 h-10 bg-gray-50 border-gray-200 rounded-xl"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-red-500" />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Utilisateurs</p>
                            <p className="text-4xl font-black text-gray-900">{stats.users.total}</p>
                            <div className="flex items-center gap-1 mt-2 text-green-500 text-sm">
                              <ArrowUpRight className="w-4 h-4" />
                              <span className="font-medium">+{stats.users.newToday} aujourd'hui</span>
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Utilisateurs Vérifiés</p>
                            <p className="text-4xl font-black text-gray-900">{stats.users.verified}</p>
                            <div className="flex items-center gap-1 mt-2 text-gray-500 text-sm">
                              <Activity className="w-4 h-4" />
                              <span>{stats.users.total > 0 ? ((stats.users.verified / stats.users.total) * 100).toFixed(0) : 0}% du total</span>
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                            <UserCheck className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Annonces en Attente</p>
                            <p className="text-4xl font-black text-gray-900">{stats.listings.pending}</p>
                            <div className="flex items-center gap-1 mt-2 text-yellow-500 text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{stats.listings.active} actives</span>
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                            <FileWarning className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Commission Totale</p>
                            <p className="text-3xl font-black text-gray-900">
                              {new Intl.NumberFormat('fr-FR', {
                                notation: 'compact',
                                compactDisplay: 'short'
                              }).format(stats.revenue.totalCommission)} XAF
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-kama-gold text-sm">
                              <TrendingUp className="w-4 h-4" />
                              <span className="font-medium">7% commission</span>
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-gradient-to-br from-kama-gold to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-kama-gold/30 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Actions Rapides</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                          onClick={() => setActiveTab('listings')}
                          className="group p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 hover:border-yellow-400 transition-all hover:shadow-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <FileText className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="text-3xl font-black text-gray-900">{stats.listings.pending}</p>
                              <p className="text-sm text-gray-600">Annonces à valider</p>
                            </div>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className="group p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <AlertTriangle className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="text-3xl font-black text-gray-900">{stats.reports.pending}</p>
                              <p className="text-sm text-gray-600">Signalements</p>
                            </div>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => setActiveTab('users')}
                          className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Users className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="text-3xl font-black text-gray-900">{stats.users.total}</p>
                              <p className="text-sm text-gray-600">Gérer utilisateurs</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-lg rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-bold">Utilisateurs Récents</CardTitle>
                        <Button variant="ghost" size="sm" className="text-kama-blue">
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.recentActivity.users.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Aucun utilisateur récent</p>
                          ) : (
                            stats.recentActivity.users.map((user) => (
                              <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow">
                                    <span className="text-white font-bold">
                                      {user.fullName?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                                <Badge className={`${user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {user.role}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-bold">Transactions Récentes</CardTitle>
                        <Button variant="ghost" size="sm" className="text-kama-blue">
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.recentActivity.transactions.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Aucune transaction récente</p>
                          ) : (
                            stats.recentActivity.transactions.map((tx) => (
                              <div key={tx._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div>
                                  <p className="font-semibold text-gray-900">{tx.listingId?.title || 'N/A'}</p>
                                  <p className="text-sm text-gray-500">
                                    Commission: {new Intl.NumberFormat('fr-FR', {
                                      style: 'currency',
                                      currency: 'XAF',
                                      maximumFractionDigits: 0,
                                    }).format(tx.commissionAmount)}
                                  </p>
                                </div>
                                <Badge className={`${tx.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {tx.status}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab !== 'dashboard' && (
                <Card className="border-0 shadow-lg rounded-2xl">
                  <CardContent className="p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Settings className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Section en construction</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      La section <span className="font-semibold text-kama-blue">{menuItems.find(item => item.id === activeTab)?.label}</span> est en cours de développement et sera bientôt disponible.
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