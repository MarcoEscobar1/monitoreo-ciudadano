import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import adminService, { AdminStats } from '../../services/adminService';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { useAdminBadges } from '../../context/AdminBadgeContext';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = DESIGN_SYSTEM.COLORS;
const SPACING = DESIGN_SYSTEM.SPACING;
const TYPOGRAPHY = DESIGN_SYSTEM.TYPOGRAPHY;
const SHADOWS = DESIGN_SYSTEM.SHADOWS;
const { width: screenWidth } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshBadges } = useAdminBadges();

  const loadStats = async () => {
    try {
      const data = await adminService.getReportsStats();
      setStats(data);
      
      // Cargar usuarios pendientes
      const pendingUsers = await adminService.getPendingUsers();
      setPendingUsersCount(pendingUsers.length);
      
      // Actualizar badges
      await refreshBadges();
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Refrescar cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      refreshBadges();
    }, [refreshBadges])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando estadísticas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary[500]]}
          />
        }
      >
        <AnimatedEntrance type="fadeIn" config={{ duration: 600 }}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Panel de Administración
            </Text>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              Gestiona reportes, usuarios y categorías
            </Text>
          </View>
        </AnimatedEntrance>

        {/* Alertas Urgentes */}
        {stats && stats.pendientes_validacion > 0 && (
          <AnimatedEntrance type="slideInDown" config={{ duration: 600, delay: 200 }}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('PendingReports')}
              activeOpacity={0.7}
            >
              <View style={styles.alertIcon}>
                <Ionicons name="alert-circle" size={28} color={COLORS.error[500]} />
              </View>
              <View style={styles.alertContent}>
                <Text variant="titleMedium" style={styles.alertTitle}>
                  {stats.pendientes_validacion} reportes pendientes
                </Text>
                <Text variant="bodyMedium" style={styles.alertSubtitle}>
                  Requieren validación
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.error[500]} />
            </TouchableOpacity>
          </AnimatedEntrance>
        )}

        {/* Alerta Usuarios Pendientes */}
        {pendingUsersCount > 0 && (
          <AnimatedEntrance type="slideInDown" config={{ duration: 600, delay: 300 }}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('PendingUsers')}
              activeOpacity={0.7}
            >
              <View style={styles.alertIcon}>
                <Ionicons name="person-add" size={28} color={COLORS.warning[500]} />
              </View>
              <View style={styles.alertContent}>
                <Text variant="titleMedium" style={styles.alertTitle}>
                  {pendingUsersCount} {pendingUsersCount === 1 ? 'cuenta nueva' : 'cuentas nuevas'}
                </Text>
                <Text variant="bodyMedium" style={styles.alertSubtitle}>
                  Esperando validación
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.warning[500]} />
            </TouchableOpacity>
          </AnimatedEntrance>
        )}

        {/* Estadísticas Generales */}
        <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 400 }}>
          <View style={styles.section}>
            <Card variant="elevated" size="medium" style={styles.statsCard}>
              <CardHeader title="Estadísticas Generales" />
              <CardContent>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: COLORS.primary[50] }]}>
                      <Ionicons name="document-text" size={28} color={COLORS.primary[500]} />
                    </View>
                    <Text variant="displaySmall" style={styles.statNumber}>{stats?.total || 0}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Total Reportes</Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: COLORS.warning[50] }]}>
                      <Ionicons name="time" size={28} color={COLORS.warning[500]} />
                    </View>
                    <Text variant="displaySmall" style={styles.statNumber}>{stats?.pendientes || 0}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Pendientes</Text>
                  </View>
                </View>

                <View style={styles.statsDivider} />

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: COLORS.info[50] }]}>
                      <Ionicons name="hourglass" size={28} color={COLORS.info[500]} />
                    </View>
                    <Text variant="displaySmall" style={styles.statNumber}>{stats?.en_proceso || 0}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>En Proceso</Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: COLORS.success[50] }]}>
                      <Ionicons name="checkmark-circle" size={28} color={COLORS.success[500]} />
                    </View>
                    <Text variant="displaySmall" style={styles.statNumber}>{stats?.resueltos || 0}</Text>
                    <Text variant="bodySmall" style={styles.statLabel}>Resueltos</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </AnimatedEntrance>

        {/* Actividad Reciente */}
        <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 600 }}>
          <View style={styles.section}>
            <Card variant="elevated" size="medium">
              <CardHeader title="Actividad Reciente" icon="time-outline" />
              <CardContent>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: COLORS.primary[50] }]}>
                    <Ionicons name="calendar" size={20} color={COLORS.primary[500]} />
                  </View>
                  <View style={styles.activityTextContainer}>
                    <Text variant="bodyLarge" style={styles.activityText}>
                      Últimas 24 horas
                    </Text>
                    <Text variant="titleLarge" style={styles.activityNumber}>
                      {stats?.ultimas_24h || 0} <Text variant="bodyMedium" style={styles.activityUnit}>reportes</Text>
                    </Text>
                  </View>
                </View>
                
                <View style={styles.activityDivider} />
                
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: COLORS.info[50] }]}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.info[500]} />
                  </View>
                  <View style={styles.activityTextContainer}>
                    <Text variant="bodyLarge" style={styles.activityText}>
                      Última semana
                    </Text>
                    <Text variant="titleLarge" style={styles.activityNumber}>
                      {stats?.ultima_semana || 0} <Text variant="bodyMedium" style={styles.activityUnit}>reportes</Text>
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </AnimatedEntrance>

        {/* Acciones Rápidas */}
        <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 800 }}>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Acciones Rápidas</Text>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('PendingReports')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.warning[50] }]}>
                <Ionicons name="clipboard" size={24} color={COLORS.warning[500]} />
              </View>
              <View style={styles.actionContent}>
                <Text variant="titleMedium" style={styles.actionTitle}>Validar Reportes</Text>
                <Text variant="bodyMedium" style={styles.actionSubtitle}>
                  {stats?.pendientes_validacion || 0} pendientes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('PendingUsers')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.warning[50] }]}>
                <Ionicons name="person-add" size={24} color={COLORS.warning[500]} />
              </View>
              <View style={styles.actionContent}>
                <Text variant="titleMedium" style={styles.actionTitle}>Validar Cuentas</Text>
                <Text variant="bodyMedium" style={styles.actionSubtitle}>
                  {pendingUsersCount || 0} cuentas pendientes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('UserManagement')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primary[50] }]}>
                <Ionicons name="people" size={24} color={COLORS.primary[500]} />
              </View>
              <View style={styles.actionContent}>
                <Text variant="titleMedium" style={styles.actionTitle}>Gestionar Usuarios</Text>
                <Text variant="bodyMedium" style={styles.actionSubtitle}>Ver todos los usuarios</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CategoryManagement')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.info[50] }]}>
                <Ionicons name="list" size={24} color={COLORS.info[500]} />
              </View>
              <View style={styles.actionContent}>
                <Text variant="titleMedium" style={styles.actionTitle}>Gestionar Categorías</Text>
                <Text variant="bodyMedium" style={styles.actionSubtitle}>Administrar categorías</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.neutral[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ReportsByCategory')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.success[50] }]}>
                <Ionicons name="stats-chart" size={24} color={COLORS.success[500]} />
              </View>
              <View style={styles.actionContent}>
                <Text variant="titleMedium" style={styles.actionTitle}>Reportes por Categoría</Text>
                <Text variant="bodyMedium" style={styles.actionSubtitle}>Estadísticas detalladas</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.neutral[500]} />
            </TouchableOpacity>
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral[50],
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[50],
  },
  loadingText: {
    marginTop: SPACING.base,
    color: COLORS.text.secondary,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.neutral[50],
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.text.secondary,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.card,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error[500],
    padding: SPACING.lg,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.lg,
    ...SHADOWS.base,
  },
  alertIcon: {
    marginRight: SPACING.base,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: COLORS.error[500],
    fontWeight: '600',
  },
  alertSubtitle: {
    color: COLORS.error[700],
    marginTop: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.xs,
  },
  statsCard: {
    marginBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.base,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statNumber: {
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  statsDivider: {
    height: 1,
    backgroundColor: COLORS.neutral[200],
    marginVertical: SPACING.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityText: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  activityNumber: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  activityUnit: {
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  activityDivider: {
    height: 1,
    backgroundColor: COLORS.neutral[200],
    marginVertical: SPACING.base,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.card,
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.base,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  actionSubtitle: {
    color: COLORS.text.secondary,
  },
});

export default AdminDashboardScreen;
