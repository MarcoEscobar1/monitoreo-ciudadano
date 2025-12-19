import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { AnimatedEntrance, AnimatedListItem } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import apiService from '../../services/apiService';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationItem {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'accepted' | 'rejected' | 'pending';
  timestamp: string | Date;
  read: boolean;
  iconEmoji: string;
  reportTitle: string;
  reporte_id: number;
}

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const { refreshUnreadCount } = useNotifications();

  // Guardar notificaciones leídas en AsyncStorage
  const saveReadNotifications = async (readSet: Set<string>) => {
    try {
      console.log('💾 Guardando notificaciones leídas:', Array.from(readSet));
      await AsyncStorage.setItem('readNotifications', JSON.stringify(Array.from(readSet)));
    } catch (error) {
      console.error('Error guardando notificaciones leídas:', error);
    }
  };

  // Cargar notificaciones desde el backend
  const fetchNotifications = async (showLoader = true, readSet?: Set<string>) => {
    try {
      if (showLoader) setLoading(true);
      
      console.log('📡 Llamando a API de notificaciones...');
      const response = await apiService.notifications.getNotifications();
      console.log('✅ Respuesta recibida:', response);
      
      if (response.success && response.data) {
        // Usar el readSet proporcionado o el estado actual
        const currentReadSet = readSet || readNotifications;
        
        // Transformar los datos del backend al formato del frontend
        const transformedNotifications = response.data.map((notif: any) => ({
          id: notif.id,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          tipo: notif.tipo,
          timestamp: new Date(notif.timestamp),
          read: currentReadSet.has(notif.id), // Usar el estado de leído local
          iconEmoji: notif.iconEmoji,
          reportTitle: notif.reportTitle,
          reporte_id: notif.reporte_id
        }));
        
        console.log('📋 Notificaciones transformadas:', transformedNotifications.length);
        setNotifications(transformedNotifications);
      } else {
        console.log('⚠️ No hay datos en la respuesta');
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
      setNotifications([]);
      Alert.alert(
        'Error',
        'No se pudieron cargar las notificaciones. Intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      console.log('✅ Finalizando carga...');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🔄 Inicializando notificaciones...');
        const readNotifs = await AsyncStorage.getItem('readNotifications');
        let readSet = new Set<string>();
        
        if (readNotifs) {
          try {
            const parsedArray = JSON.parse(readNotifs);
            console.log('📄 Datos parseados:', parsedArray);
            
            // Validar que sea un array
            if (Array.isArray(parsedArray)) {
              // Limpiar y filtrar solo IDs válidos
              parsedArray.forEach((id) => {
                if (id && typeof id === 'string' && id.startsWith('notif-')) {
                  readSet.add(id);
                }
              });
            }
          } catch (parseError) {
            console.error('❌ Error parseando notificaciones:', parseError);
            // Si hay error al parsear, limpiar el storage
            await AsyncStorage.removeItem('readNotifications');
          }
        }
        
        console.log('📖 Notificaciones leídas cargadas:', Array.from(readSet));
        setReadNotifications(readSet);
        
        await fetchNotifications(true, readSet);
      } catch (error) {
        console.error('❌ Error en inicialización:', error);
        setLoading(false);
        setNotifications([]);
      }
    };
    
    initializeNotifications();
  }, []);

  // Refrescar notificaciones cuando la pantalla obtiene el foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Pantalla de notificaciones obtuvo el foco, refrescando...');
      fetchNotifications(false);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  // Separar notificaciones recientes (no leídas o las últimas 2 leídas) del historial
  const { recentNotifications, historyNotifications } = useMemo(() => {
    // Notificaciones no leídas van a recientes
    const unread = notifications.filter(n => !n.read);
    
    // De las leídas, solo las últimas 2 van a recientes
    const read = notifications.filter(n => n.read);
    const recentRead = read.slice(0, 2);
    const oldRead = read.slice(2);

    const recent = [...unread, ...recentRead].sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    const history = oldRead;

    return { recentNotifications: recent, historyNotifications: history };
  }, [notifications]);

  const getTypeColor = (tipo: NotificationItem['tipo']) => {
    switch (tipo) {
      case 'accepted': return DESIGN_SYSTEM.COLORS.success[500];
      case 'rejected': return DESIGN_SYSTEM.COLORS.error[500];
      case 'pending': return DESIGN_SYSTEM.COLORS.warning[500];
      default: return DESIGN_SYSTEM.COLORS.neutral[500];
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
  };

  const marcarComoLeida = async (notificationId: string) => {
    const newReadSet = new Set(readNotifications);
    newReadSet.add(notificationId);
    setReadNotifications(newReadSet);
    await saveReadNotifications(newReadSet);
    
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Actualizar el contador en el contexto
    refreshUnreadCount();
  };

  const marcarTodasComoLeidas = () => {
    const notificacionesSinLeer = notifications.filter(n => !n.read).length;
    
    if (notificacionesSinLeer === 0) {
      Alert.alert(
        '📧 Sin notificaciones',
        'No hay notificaciones sin leer',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      '📖 Marcar como leídas',
      `¿Estás seguro de que quieres marcar ${notificacionesSinLeer} notificación${notificacionesSinLeer > 1 ? 'es' : ''} como leída${notificacionesSinLeer > 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Marcar como leídas',
          style: 'default',
          onPress: async () => {
            const newReadSet = new Set(readNotifications);
            notifications.forEach(notif => newReadSet.add(notif.id));
            setReadNotifications(newReadSet);
            await saveReadNotifications(newReadSet);
            
            setNotifications(prevNotifications => 
              prevNotifications.map(notification => ({
                ...notification,
                read: true
              }))
            );
            
            // Actualizar el contador en el contexto
            if (refreshUnreadCount) {
              refreshUnreadCount();
            }
            
            Alert.alert(
              '✅ Completado',
              'Todas las notificaciones han sido marcadas como leídas',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const renderNotificationItem = (notification: NotificationItem, index: number) => (
    <AnimatedListItem key={notification.id} index={index}>
      <TouchableOpacity 
        style={[
          styles.notificationItem,
          !notification.read && styles.notificationUnread
        ]}
        activeOpacity={0.7}
        onPress={() => marcarComoLeida(notification.id)}
      >
        <View style={styles.notificationIcon}>
          <Text style={styles.iconEmoji}>{notification.iconEmoji}</Text>
          <View 
            style={[
              styles.typeIndicator, 
              { backgroundColor: getTypeColor(notification.tipo) }
            ]} 
          />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.titulo}</Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(notification.timestamp instanceof Date ? notification.timestamp : new Date(notification.timestamp))}
            </Text>
          </View>
          <Text style={styles.notificationMessage}>{notification.mensaje}</Text>
        </View>

        {!notification.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </AnimatedListItem>
  );

  // Mostrar loader mientras carga
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={DESIGN_SYSTEM.COLORS.primary[500]} />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            setLoading(false);
            setNotifications([]);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <AnimatedEntrance type="slideInDown">
          <View style={styles.header}>
            <Text style={styles.title}>🔔 Notificaciones</Text>
            <Text style={styles.subtitle}>
              Revisa el estado de tus reportes ciudadanos
            </Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <Text style={styles.refreshText}>🔄 Actualizar</Text>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedEntrance>

        {/* Notificaciones Recientes */}
        <AnimatedEntrance type="fadeIn">
          <Card style={styles.notificationsCard}>
            <CardHeader 
              title="Recientes" 
              subtitle={`${recentNotifications.filter(n => !n.read).length} sin leer`}
            />
            <CardContent style={styles.notificationsList}>
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification, index) => 
                  renderNotificationItem(notification, index)
                )
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyTitle}>No hay notificaciones recientes</Text>
                  <Text style={styles.emptyText}>
                    Aquí verás el estado de tus reportes más recientes
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </AnimatedEntrance>

        {/* Botón para marcar todas como leídas */}
        {notifications.some(n => !n.read) && (
          <AnimatedEntrance type="fadeIn">
            <View style={styles.actionButtons}>
              <Button
                variant="outlined"
                title="Marcar todas como leídas"
                onPress={marcarTodasComoLeidas}
              />
            </View>
          </AnimatedEntrance>
        )}

        {/* Historial de Notificaciones */}
        <AnimatedEntrance type="fadeIn">
          <Card style={styles.notificationsCard}>
            <CardHeader 
              title="Historial" 
              subtitle={`${historyNotifications.length} notificación${historyNotifications.length !== 1 ? 'es' : ''}`}
            />
            <CardContent style={styles.notificationsList}>
              {historyNotifications.length > 0 ? (
                historyNotifications.map((notification, index) => 
                  renderNotificationItem(notification, index)
                )
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📂</Text>
                  <Text style={styles.emptyTitle}>Sin historial</Text>
                  <Text style={styles.emptyText}>
                    El historial de tus reportes anteriores aparecerá aquí
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </AnimatedEntrance>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: DESIGN_SYSTEM.SPACING.base,
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
  },
  cancelButton: {
    marginTop: DESIGN_SYSTEM.SPACING.lg,
    paddingVertical: DESIGN_SYSTEM.SPACING.sm,
    paddingHorizontal: DESIGN_SYSTEM.SPACING.lg,
  },
  cancelButtonText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.primary[500],
    textDecorationLine: 'underline',
  },
  content: {
    padding: DESIGN_SYSTEM.SPACING.base,
  },
  header: {
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
    marginTop: DESIGN_SYSTEM.SPACING.base,
  },
  refreshButton: {
    marginTop: DESIGN_SYSTEM.SPACING.sm,
    alignSelf: 'flex-start',
  },
  refreshText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.primary[500],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
  },
  title: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.neutral[900],
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  subtitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    lineHeight: 24,
  },
  notificationsCard: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  notificationsList: {
    padding: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: DESIGN_SYSTEM.SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.COLORS.neutral[100],
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
  },
  notificationUnread: {
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: DESIGN_SYSTEM.COLORS.primary[500],
  },
  notificationIcon: {
    position: 'relative',
    marginRight: DESIGN_SYSTEM.SPACING.base,
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  typeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[0],
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  notificationTitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.semibold,
    color: DESIGN_SYSTEM.COLORS.neutral[900],
    flex: 1,
    marginRight: DESIGN_SYSTEM.SPACING.sm,
  },
  notificationTime: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.xs,
    color: DESIGN_SYSTEM.COLORS.neutral[500],
  },
  notificationMessage: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.neutral[700],
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    marginLeft: DESIGN_SYSTEM.SPACING.sm,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.SPACING['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  emptyTitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.lg,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.semibold,
    color: DESIGN_SYSTEM.COLORS.neutral[700],
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  emptyText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButtons: {
    marginTop: DESIGN_SYSTEM.SPACING.base,
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
  },
});

export default NotificationsScreen;
