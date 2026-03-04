'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'MEDIA_REJECTED':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'LISTING_APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'LISTING_REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / 60000);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0 
              ? `Vous avez ${unreadCount} nouvelle(s) notification(s)`
              : 'Aucune nouvelle notification'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Card
                key={notif._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notif.read ? 'border-l-4 border-l-kama-gold bg-kama-gold/5' : ''
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-kama-gold rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notif.createdAt)}
                        </span>
                        {notif.actionUrl && (
                          <span className="text-xs text-kama-blue font-medium">
                            Voir →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
