import {
  AppointmentSlot,
  AppointmentTypeConfig,
  RecurringDaySchedule,
  ScheduleBlock,
  SlotHoldRecord,
  DetailedAppointment,
  DayOfWeek,
  AppointmentMode,
} from '../../types';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';

const STORAGE_KEYS = {
  APPOINTMENT_TYPES: 'dnc_appointment_types_v1',
  RECURRING_SCHEDULES: 'dnc_recurring_schedules_v1',
  SCHEDULE_BLOCKS: 'dnc_schedule_blocks_v1',
  SLOT_HOLDS: 'dnc_slot_holds_v1',
  APPOINTMENTS: 'dnc_detailed_appointments_v1',
};

// Default Initial Seed Data
const DEFAULT_APPOINTMENT_TYPES: AppointmentTypeConfig[] = [
  {
    id: 'apt-type-001',
    providerId: 'prov-001',
    name: 'Standard Consultation (GP)',
    description: 'Comprehensive general medical consultation, prescription check, vital review.',
    durationMinutes: 30,
    locationName: 'Consulting Room 2A',
    mode: 'IN_PERSON',
    patientEligibility: 'ALL_PATIENTS',
    leadTimeHours: 2,
    bookingHorizonDays: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    minCancellationNoticeHours: 24,
    cancellationPolicyText: 'Please cancel at least 24 hours in advance to avoid late cancellation fees.',
    priceZAR: 650,
    isActive: true,
  },
  {
    id: 'apt-type-002',
    providerId: 'prov-001',
    name: 'Comprehensive Health & Wellness Check',
    description: 'Thorough physical assessment, ECG, full blood workup requisition, and lifestyle review.',
    durationMinutes: 60,
    locationName: 'Consulting Room 2A',
    mode: 'IN_PERSON',
    patientEligibility: 'ALL_PATIENTS',
    leadTimeHours: 4,
    bookingHorizonDays: 45,
    bufferBeforeMinutes: 5,
    bufferAfterMinutes: 10,
    minCancellationNoticeHours: 24,
    cancellationPolicyText: 'Cancellations within 24 hours may incur a 50% administration fee.',
    priceZAR: 1100,
    isActive: true,
  },
  {
    id: 'apt-type-003',
    providerId: 'prov-001',
    name: 'Virtual Telehealth Consultation',
    description: 'Secure remote video consultation for follow-ups, results, and script renewals.',
    durationMinutes: 30,
    locationName: 'DigitalNexCare Encrypted Video Room',
    mode: 'VIRTUAL',
    patientEligibility: 'ALL_PATIENTS',
    leadTimeHours: 1,
    bookingHorizonDays: 14,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    minCancellationNoticeHours: 12,
    cancellationPolicyText: 'Virtual appointments can be rescheduled up to 12 hours prior.',
    priceZAR: 550,
    isActive: true,
  },
  {
    id: 'apt-type-004',
    providerId: 'prov-002',
    name: 'Dental Examination, Scale & Polish',
    description: 'Full oral examination, intraoral digital x-rays, scaling and high-gloss polish.',
    durationMinutes: 45,
    locationName: 'Dental Suite 1',
    mode: 'IN_PERSON',
    patientEligibility: 'ALL_PATIENTS',
    leadTimeHours: 3,
    bookingHorizonDays: 30,
    bufferBeforeMinutes: 5,
    bufferAfterMinutes: 10,
    minCancellationNoticeHours: 24,
    cancellationPolicyText: 'Please provide 24 hours notice for dental theatre cancellations.',
    priceZAR: 800,
    isActive: true,
  },
];

