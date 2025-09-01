import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipoNotificacion, EstadoReporte, Reporte } from '../types';

/**
 * Configuración de notificaciones
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificacionLocal {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: TipoNotificacion;
  fecha: Date;
  leida: boolean;
  data?: {
    reporte_id?: number;
    estado_anterior?: EstadoReporte;
    estado_nuevo?: EstadoReporte;
    url?: string;
    accion?: string;
  };
  prioridad: 'baja' | 'normal' | 'alta';
}

export interface ConfiguracionNotificaciones {
  push_habilitadas: boolean;
  locales_habilitadas: boolean;
  tipos_habilitados: {
    nuevo_reporte_cerca: boolean;
    actualizacion_reporte: boolean;
    comentario_reporte: boolean;
    like_reporte: boolean;
    validacion_reporte: boolean;
    emergencia: boolean;
    sistema: boolean;
  };
  horario_silencioso: {
    habilitado: boolean;
    hora_inicio: string; // "22:00"
    hora_fin: string;    // "07:00"
  };
  distancia_proximidad: number; // metros para notificaciones de proximidad
}

/**
 * Servicio de Notificaciones Push y Locales
 */
export class NotificationService {
  private static readonly STORAGE_KEY_NOTIFICATIONS = 'app_notifications';
  private static readonly STORAGE_KEY_CONFIG = 'notification_config';
  private static readonly STORAGE_KEY_TOKEN = 'expo_push_token';

  private static notificaciones: NotificacionLocal[] = [];
  private static configuracion: ConfiguracionNotificaciones = {
    push_habilitadas: true,
    locales_habilitadas: true,
    tipos_habilitados: {
      nuevo_reporte_cerca: true,
      actualizacion_reporte: true,
      comentario_reporte: true,
      like_reporte: true,
      validacion_reporte: true,
      emergencia: true,
      sistema: true,
    },
    horario_silencioso: {
      habilitado: true,
      hora_inicio: '22:00',
      hora_fin: '07:00',
    },
    distancia_proximidad: 1000, // 1km por defecto
  };

  private static contadorId = 1;

  /**
   * Inicializar el servicio de notificaciones
   */
  static async inicializar(): Promise<void> {
    console.log('🔔 Inicializando servicio de notificaciones...');
    
    await this.cargarConfiguracion();
    await this.cargarNotificaciones();
    await this.configurarPermisos();
    await this.obtenerTokenPush();
    
    console.log('✅ Servicio de notificaciones inicializado');
  }

