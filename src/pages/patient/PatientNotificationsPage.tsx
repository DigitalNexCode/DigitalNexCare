import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { NotificationService } from '../../lib/notifications/notification-service';
import { InAppNotification } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  AlertTriangle,
  CreditCard,
  Star,
  CheckCircle2,
  Mail,
  Smartphone,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Clock,
  Send,
} from 'lucide-react';

export const PatientNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>(() =>
    NotificationService.getNotifications()
  );
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNREAD' | 'APPOINTMENT' | 'REMINDER' | 'SUBSCRIPTION'>(
    'ALL'
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const refreshList = () => {
    setNotifications(NotificationService.getNotifications());
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (selectedFilter === 'UNREAD') return !n.isRead;
    if (selectedFilter === 'APPOINTMENT') {
      return (
        n.type === 'APPOINTMENT_CONFIRMED' ||
        n.type === 'APPOINTMENT_RESCHEDULED' ||
        n.type === 'APPOINTMENT_CANCELLED'
      );
    }
    if (selectedFilter === 'REMINDER') return n.type === 'APPOINTMENT_REMINDER';
    if (selectedFilter === 'SUBSCRIPTION') {
      return (
        n.type === 'SUBSCRIPTION_RENEWAL' ||
        n.type === 'SUBSCRIPTION_LIMIT_WARNING' ||
        n.type === 'PAYMENT_SUCCESS'
      );
    }
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    NotificationService.markAsRead(id);
    refreshList();
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
    refreshList();
  };

  const handleClearAll = () => {
    NotificationService.clearAll();
    refreshList();
  };

  const handleTriggerTestReminder = () => {
    setIsSimulating(true);
    setTimeout(() => {
      NotificationService.createNotification({
        userId: 'patient-lerato-001',
        title: 'Upcoming Consultation in 24 Hours',
        message: 'Reminder: You have a scheduled appointment with Dr. Naledi Mokoena tomorrow at 10:00 AM (Hatfield Medical Centre, Pretoria).',
        type: 'APPOINTMENT_REMINDER',
        channels: ['IN_APP', 'SMS', 'WHATSAPP'],
        actionUrl: '/patient/appointments',
        metadata: {
          practitionerName: 'Dr. Naledi Mokoena',
          date: '2026-09-04',
          time: '10:00',
        },
      });
      refreshList();
      setIsSimulating(false);
    }, 400);
  };

  const getIconForType = (type: InAppNotification['type']) => {
    switch (type) {
      case 'APPOINTMENT_CONFIRMED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'APPOINTMENT_RESCHEDULED':
        return <RefreshCw className="w-5 h-5 text-[#176BFF]" />;
      case 'APPOINTMENT_CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-[#FF3D71]" />;
      case 'APPOINTMENT_REMINDER':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'REVIEW_REQUEST':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 'SUBSCRIPTION_RENEWAL':
      case 'SUBSCRIPTION_LIMIT_WARNING':
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-5 h-5 text-[#00E5D4]" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <PatientLayout
      title="Notifications & Alerts"
      subtitle="Stay updated with instant booking confirmations, 24h consultation reminders, and subscription notices."
    >
      <div className="space-y-6">
        {/* Action Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#176BFF] flex items-center justify-center relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF3D71] text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Communication Center</h2>
              <p className="text-xs text-slate-500">
                Multi-channel notifications dispatched via In-App, SMS, WhatsApp & Email
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerTestReminder}
              isLoading={isSimulating}
              leftIcon={<Send className="w-3.5 h-3.5 text-[#176BFF]" />}
            >
              Simulate 24h Reminder
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-400" />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-[#176BFF] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setSelectedFilter('UNREAD')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'UNREAD'
                ? 'bg-[#176BFF] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setSelectedFilter('APPOINTMENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'APPOINTMENT'
                ? 'bg-[#176BFF] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setSelectedFilter('REMINDER')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'REMINDER'
                ? 'bg-[#176BFF] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Reminders
          </button>
          <button
            onClick={() => setSelectedFilter('SUBSCRIPTION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'SUBSCRIPTION'
                ? 'bg-[#176BFF] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Subscription & Billing
          </button>
        </div>

        {/* List of Notifications */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No Notifications</h3>
              <p className="text-xs text-slate-400">
                You're all caught up! Booking updates and reminders will appear here.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  !item.isRead
                    ? 'bg-blue-50/40 border-[#176BFF]/30 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {getIconForType(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#176BFF]" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                    {/* Multi-Channel Delivery Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                      <span className="text-slate-400">Channels:</span>
                      {item.channels.includes('IN_APP') && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Bell className="w-3 h-3 text-[#176BFF]" /> In-App
                        </span>
                      )}
                      {item.channels.includes('SMS') && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Smartphone className="w-3 h-3 text-emerald-600" /> SMS Sent
                        </span>
                      )}
                      {item.channels.includes('WHATSAPP') && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MessageSquare className="w-3 h-3 text-green-600" /> WhatsApp
                        </span>
                      )}
                      {item.channels.includes('EMAIL') && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Mail className="w-3 h-3 text-blue-600" /> Email
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString('en-ZA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {item.actionUrl && (
                    <Link to={item.actionUrl}>
                      <Button variant="primary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  );
};
