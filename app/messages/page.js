'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Send, MessageCircle, User, AlertTriangle,
  Search, Clock, CheckCheck, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchConversations(token);

    // Vérifier si on doit ouvrir une conversation spécifique
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      loadConversation(conversationId, token);
    }
  }, []);

  const fetchConversations = async (token) => {
    try {
      const response = await fetch('/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId, token) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setSelectedConversation(conversations.find(c => c._id === conversationId) || { _id: conversationId });
        
        // Scroll vers le bas
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          content: newMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Afficher un avertissement si le message a été filtré
        if (data.warning) {
          toast({
            title: 'Message filtré',
            description: data.warning,
            variant: 'destructive',
          });
        }
        
        // Scroll vers le bas
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Rafraîchir les conversations
        fetchConversations(token);
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible d\'envoyer le message',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
    loadConversation(conv._id);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherParticipant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Link href="/dashboard">
              <Button variant="ghost">Mon compte</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="flex h-full">
            {/* Liste des conversations */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-kama-gold" />
                  Messages
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-kama-gold/20 border-t-kama-gold rounded-full animate-spin"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune conversation</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv._id}
                      onClick={() => selectConversation(conv)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        selectedConversation?._id === conv._id 
                          ? 'bg-kama-blue/5 border-l-4 border-l-kama-gold' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-kama-gold to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">
                            {conv.otherParticipant?.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">
                              {conv.otherParticipant?.fullName || 'Utilisateur'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-kama-gold text-white">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          {conv.listingTitle && (
                            <p className="text-xs text-kama-blue truncate">{conv.listingTitle}</p>
                          )}
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">{conv.lastMessage.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header de la conversation */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-kama-gold to-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {selectedConversation.otherParticipant?.fullName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedConversation.otherParticipant?.fullName || 'Utilisateur'}
                        </p>
                        {selectedConversation.listingTitle && (
                          <p className="text-xs text-gray-500">
                            Concernant: {selectedConversation.listingTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Avertissement de sécurité */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">Communication sécurisée</p>
                          <p className="text-xs text-blue-600">
                            Pour votre sécurité, toutes les communications doivent passer par KAPUCE.G. 
                            L'échange de coordonnées personnelles est interdit.
                          </p>
                        </div>
                      </div>
                    </div>

                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl p-4 ${
                            msg.senderId === user.id
                              ? 'bg-gradient-to-r from-kama-blue to-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.isFiltered && (
                            <div className="flex items-center gap-1 mb-2 text-xs opacity-75">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Message filtré</span>
                            </div>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${
                            msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {msg.senderId === user.id && msg.read && (
                              <CheckCheck className="w-3 h-3 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Zone de saisie */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={sendMessage} className="flex gap-3">
                      <Input
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 h-12 rounded-xl"
                        disabled={sending}
                      />
                      <Button 
                        type="submit" 
                        disabled={sending || !newMessage.trim()}
                        className="h-12 px-6 bg-gradient-to-r from-kama-gold to-yellow-500 text-white rounded-xl"
                      >
                        {sending ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Sélectionnez une conversation</p>
                    <p className="text-gray-400 text-sm">ou contactez un vendeur depuis une annonce</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
