/**
 * Dashboard Principal Actualizado - FASE 7
 * Dashboard moderno con nuevo sistema de diseño y animaciones
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importar componentes del nuevo sistema de diseño
import { AnimatedEntrance, AnimatedListItem } from '../animated/AnimatedEntrance';
import { Card, CardHeader, CardContent, StatCard, ListCard } from '../cards/Card';
import { Button } from '../buttons/Button';
import { SegmentedControl } from '../navigation/AnimatedNavigation';

// Importar sistema de diseño
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;

const SPACING = DESIGN_SYSTEM.SPACING;

const { width: screenWidth } = Dimensions.get('window');

// ================================
// TIPOS E INTERFACES
// ================================

interface DashboardStats {
  totalReportes: number;
  reportesActivos: number;
  reportesResueltos: number;
  reportesPendientes: number;
  cambioSemanal: {
    total: number;
    activos: number;
    resueltos: number;
  };
}

interface RecentReport {
  id: string;
  titulo: string;
  categoria: string;
  estado: string;
  fecha: Date;
  ubicacion: string;
  prioridad: 'alta' | 'media' | 'baja';
}

interface CategoryStats {
  categoria: string;
  cantidad: number;
  cambio: number;
  color: string;
}

interface Props {
  onViewAllReports?: () => void;
  onViewReport?: (reportId: string) => void;
  onRefresh?: () => Promise<void>;
}

// ================================
// DATOS DE EJEMPLO
// ================================

const DASHBOARD_STATS: DashboardStats = {
  totalReportes: 1247,
  reportesActivos: 89,
  reportesResueltos: 1158,
  reportesPendientes: 23,
  cambioSemanal: {
    total: 12,
    activos: -5,
    resueltos: 18,
  },
};

const RECENT_REPORTS: RecentReport[] = [
  {
    id: '1',
    titulo: 'Semáforo dañado en Av. Principal',
    categoria: 'Transporte',
    estado: 'En progreso',
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
    ubicacion: 'Av. Principal #123',
    prioridad: 'alta',
  },
  {
    id: '2',
    titulo: 'Fuga de agua en parque',
    categoria: 'Infraestructura',
    estado: 'Pendiente',
    fecha: new Date(Date.now() - 5 * 60 * 60 * 1000),
    ubicacion: 'Parque Central',
    prioridad: 'media',
  },
  {
    id: '3',
    titulo: 'Basura acumulada',
    categoria: 'Medio Ambiente',
    estado: 'Nuevo',
    fecha: new Date(Date.now() - 8 * 60 * 60 * 1000),
    ubicacion: 'Calle 45 #67',
    prioridad: 'baja',
  },
];

const CATEGORY_STATS: CategoryStats[] = [
  {
    categoria: 'Infraestructura',
    cantidad: 45,
    cambio: 8,
    color: COLORS.categories.infrastructure,
  },
  {
    categoria: 'Transporte',
    cantidad: 32,
    cambio: -3,
    color: COLORS.categories.transport,
  },
  {
    categoria: 'Medio Ambiente',
    cantidad: 28,
    cambio: 15,
    color: COLORS.categories.environment,
  },
  {
    categoria: 'Seguridad',
    cantidad: 21,
    cambio: 2,
    color: COLORS.categories.security,
  },
];

// ================================
// UTILS
// ================================

const formatearFecha = (fecha: Date): string => {
  const ahora = new Date();
  const diferencia = ahora.getTime() - fecha.getTime();
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  
  if (horas < 1) return 'Hace menos de 1 hora';
  if (horas === 1) return 'Hace 1 hora';
  if (horas < 24) return `Hace ${horas} horas`;
  
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Hace 1 día';
  return `Hace ${dias} días`;
};

const getPrioridadColor = (prioridad: 'alta' | 'media' | 'baja'): string => {
  switch (prioridad) {
    case 'alta':
      return '#F44336';
    case 'media':
      return '#FF9800';
    case 'baja':
      return '#4CAF50';
  }
};

// ================================
// SUB-COMPONENTES
// ================================

const WelcomeSection: React.FC = () => {
  // Simulamos obtener el nombre del usuario logueado
  const userName = 'Usuario'; // TODO: Obtener del contexto de autenticación

  return (
    <AnimatedEntrance type="fadeIn" config={{ duration: 600 }}>
      <View style={styles.welcomeSection}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Bienvenido, {userName}
        </Text>
        <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
          Aquí tienes un resumen de la actividad ciudadana
        </Text>
      </View>
    </AnimatedEntrance>
  );
};

const StatsSection: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <View style={styles.statsSection}>
      <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 400 }}>
        <Card variant="elevated" size="medium" style={styles.unifiedStatsCard}>
          <CardHeader title="Estadísticas Generales" />
          <CardContent>
            {/* Primera fila: Total y Activos */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>📊</Text>
                  <View style={styles.statInfo}>
                    <Text style={styles.statTitle}>TOTAL REPORTES</Text>
                    <Text style={styles.statValue}>{stats.totalReportes.toLocaleString()}</Text>
                    <Text style={[styles.statChange, { color: stats.cambioSemanal.total > 0 ? '#4CAF50' : '#F44336' }]}>
                      {stats.cambioSemanal.total > 0 ? '↑' : '↓'} {Math.abs(stats.cambioSemanal.total)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>🔄</Text>
                  <View style={styles.statInfo}>
                    <Text style={styles.statTitle}>ACTIVOS</Text>
                    <Text style={styles.statValue}>{stats.reportesActivos}</Text>
                    <Text style={[styles.statChange, { color: stats.cambioSemanal.activos > 0 ? '#4CAF50' : '#F44336' }]}>
                      {stats.cambioSemanal.activos > 0 ? '↑' : '↓'} {Math.abs(stats.cambioSemanal.activos)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Divisor */}
            <View style={styles.statsDivider} />

            {/* Segunda fila: Resueltos y Pendientes */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>✅</Text>
                  <View style={styles.statInfo}>
                    <Text style={styles.statTitle}>RESUELTOS</Text>
                    <Text style={styles.statValue}>{stats.reportesResueltos.toLocaleString()}</Text>
                    <Text style={[styles.statChange, { color: '#4CAF50' }]}>
                      ↑ {stats.cambioSemanal.resueltos}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statHeader}>
                  <Text style={styles.statIcon}>⏳</Text>
                  <View style={styles.statInfo}>
                    <Text style={styles.statTitle}>PENDIENTES</Text>
                    <Text style={styles.statValue}>{stats.reportesPendientes}</Text>
                    <Text style={styles.statChange}>Sin cambios</Text>
                  </View>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </AnimatedEntrance>
    </View>
  );
};