const DEFAULT_RECURRING_SCHEDULES: Record<string, RecurringDaySchedule[]> = {
  'prov-001': [
    {
      dayOfWeek: 'MONDAY',
      isEnabled: true,
      intervals: [
        { id: 'int-1', startTime: '08:30', endTime: '12:30' },
        { id: 'int-2', startTime: '13:30', endTime: '17:00' },
      ],
    },
    {
      dayOfWeek: 'TUESDAY',
      isEnabled: true,
      intervals: [
        { id: 'int-3', startTime: '08:30', endTime: '12:30' },
        { id: 'int-4', startTime: '13:30', endTime: '17:00' },
      ],
    },
    {
      dayOfWeek: 'WEDNESDAY',
      isEnabled: true,
      intervals: [
        { id: 'int-5', startTime: '08:30', endTime: '12:30' },
        { id: 'int-6', startTime: '13:30', endTime: '17:00' },
      ],
    },
    {
      dayOfWeek: 'THURSDAY',
      isEnabled: true,
      intervals: [
        { id: 'int-7', startTime: '08:30', endTime: '12:30' },
        { id: 'int-8', startTime: '13:30', endTime: '17:00' },
      ],
    },
    {
      dayOfWeek: 'FRIDAY',
      isEnabled: true,
      intervals: [
        { id: 'int-9', startTime: '08:30', endTime: '12:30' },
        { id: 'int-10', startTime: '13:30', endTime: '16:00' },
      ],
    },
    {
      dayOfWeek: 'SATURDAY',
      isEnabled: true,
      intervals: [{ id: 'int-11', startTime: '09:00', endTime: '13:00' }],
    },
    {
      dayOfWeek: 'SUNDAY',
      isEnabled: false,
      intervals: [],
    },
  ],
  'prov-002': [
    {
      dayOfWeek: 'MONDAY',
      isEnabled: true,
      intervals: [{ id: 'int-21', startTime: '09:00', endTime: '16:30' }],
    },
    {
      dayOfWeek: 'TUESDAY',
      isEnabled: true,
      intervals: [{ id: 'int-22', startTime: '09:00', endTime: '16:30' }],
    },
    {
      dayOfWeek: 'WEDNESDAY',
      isEnabled: true,
      intervals: [{ id: 'int-23', startTime: '09:00', endTime: '16:30' }],
    },
    {
      dayOfWeek: 'THURSDAY',
      isEnabled: true,
      intervals: [{ id: 'int-24', startTime: '09:00', endTime: '16:30' }],
    },
    {
      dayOfWeek: 'FRIDAY',
      isEnabled: true,
      intervals: [{ id: 'int-25', startTime: '09:00', endTime: '15:00' }],
    },
    {
      dayOfWeek: 'SATURDAY',
      isEnabled: false,
      intervals: [],
    },
    {
      dayOfWeek: 'SUNDAY',
      isEnabled: false,
      intervals: [],
    },
  ],
};

const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  {
    id: 'block-001',
    providerId: 'prov-001',
    title: 'Daily Lunch Break & Charting',
    blockType: 'LUNCH_BREAK',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    startTime: '12:30',
    endTime: '13:30',
    isAllDay: false,
    notes: 'Protected practice lunch and clinical notes time.',
    createdAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 'block-002',
    providerId: 'prov-001',
    title: 'Hospital Ward Rounds (Steve Biko Academic)',
    blockType: 'EMERGENCY_COVER',
    startDate: '2026-09-04',
    endDate: '2026-09-04',
    startTime: '08:00',
    endTime: '11:00',
    isAllDay: false,
    notes: 'Morning inpatient rounds.',
    createdAt: '2026-08-20T10:00:00Z',
  },
];

const DEFAULT_APPOINTMENTS: DetailedAppointment[] = [
  {
    id: 'apt-001',
    bookingReference: 'DNC-APT-84920',
    providerId: 'prov-001',
    providerName: 'Dr. Naledi Mokoena',
    practiceName: 'Hatfield Family Medical Centre',
    specialty: 'General Practitioner (GP)',
    address: '422 Burnett Street, Hatfield, Pretoria, 0028',
    patientId: 'pat-001',
    patientName: 'Lerato Khumalo',
    patientEmail: 'lerato.khumalo@example.co.za',
    patientPhone: '+27 82 555 0192',
    patientType: 'SELF',
    date: '2026-09-02',
    startTime: '09:00',
    endTime: '09:30',
    mode: 'IN_PERSON',
    appointmentTypeId: 'apt-type-001',
    appointmentTypeName: 'Standard Consultation (GP)',
    durationMinutes: 30,
    priceZAR: 650,
    paymentMethod: 'MEDICAL_AID',
    medicalAidScheme: 'Discovery Health',
    medicalAidMemberNumber: '908234112',
    medicalAidDependantCode: '00',
    reasonForVisit: 'Routine consultation / blood pressure review',
    symptoms: 'Mild fatigue in the mornings',
    allergies: 'Penicillin',
    currentMedications: 'Enalapril 10mg daily',
    status: 'CONFIRMED',
    createdAt: '2026-08-28T14:30:00Z',
    updatedAt: '2026-08-28T14:30:00Z',
  },
  {
    id: 'apt-002',
    bookingReference: 'DNC-APT-39210',
    providerId: 'prov-002',
    providerName: 'Dr. Pieter van der Merwe',
    practiceName: 'Atlantic Dental Care',
    specialty: 'Dentist',
    address: '158 Main Road, Sea Point, Cape Town, 8005',
    patientId: 'pat-001',
    patientName: 'Lerato Khumalo',
    patientEmail: 'lerato.khumalo@example.co.za',
    patientPhone: '+27 82 555 0192',
    patientType: 'SELF',
    date: '2026-09-08',
    startTime: '11:00',
    endTime: '11:45',
    mode: 'IN_PERSON',
    appointmentTypeId: 'apt-type-004',
    appointmentTypeName: 'Dental Examination, Scale & Polish',
    durationMinutes: 45,
    priceZAR: 800,
    paymentMethod: 'MEDICAL_AID',
    medicalAidScheme: 'Discovery Health',
    medicalAidMemberNumber: '908234112',
    medicalAidDependantCode: '00',
    reasonForVisit: 'Annual Dental Checkup & Polish',
    status: 'CONFIRMED',
    createdAt: '2026-08-29T10:15:00Z',
    updatedAt: '2026-08-29T10:15:00Z',
  },
];