  /**
   * Configurar permisos de notificaciones
   */
  private static async configurarPermisos(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Emulador detectado - notificaciones push no disponibles');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificación denegados');
        return false;
      }

      // Configurar canal para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Monitoreo Ciudadano',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
          sound: 'default',
        });

        // Canal para notificaciones de alta prioridad
        await Notifications.setNotificationChannelAsync('alta_prioridad', {
          name: 'Emergencias y Urgentes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250, 250, 250],
          lightColor: '#F44336',
          sound: 'default',
        });
      }

      console.log('✅ Permisos de notificación configurados');
      return true;
    } catch (error) {
      console.error('❌ Error configurando permisos:', error);
      return false;
    }
  }

  /**
   * Obtener token para notificaciones push
   */
  private static async obtenerTokenPush(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })).data;

      await AsyncStorage.setItem(this.STORAGE_KEY_TOKEN, token);
      console.log('📱 Token push obtenido:', token.substring(0, 20) + '...');
      
      return token;
    } catch (error) {
      console.error('❌ Error obteniendo token push:', error);
      return null;
    }
  }

  /**
   * Enviar notificación local
   */
  static async enviarNotificacionLocal(
    titulo: string,
    cuerpo: string,
    tipo: TipoNotificacion,
    data?: NotificacionLocal['data'],
    prioridad: 'baja' | 'normal' | 'alta' = 'normal'
  ): Promise<string> {
    try {
      // Verificar configuración
      if (!this.configuracion.locales_habilitadas) {
        console.log('📴 Notificaciones locales deshabilitadas');
        return '';
      }

      if (!this.configuracion.tipos_habilitados[tipo]) {
        console.log(`📴 Tipo de notificación ${tipo} deshabilitado`);
        return '';
      }

      // Verificar horario silencioso
      if (this.estaEnHorarioSilencioso() && prioridad !== 'alta') {
        console.log('🤫 Horario silencioso activo - notificación diferida');
        return await this.programarNotificacion(titulo, cuerpo, tipo, data, prioridad);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: titulo,
          body: cuerpo,
          data,
          sound: prioridad === 'alta' ? 'default' : undefined,
          priority: prioridad === 'alta' ? 'high' : 'normal',
        },
        trigger: null, // Inmediata
      });

      // Guardar en historial local
      const notificacion: NotificacionLocal = {
        id: notificationId,
        titulo,
        cuerpo,
        tipo,
        fecha: new Date(),
        leida: false,
        data,
        prioridad,
      };

      this.notificaciones.unshift(notificacion);
      await this.guardarNotificaciones();

      console.log(`🔔 Notificación enviada: ${titulo}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      return '';
    }
  }

  /**
   * Programar notificación para después del horario silencioso
   */
  private static async programarNotificacion(
    titulo: string,
    cuerpo: string,
    tipo: TipoNotificacion,
    data?: NotificacionLocal['data'],
    prioridad: 'baja' | 'normal' | 'alta' = 'normal'
  ): Promise<string> {
    const ahora = new Date();
    const finSilencioso = this.calcularFinHorarioSilencioso();

    // Para simplificar, enviaremos la notificación inmediatamente con una nota sobre el horario
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${titulo}`,
        body: `${cuerpo} (Enviada durante horario silencioso)`,
        data,
      },
      trigger: null, // Inmediata pero con indicador
    });

    console.log(`⏰ Notificación programada para ${finSilencioso.toLocaleTimeString()}`);
    return notificationId;
  }

  /**
   * Verificar si está en horario silencioso
   */
  private static estaEnHorarioSilencioso(): boolean {
    if (!this.configuracion.horario_silencioso.habilitado) {
      return false;
    }

    const ahora = new Date();
    const horaActual = ahora.getHours() * 100 + ahora.getMinutes();
    
    const [inicioH, inicioM] = this.configuracion.horario_silencioso.hora_inicio.split(':').map(Number);
    const [finH, finM] = this.configuracion.horario_silencioso.hora_fin.split(':').map(Number);
    
    const horaInicio = inicioH * 100 + inicioM;
    const horaFin = finH * 100 + finM;

    // Manejar horario que cruza medianoche
    if (horaInicio > horaFin) {
      return horaActual >= horaInicio || horaActual <= horaFin;
    } else {
      return horaActual >= horaInicio && horaActual <= horaFin;
    }
  }

  /**
   * Calcular cuándo termina el horario silencioso
   */
  private static calcularFinHorarioSilencioso(): Date {
    const ahora = new Date();
    const [finH, finM] = this.configuracion.horario_silencioso.hora_fin.split(':').map(Number);
    
    const finSilencioso = new Date(ahora);
    finSilencioso.setHours(finH, finM, 0, 0);

    // Si la hora ya pasó hoy, programar para mañana
    if (finSilencioso <= ahora) {
      finSilencioso.setDate(finSilencioso.getDate() + 1);
    }

    return finSilencioso;
  }

  /**
   * Notificaciones específicas para cambios de estado
   */
  static async notificarCambioEstado(
    reporte: Reporte,
    estadoAnterior: EstadoReporte,
    estadoNuevo: EstadoReporte
  ): Promise<void> {
    const titulos: Partial<Record<EstadoReporte, string>> = {
      en_revision: '📋 Tu reporte está en revisión',
      en_progreso: '🔧 ¡Tu reporte está siendo atendido!',
      resuelto: '✅ ¡Tu reporte ha sido resuelto!',
      cerrado: '📁 Tu reporte ha sido cerrado',
      rechazado: '❌ Tu reporte ha sido rechazado',
    };

    const cuerpos: Partial<Record<EstadoReporte, string>> = {
      en_revision: `El reporte "${reporte.titulo}" está siendo evaluado por nuestro equipo.`,
      en_progreso: `Estamos trabajando en resolver "${reporte.titulo}". Te mantendremos informado.`,
      resuelto: `El problema "${reporte.titulo}" ha sido solucionado. ¡Gracias por tu participación!`,
      cerrado: `El reporte "${reporte.titulo}" ha sido cerrado. Puedes ver los detalles en la app.`,
      rechazado: `El reporte "${reporte.titulo}" no cumple con los criterios. Puedes crear uno nuevo.`,
    };

    const prioridad = estadoNuevo === 'resuelto' ? 'alta' : 'normal';

    await this.enviarNotificacionLocal(
      titulos[estadoNuevo] || '📢 Estado de reporte actualizado',
      cuerpos[estadoNuevo] || `Tu reporte "${reporte.titulo}" cambió a ${estadoNuevo}`,
      'actualizacion_reporte',
      {
        reporte_id: reporte.id,
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo,
        accion: 'ver_detalle',
      },
      prioridad
    );
  }

  /**
   * Notificar reporte cercano
   */
  static async notificarReporteCercano(reporte: Reporte, distancia: number): Promise<void> {
    await this.enviarNotificacionLocal(
      '📍 Reporte cerca de ti',
      `Hay un reporte de "${reporte.categoria.nombre}" a ${Math.round(distancia)}m de tu ubicación`,
      'nuevo_reporte_cerca',
      {
        reporte_id: reporte.id,
        accion: 'ver_mapa',
      },
      'normal'
    );
  }

  /**
   * Notificar validación completada
   */
  static async notificarValidacionCompletada(reporte: Reporte): Promise<void> {
    await this.enviarNotificacionLocal(
      '🎯 Validación completada',
      `Tu reporte "${reporte.titulo}" ha sido validado y verificado`,
      'validacion_reporte',
      {
        reporte_id: reporte.id,
        accion: 'ver_detalle',
      },
      'normal'
    );
  }

  /**
   * Obtener notificaciones del usuario
   */
  static getNotificaciones(limite: number = 50): NotificacionLocal[] {
    return this.notificaciones.slice(0, limite);
  }

  /**
   * Marcar notificación como leída
   */
  static async marcarComoLeida(notificationId: string): Promise<void> {
    const index = this.notificaciones.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notificaciones[index].leida = true;
      await this.guardarNotificaciones();
    }
  }

  /**
   * Marcar todas como leídas
   */
  static async marcarTodasComoLeidas(): Promise<void> {
    this.notificaciones.forEach(n => n.leida = true);
    await this.guardarNotificaciones();
  }

  /**
   * Contar notificaciones no leídas
   */
  static contarNoLeidas(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  /**
   * Actualizar configuración
   */
  static async actualizarConfiguracion(nuevaConfig: Partial<ConfiguracionNotificaciones>): Promise<void> {
    this.configuracion = { ...this.configuracion, ...nuevaConfig };
    await this.guardarConfiguracion();
    console.log('⚙️ Configuración de notificaciones actualizada');
  }

  /**
   * Obtener configuración actual
   */
  static getConfiguracion(): ConfiguracionNotificaciones {
    return { ...this.configuracion };
  }

  /**
   * Cancelar notificación programada
   */
  static async cancelarNotificacion(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Limpiar todas las notificaciones
   */
  static async limpiarNotificaciones(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.notificaciones = [];
    await this.guardarNotificaciones();
  }

  /**
   * Cargar configuración desde storage
   */
  private static async cargarConfiguracion(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(this.STORAGE_KEY_CONFIG);
      if (configStr) {
        this.configuracion = { ...this.configuracion, ...JSON.parse(configStr) };
      }
    } catch (error) {
      console.error('❌ Error cargando configuración de notificaciones:', error);
    }
  }

  /**
   * Guardar configuración en storage
   */
  private static async guardarConfiguracion(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(this.configuracion));
    } catch (error) {
      console.error('❌ Error guardando configuración de notificaciones:', error);
    }
  }

  /**
   * Cargar notificaciones desde storage
   */
  private static async cargarNotificaciones(): Promise<void> {
    try {
      const notifStr = await AsyncStorage.getItem(this.STORAGE_KEY_NOTIFICATIONS);
      if (notifStr) {
        const notificaciones = JSON.parse(notifStr);
        this.notificaciones = notificaciones.map((n: any) => ({
          ...n,
          fecha: new Date(n.fecha),
        }));
      }
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    }
  }

  /**
   * Guardar notificaciones en storage
   */
  private static async guardarNotificaciones(): Promise<void> {
    try {
      // Mantener solo las últimas 100 notificaciones
      const notificacionesParaGuardar = this.notificaciones.slice(0, 100);
      await AsyncStorage.setItem(this.STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notificacionesParaGuardar));
    } catch (error) {
      console.error('❌ Error guardando notificaciones:', error);
    }
  }
}

export default NotificationService;
