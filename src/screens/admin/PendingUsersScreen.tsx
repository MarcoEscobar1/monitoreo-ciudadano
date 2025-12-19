import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Text, Button, Modal, Portal, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import adminService, { PendingUser } from '../../services/adminService';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { Card } from '../../components/cards/Card';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { useAdminBadges } from '../../context/AdminBadgeContext';

const { COLORS, TYPOGRAPHY, SPACING, SHADOWS } = DESIGN_SYSTEM;

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ children, index }) => (
  <AnimatedEntrance delay={index * 50} type="slide">
    {children}
  </AnimatedEntrance>
);

export const PendingUsersScreen: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const { refreshBadges } = useAdminBadges();

  const loadPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const users = await adminService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error al cargar usuarios pendientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios pendientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  // Refrescar badges cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      console.log('👮 PendingUsersScreen enfocada, actualizando badges...');
      refreshBadges();
    }, [refreshBadges])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPendingUsers();
  }, [loadPendingUsers]);

  const handleValidate = async (userId: string) => {
    Alert.alert(
      'Validar Usuario',
      '¿Estás seguro de que deseas validar esta cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Validar',
          onPress: async () => {
            try {
              setProcessingUserId(userId);
              await adminService.validateUser(userId, 'Cuenta validada por administrador');
              Alert.alert('Éxito', 'Usuario validado correctamente');
              loadPendingUsers();
              await refreshBadges();
            } catch (error) {
              console.error('Error al validar usuario:', error);
              Alert.alert('Error', 'No se pudo validar el usuario');
            } finally {
              setProcessingUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (userId: string) => {
    setSelectedUserId(userId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!selectedUserId) return;

    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setProcessingUserId(selectedUserId);
      setRejectModalVisible(false);
      await adminService.rejectUser(selectedUserId, rejectReason);
      Alert.alert('Éxito', 'Usuario rechazado correctamente');
      await refreshBadges();
      loadPendingUsers();
    } catch (error) {
      console.error('Error al rechazar usuario:', error);
      Alert.alert('Error', 'No se pudo rechazar el usuario');
    } finally {
      setProcessingUserId(null);
      setSelectedUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <AnimatedEntrance type="fade">
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.title}>Usuarios Pendientes</Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                {pendingUsers.length} {pendingUsers.length === 1 ? 'usuario' : 'usuarios'} esperando validación
              </Text>
            </View>
          </AnimatedEntrance>

          {loading && pendingUsers.length === 0 ? (
            <AnimatedEntrance type="fade">
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>Cargando usuarios...</Text>
              </Card>
            </AnimatedEntrance>
          ) : pendingUsers.length === 0 ? (
            <AnimatedEntrance type="fade">
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No hay usuarios pendientes de validación
                </Text>
              </Card>
            </AnimatedEntrance>
          ) : (
            pendingUsers.map((user, index) => (
              <AnimatedListItem key={user.id} index={index}>
                <View style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {user.nombre.charAt(0)}{user.apellidos.charAt(0)}
                      </Text>
                    </View>
                    
                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName}>
                          {user.nombre} {user.apellidos}
                        </Text>
                        <View style={styles.pendingDot} />
                      </View>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      
                      <View style={styles.metaRow}>
                        <View style={styles.authBadge}>
                          <Text style={styles.authBadgeText}>{user.metodo_auth}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.userDetails}>
                    {user.telefono && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📱</Text>
                        <Text style={styles.detailText}>{user.telefono}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <Button
                      mode="contained"
                      onPress={() => handleValidate(user.id)}
                      disabled={processingUserId === user.id}
                      loading={processingUserId === user.id}
                      style={[styles.button, styles.validateButton]}
                      labelStyle={styles.buttonLabel}
                    >
                      Validar
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleReject(user.id)}
                      disabled={processingUserId !== null}
                      style={[styles.button, styles.rejectButton]}
                      labelStyle={[styles.buttonLabel, styles.rejectButtonLabel]}
                    >
                      Rechazar
                    </Button>
                  </View>
                </View>
              </AnimatedListItem>
            ))
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={rejectModalVisible}
          onDismiss={() => setRejectModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Rechazar Usuario</Text>
          <Text style={styles.modalSubtitle}>
            Ingresa el motivo del rechazo:
          </Text>
          <TextInput
            mode="outlined"
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Ejemplo: Información incompleta o sospechosa"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setRejectModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={confirmReject}
              style={[styles.modalButton, styles.modalConfirmButton]}
            >
              Rechazar
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.neutral[50],
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.text.secondary,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.neutral[500],
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary[700],
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    color: COLORS.neutral[900],
    fontWeight: '700',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning[500],
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.neutral[600],
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  authBadge: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 16,
  },
  authBadgeText: {
    fontSize: 11,
    color: COLORS.primary[700],
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userDetails: {
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.neutral[700],
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
  },
  validateButton: {
    backgroundColor: COLORS.primary[500],
  },
  rejectButton: {
    borderColor: COLORS.error[500],
  },
  buttonLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  rejectButtonLabel: {
    color: COLORS.error[500],
  },
  modal: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    margin: SPACING.lg,
    borderRadius: 12,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.neutral[900],
    marginBottom: SPACING.sm,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.neutral[600],
    marginBottom: SPACING.md,
  },
  input: {
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalButton: {
    minWidth: 100,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.error[500],
  },
});
