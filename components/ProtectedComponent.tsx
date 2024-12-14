import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredRoles?: string[]; // Optional: Roles allowed to access the component
  fallback?: React.ReactNode; // Optional: Fallback UI for unauthorized access
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredRoles = [], // Defaults to an empty array (no roles required)
  fallback = null // Defaults to null if no fallback UI is provided
}) => {
  const { isAuthorized, loading } = useAuth();

  // Show loading state if the auth context is still loading
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not authorized for the specified roles
  if (!isAuthorized(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Render children if the user is authorized
  return <>{children}</>;
};
