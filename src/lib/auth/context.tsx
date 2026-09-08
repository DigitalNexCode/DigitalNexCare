import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  PatientSubscriptionTier,
  UserProfile,
  PatientDependant,
  PatientMedicalAidProfile,
  SouthAfricanProvince,
} from '../../types';
import { SUBSCRIPTION_PLANS } from '../constants';
import { SubscriptionService } from '../subscription/subscription-service';
import { UserUnlockService } from '../subscription/user-unlock-service';

export interface SignUpData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
}

export interface PatientProfileData {
  nationalIdOrPassport: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  province: SouthAfricanProvince;
  city: string;
  suburb: string;
  address: string;
  medicalAid?: PatientMedicalAidProfile;
}

export interface ProviderProfileData {
  title: string;
  specialty: string;
  hpcsaNumber?: string;
  sancNumber?: string;
  sapcNumber?: string;
  ahpcsaNumber?: string;
  practiceNumber?: string;
  practiceName: string;
  province: SouthAfricanProvince;
  city: string;
  suburb: string;
  address: string;
  consultationFeeZAR: number;
}

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: UserProfile | null;
  subscriptionPlan: PatientSubscriptionTier;
  setSubscriptionPlan: (plan: PatientSubscriptionTier) => void;
  revealsRemaining: number;
  unlockedIds: string[];
  unlockPractitioner: (id: string) => { success: boolean; message?: string };
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  pendingVerificationEmail: string | null;
  signIn: (email: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; message?: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; message?: string }>;
  resendVerificationCode: () => Promise<{ success: boolean; message?: string }>;
  completePatientProfile: (data: PatientProfileData) => Promise<{ success: boolean; message?: string }>;
  completeProviderProfile: (data: ProviderProfileData) => Promise<{ success: boolean; message?: string }>;
  updateUser: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  id: 'usr-patient-001',
  email: 'thandi.nkosi@example.co.za',
  fullName: 'Thandi Nkosi',
  phone: '+27 82 555 1234',
  role: 'PATIENT',
  isEmailVerified: true,
  isProfileComplete: true,
  createdAt: '2026-01-15T08:00:00Z',
  nationalIdOrPassport: '9204125890082',
  dateOfBirth: '1992-04-12',
  gender: 'FEMALE',
  province: 'Gauteng',
  city: 'Pretoria',
  suburb: 'Hatfield',
  address: '42 Burnett Street',
  currentPlan: 'NEXCARE_FREE',
  revealsUsedThisMonth: 0,
  monthlyRevealLimit: 2,
  billingPeriodEnd: '2026-09-30',
  unlockedPractitionerIds: [],
  dependants: [
    {
      id: 'dep-1',
      fullName: 'Sipho Nkosi',
      relationship: 'CHILD',
      idNumberOrDOB: '2020-04-12',
      dateOfBirth: '2020-04-12',
      medicalAidDependantCode: '01',
      guardianConsent: true,
    },
  ],
  medicalAid: {
    schemeName: 'Discovery Health',
    planName: 'Classic Comprehensive',
    membershipNumber: '984029112',
    mainMemberName: 'Thandi Nkosi',
    dependantCode: '00',
    eligibilityStatus: 'VERIFIED',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('PATIENT');
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlanState] = useState<PatientSubscriptionTier>('NEXCARE_FREE');
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    return DEFAULT_USER ? UserUnlockService.getUserUnlockedPractitionerIds(DEFAULT_USER.id) : [];
  });
  const [revealsUsed, setRevealsUsed] = useState<number>(() => {
    return DEFAULT_USER ? UserUnlockService.getUserQuotaStatus(DEFAULT_USER.id, 'NEXCARE_FREE').revealsUsed : 0;
  });

  const planInfo = SUBSCRIPTION_PLANS[subscriptionPlan];
  const totalAllowance = planInfo.monthlyReveals;
  const revealsRemaining = totalAllowance === -1 ? 999 : Math.max(0, totalAllowance - revealsUsed);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
      });
    }
  };

  const setSubscriptionPlan = (newPlan: PatientSubscriptionTier) => {
    setSubscriptionPlanState(newPlan);
    if (user) {
      const quota = UserUnlockService.getUserQuotaStatus(user.id, newPlan);
      setRevealsUsed(quota.revealsUsed);
      setUser({
        ...user,
        currentPlan: newPlan,
        monthlyRevealLimit: SUBSCRIPTION_PLANS[newPlan].monthlyReveals,
        revealsUsedThisMonth: quota.revealsUsed,
      });
    }
  };

  const unlockPractitioner = (id: string): { success: boolean; message?: string } => {
    if (!user) {
      return {
        success: false,
        message: 'Please sign in to unlock external practitioner details.',
      };
    }

    const result = UserUnlockService.unlockForUser({
      userId: user.id,
      practitionerId: id,
      currentPlan: subscriptionPlan,
    });

    if (result.status === 'ALREADY_UNLOCKED' || result.status === 'ALLOW') {
      const updatedUnlocked = UserUnlockService.getUserUnlockedPractitionerIds(user.id);
      setUnlockedIds(updatedUnlocked);
      setRevealsUsed(result.revealsUsed);
      setUser({
        ...user,
        revealsUsedThisMonth: result.revealsUsed,
        unlockedPractitionerIds: updatedUnlocked,
      });
      return { success: true, message: result.message };
    }

    return {
      success: false,
      message: result.message || 'EXTERNAL_PRACTITIONER_LIMIT_REACHED: You have reached your monthly reveal allowance.',
    };
  };

  const signIn = async (email: string, specifiedRole: UserRole = 'PATIENT') => {
    // Simulated authentication with smart defaults per role
    const isDoctor = specifiedRole === 'PROVIDER' || email.includes('dr.') || email.includes('provider');
    const isAdmin = specifiedRole === 'PLATFORM_ADMIN' || specifiedRole === 'SUPER_ADMIN';
    const newUserId = `usr-${Date.now()}`;
    const userUnlocks = UserUnlockService.getUserUnlockedPractitionerIds(newUserId);
    const userQuota = UserUnlockService.getUserQuotaStatus(newUserId, 'NEXCARE_FREE');

    const signedInUser: UserProfile = {
      id: newUserId,
      email,
      fullName: isDoctor ? 'Dr. Naledi Mokoena' : isAdmin ? 'Admin User' : 'Lerato Khumalo',
      phone: '+27 82 555 9876',
      role: specifiedRole,
      isEmailVerified: true,
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
      province: 'Gauteng',
      city: 'Pretoria',
      suburb: 'Hatfield',
      currentPlan: 'NEXCARE_FREE',
      revealsUsedThisMonth: userQuota.revealsUsed,
      monthlyRevealLimit: 2,
      billingPeriodEnd: '2026-09-30',
      unlockedPractitionerIds: userUnlocks,
      title: isDoctor ? 'Dr.' : undefined,
      specialty: isDoctor ? 'General Practitioner' : undefined,
      hpcsaNumber: isDoctor ? 'MP 0789456' : undefined,
      practiceName: isDoctor ? 'Hatfield Family Care Practice' : undefined,
      verificationStatus: isDoctor ? 'VERIFIED' : undefined,
      claimStatus: isDoctor ? 'CLAIMED' : undefined,
    };

    setUser(signedInUser);
    setRoleState(specifiedRole);
    setUnlockedIds(userUnlocks);
    setRevealsUsed(userQuota.revealsUsed);
    return { success: true };
  };

  const signUp = async (data: SignUpData) => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      isEmailVerified: false,
      isProfileComplete: false,
      createdAt: new Date().toISOString(),
      currentPlan: 'NEXCARE_FREE',
      revealsUsedThisMonth: 0,
      monthlyRevealLimit: 2,
      billingPeriodEnd: '2026-09-30',
      unlockedPractitionerIds: [],
    };

    setUser(newUser);
    setRoleState(data.role);
    setPendingVerificationEmail(data.email);
    return { success: true };
  };

  const verifyEmail = async (code: string) => {
    if (!code || code.trim().length < 4) {
      return { success: false, message: 'Please enter a valid 6-digit verification code.' };
    }

    if (user) {
      setUser({
        ...user,
        isEmailVerified: true,
      });
    }
    setPendingVerificationEmail(null);
    return { success: true };
  };

  const resendVerificationCode = async () => {
    return { success: true, message: 'Verification code resent to your email address.' };
  };

  const completePatientProfile = async (data: PatientProfileData) => {
    if (!user) return { success: false, message: 'User session not found.' };

    const updatedUser: UserProfile = {
      ...user,
      nationalIdOrPassport: data.nationalIdOrPassport,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      province: data.province,
      city: data.city,
      suburb: data.suburb,
      address: data.address,
      medicalAid: data.medicalAid,
      isProfileComplete: true,
    };

    setUser(updatedUser);
    return { success: true };
  };

  const completeProviderProfile = async (data: ProviderProfileData) => {
    if (!user) return { success: false, message: 'User session not found.' };

    const updatedUser: UserProfile = {
      ...user,
      title: data.title,
      specialty: data.specialty,
      hpcsaNumber: data.hpcsaNumber,
      sancNumber: data.sancNumber,
      sapcNumber: data.sapcNumber,
      ahpcsaNumber: data.ahpcsaNumber,
      practiceNumber: data.practiceNumber,
      practiceName: data.practiceName,
      province: data.province,
      city: data.city,
      suburb: data.suburb,
      address: data.address,
      consultationFeeZAR: data.consultationFeeZAR,
      isProfileComplete: true,
      verificationStatus: 'SUBMITTED',
      claimStatus: 'CLAIM_REQUESTED',
    };

    setUser(updatedUser);
    return { success: true };
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const logout = () => {
    setUser(null);
    setPendingVerificationEmail(null);
    setUnlockedIds([]);
    setRevealsUsed(0);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        user,
        subscriptionPlan,
        setSubscriptionPlan,
        revealsRemaining,
        unlockedIds,
        unlockPractitioner,
        isAuthenticated: Boolean(user),
        isEmailVerified: Boolean(user?.isEmailVerified),
        isProfileComplete: Boolean(user?.isProfileComplete),
        pendingVerificationEmail,
        signIn,
        signUp,
        verifyEmail,
        resendVerificationCode,
        completePatientProfile,
        completeProviderProfile,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
