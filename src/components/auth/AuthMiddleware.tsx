import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants';

interface AuthProtectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: string;
}

/**
 * Componente HOC para proteger rutas que requieren autenticación
 */
export const AuthProtection: React.FC<AuthProtectionProps> = ({ 
  children, 
  fallback = null, 
  requiredRole 
}) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Mostrar loading durante verificación de autenticación
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Si no está autenticado, mostrar fallback
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Verificar rol si es requerido
  if (requiredRole && user.role !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook para verificar permisos específicos
 */
export const usePermissions = () => {
  const { isAuthenticated, user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // Lógica de permisos basada en roles
    const permissions: Record<string, string[]> = {
      admin: ['create', 'read', 'update', 'delete', 'moderate'],
      moderator: ['create', 'read', 'update', 'moderate'],
      user: ['create', 'read', 'update'],
      guest: ['read'],
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const canCreateReports = (): boolean => hasPermission('create');
  const canModerateReports = (): boolean => hasPermission('moderate');
  const canDeleteReports = (): boolean => hasPermission('delete');

  return {
    hasPermission,
    canCreateReports,
    canModerateReports,
    canDeleteReports,
  };
};

/**
 * HOC para componentes que requieren autenticación
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRole?: string;
    fallback?: React.ComponentType;
  } = {}
) => {
  return (props: P) => {
    const FallbackComponent = options.fallback || (() => null);

    return (
      <AuthProtection 
        requiredRole={options.requiredRole}
        fallback={<FallbackComponent />}
      >
        <Component {...props} />
      </AuthProtection>
    );
  };
};

/**
 * Componente para mostrar contenido solo a usuarios autenticados
 */
export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Componente para mostrar contenido solo a usuarios no autenticados
 */
export const UnauthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default {
  AuthProtection,
  withAuth,
  AuthenticatedOnly,
  UnauthenticatedOnly,
  usePermissions,
};
