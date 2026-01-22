import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoriaProblema } from '../types';
import { categoryService } from './apiService';

/**
 * Servicio simplificado para gestión de categorías
 * Conecta con el backend y mantiene cache local
 */
class CategoriaService {
  private readonly STORAGE_KEY = 'categorias_problemas';
  private categorias: CategoriaProblema[] = [];
  private lastUpdate: Date | null = null;
  
  // Categorías por defecto para fallback
  private readonly categoriasDefault: CategoriaProblema[] = [
    {
      id: 'default-1',
      nombre: 'Infraestructura',
      descripcion: 'Problemas relacionados con calles, aceras, puentes, etc.',
      icono: 'build',
      color: '#FF6B35',
      activa: true,
      orden: 1
    },
    {
      id: 'default-2',
      nombre: 'Transporte',
      descripcion: 'Problemas de transporte público, semáforos, señalización',
      icono: 'directions-car',
      color: '#004E89',
      activa: true,
      orden: 2
    },
    {
      id: 'default-3',
      nombre: 'Medio Ambiente',
      descripcion: 'Contaminación, basuras, espacios verdes',
      icono: 'eco',
      color: '#2ECC71',
      activa: true,
      orden: 3
    },
    {
      id: 'default-4',
      nombre: 'Seguridad',
      descripcion: 'Problemas de seguridad ciudadana, alumbrado público',
      icono: 'security',
      color: '#E74C3C',
      activa: true,
      orden: 4
    },
    {
      id: 'default-5',
      nombre: 'Servicios Públicos',
      descripcion: 'Agua, luz, gas, recolección de basuras',
      icono: 'lightbulb',
      color: '#F39C12',
      activa: true,
      orden: 5
    },
    {
      id: 'default-6',
      nombre: 'Salud',
      descripcion: 'Servicios de salud pública, centros de salud',
      icono: 'local-hospital',
      color: '#9B59B6',
      activa: true,
      orden: 6
    }
  ];

  constructor() {
    this.loadCategoriasFromStorage();
  }

  /**
   * Cargar categorías desde AsyncStorage
   */
  private async loadCategoriasFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      const lastUpdateData = await AsyncStorage.getItem(`${this.STORAGE_KEY}_last_update`);

      if (data) {
        this.categorias = JSON.parse(data);
        this.lastUpdate = lastUpdateData ? new Date(lastUpdateData) : null;
      }

      // Si no hay datos o son muy antiguos (más de 1 hora), intentar actualizar
      const shouldUpdate = !this.lastUpdate || 
                          (Date.now() - this.lastUpdate.getTime()) > 60 * 60 * 1000;
      
      if (shouldUpdate) {
        await this.syncWithBackend();
      }

    } catch (error) {
      console.error('Error cargando categorías:', error);
      this.categorias = [...this.categoriasDefault];
    }
  }

  /**
   * Sincronizar con el backend
   */
  private async syncWithBackend(): Promise<void> {
    try {
      const backendCategorias = await categoryService.getAll();
      
      if (backendCategorias && backendCategorias.length > 0) {
        // Las categorías ya vienen con encoding correcto desde la base de datos
        this.categorias = backendCategorias;
        this.lastUpdate = new Date();
        
        // Guardar en cache
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.categorias));
        await AsyncStorage.setItem(`${this.STORAGE_KEY}_last_update`, this.lastUpdate.toISOString());
      }
    } catch (error) {
      // Si no hay cache, usar categorías por defecto
      if (this.categorias.length === 0) {
        this.categorias = [...this.categoriasDefault];
      }
    }
  }

  /**
   * Obtener todas las categorías activas
   */
  async getCategorias(): Promise<CategoriaProblema[]> {
    // Si está vacío, cargar primero
    if (this.categorias.length === 0) {
      await this.loadCategoriasFromStorage();
    }

    return this.categorias
      .filter(categoria => categoria.activa)
      .sort((a, b) => a.orden - b.orden);
  }

  /**
   * Obtener categoría por ID
   */
  async getCategoriaById(id: string): Promise<CategoriaProblema | null> {
    try {
      // Intentar obtener del backend primero
      const backendCategoria = await categoryService.getById(id);
      if (backendCategoria) {
        return backendCategoria; // Ya viene con encoding correcto
      }
    } catch (error) {
      // Backend no disponible, usar cache local
    }

    // Fallback a cache local
    const categorias = await this.getCategorias();
    return categorias.find(categoria => categoria.id === id) || null;
  }

  /**
   * Buscar categorías por nombre
   */
  async buscarCategorias(termino: string): Promise<CategoriaProblema[]> {
    const categorias = await this.getCategorias();
    const terminoLower = termino.toLowerCase();
    
    return categorias.filter(categoria =>
      categoria.nombre.toLowerCase().includes(terminoLower) ||
      categoria.descripcion.toLowerCase().includes(terminoLower)
    );
  }

  /**
   * Forzar actualización desde backend y limpiar cache
   */
  async forceUpdate(): Promise<boolean> {
    try {
      // Limpiar cache primero
      await this.clearCache();
      // Luego sincronizar
      await this.syncWithBackend();
      return true;
    } catch (error) {
      console.error('Error forzando actualización:', error);
      return false;
    }
  }

  /**
   * Limpiar cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_last_update`);
      this.categorias = [];
      this.lastUpdate = null;
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  }
}

// Exportar instancia singleton
export const categoriaService = new CategoriaService();
export default categoriaService;