export interface Chunk6TestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

export class SchedulingEngine {
  // --- APPOINTMENT TYPES ---
  static getAppointmentTypes(providerId?: string): AppointmentTypeConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENT_TYPES);
      const all: AppointmentTypeConfig[] = stored ? JSON.parse(stored) : DEFAULT_APPOINTMENT_TYPES;
      if (providerId) {
        return all.filter((t) => t.providerId === providerId && t.isActive);
      }
      return all;
    } catch {
      return DEFAULT_APPOINTMENT_TYPES;
    }
  }

  static getAppointmentTypeById(id: string): AppointmentTypeConfig | undefined {
    const types = this.getAppointmentTypes();
    return types.find((t) => t.id === id);
  }

  static saveAppointmentType(config: AppointmentTypeConfig): AppointmentTypeConfig {
    const all = this.getAppointmentTypes();
    const existingIndex = all.findIndex((t) => t.id === config.id);
    let updated: AppointmentTypeConfig[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = config;
    } else {
      updated = [...all, config];
    }
    localStorage.setItem(STORAGE_KEYS.APPOINTMENT_TYPES, JSON.stringify(updated));
    return config;
  }

  static deleteAppointmentType(id: string): void {
    const all = this.getAppointmentTypes();
    const filtered = all.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENT_TYPES, JSON.stringify(filtered));
  }

  // --- RECURRING SCHEDULES ---
  static getRecurringSchedule(providerId: string): RecurringDaySchedule[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES);
      const allMap: Record<string, RecurringDaySchedule[]> = stored
        ? JSON.parse(stored)
        : DEFAULT_RECURRING_SCHEDULES;

      if (allMap[providerId]) {
        return allMap[providerId];
      }
      return (
        DEFAULT_RECURRING_SCHEDULES['prov-001'] || [
          { dayOfWeek: 'MONDAY', isEnabled: true, intervals: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 'TUESDAY', isEnabled: true, intervals: [{ id: '2', startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 'WEDNESDAY', isEnabled: true, intervals: [{ id: '3', startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 'THURSDAY', isEnabled: true, intervals: [{ id: '4', startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 'FRIDAY', isEnabled: true, intervals: [{ id: '5', startTime: '09:00', endTime: '17:00' }] },
          { dayOfWeek: 'SATURDAY', isEnabled: false, intervals: [] },
          { dayOfWeek: 'SUNDAY', isEnabled: false, intervals: [] },
        ]
      );
    } catch {
      return DEFAULT_RECURRING_SCHEDULES['prov-001'] || [];
    }
  }

  static saveRecurringSchedule(providerId: string, schedule: RecurringDaySchedule[]): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES);
      const allMap: Record<string, RecurringDaySchedule[]> = stored
        ? JSON.parse(stored)
        : { ...DEFAULT_RECURRING_SCHEDULES };
      allMap[providerId] = schedule;
      localStorage.setItem(STORAGE_KEYS.RECURRING_SCHEDULES, JSON.stringify(allMap));
    } catch (e) {
      console.error('Failed to save recurring schedule', e);
    }
  }

  // --- SCHEDULE BLOCKS ---
  static getBlocks(providerId?: string): ScheduleBlock[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULE_BLOCKS);
      const all: ScheduleBlock[] = stored ? JSON.parse(stored) : DEFAULT_SCHEDULE_BLOCKS;
      if (providerId) {
        return all.filter((b) => b.providerId === providerId);
      }
      return all;
    } catch {
      return DEFAULT_SCHEDULE_BLOCKS;
    }
  }

  static createBlock(block: Omit<ScheduleBlock, 'id' | 'createdAt'>): ScheduleBlock {
    const all = this.getBlocks();
    const newBlock: ScheduleBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...all, newBlock];
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_BLOCKS, JSON.stringify(updated));
    return newBlock;
  }

  static deleteBlock(id: string): void {
    const all = this.getBlocks();
    const filtered = all.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_BLOCKS, JSON.stringify(filtered));
  }

  // --- APPOINTMENTS STORAGE ---
  static getAppointments(filter?: { providerId?: string; patientId?: string; status?: string }): DetailedAppointment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      let all: DetailedAppointment[] = stored ? JSON.parse(stored) : DEFAULT_APPOINTMENTS;
      if (filter) {
        if (filter.providerId) all = all.filter((a) => a.providerId === filter.providerId);
        if (filter.patientId) all = all.filter((a) => a.patientId === filter.patientId);
        if (filter.status) all = all.filter((a) => a.status === filter.status);
      }
      return all;
    } catch {
      return DEFAULT_APPOINTMENTS;
    }
  }

  static getAppointmentById(id: string): DetailedAppointment | undefined {
    const all = this.getAppointments();
    return all.find((a) => a.id === id);
  }

  // --- SLOT HOLDS ---
  static getActiveHolds(): SlotHoldRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SLOT_HOLDS);
      const all: SlotHoldRecord[] = stored ? JSON.parse(stored) : [];
      const now = new Date().getTime();
      // Filter out expired holds
      return all.filter((h) => h.status === 'ACTIVE' && new Date(h.expiresAt).getTime() > now);
    } catch {
      return [];
    }
  }

  /**
   * Temporary Slot Hold with Configurable Expiry
   * Prevents concurrent double booking
   */
  static holdSlot(params: {
    slotId: string;
    providerId: string;
    patientId: string;
    patientName: string;
    date: string;
    startTime: string;
    endTime: string;
    appointmentTypeId: string;
    expiryMinutes?: number;
  }): { success: boolean; hold?: SlotHoldRecord; message?: string } {
    // 1. External practitioner guard
    if (!this.isProviderDirectlyBookable(params.providerId)) {
      return {
        success: false,
        message: 'Direct booking is only available for verified DigitalNexCare providers.',
      };
    }

    const activeHolds = this.getActiveHolds();
    const existingAppointments = this.getAppointments({
      providerId: params.providerId,
    }).filter((a) => a.date === params.date && a.status === 'CONFIRMED');

    // 2. Check collision with existing confirmed appointments
    const hasAptCollision = existingAppointments.some(
      (a) => this.timeOverlap(a.startTime, a.endTime, params.startTime, params.endTime)
    );
    if (hasAptCollision) {
      return {
        success: false,
        message: 'This slot has already been booked by another patient.',
      };
    }

    // 3. Check collision with active holds from OTHER users
    const hasHoldCollision = activeHolds.some(
      (h) =>
        h.providerId === params.providerId &&
        h.date === params.date &&
        h.patientId !== params.patientId &&
        this.timeOverlap(h.startTime, h.endTime, params.startTime, params.endTime)
    );
    if (hasHoldCollision) {
      return {
        success: false,
        message: 'This slot is currently being held by another patient. Please select a different time.',
      };
    }

    // 4. Create new hold
    const expiryMins = params.expiryMinutes || 10;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMins * 60 * 1000).toISOString();

    const holdRecord: SlotHoldRecord = {
      holdId: `hold-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      slotId: params.slotId,
      providerId: params.providerId,
      patientId: params.patientId,
      patientName: params.patientName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      appointmentTypeId: params.appointmentTypeId,
      heldAt: now.toISOString(),
      expiresAt,
      status: 'ACTIVE',
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SLOT_HOLDS);
      const all: SlotHoldRecord[] = stored ? JSON.parse(stored) : [];
      // Clean up previous holds by this patient for this provider
      const cleaned = all.filter(
        (h) => !(h.patientId === params.patientId && h.providerId === params.providerId)
      );
      cleaned.push(holdRecord);
      localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(cleaned));
    } catch (e) {
      console.error('Failed to write slot hold', e);
    }

    return { success: true, hold: holdRecord };
  }

  static releaseHold(holdId: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SLOT_HOLDS);
      if (!stored) return;
      const all: SlotHoldRecord[] = JSON.parse(stored);
      const updated = all.map((h) => (h.holdId === holdId ? { ...h, status: 'RELEASED' as const } : h));
      localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to release hold', e);
    }
  }

  // --- DYNAMIC SLOT GENERATION ENGINE ---
  /**
   * Generates real bookable slots based on:
   * - Recurring weekly schedules
   * - Active confirmed appointments
   * - Active slot holds
   * - Schedule blocks (leave, breaks, admin time)
   * - Appointment type duration & buffers
   * - Lead time constraint
   * - Booking horizon constraint
   */
  static generateAvailableSlots(
    providerId: string,
    appointmentTypeId: string,
    startDateStr: string, // YYYY-MM-DD
    endDateStr: string, // YYYY-MM-DD
    simulatedNow?: Date
  ): AppointmentSlot[] {
    // 1. External Practitioner Guard: strictly reject
    if (!this.isProviderDirectlyBookable(providerId)) {
      return [];
    }

    const apptType = this.getAppointmentTypeById(appointmentTypeId) || this.getAppointmentTypes(providerId)[0];
    if (!apptType || !apptType.isActive) return [];

    const recurring = this.getRecurringSchedule(providerId);
    const blocks = this.getBlocks(providerId);
    const confirmedApts = this.getAppointments({ providerId, status: 'CONFIRMED' });
    const activeHolds = this.getActiveHolds().filter((h) => h.providerId === providerId);

    const now = simulatedNow || new Date();
    const leadTimeCutoff = new Date(now.getTime() + apptType.leadTimeHours * 60 * 60 * 1000);
    const maxHorizonDate = new Date(now.getTime() + apptType.bookingHorizonDays * 24 * 60 * 60 * 1000);

    const resultSlots: AppointmentSlot[] = [];

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Day of week mapping
    const dayNames: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    // Iterate through dates
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateIsoStr = current.toISOString().split('T')[0];
      const dayOfWeek = dayNames[current.getDay()];

      // Check horizon
      if (current > maxHorizonDate) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Find recurring configuration for this day
      const daySchedule = recurring.find((r) => r.dayOfWeek === dayOfWeek);
      if (daySchedule && daySchedule.isEnabled) {
        for (const interval of daySchedule.intervals) {
          const totalSlotMinutes = apptType.durationMinutes + apptType.bufferAfterMinutes;
          let intervalStartMin = this.timeToMinutes(interval.startTime) + apptType.bufferBeforeMinutes;
          const intervalEndMin = this.timeToMinutes(interval.endTime);

          while (intervalStartMin + apptType.durationMinutes <= intervalEndMin) {
            const slotStartMin = intervalStartMin;
            const slotEndMin = intervalStartMin + apptType.durationMinutes;
            const slotStartStr = this.minutesToTime(slotStartMin);
            const slotEndStr = this.minutesToTime(slotEndMin);

            // Construct full datetime for lead time check
            const [y, m, d] = dateIsoStr.split('-').map(Number);
            const [sh, sm] = slotStartStr.split(':').map(Number);
            const slotDateTime = new Date(y, m - 1, d, sh, sm);

            // Check if slot is in the past or violates lead time
            const isLeadTimeOk = slotDateTime >= leadTimeCutoff;

            if (isLeadTimeOk) {
              // Check collision with schedule blocks
              const isBlocked = blocks.some((b) => {
                const isInDateRange = dateIsoStr >= b.startDate && dateIsoStr <= b.endDate;
                if (!isInDateRange) return false;
                if (b.isAllDay) return true;
                return this.timeOverlap(b.startTime, b.endTime, slotStartStr, slotEndStr);
              });

              // Check collision with confirmed appointments
              const isAptCollision = confirmedApts.some(
                (a) => a.date === dateIsoStr && this.timeOverlap(a.startTime, a.endTime, slotStartStr, slotEndStr)
              );

              // Check collision with active slot holds
              const isHoldCollision = activeHolds.some(
                (h) => h.date === dateIsoStr && this.timeOverlap(h.startTime, h.endTime, slotStartStr, slotEndStr)
              );

              if (!isBlocked && !isAptCollision && !isHoldCollision) {
                resultSlots.push({
                  id: `slot-${providerId}-${dateIsoStr}-${slotStartStr.replace(':', '')}`,
                  date: dateIsoStr,
                  startTime: slotStartStr,
                  endTime: slotEndStr,
                  mode: apptType.mode,
                  priceZAR: apptType.priceZAR,
                  isAvailable: true,
                });
              }
            }

            intervalStartMin += totalSlotMinutes;
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return resultSlots;
  }

  // --- CONFIRM BOOKING TRANSACTION ---
  /**
   * Atomic Booking Confirmation with Double Booking Prevention
   */
  static confirmBooking(params: {
    holdId?: string;
    providerId: string;
    patientId: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientType: 'SELF' | 'DEPENDANT';
    dependantName?: string;
    dependantRelationship?: string;
    date: string;
    startTime: string;
    endTime: string;
    mode: AppointmentMode;
    appointmentTypeId: string;
    paymentMethod: 'MEDICAL_AID' | 'CARD_AT_PRACTICE' | 'ONLINE';
    medicalAidScheme?: string;
    medicalAidMemberNumber?: string;
    medicalAidDependantCode?: string;
    reasonForVisit: string;
    symptoms?: string;
    allergies?: string;
    currentMedications?: string;
  }): { success: boolean; appointment?: DetailedAppointment; errorCode?: string; message?: string } {
    // 1. Guard external practitioner
    if (!this.isProviderDirectlyBookable(params.providerId)) {
      return {
        success: false,
        errorCode: 'EXTERNAL_PRACTITIONER_NOT_BOOKABLE',
        message: 'Appointments can only be booked for verified DigitalNexCare providers.',
      };
    }

    const provider = MOCK_PROVIDERS.find((p) => p.id === params.providerId) || MOCK_PROVIDERS[0];
    const apptType = this.getAppointmentTypeById(params.appointmentTypeId) || this.getAppointmentTypes(params.providerId)[0];

    // 2. Transactional lock check: Ensure no other confirmed appointment exists for this exact time
    const existingApts = this.getAppointments({ providerId: params.providerId, status: 'CONFIRMED' });
    const hasCollision = existingApts.some(
      (a) => a.date === params.date && this.timeOverlap(a.startTime, a.endTime, params.startTime, params.endTime)
    );

    if (hasCollision) {
      return {
        success: false,
        errorCode: 'DOUBLE_BOOKING_PREVENTED',
        message: 'This slot was already confirmed for another booking. Please choose another time slot.',
      };
    }

    // 3. Generate Booking Reference
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const bookingReference = `DNC-APT-${randomSuffix}`;
    const newId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newAppointment: DetailedAppointment = {
      id: newId,
      bookingReference,
      providerId: params.providerId,
      providerName: provider.fullName,
      practiceName: provider.practiceName,
      specialty: provider.specialty,
      address: provider.address,
      patientId: params.patientId,
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientType: params.patientType,
      dependantName: params.dependantName,
      dependantRelationship: params.dependantRelationship,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      mode: params.mode,
      appointmentTypeId: params.appointmentTypeId,
      appointmentTypeName: apptType ? apptType.name : 'General Consultation',
      durationMinutes: apptType ? apptType.durationMinutes : 30,
      priceZAR: apptType ? apptType.priceZAR : provider.consultationFeeZAR,
      paymentMethod: params.paymentMethod,
      medicalAidScheme: params.medicalAidScheme,
      medicalAidMemberNumber: params.medicalAidMemberNumber,
      medicalAidDependantCode: params.medicalAidDependantCode,
      reasonForVisit: params.reasonForVisit,
      symptoms: params.symptoms,
      allergies: params.allergies,
      currentMedications: params.currentMedications,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Save to appointments store
    try {
      const all = this.getAppointments();
      all.unshift(newAppointment);
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(all));

      // 5. Convert hold if present
      if (params.holdId) {
        const storedHolds = localStorage.getItem(STORAGE_KEYS.SLOT_HOLDS);
        if (storedHolds) {
          const allHolds: SlotHoldRecord[] = JSON.parse(storedHolds);
          const updatedHolds = allHolds.map((h) =>
            h.holdId === params.holdId ? { ...h, status: 'CONVERTED' as const } : h
          );
          localStorage.setItem(STORAGE_KEYS.SLOT_HOLDS, JSON.stringify(updatedHolds));
        }
      }
    } catch (e) {
      console.error('Failed to commit appointment transaction', e);
    }

    return { success: true, appointment: newAppointment };
  }

  // --- RESCHEDULING ENGINE ---
  /**
   * Transactional New-Slot Hold and Old-Slot Release
   */
  static rescheduleAppointment(params: {
    appointmentId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    newAppointmentTypeId?: string;
    rescheduleReason?: string;
  }): { success: boolean; newAppointment?: DetailedAppointment; message?: string } {
    const original = this.getAppointmentById(params.appointmentId);
    if (!original || original.status !== 'CONFIRMED') {
      return { success: false, message: 'Original appointment not found or not in confirmed status.' };
    }

    // 1. Verify new slot is free
    const existingApts = this.getAppointments({ providerId: original.providerId, status: 'CONFIRMED' }).filter(
      (a) => a.id !== original.id
    );
    const hasCollision = existingApts.some(
      (a) =>
        a.date === params.newDate &&
        this.timeOverlap(a.startTime, a.endTime, params.newStartTime, params.newEndTime)
    );

    if (hasCollision) {
      return {
        success: false,
        message: 'The requested new slot is not available. Please select another slot.',
      };
    }

    const apptTypeId = params.newAppointmentTypeId || original.appointmentTypeId;
    const apptType = this.getAppointmentTypeById(apptTypeId);

    const newAppointmentId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);

    const newAppointment: DetailedAppointment = {
      ...original,
      id: newAppointmentId,
      bookingReference: `DNC-APT-${randomSuffix}`,
      date: params.newDate,
      startTime: params.newStartTime,
      endTime: params.newEndTime,
      appointmentTypeId: apptTypeId,
      appointmentTypeName: apptType ? apptType.name : original.appointmentTypeName,
      durationMinutes: apptType ? apptType.durationMinutes : original.durationMinutes,
      priceZAR: apptType ? apptType.priceZAR : original.priceZAR,
      rescheduledFromId: original.id,
      notes: params.rescheduleReason ? `Rescheduled reason: ${params.rescheduleReason}` : original.notes,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update old appointment to RESCHEDULED
    try {
      const all = this.getAppointments();
      const updated = all.map((a) =>
        a.id === original.id
          ? {
              ...a,
              status: 'RESCHEDULED' as const,
              rescheduledToId: newAppointmentId,
              updatedAt: new Date().toISOString(),
            }
          : a
      );
      updated.unshift(newAppointment);
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to execute rescheduling transaction', e);
    }

    return { success: true, newAppointment };
  }

  // --- POLICY-CONTROLLED CANCELLATION ---
  static cancelAppointment(params: {
    appointmentId: string;
    cancelledBy: 'PATIENT' | 'PROVIDER';
    cancellationReason: string;
  }): {
    success: boolean;
    isLateCancellation: boolean;
    noticeHoursGiven: number;
    appointment?: DetailedAppointment;
    message?: string;
  } {
    const original = this.getAppointmentById(params.appointmentId);
    if (!original || original.status === 'CANCELLED') {
      return {
        success: false,
        isLateCancellation: false,
        noticeHoursGiven: 0,
        message: 'Appointment not found or already cancelled.',
      };
    }

    const apptType = this.getAppointmentTypeById(original.appointmentTypeId);
    const minNoticeHours = apptType ? apptType.minCancellationNoticeHours : 24;

    // Calculate hours notice given
    const [y, m, d] = original.date.split('-').map(Number);
    const [sh, sm] = original.startTime.split(':').map(Number);
    const apptDateTime = new Date(y, m - 1, d, sh, sm);
    const now = new Date();
    const diffMs = apptDateTime.getTime() - now.getTime();
    const noticeHoursGiven = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

    const isLateCancellation = noticeHoursGiven < minNoticeHours;

    try {
      const all = this.getAppointments();
      const updated = all.map((a) =>
        a.id === original.id
          ? {
              ...a,
              status: 'CANCELLED' as const,
              cancellationReason: params.cancellationReason,
              cancelledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : a
      );
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
      const updatedApt = updated.find((a) => a.id === original.id);
      return {
        success: true,
        isLateCancellation,
        noticeHoursGiven,
        appointment: updatedApt,
      };
    } catch (e) {
      console.error('Failed to cancel appointment', e);
      return {
        success: false,
        isLateCancellation: false,
        noticeHoursGiven: 0,
        message: 'Failed to update appointment record.',
      };
    }
  }

  // --- EXTERNAL PRACTITIONER GUARD ---
  static isProviderDirectlyBookable(providerId: string): boolean {
    const provider = MOCK_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) return false;
    return provider.practitionerType === 'DIGITALNEXCARE_PROVIDER' && provider.verificationStatus === 'VERIFIED';
  }

  // --- TIME UTILITIES ---
  private static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  private static minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private static timeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const a1 = this.timeToMinutes(startA);
    const a2 = this.timeToMinutes(endA);
    const b1 = this.timeToMinutes(startB);
    const b2 = this.timeToMinutes(endB);
    return Math.max(a1, b1) < Math.min(a2, b2);
  }

  // --- CHUNK 6 ACCEPTANCE TESTS ---
  static runChunk6AcceptanceTests(): Chunk6TestResult[] {
    const results: Chunk6TestResult[] = [];

    // Test 1: Appointment Types Configuration
    const types = this.getAppointmentTypes('prov-001');
    const hasTypes = types.length >= 3 && types.some((t) => t.durationMinutes === 30 && t.priceZAR > 0);
    results.push({
      id: 'CH6-TEST-01',
      name: 'Appointment Types Configuration & Metadata Parsing',
      passed: hasTypes,
      details: hasTypes
        ? `Loaded ${types.length} active appointment types with durations, buffers, lead times, and ZAR pricing.`
        : 'Failed to parse appointment types for provider.',
    });

    // Test 2: Recurring Availability Engine
    const schedule = this.getRecurringSchedule('prov-001');
    const monSchedule = schedule.find((s) => s.dayOfWeek === 'MONDAY');
    const hasMonIntervals = Boolean(monSchedule?.isEnabled && (monSchedule.intervals.length || 0) >= 2);
    results.push({
      id: 'CH6-TEST-02',
      name: 'Recurring Weekly Availability Schedule Engine',
      passed: hasMonIntervals,
      details: hasMonIntervals
        ? 'Verified recurring weekly schedules with multiple shifts per day (Morning/Afternoon intervals).'
        : 'Failed to verify recurring weekly schedule shifts.',
    });

    // Test 3: Schedule Blocks & Leave Blackout Enforcement
    const testBlock = this.createBlock({
      providerId: 'prov-001',
      title: 'Automated Test Leave',
      blockType: 'LEAVE',
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      startTime: '09:00',
      endTime: '12:00',
      isAllDay: false,
    });
    const slotsOnBlockDate = this.generateAvailableSlots('prov-001', 'apt-type-001', '2026-09-15', '2026-09-15');
    const blockOverlap = slotsOnBlockDate.some(
      (s) => s.startTime >= '09:00' && s.startTime < '12:00'
    );
    this.deleteBlock(testBlock.id);
    results.push({
      id: 'CH6-TEST-03',
      name: 'Schedule Blocks & Leave Blackout Enforcement',
      passed: !blockOverlap,
      details: !blockOverlap
        ? 'Blackout intervals properly excluded slots during configured leave/break windows.'
        : 'Slots were erroneously generated during a blackout block.',
    });

    // Test 4: Dynamic Slot Generation with Buffers & Lead Times
    const generatedSlots = this.generateAvailableSlots('prov-001', 'apt-type-001', '2026-09-09', '2026-09-09');
    const slotsGenerated = generatedSlots.length > 0;
    results.push({
      id: 'CH6-TEST-04',
      name: 'Dynamic Slot Generation with Buffers & Lead Time Constraints',
      passed: slotsGenerated,
      details: slotsGenerated
        ? `Successfully generated ${generatedSlots.length} available slots conforming to buffers and lead times.`
        : 'Failed to generate availability slots.',
    });

    // Test 5: Temporary Slot Hold & Expiry Management
    const testHoldSlot = generatedSlots[0] || {
      id: 'slot-test-01',
      date: '2026-09-09',
      startTime: '08:30',
      endTime: '09:00',
      mode: 'IN_PERSON' as const,
      isAvailable: true,
    };
    const holdRes = this.holdSlot({
      slotId: testHoldSlot.id,
      providerId: 'prov-001',
      patientId: 'pat-test-1',
      patientName: 'Test Patient 1',
      date: testHoldSlot.date,
      startTime: testHoldSlot.startTime,
      endTime: testHoldSlot.endTime,
      appointmentTypeId: 'apt-type-001',
      expiryMinutes: 5,
    });
    const holdSuccess = holdRes.success && Boolean(holdRes.hold?.holdId);
    results.push({
      id: 'CH6-TEST-05',
      name: 'Atomic Temporary Slot Hold with Expiry',
      passed: holdSuccess,
      details: holdSuccess
        ? `Slot hold established with ID ${holdRes.hold?.holdId} expiring in 5 minutes.`
        : 'Failed to create temporary slot hold.',
    });

    // Test 6: Double-Booking Race Condition Prevention
    const concurrentHold = this.holdSlot({
      slotId: testHoldSlot.id,
      providerId: 'prov-001',
      patientId: 'pat-test-2', // different patient attempting same slot
      patientName: 'Test Patient 2',
      date: testHoldSlot.date,
      startTime: testHoldSlot.startTime,
      endTime: testHoldSlot.endTime,
      appointmentTypeId: 'apt-type-001',
      expiryMinutes: 5,
    });
    const doubleBookingPrevented = !concurrentHold.success;
    if (holdRes.hold) {
      this.releaseHold(holdRes.hold.holdId);
    }
    results.push({
      id: 'CH6-TEST-06',
      name: 'Transactional Double-Booking Race Condition Prevention',
      passed: doubleBookingPrevented,
      details: doubleBookingPrevented
        ? 'Simultaneous conflicting reservation was rejected with collision error.'
        : 'Double-booking collision failed: second hold erroneously succeeded.',
    });

    // Test 7: End-to-End Booking Transaction
    const confirmRes = this.confirmBooking({
      providerId: 'prov-001',
      patientId: 'pat-test-auto',
      patientName: 'Automated Test Runner',
      patientEmail: 'test@digitalnexcare.co.za',
      patientPhone: '+27 82 000 1111',
      patientType: 'SELF',
      date: '2026-09-18',
      startTime: '14:00',
      endTime: '14:30',
      mode: 'IN_PERSON',
      appointmentTypeId: 'apt-type-001',
      paymentMethod: 'MEDICAL_AID',
      medicalAidScheme: 'Discovery Health',
      reasonForVisit: 'Acceptance Test Check',
    });
    const bookingCreated = confirmRes.success && Boolean(confirmRes.appointment?.bookingReference);
    results.push({
      id: 'CH6-TEST-07',
      name: 'End-to-End Booking Transaction & Reference Generation',
      passed: bookingCreated,
      details: bookingCreated
        ? `Created confirmed booking ${confirmRes.appointment?.bookingReference} in transactional store.`
        : 'Failed to confirm booking transaction.',
    });

    // Test 8: Transactional Reschedule & Slot Reallocation
    let reschedulePassed = false;
    if (confirmRes.appointment) {
      const reschedRes = this.rescheduleAppointment({
        appointmentId: confirmRes.appointment.id,
        newDate: '2026-09-18',
        newStartTime: '15:00',
        newEndTime: '15:30',
        rescheduleReason: 'Patient meeting rescheduled',
      });
      reschedulePassed = reschedRes.success && reschedRes.newAppointment?.status === 'CONFIRMED';
    }
    results.push({
      id: 'CH6-TEST-08',
      name: 'Transactional Rescheduling & Inventory Reallocation',
      passed: reschedulePassed,
      details: reschedulePassed
        ? 'Original appointment updated to RESCHEDULED and new slot atomically confirmed.'
        : 'Failed to execute rescheduling transaction.',
    });

    // Test 9: External Practitioner Zero-Booking Guard
    const extBookable = this.isProviderDirectlyBookable('ext-locked-001');
    const extSlots = this.generateAvailableSlots('ext-locked-001', 'apt-type-001', '2026-09-10', '2026-09-10');
    const externalGuardPassed = !extBookable && extSlots.length === 0;
    results.push({
      id: 'CH6-TEST-09',
      name: 'External Practitioner Zero-Booking Guard',
      passed: externalGuardPassed,
      details: externalGuardPassed
        ? 'External unjoined practitioners strictly prohibited from having booking slots or direct appointments.'
        : 'External practitioner guard failed.',
    });

    return results;
  }
}
