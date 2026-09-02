import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/context';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireEmailVerified?: boolean;
  requireProfileComplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireEmailVerified = true,
  requireProfileComplete = true,
}) => {
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, isProfileComplete, user, role } = useAuth();

  // 1. Not Authenticated -> Redirect to Sign In
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  // 2. Email not verified -> Redirect to Verification
  if (requireEmailVerified && !isEmailVerified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // 3. Profile incomplete -> Redirect to Profile Completion
  if (requireProfileComplete && !isProfileComplete) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  // 4. Role Authorization Check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role) || allowedRoles.includes(role);
    if (!hasRole) {
      // Redirect to their respective appropriate home
      if (user.role === 'PROVIDER') {
        return <Navigate to="/provider/dashboard" replace />;
      }
      if (user.role === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/patient/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
