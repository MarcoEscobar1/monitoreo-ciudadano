import api from './apiService';

export interface AdminStats {
  total: number;
  pendientes_validacion: number;
  pendientes: number;
  en_revision: number;
  en_proceso: number;
  resueltos: number;
  rechazados: number;
  ultimas_24h: number;
  ultima_semana: number;
}

export interface PendingReport {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  validado: boolean;
  fecha_creacion: string;
  imagen_principal?: string;
  longitud: number;
  latitud: number;
  direccion: string;
  nombre: string;
  apellidos: string;
  usuario_email: string;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
}

export interface AdminUser {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipo_usuario: string;
  activo: boolean;
  email_verificado: boolean;
  fecha_registro: string;
  fecha_ultimo_acceso: string;
  total_reportes: number;
}

export interface CategoryStats {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  total_reportes: number;
  reportes_validados: number;
  reportes_resueltos: number;
  reportes_ultimo_mes: number;
}

export interface PendingUser {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fecha_registro: string;
  metodo_auth: string;
}

class AdminService {
  // ================================
  // REPORTES
  // ================================

  async getPendingReports(): Promise<PendingReport[]> {
    try {
      const response = await api.get('/admin/reports/pending');
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error obteniendo reportes pendientes:', error);
      throw new Error(error.message || 'Error obteniendo reportes pendientes');
    }
  }

  async getReportsStats(): Promise<AdminStats> {
    try {
      const response = await api.get('/admin/reports/stats');
      console.log('📊 AdminService.getReportsStats - Respuesta completa:', JSON.stringify(response));
      console.log('📊 AdminService.getReportsStats - response.data:', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw new Error(error.message || 'Error obteniendo estadísticas');
    }
  }

  async validateReport(reportId: string, comentarios?: string): Promise<void> {
    try {
      await api.post(`/admin/reports/${reportId}/validate`, { comentarios });
    } catch (error: any) {
      console.error('❌ Error validando reporte:', error);
      throw new Error(error.message || 'Error validando reporte');
    }
  }

  async rejectReport(reportId: string, motivo: string): Promise<void> {
    try {
      if (!motivo) {
        throw new Error('El motivo de rechazo es requerido');
      }
      await api.post(`/admin/reports/${reportId}/reject`, { motivo });
    } catch (error: any) {
      console.error('❌ Error rechazando reporte:', error);
      throw new Error(error.message || 'Error rechazando reporte');
    }
  }

  async updateReportStatus(
    reportId: string, 
    estado: string, 
    comentarios?: string
  ): Promise<void> {
    try {
      await api.patch(`/admin/reports/${reportId}/status`, { estado, comentarios });
    } catch (error: any) {
      console.error('❌ Error actualizando estado:', error);
      throw new Error(error.message || 'Error actualizando estado');
    }
  }

  // ================================
  // USUARIOS
  // ================================

  async getUsers(page = 1, limit = 20, tipo?: string): Promise<{
    data: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString() 
      });
      if (tipo) queryParams.append('tipo', tipo);
      
      const response = await api.get(`/admin/users?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error obteniendo usuarios:', error);
      throw new Error(error.message || 'Error obteniendo usuarios');
    }
  }

  async toggleUserStatus(userId: string, activo: boolean): Promise<void> {
    try {
      await api.patch(`/admin/users/${userId}/status`, { activo });
    } catch (error: any) {
      console.error('❌ Error actualizando usuario:', error);
      throw new Error(error.message || 'Error actualizando usuario');
    }
  }

  // ================================
  // CATEGORÍAS
  // ================================

  async getCategories(): Promise<any[]> {
    try {
      const response = await api.get('/admin/categories');
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error obteniendo categorías:', error);
      throw new Error(error.message || 'Error obteniendo categorías');
    }
  }

  async createCategory(data: {
    nombre: string;
    descripcion?: string;
    tipo_problema: string;
    icono?: string;
    color?: string;
    prioridad_base?: string;
  }): Promise<any> {
    try {
      const response = await api.post('/admin/categories', data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando categoría:', error);
      throw new Error(error.message || 'Error creando categoría');
    }
  }

  async updateCategory(categoryId: string, data: {
    nombre?: string;
    descripcion?: string;
    icono?: string;
    color?: string;
    prioridad_base?: string;
    activo?: boolean;
  }): Promise<any> {
    try {
      const response = await api.put(`/admin/categories/${categoryId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error actualizando categoría:', error);
      throw new Error(error.message || 'Error actualizando categoría');
    }
  }

  async getReportsByCategory(): Promise<CategoryStats[]> {
    try {
      const response = await api.get('/admin/reports/by-category');
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error obteniendo reportes por categoría:', error);
      throw new Error(error.message || 'Error obteniendo reportes por categoría');
    }
  }

  // ================================
  // USUARIOS PENDIENTES
  // ================================

  async getPendingUsers(): Promise<PendingUser[]> {
    try {
      const response = await api.get('/admin/users/pending');
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Error obteniendo usuarios pendientes:', error);
      throw new Error(error.message || 'Error obteniendo usuarios pendientes');
    }
  }

  async validateUser(userId: string, comentarios?: string): Promise<void> {
    try {
      await api.post(`/admin/users/${userId}/validate`, { comentarios });
    } catch (error: any) {
      console.error('❌ Error validando usuario:', error);
      throw new Error(error.message || 'Error validando usuario');
    }
  }

  async rejectUser(userId: string, motivo: string): Promise<void> {
    try {
      if (!motivo) {
        throw new Error('El motivo de rechazo es requerido');
      }
      await api.post(`/admin/users/${userId}/reject`, { motivo });
    } catch (error: any) {
      console.error('❌ Error rechazando usuario:', error);
      throw new Error(error.message || 'Error rechazando usuario');
    }
  }
}

export default new AdminService();
