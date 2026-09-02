/**
 * DigitalNexCare Supabase Database TypeScript Definitions
 * Chunk 2 - Database, Authentication, Directory Data Model and Security
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'PATIENT'
  | 'PROVIDER'
  | 'PRACTICE_MANAGER'
  | 'RECEPTION_SCHEDULER'
  | 'FINANCE_BILLING'
  | 'VERIFIER_TRUST_OPS'
  | 'PLATFORM_ADMIN'
  | 'SUPER_ADMIN'
  | 'ENTERPRISE_PARTNER';

export type PractitionerType = 'DIGITALNEXCARE_PROVIDER' | 'EXTERNAL_PRACTITIONER';

export type ClaimStatus =
  | 'UNCLAIMED'
  | 'CLAIM_REQUESTED'
  | 'UNDER_REVIEW'
  | 'CLAIMED'
  | 'REJECTED'
  | 'DISPUTED';

export type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export type DataAuthority =
  | 'DIGITALNEXCARE_VERIFIED_PROVIDER'
  | 'PRACTITIONER_CONFIRMED'
  | 'ADMIN_VERIFIED'
  | 'AUTHORITATIVE_PROFESSIONAL_REGISTER'
  | 'PRACTICE_WEBSITE'
  | 'OTHER_APPROVED_EXTERNAL_SOURCE';

export type SouthAfricanProvince =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Free State'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Northern Cape';

export type PatientSubscriptionTier =
  | 'NEXCARE_FREE'
  | 'NEXCARE_ACCESS'
  | 'NEXCARE_PLUS'
  | 'NEXCARE_FAMILY';

export type AppointmentStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          normalized_phone: string | null;
          national_id_or_passport: string | null;
          date_of_birth: string | null;
          gender: string | null;
          avatar_url: string | null;
          is_email_verified: boolean;
          is_phone_verified: boolean;
          is_profile_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          normalized_phone?: string | null;
          national_id_or_passport?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          avatar_url?: string | null;
          is_email_verified?: boolean;
          is_phone_verified?: boolean;
          is_profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          granted_by: string | null;
          granted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRole;
          granted_by?: string | null;
          granted_at?: string;
        };
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          registration_number: string | null;
          practice_number: string | null;
          primary_phone: string | null;
          primary_email: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          registration_number?: string | null;
          practice_number?: string | null;
          primary_phone?: string | null;
          primary_email?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organisations']['Insert']>;
      };
      organisation_memberships: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organisation_id: string;
          user_id: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organisation_memberships']['Insert']>;
      };
      consents: {
        Row: {
          id: string;
          user_id: string;
          consent_type: string;
          version: string;
          ip_address: string | null;
          user_agent: string | null;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type: string;
          version: string;
          ip_address?: string | null;
          user_agent?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['consents']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_role: UserRole | null;
          action: string;
          resource: string;
          entity_id: string | null;
          diff: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_role?: UserRole | null;
          action: string;
          resource: string;
          entity_id?: string | null;
          diff?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      practitioner_directory: {
        Row: {
          id: string;
          display_name: string;
          normalized_name: string;
          title: string | null;
          practice_name: string | null;
          normalized_practice_name: string | null;
          primary_category_id: string | null;
          professional_registration_number: string | null;
          public_phone: string | null;
          normalized_phone: string | null;
          public_email: string | null;
          website: string | null;
          address_line: string | null;
          suburb: string;
          city: string;
          province: SouthAfricanProvince;
          postal_code: string | null;
          latitude: number;
          longitude: number;
          practitioner_fingerprint: string;
          practitioner_type: PractitionerType;
          is_joined: boolean;
          is_bookable: boolean;
          provider_id: string | null;
          practice_id: string | null;
          location_id: string | null;
          claim_status: ClaimStatus;
          verification_status: VerificationStatus;
          freshness_status: string;
          data_authority: DataAuthority;
          rating: number;
          review_count: number;
          offers_virtual: boolean;
          offers_in_person: boolean;
          source_attribution: string | null;
          first_discovered_at: string;
          last_discovered_at: string;
          last_refreshed_at: string;
          last_provider_confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          normalized_name: string;
          title?: string | null;
          practice_name?: string | null;
          normalized_practice_name?: string | null;
          primary_category_id?: string | null;
          professional_registration_number?: string | null;
          public_phone?: string | null;
          normalized_phone?: string | null;
          public_email?: string | null;
          website?: string | null;
          address_line?: string | null;
          suburb: string;
          city: string;
          province: SouthAfricanProvince;
          postal_code?: string | null;
          latitude: number;
          longitude: number;
          practitioner_fingerprint: string;
          practitioner_type?: PractitionerType;
          is_joined?: boolean;
          is_bookable?: boolean;
          provider_id?: string | null;
          practice_id?: string | null;
          location_id?: string | null;
          claim_status?: ClaimStatus;
          verification_status?: VerificationStatus;
          freshness_status?: string;
          data_authority?: DataAuthority;
          rating?: number;
          review_count?: number;
          offers_virtual?: boolean;
          offers_in_person?: boolean;
          source_attribution?: string | null;
          first_discovered_at?: string;
          last_discovered_at?: string;
          last_refreshed_at?: string;
          last_provider_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['practitioner_directory']['Insert']>;
      };
      specialties: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon_name: string | null;
          is_popular: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          icon_name?: string | null;
          is_popular?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['specialties']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          specialty_id: string | null;
          name: string;
          description: string | null;
          typical_duration_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          specialty_id?: string | null;
          name: string;
          description?: string | null;
          typical_duration_minutes?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      visit_reasons: {
        Row: {
          id: string;
          specialty_id: string | null;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          specialty_id?: string | null;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['visit_reasons']['Insert']>;
      };
      practitioner_data_sources: {
        Row: {
          id: string;
          practitioner_id: string;
          field_name: string;
          source_type: string;
          source_reference: string | null;
          priority: number;
          confidence: number;
          first_seen: string;
          last_seen: string;
          provider_confirmed: boolean;
          admin_verified: boolean;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          field_name: string;
          source_type: string;
          source_reference?: string | null;
          priority?: number;
          confidence?: number;
          first_seen?: string;
          last_seen?: string;
          provider_confirmed?: boolean;
          admin_verified?: boolean;
        };
        Update: Partial<Database['public']['Tables']['practitioner_data_sources']['Insert']>;
      };
      practitioner_source_snapshots: {
        Row: {
          id: string;
          practitioner_id: string | null;
          source_type: string;
          storage_path: string;
          compression: string;
          content_hash: string;
          raw_size_bytes: number;
          compressed_size_bytes: number;
          metadata: Json | null;
          captured_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id?: string | null;
          source_type: string;
          storage_path: string;
          compression?: string;
          content_hash: string;
          raw_size_bytes: number;
          compressed_size_bytes: number;
          metadata?: Json | null;
          captured_at?: string;
        };
        Update: Partial<Database['public']['Tables']['practitioner_source_snapshots']['Insert']>;
      };
      practitioner_ingestion_jobs: {
        Row: {
          id: string;
          query: string | null;
          area: string | null;
          province: SouthAfricanProvince;
          city: string | null;
          category: string | null;
          specialty: string | null;
          status: string;
          started_at: string | null;
          completed_at: string | null;
          results_found: number;
          created_count: number;
          updated_count: number;
          duplicates_count: number;
          errors_count: number;
          error_log: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          query?: string | null;
          area?: string | null;
          province: SouthAfricanProvince;
          city?: string | null;
          category?: string | null;
          specialty?: string | null;
          status?: string;
          started_at?: string | null;
          completed_at?: string | null;
          results_found?: number;
          created_count?: number;
          updated_count?: number;
          duplicates_count?: number;
          errors_count?: number;
          error_log?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['practitioner_ingestion_jobs']['Insert']>;
      };
      practitioner_duplicate_candidates: {
        Row: {
          id: string;
          source_id: string;
          target_id: string;
          confidence_score: number;
          match_reasons: Json | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          target_id: string;
          confidence_score: number;
          match_reasons?: Json | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['practitioner_duplicate_candidates']['Insert']>;
      };
      practitioner_data_conflicts: {
        Row: {
          id: string;
          practitioner_id: string;
          field_name: string;
          existing_value: string | null;
          existing_authority: DataAuthority;
          incoming_value: string | null;
          incoming_authority: DataAuthority;
          source_type: string;
          status: string;
          resolution_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id: string;
          field_name: string;
          existing_value?: string | null;
          existing_authority: DataAuthority;
          incoming_value?: string | null;
          incoming_authority: DataAuthority;
          source_type: string;
          status?: string;
          resolution_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['practitioner_data_conflicts']['Insert']>;
      };
      provider_external_claims: {
        Row: {
          id: string;
          provider_id: string;
          practitioner_directory_id: string;
          claim_status: ClaimStatus;
          verification_notes: string | null;
          proof_documents: Json | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          practitioner_directory_id: string;
          claim_status?: ClaimStatus;
          verification_notes?: string | null;
          proof_documents?: Json | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['provider_external_claims']['Insert']>;
      };
      providers: {
        Row: {
          id: string;
          title: string;
          bio: string | null;
          experience_years: number;
          consultation_fee_cents: number;
          photo_url: string | null;
          languages: string[];
          gender: string | null;
          is_accepting_new_patients: boolean;
          verification_status: VerificationStatus;
          claim_status: ClaimStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title?: string;
          bio?: string | null;
          experience_years?: number;
          consultation_fee_cents?: number;
          photo_url?: string | null;
          languages?: string[];
          gender?: string | null;
          is_accepting_new_patients?: boolean;
          verification_status?: VerificationStatus;
          claim_status?: ClaimStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['providers']['Insert']>;
      };
      patient_subscription_plans: {
        Row: {
          id: PatientSubscriptionTier;
          name: string;
          tagline: string;
          price_cents: number;
          monthly_external_reveals: number | null;
          is_popular: boolean;
          features: Json;
          created_at: string;
        };
        Insert: {
          id: PatientSubscriptionTier;
          name: string;
          tagline: string;
          price_cents: number;
          monthly_external_reveals?: number | null;
          is_popular?: boolean;
          features: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['patient_subscription_plans']['Insert']>;
      };
      patient_subscriptions: {
        Row: {
          id: string;
          patient_id: string;
          plan_id: PatientSubscriptionTier;
          status: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          payment_method: string | null;
          payment_gateway_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          plan_id?: PatientSubscriptionTier;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          payment_method?: string | null;
          payment_gateway_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['patient_subscriptions']['Insert']>;
      };
      external_practitioner_unlocks: {
        Row: {
          id: string;
          patient_id: string;
          practitioner_id: string;
          subscription_period_start: string;
          plan_tier: PatientSubscriptionTier;
          unlocked_at: string;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          practitioner_id: string;
          subscription_period_start: string;
          plan_tier: PatientSubscriptionTier;
          unlocked_at?: string;
          ip_address?: string | null;
        };
        Update: Partial<Database['public']['Tables']['external_practitioner_unlocks']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          booking_reference: string;
          provider_id: string;
          patient_id: string;
          dependant_id: string | null;
          location_id: string | null;
          appointment_type_id: string;
          status: AppointmentStatus;
          start_datetime: string;
          end_datetime: string;
          mode: string;
          reason_for_visit: string | null;
          medical_aid_membership_id: string | null;
          consultation_fee_cents: number;
          payment_status: string;
          cancellation_reason: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_reference: string;
          provider_id: string;
          patient_id: string;
          dependant_id?: string | null;
          location_id?: string | null;
          appointment_type_id: string;
          status?: AppointmentStatus;
          start_datetime: string;
          end_datetime: string;
          mode?: string;
          reason_for_visit?: string | null;
          medical_aid_membership_id?: string | null;
          consultation_fee_cents?: number;
          payment_status?: string;
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      slot_holds: {
        Row: {
          id: string;
          provider_id: string;
          patient_id: string;
          appointment_type_id: string | null;
          start_datetime: string;
          end_datetime: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          patient_id: string;
          appointment_type_id?: string | null;
          start_datetime: string;
          end_datetime: string;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['slot_holds']['Insert']>;
      };
      medical_schemes: {
        Row: {
          id: string;
          code: string;
          name: string;
          administrator: string | null;
          logo_url: string | null;
          contact_phone: string | null;
          website: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          administrator?: string | null;
          logo_url?: string | null;
          contact_phone?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['medical_schemes']['Insert']>;
      };
    };
    Functions: {
      search_practitioners_projected: {
        Args: {
          p_patient_id?: string | null;
          p_query?: string | null;
          p_specialty_code?: string | null;
          p_province?: SouthAfricanProvince | null;
          p_city?: string | null;
          p_suburb?: string | null;
          p_user_lat?: number | null;
          p_user_lng?: number | null;
          p_max_distance_km?: number | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: Json;
      };
      unlock_external_practitioner_atomic: {
        Args: {
          p_patient_id: string;
          p_practitioner_id: string;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      hold_appointment_slot: {
        Args: {
          p_provider_id: string;
          p_patient_id: string;
          p_appointment_type_id: string;
          p_start_datetime: string;
          p_end_datetime: string;
        };
        Returns: Json;
      };
    };
  };
}
