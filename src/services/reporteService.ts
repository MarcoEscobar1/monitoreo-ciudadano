import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reporte, EstadoReporte, PrioridadReporte, TipoZona } from '../types';
import { imageService } from './imageService';
import { categoryService, reportService } from './apiService';
import { validacionService } from './validacionService';

export interface FiltroReportes {
  categoria?: string;
  estado?: EstadoReporte;
  prioridad?: PrioridadReporte;
  fechaDesde?: Date;
  fechaHasta?: Date;
  texto?: string;
  ubicacion?: {
    centro: { lat: number; lng: number };
    radio: number; // en metros
  };
}

export interface ReporteCreationResult {
  success: boolean;
  reporte?: Reporte;
  error?: string;
  warnings?: string[];
}

export interface EstadisticasReportes {
  total: number;
  pendientes: number;
  enProceso: number;
  resueltos: number;
  rechazados: number;
  porCategoria: { [categoria: number]: number };
  tendencia: { fecha: string; cantidad: number }[];
}

/**
 * Servicio principal para gestión de reportes
 * Maneja CRUD, validaciones, estadísticas y sincronización
 */
class ReporteService {
  private readonly STORAGE_KEY = 'reportes_ciudadanos';
  private readonly MY_REPORTS_KEY = 'mis_reportes';
  private readonly STATS_KEY = 'estadisticas_reportes';
  
  private reportes: Reporte[] = [];
  private misReportes: Reporte[] = [];
  private nextId = 1;

  constructor() {
    this.loadReportsFromStorage();
  }

  /**
   * Cargar reportes desde AsyncStorage
   */
  private async loadReportsFromStorage(): Promise<void> {
    try {
      const [reportesData, misReportesData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.MY_REPORTS_KEY),
      ]);

      if (reportesData) {
        this.reportes = JSON.parse(reportesData);
      }

      if (misReportesData) {
        this.misReportes = JSON.parse(misReportesData);
      }

      // Calcular siguiente ID
      const allReportes = [...this.reportes, ...this.misReportes];
      if (allReportes.length > 0) {
        this.nextId = Math.max(...allReportes.map(r => r.id)) + 1;
      }

