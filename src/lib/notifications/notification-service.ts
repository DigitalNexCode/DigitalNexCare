/**
 * DigitalNexCare Multi-Channel Notification Engine
 * Chunk 7 - In-App, SMS, Email, and WhatsApp Adapters
 */

import {
  InAppNotification,
  NotificationType,
  NotificationChannel,
  ChannelDispatchLog,
  DetailedAppointment,
  PatientSubscriptionTier,
} from '../../types';

const STORAGE_KEY_NOTIFICATIONS = 'dnc_in_app_notifications_v1';

export interface MultiChannelDispatchOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Retrieve all in-app notifications
   */
  static getNotifications(userId?: string): InAppNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (stored) {
        const parsed: InAppNotification[] = JSON.parse(stored);
        return userId ? parsed.filter((n) => n.userId === userId) : parsed;
      }
    } catch {}

    const seedNotifications: InAppNotification[] = [
      {
        id: 'notif-seed-001',
        userId: 'patient-lerato-001',
        type: 'BOOKING_CONFIRMATION',
        title: 'Consultation Confirmed',
        message: 'Your appointment with Dr. Naledi Mokoena on 2026-03-05 at 09:00 is confirmed. Ref: DNC-APT-84920',
        actionUrl: '/patient/appointments',
        actionLabel: 'View Appointment',
        isRead: false,
        read: false,
        channels: ['IN_APP', 'SMS', 'EMAIL', 'WHATSAPP'],
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        dispatchLogs: [
          {
            channel: 'IN_APP',
            status: 'READ',
            recipient: 'patient-lerato-001',
            dispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            channel: 'SMS',
            status: 'DELIVERED',
            recipient: '+27 82 555 1234',
            dispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            externalRef: 'SMS-SA-98234',
            deliveryLatencyMs: 420,
          },
          {
            channel: 'EMAIL',
            status: 'DELIVERED',
            recipient: 'lerato.m@example.co.za',
            dispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            externalRef: 'EML-SEND-1092',
            deliveryLatencyMs: 890,
          },
          {
            channel: 'WHATSAPP',
            status: 'READ',
            recipient: '+27 82 555 1234',
            dispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            externalRef: 'WA-MSG-88219',
            deliveryLatencyMs: 310,
          },
        ],
      },
      {
        id: 'notif-seed-002',
        userId: 'patient-lerato-001',
        type: 'APPOINTMENT_REMINDER',
        title: 'Upcoming Visit in 24 Hours',
        message: 'Reminder: You have a scheduled appointment tomorrow with Dr. Naledi Mokoena at 09:00. Please arrive 10 mins early for check-in.',
        actionUrl: '/patient/appointments',
        actionLabel: 'Check-in Details',
        isRead: false,
        read: false,
        channels: ['IN_APP', 'SMS'],
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        dispatchLogs: [
          {
            channel: 'IN_APP',
            status: 'DELIVERED',
            recipient: 'patient-lerato-001',
            dispatchedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            channel: 'SMS',
            status: 'DELIVERED',
            recipient: '+27 82 555 1234',
            dispatchedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            externalRef: 'SMS-SA-98110',
            deliveryLatencyMs: 380,
          },
        ],
      },
      {
        id: 'notif-seed-003',
        userId: 'patient-lerato-001',
        type: 'SUBSCRIPTION_ALERT',
        title: 'External Reveal Credit Available',
        message: 'Your monthly external directory quota is active. You have 1 reveal remaining this cycle on NexCare Free.',
        actionUrl: '/patient/subscription',
        actionLabel: 'View Allowance',
        isRead: true,
        read: true,
        channels: ['IN_APP'],
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        dispatchLogs: [
          {
            channel: 'IN_APP',
            status: 'READ',
            recipient: 'patient-lerato-001',
            dispatchedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          },
        ],
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(seedNotifications));
    } catch {}

    return seedNotifications;
  }

  /**
   * Get unread count
   */
  static getUnreadCount(userId?: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  }

  /**
   * Mark single notification as read
   */
  static markAsRead(id: string): InAppNotification[] {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list));
      } catch {}
    }
    return list;
  }

  /**
   * Mark all notifications as read
   */
  static markAllAsRead(userId?: string): InAppNotification[] {
    const list = this.getNotifications();
    list.forEach((n) => {
      if (!userId || n.userId === userId) {
        n.read = true;
      }
    });
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list));
    } catch {}
    return list;
  }

  /**
   * Delete single notification
   */
  static deleteNotification(id: string): InAppNotification[] {
    const list = this.getNotifications().filter((n) => n.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list));
    } catch {}
    return list;
  }

  /**
   * Clear all notifications
   */
  static clearAll(userId?: string): InAppNotification[] {
    const list = userId
      ? this.getNotifications().filter((n) => n.userId !== userId)
      : [];
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list));
    } catch {}
    return list;
  }

  /**
   * Create and Dispatch Notification Across Configured Channels
   */
  static createNotification(options: MultiChannelDispatchOptions): InAppNotification {
    const list = this.getNotifications();
    const now = new Date().toISOString();

    const targetChannels: NotificationChannel[] = options.channels || ['IN_APP', 'SMS', 'EMAIL', 'WHATSAPP'];

    const dispatchLogs: ChannelDispatchLog[] = targetChannels.map((channel) => {
      let recipient = options.userId;
      if (channel === 'SMS' || channel === 'WHATSAPP') {
        recipient = options.recipientPhone || '+27 82 555 1234';
      } else if (channel === 'EMAIL') {
        recipient = options.recipientEmail || 'lerato.m@example.co.za';
      }

      return {
        channel,
        status: 'DELIVERED',
        recipient,
        dispatchedAt: now,
        externalRef: `${channel}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        deliveryLatencyMs: Math.floor(Math.random() * 400) + 150,
      };
    });

    const newNotification: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      isRead: false,
      read: false,
      channels: targetChannels,
      createdAt: now,
      dispatchLogs,
      metadata: options.metadata,
    };

    list.unshift(newNotification);

    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list));
    } catch {}

    return newNotification;
  }

  // ==========================================
  // CONVENIENT MULTI-CHANNEL TRIGGERS
  // ==========================================

  static notifyBookingConfirmation(appointment: DetailedAppointment) {
    return this.createNotification({
      userId: appointment.patientId,
      type: 'BOOKING_CONFIRMATION',
      title: 'Appointment Confirmed',
      message: `Confirmed: ${appointment.appointmentTypeName} with ${appointment.providerName} on ${appointment.date} at ${appointment.startTime}. Booking Ref: ${appointment.bookingReference}`,
      actionUrl: '/patient/appointments',
      actionLabel: 'View Schedule',
      recipientEmail: appointment.patientEmail,
      recipientPhone: appointment.patientPhone,
    });
  }

  static notifyRescheduled(appointment: DetailedAppointment, oldDate: string, oldTime: string) {
    return this.createNotification({
      userId: appointment.patientId,
      type: 'BOOKING_RESCHEDULED',
      title: 'Appointment Rescheduled',
      message: `Your appointment with ${appointment.providerName} was moved from ${oldDate} (${oldTime}) to ${appointment.date} at ${appointment.startTime}. Ref: ${appointment.bookingReference}`,
      actionUrl: '/patient/appointments',
      actionLabel: 'Review Update',
      recipientEmail: appointment.patientEmail,
      recipientPhone: appointment.patientPhone,
    });
  }

  static notifyCancelled(appointment: DetailedAppointment, reason?: string) {
    return this.createNotification({
      userId: appointment.patientId,
      type: 'BOOKING_CANCELLED',
      title: 'Appointment Cancelled',
      message: `Your appointment with ${appointment.providerName} for ${appointment.date} at ${appointment.startTime} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      actionUrl: '/patient/appointments',
      actionLabel: 'View Bookings',
      recipientEmail: appointment.patientEmail,
      recipientPhone: appointment.patientPhone,
    });
  }

  static notifyReminder(appointment: DetailedAppointment, hoursNotice: number = 24) {
    return this.createNotification({
      userId: appointment.patientId,
      type: 'APPOINTMENT_REMINDER',
      title: `Reminder: Consultation in ${hoursNotice} Hours`,
      message: `You have an upcoming consultation with ${appointment.providerName} at ${appointment.practiceName} on ${appointment.date} at ${appointment.startTime}.`,
      actionUrl: '/patient/appointments',
      actionLabel: 'View Directions',
      recipientEmail: appointment.patientEmail,
      recipientPhone: appointment.patientPhone,
    });
  }

  static notifyReviewRequest(appointment: DetailedAppointment) {
    return this.createNotification({
      userId: appointment.patientId,
      type: 'REVIEW_REQUEST',
      title: 'How was your consultation?',
      message: `Your visit with ${appointment.providerName} is complete. Please share your feedback to help improve healthcare access.`,
      actionUrl: '/patient/reviews',
      actionLabel: 'Leave a Review',
      recipientEmail: appointment.patientEmail,
      recipientPhone: appointment.patientPhone,
    });
  }

  static notifySubscriptionAlert(plan: PatientSubscriptionTier, remaining: number, total: number) {
    return this.createNotification({
      userId: 'patient-lerato-001',
      type: 'REVEAL_LIMIT_WARNING',
      title: 'Practitioner Reveal Usage Alert',
      message: `You have used ${total - remaining} of your ${total} external reveals for this billing cycle. Upgrade to NexCare Plus for 20 monthly reveals.`,
      actionUrl: '/patient/subscription',
      actionLabel: 'Upgrade Plan',
    });
  }
}
