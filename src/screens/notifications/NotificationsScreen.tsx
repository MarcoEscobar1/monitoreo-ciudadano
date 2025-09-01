import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { AnimatedEntrance, AnimatedListItem } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent, ListCard } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'update' | 'new_report' | 'validation' | 'emergency' | 'system';
  timestamp: Date;
  read: boolean;
  iconEmoji: string;
}

const NotificationsScreen: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [proximityEnabled, setProximityEnabled] = useState(true);
  const [emergencyEnabled, setEmergencyEnabled] = useState(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Reporte actualizado',
      message: 'Tu reporte "Bache en Av. Principal" ha sido marcado como "En progreso"',
      type: 'update',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      read: false,
      iconEmoji: '🔄'
    },
    {
      id: '2',
      title: 'Nuevo reporte cercano',
      message: 'Se reportó "Alumbrado público deficiente" a 200m de tu ubicación',
      type: 'new_report',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
      read: false,
      iconEmoji: '�'
    },
    {
      id: '4',
      title: 'Validación recibida',
      message: '5 usuarios han validado tu reporte como útil',
      type: 'validation',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      read: true,
      iconEmoji: '👍'
    },
  ]);

  const getTypeColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'emergency': return DESIGN_SYSTEM.COLORS.error[500];
      case 'update': return DESIGN_SYSTEM.COLORS.primary[500];
      case 'validation': return DESIGN_SYSTEM.COLORS.success[500];
      case 'new_report': return DESIGN_SYSTEM.COLORS.secondary[500];
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
    return `Hace ${diffDays} días`;
  };

  const marcarComoLeida = (notificationId: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
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
          onPress: () => {
            setNotifications(prevNotifications => 
              prevNotifications.map(notification => ({
                ...notification,
                read: true
              }))
            );
            
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <AnimatedEntrance type="slideInDown">
          <View style={styles.header}>
            <Text style={styles.title}>Notificaciones</Text>
            <Text style={styles.subtitle}>
              Mantente informado sobre actualizaciones de tus reportes y actividad en tu zona
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance type="fadeIn">
          <Card style={styles.configCard}>
            <CardHeader title="Configuración de notificaciones" />
            <CardContent>
              <View style={styles.configItem}>
                <View style={styles.configInfo}>
                  <Text style={styles.configLabel}>Push notifications</Text>
                  <Text style={styles.configDescription}>Recibir notificaciones instantáneas</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ 
                    false: DESIGN_SYSTEM.COLORS.neutral[300], 
                    true: DESIGN_SYSTEM.COLORS.primary[200] 
                  }}
                  thumbColor={pushEnabled ? DESIGN_SYSTEM.COLORS.primary[500] : DESIGN_SYSTEM.COLORS.neutral[50]}
                />
              </View>

              <View style={styles.configItem}>
                <View style={styles.configInfo}>
                  <Text style={styles.configLabel}>Reportes cercanos</Text>
                  <Text style={styles.configDescription}>Notificar sobre reportes en tu zona</Text>
                </View>
                <Switch
                  value={proximityEnabled}
                  onValueChange={setProximityEnabled}
                  trackColor={{ 
                    false: DESIGN_SYSTEM.COLORS.neutral[300], 
                    true: DESIGN_SYSTEM.COLORS.primary[200] 
                  }}
                  thumbColor={proximityEnabled ? DESIGN_SYSTEM.COLORS.primary[500] : DESIGN_SYSTEM.COLORS.neutral[50]}
                />
              </View>

              <View style={styles.configItem}>
                <View style={styles.configInfo}>
                  <Text style={styles.configLabel}>Emergencias</Text>
                  <Text style={styles.configDescription}>Alertas de reportes de emergencia</Text>
                </View>
                <Switch
                  value={emergencyEnabled}
                  onValueChange={setEmergencyEnabled}
                  trackColor={{ 
                    false: DESIGN_SYSTEM.COLORS.neutral[300], 
                    true: DESIGN_SYSTEM.COLORS.error[50] 
                  }}
                  thumbColor={emergencyEnabled ? DESIGN_SYSTEM.COLORS.error[500] : DESIGN_SYSTEM.COLORS.neutral[50]}
                />
              </View>
            </CardContent>
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance type="fadeIn">
          <Card style={styles.notificationsCard}>
            <CardHeader 
              title="Notificaciones recientes" 
              subtitle={`${notifications.filter(n => !n.read).length} sin leer`}
            />
            <CardContent style={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
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
                            { backgroundColor: getTypeColor(notification.type) }
                          ]} 
                        />
                      </View>
                      
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle}>{notification.title}</Text>
                          <Text style={styles.notificationTime}>
                            {formatTimestamp(notification.timestamp)}
                          </Text>
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                      </View>

                      {!notification.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  </AnimatedListItem>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔔</Text>
                  <Text style={styles.emptyTitle}>No hay notificaciones</Text>
                  <Text style={styles.emptyText}>
                    Cuando tengas notificaciones aparecerán aquí
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </AnimatedEntrance>

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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  content: {
    padding: DESIGN_SYSTEM.SPACING.base,
  },
  header: {
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
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
  configCard: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.COLORS.neutral[200],
  },
  configInfo: {
    flex: 1,
    marginRight: DESIGN_SYSTEM.SPACING.base,
  },
  configLabel: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
    color: DESIGN_SYSTEM.COLORS.neutral[800],
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  configDescription: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
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
    paddingVertical: DESIGN_SYSTEM.SPACING['3xl'],
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
    marginTop: DESIGN_SYSTEM.SPACING.lg,
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
  },
});

export default NotificationsScreen;
