import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredRoles,
  fallback
}) => {
  const { isAuthorized } = useAuth();

/*   if (!isAuthorized(requiredRoles)) {
    return fallback ? <>{fallback}</> : null;
  }
 */
  return <>{children}</>;
};