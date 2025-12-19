import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import adminService, { AdminUser } from '../../services/adminService';
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;
const SPACING = DESIGN_SYSTEM.SPACING;
const SHADOWS = DESIGN_SYSTEM.SHADOWS;
const TYPOGRAPHY = DESIGN_SYSTEM.TYPOGRAPHY;

const UserManagementScreen = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadUsers = async (pageNum = 1, filterType: string | null = null) => {
    try {
      const response = await adminService.getUsers(pageNum, 20, filterType || undefined);
      
      if (pageNum === 1) {
        setUsers(response.data);
      } else {
        setUsers((prev) => [...prev, ...response.data]);
      }
      
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers(1, filter);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(1, filter);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadUsers(page + 1, filter);
    }
  };

  const toggleUserStatus = async (user: AdminUser) => {
    const newStatus = !user.activo;
    Alert.alert(
      `${newStatus ? 'Activar' : 'Desactivar'} Usuario`,
      `¿Estás seguro de ${newStatus ? 'activar' : 'desactivar'} a ${user.nombre} ${user.apellidos}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await adminService.toggleUserStatus(user.id, newStatus);
              Alert.alert(
                'Éxito',
                `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`
              );
              onRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getUserTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'ADMINISTRADOR':
        return COLORS.error;
      case 'MODERADOR':
        return COLORS.warning;
      default:
        return COLORS.info;
    }
  };

  const getUserTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'ADMINISTRADOR':
        return 'shield-checkmark';
      case 'MODERADOR':
        return 'shield-half';
      default:
        return 'person';
    }
  };

  const renderUser = ({ item }: { item: AdminUser }) => (
    <AnimatedEntrance type="slideInUp" config={{ duration: 300 }}>
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={[
            styles.userAvatar,
            { backgroundColor: item.activo ? COLORS.primary[100] : COLORS.neutral[200] }
          ]}>
            <Ionicons
              name="person"
              size={28}
              color={item.activo ? COLORS.primary[600] : COLORS.neutral[500]}
            />
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>
                {item.nombre} {item.apellidos}
              </Text>
              {item.activo && (
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            
            <View style={styles.userMeta}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getUserTypeColor(item.tipo_usuario)[100] },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: getUserTypeColor(item.tipo_usuario)[700] },
                  ]}
                >
                  {item.tipo_usuario}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.neutral[600]} />
                <Text style={styles.metaText}>{item.total_reportes} reportes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary[600]} />
            <Text style={styles.detailText}>{item.telefono || 'Sin teléfono'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary[600]} />
            <Text style={styles.detailText}>
              {new Date(item.fecha_registro).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons
              name={item.email_verificado ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={item.email_verificado ? COLORS.success[600] : COLORS.error[600]}
            />
            <Text style={[
              styles.detailText,
              { color: item.email_verificado ? COLORS.success[700] : COLORS.error[700] }
            ]}>
              {item.email_verificado ? 'Email verificado' : 'Email sin verificar'}
            </Text>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              item.activo ? styles.deactivateButton : styles.activateButton,
            ]}
            onPress={() => toggleUserStatus(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.activo ? 'ban-outline' : 'checkmark-circle-outline'}
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.statusButtonText}>
              {item.activo ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedEntrance>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === null && styles.filterButtonActive]}
        onPress={() => setFilter(null)}
      >
        <Text
          style={[
            styles.filterText,
            filter === null && styles.filterTextActive,
          ]}
        >
          Todos
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'CIUDADANO' && styles.filterButtonActive,
        ]}
        onPress={() => setFilter('CIUDADANO')}
      >
        <Text
          style={[
            styles.filterText,
            filter === 'CIUDADANO' && styles.filterTextActive,
          ]}
        >
          Ciudadanos
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'ADMINISTRADOR' && styles.filterButtonActive,
        ]}
        onPress={() => setFilter('ADMINISTRADOR')}
      >
        <Text
          style={[
            styles.filterText,
            filter === 'ADMINISTRADOR' && styles.filterTextActive,
          ]}
        >
          Admins
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AnimatedEntrance type="fade" config={{ duration: 300 }}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Gestión de Usuarios</Text>
          <Text variant="bodyLarge" style={styles.headerSubtitle}>
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'} registrados
          </Text>
        </View>
      </AnimatedEntrance>
      
      {renderFilters()}
      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.loadingMore}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral[50],
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.neutral[50],
    gap: SPACING.lg,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    flex: 1,
    maxWidth: 120,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary[500],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral[700],
    textAlign: 'center',
    numberOfLines: 1,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
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
    ...TYPOGRAPHY.h4,
    color: COLORS.neutral[900],
    fontWeight: '600',
  },
  activeBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success[500],
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success[500],
  },
  userEmail: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.neutral[600],
    marginBottom: SPACING.sm,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  typeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 16,
  },
  typeText: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.neutral[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    color: COLORS.neutral[700],
    fontWeight: '500',
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
  detailText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.neutral[700],
  },
  userActions: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  activateButton: {
    backgroundColor: COLORS.success[500],
  },
  deactivateButton: {
    backgroundColor: COLORS.error[500],
  },
  statusButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  loadingMore: {
    paddingVertical: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default UserManagementScreen;
