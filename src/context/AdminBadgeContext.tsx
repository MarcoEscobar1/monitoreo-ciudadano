import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import adminService from '../services/adminService';

interface AdminBadgeContextType {
  pendingReportsCount: number;
  pendingUsersCount: number;
  refreshBadges: () => Promise<void>;
}

const AdminBadgeContext = createContext<AdminBadgeContextType>({
  pendingReportsCount: 0,
  pendingUsersCount: 0,
  refreshBadges: async () => {},
});

export const useAdminBadges = () => useContext(AdminBadgeContext);

export const AdminBadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshBadges = async () => {
    try {
      // Verificar si el usuario está autenticado y es admin
      const token = await SecureStore.getItemAsync('userToken');
      const userDataString = await SecureStore.getItemAsync('userData');
      
      console.log('🔍 AdminBadgeContext: refreshBadges llamado');
      console.log('🔑 Token existe:', !!token);
      console.log('📄 UserData existe:', !!userDataString);
      
      if (!token || !userDataString) {
        // Si no hay token o datos de usuario, resetear contadores
        console.log('❌ No hay token o userData, reseteando contadores');
        setPendingReportsCount(0);
        setPendingUsersCount(0);
        return;
      }

      const userData = JSON.parse(userDataString);
      console.log('👤 Tipo de usuario:', userData.tipo_usuario);
      
      const isAdmin = userData.tipo_usuario === 'ADMINISTRADOR' || 
                      userData.tipo_usuario === 'MODERADOR' ||
                      userData.tipo_usuario === 'admin';
      
      console.log('👮 Es admin:', isAdmin);
      
      if (!isAdmin) {
        // Si no es admin, resetear contadores
        console.log('❌ Usuario no es admin, reseteando contadores');
        setPendingReportsCount(0);
        setPendingUsersCount(0);
        return;
      }

      console.log('👮 AdminBadgeContext: Actualizando contadores de admin...');

      // Obtener estadísticas de reportes pendientes
      const statsResponse = await adminService.getReportsStats();
      console.log('📡 AdminBadgeContext: Respuesta de stats:', JSON.stringify(statsResponse));
      
      if (statsResponse) {
        // pendientes_validacion puede venir como string o number
        const pendingReports = typeof statsResponse.pendientes_validacion === 'string' 
          ? parseInt(statsResponse.pendientes_validacion) 
          : (statsResponse.pendientes_validacion || 0);
        console.log('📊 Reportes pendientes de validación:', pendingReports);
        setPendingReportsCount(pendingReports);
      }

      // Obtener usuarios pendientes de aprobación
      const usersResponse = await adminService.getPendingUsers();
      if (usersResponse) {
        const pendingUsers = usersResponse.length || 0;
        console.log('👥 Usuarios pendientes de aprobación:', pendingUsers);
        setPendingUsersCount(pendingUsers);
      }
    } catch (error) {
      // Silenciar errores de autenticación cuando no hay sesión o no es admin
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('Token de acceso requerido') && 
          !errorMessage.includes('No autorizado') &&
          !errorMessage.includes('Acceso denegado')) {
        console.error('❌ Error obteniendo contadores de admin:', error);
      }
      setPendingReportsCount(0);
      setPendingUsersCount(0);
    }
  };

  // Monitorear cambios en el estado de admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      const userDataString = await SecureStore.getItemAsync('userData');
      
      const wasAdmin = isAdmin;
      let nowAdmin = false;
      
      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        nowAdmin = userData.tipo_usuario === 'ADMINISTRADOR' || 
                   userData.tipo_usuario === 'MODERADOR' ||
                   userData.tipo_usuario === 'admin';
      }
      
      setIsAdmin(nowAdmin);
      
      // Si acabamos de convertirnos en admin, refrescar inmediatamente
      if (!wasAdmin && nowAdmin) {
        console.log('👮 Usuario admin detectado, refrescando badges...');
        await refreshBadges();
      }
    };
    
    // Verificar inmediatamente
    checkAdminStatus();
    
    // Verificar cada segundo durante los primeros 5 segundos (para detectar login rápido)
    const rapidChecks = [100, 300, 500, 800, 1200].map(delay =>
      setTimeout(checkAdminStatus, delay)
    );
    
    // Actualizar cada 60 segundos si es admin (reducir carga al servidor)
    const interval = setInterval(async () => {
      const token = await SecureStore.getItemAsync('userToken');
      const userDataString = await SecureStore.getItemAsync('userData');
      
      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        const isAdmin = userData.tipo_usuario === 'ADMINISTRADOR' || 
                        userData.tipo_usuario === 'MODERADOR' ||
                        userData.tipo_usuario === 'admin';
        
        if (isAdmin) {
          await refreshBadges();
        }
      }
    }, 60000); // 60 segundos
    
    return () => {
      rapidChecks.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [isAdmin]);

  return (
    <AdminBadgeContext.Provider value={{ pendingReportsCount, pendingUsersCount, refreshBadges }}>
      {children}
    </AdminBadgeContext.Provider>
  );
};