      console.log(`📊 Reportes cargados: ${this.reportes.length} públicos, ${this.misReportes.length} míos`);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
    }
  }

  /**
   * Guardar reportes en AsyncStorage
   */
  private async saveReportesToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.reportes)),
        AsyncStorage.setItem(this.MY_REPORTS_KEY, JSON.stringify(this.misReportes)),
      ]);
    } catch (error) {
      console.error('❌ Error guardando reportes:', error);
    }
  }

  /**
   * Crear nuevo reporte con validaciones completas
   */
  async crearReporte(data: {
    titulo: string;
    descripcion: string;
    categoria_id: string;
    ubicacion: { lat: number; lng: number };
    direccion?: string;
    imagen?: string;
    prioridad?: PrioridadReporte;
    es_anonimo?: boolean;
  }): Promise<ReporteCreationResult> {
    try {
      console.log('📝 Creando nuevo reporte...');

      // 1. Validar datos básicos
      if (!data.titulo?.trim()) {
        return { success: false, error: 'El título es requerido' };
      }

      if (!data.descripcion?.trim()) {
        return { success: false, error: 'La descripción es requerida' };
      }

      if (!data.ubicacion?.lat || !data.ubicacion?.lng) {
        return { success: false, error: 'La ubicación es requerida' };
      }

      // 2. Validar y procesar imagen si existe
      let imagenesProcesadas: string[] = [];
      if (data.imagen) {
        try {
          // Verificar que la imagen tenga una URI válida
          if (data.imagen.startsWith('file://') || 
              data.imagen.startsWith('content://') ||
              data.imagen.startsWith('data:image/') ||
              data.imagen.startsWith('http://') ||
              data.imagen.startsWith('https://')) {
            
            imagenesProcesadas.push(data.imagen);
            console.log('✅ Imagen válida detectada:', data.imagen.substring(0, 50) + '...');
          } else {
            console.warn('⚠️ Formato de imagen no reconocido:', data.imagen.substring(0, 50));
            return { 
              success: false, 
              error: 'Formato de imagen no válido. Use cámara o galería.' 
            };
          }
        } catch (error) {
          console.error('❌ Error procesando imagen:', error);
          return { 
            success: false, 
            error: 'Error al procesar la imagen' 
          };
        }
      }

      // 3. Intentar crear reporte en el backend
      try {
        const reporteData = {
          titulo: data.titulo.trim(),
          descripcion: data.descripcion.trim(),
          categoria_id: data.categoria_id,
          ubicacion: {
            latitude: data.ubicacion.lat,
            longitude: data.ubicacion.lng,
          },
          direccion: data.direccion || '',
          prioridad: data.prioridad || 'media',
          imagenes: imagenesProcesadas,
        };

        const response = await reportService.create(reporteData);
        
        if (response.success && response.data) {
          console.log('✅ Reporte creado en backend:', response.data.id);
          
          // Convertir respuesta del backend a formato local
          const nuevoReporte: Reporte = {
            id: response.data.id,
            titulo: response.data.titulo,
            descripcion: response.data.descripcion,
            categoria_id: data.categoria_id,
            zona_id: 1,
            ubicacion: response.data.ubicacion,
            direccion: response.data.direccion,
            imagenes: imagenesProcesadas,
            estado: response.data.estado as EstadoReporte,
            prioridad: response.data.prioridad as PrioridadReporte,
            fecha_creacion: new Date(response.data.fecha_creacion),
            fecha_actualizacion: new Date(response.data.fecha_creacion),
            usuario_id: data.es_anonimo ? 0 : 1,
            likes: 0,
            dislikes: 0,
            validaciones: 0,
            comentarios_count: 0,
            usuario: { id: 1, nombre: response.data.usuario?.nombre || 'Usuario' },
            categoria: response.data.categoria || await this.getCategoriaInfo(data.categoria_id),
            zona: { 
              id: 1, 
              nombre: 'Zona Centro', 
              tipo: 'barrio' as TipoZona, 
              coordenadas: [], 
              activa: true 
            },
          };

          // También guardar localmente para cache
          this.misReportes.push(nuevoReporte);
          this.reportes.push(nuevoReporte);
          await this.saveReportesToStorage();

          return {
            success: true,
            reporte: nuevoReporte
          };
        }
      } catch (backendError) {
        console.log('⚠️ Backend no disponible, guardando localmente...', backendError);
      }

      // 4. Si el backend no está disponible, crear reporte local
      const categoria = await this.getCategoriaInfo(data.categoria_id);
      
      const nuevoReporte: Reporte = {
        id: this.nextId++,
        titulo: data.titulo.trim(),
        descripcion: data.descripcion.trim(),
        categoria_id: data.categoria_id,
        zona_id: 1,
        ubicacion: {
          latitude: data.ubicacion.lat,
          longitude: data.ubicacion.lng,
        },
        direccion: data.direccion || 'Dirección no especificada',
        imagenes: imagenesProcesadas,
        estado: 'nuevo' as EstadoReporte,
        prioridad: data.prioridad || 'media',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        usuario_id: data.es_anonimo ? 0 : 1,
        likes: 0,
        dislikes: 0,
        validaciones: 0,
        comentarios_count: 0,
        usuario: { id: 1, nombre: 'Usuario Anónimo' },
        categoria: {
          id: categoria.id,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || 'Sin descripción',
          activa: categoria.activa,
        },
        zona: { 
          id: 1, 
          nombre: 'Zona Centro', 
          tipo: 'barrio' as TipoZona, 
          coordenadas: [], 
          activa: true 
        },
      };

      // Guardar reporte local
      this.misReportes.push(nuevoReporte);
      this.reportes.push(nuevoReporte);
      await this.saveReportesToStorage();

      console.log(`✅ Reporte creado localmente: ID ${nuevoReporte.id}`);
      
      return {
        success: true,
        reporte: nuevoReporte,
        warnings: ['Reporte guardado localmente. Se sincronizará cuando haya conexión.']
      };

    } catch (error) {
      console.error('❌ Error creando reporte:', error);
      return {
        success: false,
        error: 'Error interno del sistema'
      };
    }
  }

  /**
   * Obtener información de categoría
   */
  private async getCategoriaInfo(categoriaId: string) {
    try {
      const categoria = await categoryService.getById(categoriaId);
      return categoria || {
        id: categoriaId,
        nombre: 'Categoría Desconocida',
        descripcion: 'Categoría no encontrada',
        activa: true,
      };
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      return {
        id: categoriaId,
        nombre: 'Categoría Desconocida',
        descripcion: 'Categoría no encontrada',
        activa: true,
      };
    }
  }

  /**
   * Obtener reporte por ID
   */
  async getReporte(id: number): Promise<Reporte | null> {
    const reporte = [...this.reportes, ...this.misReportes]
      .find(r => r.id === id);
    
    return reporte || null;
  }

  /**
   * Obtener mis reportes
   */
  async getMisReportes(filtro?: FiltroReportes): Promise<Reporte[]> {
    let reportes = [...this.misReportes];

    if (filtro) {
      reportes = this.aplicarFiltros(reportes, filtro);
    }

    return reportes.sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );
  }

  /**
   * Obtener reportes validados para el mapa interactivo
   * Solo devuelve reportes que han sido validados por admin
   */
  async getReportesParaMapa(filtro?: any): Promise<Reporte[]> {
    try {
      console.log('🗺️ Obteniendo reportes validados para mapa...');
      const response = await reportService.getForMap(filtro);
      
      if (response.success && response.data && response.data.length > 0) {
        console.log(`✅ Reportes validados obtenidos: ${response.data.length}`);
        return response.data;
      }
    } catch (error) {
      console.log('⚠️ Error obteniendo reportes para mapa:', error);
    }

    // Fallback: filtrar reportes locales solo validados
    return this.reportes.filter(r => r.validado === true);
  }

  /**
   * Obtener todos los reportes (públicos)
   */
  async getReportes(filtro?: FiltroReportes): Promise<Reporte[]> {
    try {
      // Intentar obtener reportes del backend
      const backendReportes = await reportService.getAll(filtro);
      
      if (backendReportes && backendReportes.length > 0) {
        console.log(`✅ Reportes obtenidos del backend: ${backendReportes.length}`);
        return backendReportes;
      }
    } catch (error) {
      console.log('⚠️ Backend no disponible, usando reportes locales');
    }

    // Usar reportes locales como fallback
    let reportes = [...this.reportes];

    if (filtro) {
      reportes = this.aplicarFiltros(reportes, filtro);
    }

    return reportes.sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    );
  }

  /**
   * Aplicar filtros a lista de reportes
   */
  private aplicarFiltros(reportes: Reporte[], filtro: FiltroReportes): Reporte[] {
    let resultado = [...reportes];

    // Filtrar por categoría
    if (filtro.categoria) {
      resultado = resultado.filter(reporte => 
        reporte.categoria_id === filtro.categoria
      );
    }

    // Filtrar por estado
    if (filtro.estado) {
      resultado = resultado.filter(reporte => 
        reporte.estado === filtro.estado
      );
    }

    // Filtrar por prioridad
    if (filtro.prioridad) {
      resultado = resultado.filter(reporte => 
        reporte.prioridad === filtro.prioridad
      );
    }

    // Filtrar por fechas
    if (filtro.fechaDesde) {
      resultado = resultado.filter(reporte => 
        new Date(reporte.fecha_creacion) >= filtro.fechaDesde!
      );
    }

    if (filtro.fechaHasta) {
      resultado = resultado.filter(reporte => 
        new Date(reporte.fecha_creacion) <= filtro.fechaHasta!
      );
    }

    // Filtrar por texto (título o descripción)
    if (filtro.texto) {
      const texto = filtro.texto.toLowerCase();
      resultado = resultado.filter(reporte => 
        reporte.titulo.toLowerCase().includes(texto) ||
        reporte.descripcion.toLowerCase().includes(texto)
      );
    }

    return resultado;
  }

  /**
   * Actualizar estado de un reporte
   */
  async actualizarEstado(id: number, nuevoEstado: EstadoReporte): Promise<boolean> {
    try {
      const index = this.reportes.findIndex(r => r.id === id);
      const myIndex = this.misReportes.findIndex(r => r.id === id);

      if (index !== -1) {
        this.reportes[index] = {
          ...this.reportes[index],
          estado: nuevoEstado,
          fecha_actualizacion: new Date(),
        };
      }

      if (myIndex !== -1) {
        this.misReportes[myIndex] = {
          ...this.misReportes[myIndex],
          estado: nuevoEstado,
          fecha_actualizacion: new Date(),
        };
      }

      await this.saveReportesToStorage();
      console.log(`✅ Estado del reporte ${id} actualizado a: ${nuevoEstado}`);
      return true;
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      return false;
    }
  }

  /**
   * Obtener reportes del usuario autenticado
   */
  async obtenerMisReportes(): Promise<any[]> {
    try {
      console.log('📥 Obteniendo reportes del usuario...');
      const response = await reportService.getMy();
      
      if (response.success && response.data) {
        console.log(`✅ Reportes del usuario obtenidos: ${response.data.length}`);
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo mis reportes:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const reporteService = new ReporteService();
