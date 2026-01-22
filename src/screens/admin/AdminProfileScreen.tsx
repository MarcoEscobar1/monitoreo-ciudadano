import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { ProfileAvatar } from '../../components/avatar/ProfileAvatar';
import { useAuth } from '../../context/AuthContext';
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;
const SPACING = DESIGN_SYSTEM.SPACING;
const TYPOGRAPHY = DESIGN_SYSTEM.TYPOGRAPHY;

const AdminProfileScreen: React.FC = () => {
  const { logout, user } = useAuth();
  
  // Datos del administrador desde el contexto
  const adminData = {
    fullName: user?.nombre ? `${user.nombre} ${user.apellidos || ''}`.trim() : 'Administrador',
    email: user?.email || 'admin@ejemplo.com',
    phone: user?.telefono || 'No especificado',
    rol: user?.tipo_usuario || 'ADMINISTRADOR',
    avatar: user?.avatar_url,
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return COLORS.error[500];
      case 'MODERADOR':
        return COLORS.warning[500];
      default:
        return COLORS.info[500];
    }
  };

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'MODERADOR':
        return 'Moderador';
      default:
        return 'Usuario';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar tu sesión de administrador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error en logout:', error);
              Alert.alert(
                'Error',
                'Hubo un problema al cerrar sesión. Se cerrará la sesión localmente.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance type="slideInDown" config={{ duration: 600 }}>
          <View style={styles.header}>
            <ProfileAvatar 
              size={100}
              uri={adminData.avatar}
              name={adminData.fullName}
              style={styles.avatar}
            />
            <Text variant="headlineSmall" style={styles.name}>
              {adminData.fullName}
            </Text>
            <Text variant="bodyLarge" style={styles.email}>
              {adminData.email}
            </Text>
            {adminData.phone !== 'No especificado' && (
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={16} color={COLORS.primary[100]} />
                <Text variant="bodyMedium" style={styles.phone}>
                  {adminData.phone}
                </Text>
              </View>
            )}
            <View style={styles.badgeContainer}>
              <View style={[
                styles.badge,
                { backgroundColor: getRoleBadgeColor(adminData.rol) }
              ]}>
                <Text variant="labelLarge" style={styles.badgeText}>
                  {getRoleLabel(adminData.rol)}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedEntrance>

        <View style={styles.content}>
          <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 200 }}>
            <Card variant="elevated" size="medium" style={styles.infoCard}>
              <CardHeader title="Información del perfil" icon="person-outline" />
              <CardContent>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: COLORS.primary[50] }]}>
                    <Ionicons name="shield-checkmark" size={24} color={COLORS.primary[500]} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text variant="labelMedium" style={styles.infoLabel}>
                      Tipo de cuenta
                    </Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {adminData.rol}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: COLORS.info[50] }]}>
                    <Ionicons name="mail" size={24} color={COLORS.info[500]} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text variant="labelMedium" style={styles.infoLabel}>
                      Correo electrónico
                    </Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {adminData.email}
                    </Text>
                  </View>
                </View>

                {adminData.phone !== 'No especificado' && (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: COLORS.success[50] }]}>
                        <Ionicons name="call" size={24} color={COLORS.success[500]} />
                      </View>
                      <View style={styles.infoContent}>
                        <Text variant="labelMedium" style={styles.infoLabel}>
                          Teléfono
                        </Text>
                        <Text variant="bodyLarge" style={styles.infoValue}>
                          {adminData.phone}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 400 }}>
            <Card variant="elevated" size="medium" style={styles.permissionsCard}>
              <CardHeader title="Permisos administrativos" icon="key-outline" />
              <CardContent>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success[500]} />
                  <Text variant="bodyMedium" style={styles.permissionText}>
                    Validar y rechazar reportes
                  </Text>
                </View>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success[500]} />
                  <Text variant="bodyMedium" style={styles.permissionText}>
                    Gestionar usuarios
                  </Text>
                </View>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success[500]} />
                  <Text variant="bodyMedium" style={styles.permissionText}>
                    Administrar categorías
                  </Text>
                </View>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success[500]} />
                  <Text variant="bodyMedium" style={styles.permissionText}>
                    Ver estadísticas completas
                  </Text>
                </View>
              </CardContent>
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance type="fadeIn" config={{ duration: 600, delay: 600 }}>
            <View style={styles.actionButtons}>
              <Button
                variant="outlined"
                color="error"
                title="Cerrar sesión"
                onPress={handleLogout}
                style={styles.logoutButton}
              />
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.primary[500],
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['3xl'],
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    marginBottom: SPACING.base,
    borderWidth: 4,
    borderColor: COLORS.neutral[0],
  },
  name: {
    color: COLORS.neutral[0],
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  email: {
    color: COLORS.primary[100],
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  phone: {
    color: COLORS.primary[200],
  },
  badgeContainer: {
    marginTop: SPACING.base,
  },
  badge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.neutral[0],
    fontWeight: '600',
  },
  content: {
    padding: SPACING.base,
  },
  infoCard: {
    marginBottom: SPACING.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs / 2,
  },
  infoValue: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.neutral[200],
    marginVertical: SPACING.sm,
  },
  permissionsCard: {
    marginBottom: SPACING.base,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  permissionText: {
    color: COLORS.text.primary,
    flex: 1,
  },
  actionButtons: {
    marginTop: SPACING.lg,
  },
  logoutButton: {
    borderColor: COLORS.error[500],
    borderWidth: 2,
  },
});

export default AdminProfileScreen;