const CategorySection: React.FC<{ categories: CategoryStats[] }> = ({ categories }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const periods = ['Esta semana', 'Este mes', 'Este año'];

  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 800 }}>
      <Card variant="elevated" size="medium" style={styles.categoryCard}>
        <CardHeader
          title="Reportes por Categoría"
        />

        <CardContent>
          <View style={styles.periodSelectorContainer}>
            <SegmentedControl
              items={periods}
              selectedIndex={selectedPeriod}
              onSelectionChange={setSelectedPeriod}
              style={styles.periodSelector}
            />
          </View>

          <View style={styles.categoryList}>
            {categories.map((category, index) => (
              <AnimatedListItem
                key={category.categoria}
                index={index}
                staggerDelay={200}
                style={styles.categoryItem}
              >
                <View style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIndicator,
                        { backgroundColor: category.color },
                      ]}
                    />
                    <Text variant="bodyLarge" style={styles.categoryName}>
                      {category.categoria}
                    </Text>
                  </View>

                  <View style={styles.categoryStats}>
                    <Text variant="titleMedium" style={styles.categoryCount}>
                      {category.cantidad}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.categoryChange,
                        {
                          color: category.cambio > 0 ? COLORS.secondary[500] : '#F44336',
                        },
                      ]}
                    >
                      {category.cambio > 0 ? '+' : ''}{category.cambio}%
                    </Text>
                  </View>
                </View>
              </AnimatedListItem>
            ))}
          </View>
        </CardContent>
      </Card>
    </AnimatedEntrance>
  );
};

