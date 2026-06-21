'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, MessageCircle, Shield, Search, Eye, User,
  AlertTriangle, Filter, Clock, Ban, Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function AdminMessagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, FLAGGED, SUSPICIOUS

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchConversations(token);
  }, [filter]);

  const fetchConversations = async (token) => {
    try {
      const response = await fetch(`/api/admin/messages?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('adminAccessToken')}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const response = await fetch(`/api/admin/messages/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
    loadConversationMessages(conv._id);
  };

  const filteredConversations = conversations.filter(conv => {
    const searchMatch = !searchTerm || 
      conv.participants?.some(p => 
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      conv.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster />
      
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-kama-gold" />
                Supervision des Messages
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Avertissement */}
        <Card className="bg-blue-900/20 border-blue-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-100 font-semibold">Supervision Confidentielle</p>
                <p className="text-blue-300 text-sm">
                  Vous avez accès à toutes les conversations de la plateforme pour assurer la sécurité 
                  et prévenir la fraude. Cette fonction doit être utilisée uniquement dans le cadre de 
                  la modération et de la protection des utilisateurs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'ALL' ? 'default' : 'outline'}
              onClick={() => setFilter('ALL')}
              className={filter === 'ALL' ? 'bg-kama-gold text-white' : 'border-gray-600 text-gray-400'}
            >
              Toutes
            </Button>
            <Button
              variant={filter === 'FLAGGED' ? 'default' : 'outline'}
              onClick={() => setFilter('FLAGGED')}
              className={filter === 'FLAGGED' ? 'bg-red-600 text-white' : 'border-gray-600 text-gray-400'}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signalées
            </Button>
            <Button
              variant={filter === 'SUSPICIOUS' ? 'default' : 'outline'}
              onClick={() => setFilter('SUSPICIOUS')}
              className={filter === 'SUSPICIOUS' ? 'bg-orange-600 text-white' : 'border-gray-600 text-gray-400'}
            >
              <Shield className="w-4 h-4 mr-2" />
              Suspectes
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des conversations */}
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Aucune conversation</p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conv) => (
                <Card
                  key={conv._id}
                  className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-kama-gold ${
                    selectedConversation?._id === conv._id ? 'border-kama-gold' : ''
                  }`}
                  onClick={() => selectConversation(conv)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div className="flex items-center gap-2">
                          {conv.participants?.map((p, idx) => (
                            <span key={idx} className="text-white font-medium">
                              {p?.fullName || 'Utilisateur'}
                              {idx < conv.participants.length - 1 && <span className="text-gray-500 mx-1">↔</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                      {conv.hasFlaggedMessages && (
                        <Badge className="bg-red-500/20 text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Alertes
                        </Badge>
                      )}
                    </div>
                    
                    {conv.listingTitle && (
                      <p className="text-xs text-kama-blue mb-2">
                        Concernant: {conv.listingTitle}
                      </p>
                    )}
                    
                    {conv.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400 truncate flex-1">
                          {conv.lastMessage.content}
                        </p>
                        <span className="text-xs text-gray-600 ml-2">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Messages de la conversation sélectionnée */}
          <div className="sticky top-24">
            {selectedConversation ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="border-b border-gray-700">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-kama-gold" />
                    Messages
                  </CardTitle>
                  {selectedConversation.listingTitle && (
                    <p className="text-sm text-gray-400">
                      Annonce: {selectedConversation.listingTitle}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun message</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`p-3 rounded-xl ${
                          msg.isFiltered 
                            ? 'bg-red-900/20 border border-red-500/30' 
                            : 'bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-kama-gold rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {msg.sender?.fullName?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-white text-sm font-medium">
                              {msg.sender?.fullName || 'Utilisateur'}
                            </span>
                            {msg.isFiltered && (
                              <Badge className="bg-red-500 text-white text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Filtré
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        
                        <p className="text-gray-200 text-sm">{msg.content}</p>
                        
                        {msg.isFiltered && msg.originalContent && (
                          <div className="mt-2 pt-2 border-t border-red-500/30">
                            <p className="text-xs text-red-400 mb-1">Contenu original:</p>
                            <p className="text-xs text-gray-400 italic">{msg.originalContent}</p>
                            {msg.filterReason && (
                              <p className="text-xs text-orange-400 mt-1">
                                Raison: {msg.filterReason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-16 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    Sélectionnez une conversation pour voir les messages
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
