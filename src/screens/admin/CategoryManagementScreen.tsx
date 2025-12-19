import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import adminService from '../../services/adminService';
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;
const SPACING = DESIGN_SYSTEM.SPACING;
const SHADOWS = DESIGN_SYSTEM.SHADOWS;
const TYPOGRAPHY = DESIGN_SYSTEM.TYPOGRAPHY;

interface Category {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_problema: string;
  icono: string;
  color: string;
  prioridad_base: string;
  activo: boolean;
  total_reportes: number;
  reportes_validados: number;
}

const CategoryManagementScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const toggleCategoryStatus = async (category: Category) => {
    const newStatus = !category.activo;
    
    Alert.alert(
      `${newStatus ? 'Activar' : 'Desactivar'} Categoría`,
      `¿Estás seguro de ${newStatus ? 'activar' : 'desactivar'} la categoría "${category.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await adminService.updateCategory(category.id, { activo: newStatus });
              Alert.alert(
                'Éxito',
                `Categoría ${newStatus ? 'activada' : 'desactivada'} correctamente`
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

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'CRITICA':
        return COLORS.error;
      case 'ALTA':
        return COLORS.warning;
      case 'MEDIA':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <AnimatedEntrance type="slideInUp" config={{ duration: 300, delay: index * 50 }}>
      <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.nombre}</Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.descripcion || 'Sin descripción'}
          </Text>
        </View>
        
        <Switch
          value={item.activo}
          onValueChange={() => toggleCategoryStatus(item)}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
          thumbColor={item.activo ? COLORS.primary : COLORS.textSecondary}
        />
      </View>

      <View style={styles.categoryDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tipo:</Text>
          <Text style={styles.detailValue}>{item.tipo_problema}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Prioridad base:</Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.prioridad_base) + '20' },
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                { color: getPriorityColor(item.prioridad_base) },
              ]}
            >
              {item.prioridad_base}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.categoryStats}>
        <View style={styles.statItem}>
          <Ionicons name="document-text" size={16} color={COLORS.primary} />
          <Text style={styles.statText}>
            {item.total_reportes} reportes
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.statText}>
            {item.reportes_validados} validados
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.statusBadge,
          item.activo ? styles.statusActive : styles.statusInactive,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            item.activo ? styles.statusTextActive : styles.statusTextInactive,
          ]}
        >
          {item.activo ? 'ACTIVA' : 'INACTIVA'}
        </Text>
      </View>
      </View>
    </AnimatedEntrance>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AnimatedEntrance type="fade" config={{ duration: 300 }}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Gestión de Categorías</Text>
          <Text variant="bodyLarge" style={styles.headerSubtitle}>
            {categories.length} categoría{categories.length !== 1 ? 's' : ''} registradas
          </Text>
        </View>
      </AnimatedEntrance>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No hay categorías registradas</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[50],
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
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
  listContent: {
    padding: SPACING.md,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  categoryName: {
    fontSize: 18,
    color: COLORS.neutral[900],
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: COLORS.neutral[600],
  },
  categoryDetails: {
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.neutral[600],
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.neutral[900],
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorCode: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  categoryStats: {
    flexDirection: 'row',
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: SPACING.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.neutral[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    color: COLORS.neutral[700],
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: COLORS.success + '20',
  },
  statusInactive: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  statusTextActive: {
    color: COLORS.success,
  },
  statusTextInactive: {
    color: COLORS.error,
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

export default CategoryManagementScreen;
