import { categoriaService, CategoriaProblema } from './categoriaService';
import { Coordenada } from '../types';

export interface ValidacionReporte {
  esValido: boolean;
  errores: string[];
  advertencias: string[];
  puntuacion: number; // 0-100
  sugerencias: string[];
}

export interface DatosReporte {
  titulo: string;
  descripcion: string;
  categoriaId: number;
  ubicacion?: Coordenada;
  fotos?: string[];
  camposPersonalizados?: Record<string, any>;
  esAnonimo?: boolean;
  contacto?: {
    telefono?: string;
    email?: string;
  };
}

class ValidacionService {
  private readonly MIN_TITULO_LENGTH = 10;
  private readonly MAX_TITULO_LENGTH = 100;
  private readonly MIN_DESCRIPCION_LENGTH = 20;
  private readonly MAX_DESCRIPCION_LENGTH = 1000;
  private readonly MAX_FOTOS = 5;

  /**
   * Validar reporte completo
   */
  async validarReporte(datos: DatosReporte): Promise<ValidacionReporte> {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let puntuacion = 100;

    // Validaciones básicas
    const validacionBasica = this.validarCamposBasicos(datos);
    errores.push(...validacionBasica.errores);
    advertencias.push(...validacionBasica.advertencias);
    sugerencias.push(...validacionBasica.sugerencias);
    puntuacion -= validacionBasica.penalizacion;

    // Validación de categoría
    const validacionCategoria = await this.validarCategoria(datos);
    errores.push(...validacionCategoria.errores);
    advertencias.push(...validacionCategoria.advertencias);
    sugerencias.push(...validacionCategoria.sugerencias);
    puntuacion -= validacionCategoria.penalizacion;

    // Validación de contenido
    const validacionContenido = this.validarContenido(datos);
    errores.push(...validacionContenido.errores);
    advertencias.push(...validacionContenido.advertencias);
    sugerencias.push(...validacionContenido.sugerencias);
    puntuacion -= validacionContenido.penalizacion;

    // Validación de ubicación
    const validacionUbicacion = this.validarUbicacion(datos);
    errores.push(...validacionUbicacion.errores);
    advertencias.push(...validacionUbicacion.advertencias);
    sugerencias.push(...validacionUbicacion.sugerencias);
    puntuacion -= validacionUbicacion.penalizacion;

    // Validación de fotos
    const validacionFotos = this.validarFotos(datos);
    errores.push(...validacionFotos.errores);
    advertencias.push(...validacionFotos.advertencias);
    sugerencias.push(...validacionFotos.sugerencias);
    puntuacion -= validacionFotos.penalizacion;

    // Validación de contacto
    const validacionContacto = this.validarContacto(datos);
    errores.push(...validacionContacto.errores);
    advertencias.push(...validacionContacto.advertencias);
    sugerencias.push(...validacionContacto.sugerencias);
    puntuacion -= validacionContacto.penalizacion;

    return {
      esValido: errores.length === 0,
      errores: [...new Set(errores)], // Eliminar duplicados
      advertencias: [...new Set(advertencias)],
      sugerencias: [...new Set(sugerencias)],
      puntuacion: Math.max(0, Math.min(100, puntuacion)),
    };
  }

  /**
   * Validar campos básicos
   */
  private validarCamposBasicos(datos: DatosReporte): {
    errores: string[];
    advertencias: string[];
    sugerencias: string[];
    penalizacion: number;
  } {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let penalizacion = 0;

    // Validar título
    if (!datos.titulo || datos.titulo.trim().length === 0) {
      errores.push('El título es obligatorio');
      penalizacion += 20;
    } else {
      const titulo = datos.titulo.trim();
      
      if (titulo.length < this.MIN_TITULO_LENGTH) {
        errores.push(`El título debe tener al menos ${this.MIN_TITULO_LENGTH} caracteres`);
        penalizacion += 15;
      } else if (titulo.length > this.MAX_TITULO_LENGTH) {
        errores.push(`El título no puede exceder ${this.MAX_TITULO_LENGTH} caracteres`);
        penalizacion += 10;
      }

      // Verificar calidad del título
      if (titulo.length < 20) {
        sugerencias.push('Un título más descriptivo ayudará a procesar tu reporte más rápido');
        penalizacion += 5;
      }

      if (titulo.toUpperCase() === titulo) {
        advertencias.push('Evita escribir todo en mayúsculas');
        penalizacion += 3;
      }

      if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(titulo)) {
        errores.push('El título debe contener al menos una letra');
        penalizacion += 10;
      }
    }