const RecentReportsSection: React.FC<{
  reports: RecentReport[];
  onViewReport?: (reportId: string) => void;
  onViewAll?: () => void;
}> = ({ reports, onViewReport, onViewAll }) => {
  const listItems = reports.map(report => ({
    id: report.id,
    title: report.titulo,
    subtitle: `${report.categoria} • ${formatearFecha(report.fecha)}`,
    trailing: (
      <View style={styles.reportTrailing}>
        <View
          style={[
            styles.priorityDot,
            { backgroundColor: getPrioridadColor(report.prioridad) },
          ]}
        />
        <Text variant="bodySmall" style={styles.reportStatus}>
          {report.estado}
        </Text>
      </View>
    ),
    onPress: () => onViewReport?.(report.id),
  }));

  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 1200 }}>
      <ListCard
        title="Reportes Recientes"
        items={listItems}
        maxItems={5}
        showSeeAll
        onSeeAllPress={onViewAll}
        style={styles.recentReportsCard}
      />
    </AnimatedEntrance>
  );
};

// ================================
// COMPONENTE PRINCIPAL
// ================================

export const Dashboard: React.FC<Props> = ({
  onViewAllReports,
  onViewReport,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary[500]]}
            tintColor={COLORS.primary[500]}
          />
        }
      >
        {/* Sección de Bienvenida */}
        <WelcomeSection />

        {/* Estadísticas */}
        <StatsSection stats={DASHBOARD_STATS} />

        {/* Reportes Recientes */}
        <RecentReportsSection
          reports={RECENT_REPORTS}
          onViewReport={onViewReport}
          onViewAll={onViewAllReports}
        />

        {/* Categorías */}
        <CategorySection categories={CATEGORY_STATS} />

      </ScrollView>
    </SafeAreaView>
  );
};

// ================================
// ESTILOS
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: SPACING.base,
  },

  welcomeSection: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base, // Reducir padding vertical
  },

  greeting: {
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },

  welcomeSubtitle: {
    color: COLORS.text.secondary,
    lineHeight: 24,
  },

  statsSection: {
    paddingHorizontal: SPACING.sm, // Reducir padding
    marginBottom: SPACING.base, // Reducir margen inferior
  },

  sectionTitle: {
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.base,
  },

  // Estilos para la tarjeta unificada de estadísticas
  unifiedStatsCard: {
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.base,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statItem: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },

  statIcon: {
    fontSize: 24,
    lineHeight: 30,
  },

  statInfo: {
    flex: 1,
  },

  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  statChange: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  statsDivider: {
    height: 1,
    backgroundColor: COLORS.neutral[200],
    marginVertical: SPACING.base,
    marginHorizontal: SPACING.xs,
  },

  categoryCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },

  periodSelectorContainer: {
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },

  periodSelector: {
    width: '100%',
    minWidth: 280, // Ancho mínimo para que los textos no se corten
  },

  categoryList: {
    gap: SPACING.sm,
  },

  categoryItem: {
    paddingVertical: SPACING.xs,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },

  categoryName: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  categoryStats: {
    alignItems: 'flex-end',
  },

  categoryCount: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },

  categoryChange: {
    fontSize: 12,
    fontWeight: '500',
  },

  recentReportsCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },

  reportTrailing: {
    alignItems: 'flex-end',
  },

  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },

  reportStatus: {
    color: COLORS.text.secondary,
    fontSize: 11,
  },
});

export default Dashboard;
