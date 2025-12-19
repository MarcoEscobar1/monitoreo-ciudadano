import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntrance, AnimatedListItem } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import adminService, { CategoryStats } from '../../services/adminService';
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;
const SPACING = DESIGN_SYSTEM.SPACING;
const SHADOWS = DESIGN_SYSTEM.SHADOWS;

const ReportsByCategoryScreen = () => {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await adminService.getReportsByCategory();
      setCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
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

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
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
      <AnimatedEntrance type="fadeIn" config={{ duration: 400 }}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>Reportes por Categoría</Text>
          <Text variant="bodyLarge" style={styles.headerSubtitle}>
            Estadísticas detalladas de cada categoría
          </Text>
        </View>
      </AnimatedEntrance>

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
        {categories.map((category, index) => {
        const validadoPercent = getPercentage(
          category.reportes_validados,
          category.total_reportes
        );
        const resueltoPercent = getPercentage(
          category.reportes_resueltos,
          category.total_reportes
        );

        return (
          <AnimatedListItem key={category.id} index={index} staggerDelay={100}>
            <Card variant="elevated" size="medium" style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.nombre}</Text>
                <Text style={styles.categoryTotal}>
                  {category.total_reportes} reportes totales
                </Text>
              </View>
            </View>

            <View style={styles.statsSection}>
              {/* Reportes Validados */}
              <View style={styles.statRow}>
                <View style={styles.statLabel}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.success}
                  />
                  <Text style={styles.statLabelText}>Validados</Text>
                </View>
                <View style={styles.statValue}>
                  <Text style={styles.statNumber}>
                    {category.reportes_validados}
                  </Text>
                </View>
              </View>

              {/* Barra de progreso - Validados */}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${validadoPercent}%`,
                      backgroundColor: COLORS.success,
                    },
                  ]}
                />
              </View>

              {/* Reportes Resueltos */}
              <View style={styles.statRow}>
                <View style={styles.statLabel}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.statLabelText}>Resueltos</Text>
                </View>
                <View style={styles.statValue}>
                  <Text style={styles.statNumber}>
                    {category.reportes_resueltos}
                  </Text>
                </View>
              </View>

              {/* Barra de progreso - Resueltos */}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${resueltoPercent}%`,
                      backgroundColor: COLORS.primary,
                    },
                  ]}
                />
              </View>

              {/* Reportes último mes */}
              <View style={styles.statRow}>
                <View style={styles.statLabel}>
                  <Ionicons name="calendar" size={20} color={COLORS.info} />
                  <Text style={styles.statLabelText}>Último mes</Text>
                </View>
                <View style={styles.statValue}>
                  <Text style={styles.statNumber}>
                    {category.reportes_ultimo_mes}
                  </Text>
                </View>
              </View>
            </View>
            </Card>
          </AnimatedListItem>
        );
      })}

      {categories.length === 0 && (
        <AnimatedEntrance type="fadeIn" config={{ duration: 600 }}>
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={80} color={COLORS.text.disabled} />
            <Text variant="titleLarge" style={styles.emptyText}>
              No hay reportes registrados aún
            </Text>
          </View>
        </AnimatedEntrance>
      )}
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
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  headerTitle: {
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.text.secondary,
  },
  categoryCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },
  categoryTotal: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  statsSection: {
    gap: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statLabelText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statNumber: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  statPercent: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.neutral[100],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    marginTop: SPACING.xl,
  },
  emptyText: {
    color: COLORS.text.secondary,
    marginTop: SPACING.lg,
    fontWeight: '500',
  },
});

export default ReportsByCategoryScreen;