    // Validar descripción
    if (!datos.descripcion || datos.descripcion.trim().length === 0) {
      errores.push('La descripción es obligatoria');
      penalizacion += 20;
    } else {
      const descripcion = datos.descripcion.trim();
      
      if (descripcion.length < this.MIN_DESCRIPCION_LENGTH) {
        errores.push(`La descripción debe tener al menos ${this.MIN_DESCRIPCION_LENGTH} caracteres`);
        penalizacion += 15;
      } else if (descripcion.length > this.MAX_DESCRIPCION_LENGTH) {
        errores.push(`La descripción no puede exceder ${this.MAX_DESCRIPCION_LENGTH} caracteres`);
        penalizacion += 10;
      }

      // Verificar calidad de la descripción
      if (descripcion.split(' ').length < 10) {
        sugerencias.push('Una descripción más detallada ayudará a resolver el problema más eficientemente');
        penalizacion += 5;
      }

      if (descripcion.toUpperCase() === descripcion) {
        advertencias.push('Evita escribir toda la descripción en mayúsculas');
        penalizacion += 3;
      }
    }

    // Validar categoría
    if (!datos.categoriaId || datos.categoriaId <= 0) {
      errores.push('Debes seleccionar una categoría');
      penalizacion += 20;
    }

    return { errores, advertencias, sugerencias, penalizacion };
  }

  /**
   * Validar categoría específica
   */
  private async validarCategoria(datos: DatosReporte): Promise<{
    errores: string[];
    advertencias: string[];
    sugerencias: string[];
    penalizacion: number;
  }> {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let penalizacion = 0;

    try {
      const categoria = await categoriaService.getCategoriaById(datos.categoriaId);
      
      if (!categoria) {
        errores.push('La categoría seleccionada no existe');
        penalizacion += 20;
        return { errores, advertencias, sugerencias, penalizacion };
      }

      if (!categoria.activa) {
        errores.push('La categoría seleccionada no está disponible');
        penalizacion += 20;
        return { errores, advertencias, sugerencias, penalizacion };
      }

      // Validar campos personalizados
      if (categoria.camposPersonalizados) {
        for (const campo of categoria.camposPersonalizados) {
          const valor = datos.camposPersonalizados?.[campo.id];

          if (campo.requerido && (valor === undefined || valor === null || valor === '')) {
            errores.push(`El campo "${campo.nombre}" es requerido para esta categoría`);
            penalizacion += 10;
          }
        }
      }

      // Validar ubicación requerida
      if (categoria.requiereUbicacion && !datos.ubicacion) {
        errores.push('Esta categoría requiere especificar la ubicación');
        penalizacion += 15;
      }

      // Validar foto requerida
      if (categoria.requiereFoto && (!datos.fotos || datos.fotos.length === 0)) {
        errores.push('Esta categoría requiere al menos una foto');
        penalizacion += 15;
      }

      // Advertencias según prioridad
      switch (categoria.prioridad) {
        case 'critica':
          advertencias.push('Este es un reporte de prioridad crítica. Será atendido inmediatamente.');
          break;
        case 'alta':
          advertencias.push('Este reporte será procesado con alta prioridad.');
          break;
        case 'media':
          if (categoria.tiempoRespuestaEsperado) {
            advertencias.push(`Tiempo estimado de respuesta: ${categoria.tiempoRespuestaEsperado} horas.`);
          }
          break;
      }

    } catch (error) {
      console.error('❌ Error validando categoría:', error);
      errores.push('Error verificando la categoría');
      penalizacion += 10;
    }

    return { errores, advertencias, sugerencias, penalizacion };
  }

  /**
   * Validar contenido del reporte
   */
  private validarContenido(datos: DatosReporte): {
    errores: string[];
    advertencias: string[];
    sugerencias: string[];
    penalizacion: number;
  } {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let penalizacion = 0;

    // Detectar contenido inapropiado (lista básica)
    const palabrasInapropiadas = [
      'idiota', 'estupido', 'imbecil', 'maldito',
      // Agrega más según necesites
    ];

    const contenidoCompleto = `${datos.titulo} ${datos.descripcion}`.toLowerCase();
    
    const palabrasEncontradas = palabrasInapropiadas.filter(palabra => 
      contenidoCompleto.includes(palabra)
    );

    if (palabrasEncontradas.length > 0) {
      advertencias.push('Tu reporte contiene lenguaje que podría considerarse inapropiado');
      sugerencias.push('Usar un lenguaje respetuoso ayuda a que tu reporte sea tomado más en serio');
      penalizacion += 10;
    }

    // Detectar spam o texto repetitivo
    const palabras = contenidoCompleto.split(/\s+/);
    const frecuenciaPalabras: Record<string, number> = {};
    
    palabras.forEach(palabra => {
      if (palabra.length > 3) { // Solo palabras significativas
        frecuenciaPalabras[palabra] = (frecuenciaPalabras[palabra] || 0) + 1;
      }
    });

    const palabrasRepetitivas = Object.entries(frecuenciaPalabras)
      .filter(([_, count]) => count > 3)
      .map(([palabra]) => palabra);

    if (palabrasRepetitivas.length > 2) {
      advertencias.push('Tu reporte contiene mucho texto repetitivo');
      sugerencias.push('Trata de ser más conciso y variado en tu descripción');
      penalizacion += 5;
    }

    // Verificar si parece ser un reporte real
    const patronesVagos = [
      /problema.*general/i,
      /mal.*todo/i,
      /no.*funciona.*nada/i,
      /terrible.*servicio/i,
    ];

    const esVago = patronesVagos.some(patron => patron.test(contenidoCompleto));
    
    if (esVago) {
      sugerencias.push('Trata de ser más específico sobre el problema que estás reportando');
      penalizacion += 8;
    }

    return { errores, advertencias, sugerencias, penalizacion };
  }

  /**
   * Validar ubicación
   */
  private validarUbicacion(datos: DatosReporte): {
    errores: string[];
    advertencias: string[];
    sugerencias: string[];
    penalizacion: number;
  } {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let penalizacion = 0;

    if (datos.ubicacion) {
      const { latitude, longitude } = datos.ubicacion;

      // Validar coordenadas válidas
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        errores.push('Las coordenadas de ubicación no son válidas');
        penalizacion += 15;
      } else {
        // Validar rangos de coordenadas (aproximados para el mundo)
        if (latitude < -90 || latitude > 90) {
          errores.push('La latitud debe estar entre -90 y 90 grados');
          penalizacion += 15;
        }

        if (longitude < -180 || longitude > 180) {
          errores.push('La longitud debe estar entre -180 y 180 grados');
          penalizacion += 15;
        }

        // Verificar si está en una ubicación razonable (no en el océano, etc.)
        // Esta es una validación muy básica, en una implementación real usarías servicios de geocodificación
        if (latitude === 0 && longitude === 0) {
          advertencias.push('La ubicación parece estar en coordenadas 0,0. Verifica que sea correcta.');
          penalizacion += 5;
        }
      }
    } else {
      // Si no hay ubicación pero no es requerida, dar sugerencia
      sugerencias.push('Agregar la ubicación ayuda a procesar el reporte más eficientemente');
      penalizacion += 3;
    }

    return { errores, advertencias, sugerencias, penalizacion };
  }

  /**
   * Validar fotos
   */
  private validarFotos(datos: DatosReporte): {
    errores: string[];
    advertencias: string[];
    sugerencias: string[];
    penalizacion: number;
  } {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let penalizacion = 0;

    if (datos.fotos) {
      if (datos.fotos.length > this.MAX_FOTOS) {
        errores.push(`No puedes agregar más de ${this.MAX_FOTOS} fotos`);
        penalizacion += 10;
      }

      // Validar que las URIs de fotos sean válidas
      const fotosInvalidas = datos.fotos.filter(foto => 
        !foto || typeof foto !== 'string' || foto.trim().length === 0
      );

      if (fotosInvalidas.length > 0) {
        errores.push('Algunas fotos no son válidas');
        penalizacion += 8;
      }

      // Sugerir más fotos si solo hay una
      if (datos.fotos.length === 1) {
        sugerencias.push('Agregar más fotos desde diferentes ángulos puede ayudar a entender mejor el problema');
      }
    } else {
      // Si no hay fotos, sugerir agregarlas
      sugerencias.push('Las fotos ayudan significativamente a entender y resolver el problema más rápido');
      penalizacion += 5;
    }

    return { errores, advertencias, sugerencias, penalizacion };
  }

  /**
   * Validar información de contacto
   */
  private validarContacto(datos: DatosReporte): {
    errores: string[];
    advertencias: string[];
    sugerencias: string[];
    penalizacion: number;
  } {
    const errores: string[] = [];
    const advertencias: string[] = [];
    const sugerencias: string[] = [];
    let penalizacion = 0;

    if (datos.esAnonimo) {
      advertencias.push('Los reportes anónimos pueden tomar más tiempo en ser procesados');
      sugerencias.push('Considera proporcionar al menos un método de contacto para seguimiento');
      penalizacion += 3;
    } else if (datos.contacto) {
      const { telefono, email } = datos.contacto;

      // Validar teléfono si se proporciona
      if (telefono) {
        const telefonoLimpio = telefono.replace(/\D/g, '');
        if (telefonoLimpio.length < 7) {
          errores.push('El número de teléfono debe tener al menos 7 dígitos');
          penalizacion += 5;
        } else if (telefonoLimpio.length > 15) {
          errores.push('El número de teléfono no puede tener más de 15 dígitos');
          penalizacion += 5;
        }
      }

      // Validar email si se proporciona
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errores.push('El formato del email no es válido');
          penalizacion += 5;
        }
      }

      // Si no tiene ningún método de contacto
      if (!telefono && !email) {
        sugerencias.push('Proporcionar un método de contacto ayuda a obtener actualizaciones sobre tu reporte');
        penalizacion += 2;
      }
    }

    return { errores, advertencias, sugerencias, penalizacion };
  }

  /**
   * Validar antes del envío (validación final)
   */
  async validarAntesDelEnvio(datos: DatosReporte): Promise<{
    puedeEnviar: boolean;
    motivosRechazo: string[];
    recomendaciones: string[];
  }> {
    const validacion = await this.validarReporte(datos);

    const motivosRechazo = validacion.errores;
    const recomendaciones: string[] = [
      ...validacion.advertencias,
      ...validacion.sugerencias,
    ];

    // Criterios adicionales para permitir envío
    let puedeEnviar = validacion.esValido;

    // Si la puntuación es muy baja, no permitir envío aunque no haya errores críticos
    if (validacion.puntuacion < 50) {
      puedeEnviar = false;
      motivosRechazo.push('La calidad del reporte es muy baja. Revisa las sugerencias y mejora el contenido.');
    }

    return {
      puedeEnviar,
      motivosRechazo,
      recomendaciones,
    };
  }

  /**
   * Generar recomendaciones para mejorar el reporte
   */
  async generarRecomendaciones(datos: DatosReporte): Promise<string[]> {
    const validacion = await this.validarReporte(datos);
    const recomendaciones: string[] = [...validacion.sugerencias];

    // Recomendaciones adicionales basadas en la puntuación
    if (validacion.puntuacion < 70) {
      recomendaciones.push('Considera revisar y mejorar el reporte antes de enviarlo');
    }

    if (validacion.puntuacion >= 80) {
      recomendaciones.push('¡Excelente! Tu reporte tiene muy buena calidad');
    }

    return recomendaciones;
  }
}

// Exportar instancia singleton
export const validacionService = new ValidacionService();
export default validacionService;
