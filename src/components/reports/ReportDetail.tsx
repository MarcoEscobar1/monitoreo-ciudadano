/**
 * Pantalla de Detalles de Reporte - FASE 7
 * Vista completa de un reporte con animaciones y interacciones modernas
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import {
  Text,
  IconButton,
  Chip,
  Divider,
  Portal,
  Modal,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importar componentes del nuevo sistema de diseño
import { AnimatedEntrance, AnimatedListItem } from '../animated/AnimatedEntrance';
import { Card, CardHeader, CardContent, CardActions } from '../cards/Card';
import { Button } from '../buttons/Button';

// Tipos locales (reemplazando imports externos)
interface Report {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  prioridad: 'alta' | 'media' | 'baja';
  fechaCreacion: Date;
  latitud: number;
  longitud: number;
  direccion?: string;
  ciudadano: {
    nombre: string;
    email: string;
  };
}

interface ReportUpdate {
  id: string;
  fecha: Date;
  estado: string;
  comentario: string;
  usuario: string;
}

// Sistema de diseño
import DESIGN_SYSTEM from '../../theme/designSystem';

const COLORS = DESIGN_SYSTEM.COLORS;

const SPACING = DESIGN_SYSTEM.SPACING;

const { width: screenWidth } = Dimensions.get('window');

// ================================
// INTERFACES Y TIPOS
// ================================

interface ReportDetailProps {
  report: Report;
  updates: ReportUpdate[];
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusUpdate?: (newStatus: string) => void;
  onAddUpdate?: () => void;
  isLoading?: boolean;
}

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onShare: () => void;
  report: Report;
}

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

interface PriorityBadgeProps {
  priority: 'alta' | 'media' | 'baja';
  size?: 'small' | 'medium';
}

// ================================
// DATOS Y UTILIDADES
// ================================

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'nuevo':
      return COLORS.reportStatus.nuevo;
    case 'en progreso':
      return COLORS.reportStatus.en_progreso;
    case 'resuelto':
      return COLORS.reportStatus.resuelto;
    case 'cerrado':
      return COLORS.reportStatus.cerrado;
    default:
      return COLORS.neutral[500];
  }
};

const getPriorityColor = (priority: 'alta' | 'media' | 'baja'): string => {
  switch (priority) {
    case 'alta':
      return COLORS.error[500];
    case 'media':
      return COLORS.warning[500];
    case 'baja':
      return COLORS.success[500];
  }
};

const getCategoryColor = (category: string): string => {
  const categoryKey = category.toLowerCase().replace(/\s+/g, '');
  const colorMap: { [key: string]: string } = {
    infraestructura: COLORS.categories.infrastructure,
    medioambiente: COLORS.categories.environment,
    ambiente: COLORS.categories.environment,
    seguridad: COLORS.categories.security,
    transporte: COLORS.categories.transport,
    salud: COLORS.categories.health,
    educacion: COLORS.categories.education,
    educación: COLORS.categories.education,
  };
  
  return colorMap[categoryKey] || COLORS.neutral[500];
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatLocation = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

// ================================
// SUB-COMPONENTES
// ================================

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const color = getStatusColor(status);
  const textSize = size === 'small' ? 'bodySmall' : size === 'large' ? 'titleSmall' : 'bodyMedium';
  
  return (
    <Chip
      mode="flat"
      style={[
        styles.statusBadge,
        { backgroundColor: `${color}20`, borderColor: color },
        size === 'small' && styles.smallBadge,
      ]}
      textStyle={[
        styles.statusBadgeText,
        { color },
        size === 'small' && styles.smallBadgeText,
      ]}
    >
      {status}
    </Chip>
  );
};

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'medium' }) => {
  const color = getPriorityColor(priority);
  const icon = priority === 'alta' ? '🔴' : priority === 'media' ? '🟡' : '🟢';
  
  return (
    <View style={styles.priorityBadge}>
      <Text style={styles.priorityIcon}>{icon}</Text>
      <Text
        variant={size === 'small' ? 'bodySmall' : 'bodyMedium'}
        style={[styles.priorityText, { color }]}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Text>
    </View>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  onShare,
  report,
}) => {
  return (
    <View style={styles.actionButtons}>
      <AnimatedListItem index={0} staggerDelay={100}>
        <IconButton
          icon="share-variant"
          size={24}
          onPress={onShare}
          style={styles.actionButton}
          iconColor={COLORS.primary[500]}
        />
      </AnimatedListItem>

      {onEdit && (
        <AnimatedListItem index={1} staggerDelay={100}>
          <IconButton
            icon="pencil"
            size={24}
            onPress={onEdit}
            style={styles.actionButton}
            iconColor={COLORS.secondary[500]}
          />
        </AnimatedListItem>
      )}

      {onDelete && (
        <AnimatedListItem index={2} staggerDelay={100}>
          <IconButton
            icon="delete"
            size={24}
            onPress={onDelete}
            style={styles.actionButton}
            iconColor={COLORS.error[500]}
          />
        </AnimatedListItem>
      )}
    </View>
  );
};

const ReportHeader: React.FC<{
  report: Report;
  onBack: () => void;
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ report, onBack, onShare, onEdit, onDelete }) => {
  return (
    <AnimatedEntrance type="slideInDown" config={{ duration: 400 }}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={onBack}
            iconColor={COLORS.text.primary}
          />
          <ActionButtons
            onEdit={onEdit}
            onDelete={onDelete}
            onShare={onShare}
            report={report}
          />
        </View>

        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.title}>
            {report.titulo}
          </Text>

          <View style={styles.headerMeta}>
            <StatusBadge status={report.estado} />
            <PriorityBadge priority={report.prioridad} />
            <Chip
              mode="flat"
              style={[
                styles.categoryChip,
                { borderColor: getCategoryColor(report.categoria) },
              ]}
              textStyle={[
                styles.categoryChipText,
                { color: getCategoryColor(report.categoria) },
              ]}
            >
              {report.categoria}
            </Chip>
          </View>
        </View>
      </Surface>
    </AnimatedEntrance>
  );
};

const ReportInfo: React.FC<{ report: Report }> = ({ report }) => {
  const infoItems = [
    {
      icon: '📅',
      label: 'Fecha de creación',
      value: formatDate(report.fechaCreacion),
    },
    {
      icon: '👤',
      label: 'Reportado por',
      value: report.ciudadano.nombre,
    },
    {
      icon: '📧',
      label: 'Contacto',
      value: report.ciudadano.email,
    },
    {
      icon: '📍',
      label: 'Ubicación',
      value: report.direccion || formatLocation(report.latitud, report.longitud),
    },
  ];

  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 400, delay: 200 }}>
      <Card variant="elevated" size="medium" style={styles.infoCard}>
        <CardHeader title="Información del Reporte" />
        <CardContent>
          <View style={styles.infoList}>
            {infoItems.map((item, index) => (
              <AnimatedListItem
                key={item.label}
                index={index}
                staggerDelay={100}
                style={styles.infoItem}
              >
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <View style={styles.infoContent}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      {item.label}
                    </Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {item.value}
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

const ReportDescription: React.FC<{ description: string }> = ({ description }) => {
  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 400, delay: 300 }}>
      <Card variant="elevated" size="medium" style={styles.descriptionCard}>
        <CardHeader title="Descripción" />
        <CardContent>
          <Text variant="bodyLarge" style={styles.description}>
            {description}
          </Text>
        </CardContent>
      </Card>
    </AnimatedEntrance>
  );
};

const QuickActions: React.FC<{
  onStatusUpdate?: (status: string) => void;
  onAddUpdate?: () => void;
  currentStatus: string;
}> = ({ onStatusUpdate, onAddUpdate, currentStatus }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const statusOptions = ['Nuevo', 'En progreso', 'Resuelto', 'Cerrado'];
  
  const handleStatusChange = (newStatus: string) => {
    setShowStatusModal(false);
    onStatusUpdate?.(newStatus);
  };

  return (
    <AnimatedEntrance type="slideInUp" config={{ duration: 400, delay: 400 }}>
      <Card variant="outlined" size="medium" style={styles.actionsCard}>
        <CardHeader title="Acciones Rápidas" />
        <CardActions>
          <View style={styles.quickActionButtons}>
            <Button
              title="Cambiar Estado"
              variant="outlined"
              color="primary"
              onPress={() => setShowStatusModal(true)}
              style={styles.quickActionButton}
            />
            {onAddUpdate && (
              <Button
                title="Agregar Actualización"
                variant="filled"
                color="primary"
                onPress={onAddUpdate}
                style={styles.quickActionButton}
              />
            )}
          </View>
        </CardActions>
      </Card>

      {/* Modal de cambio de estado */}
      <Portal>
        <Modal
          visible={showStatusModal}
          onDismiss={() => setShowStatusModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Cambiar Estado
          </Text>
          <View style={styles.statusOptions}>
            {statusOptions.map((status) => (
              <Button
                key={status}
                title={status}
                variant={currentStatus === status ? 'filled' : 'outlined'}
                color="primary"
                onPress={() => handleStatusChange(status)}
                style={styles.statusOption}
              />
            ))}
          </View>
          <Button
            title="Cancelar"
            variant="text"
            onPress={() => setShowStatusModal(false)}
            style={styles.cancelButton}
          />
        </Modal>
      </Portal>
    </AnimatedEntrance>
  );
};

// ================================
// COMPONENTE PRINCIPAL
// ================================

export const ReportDetail: React.FC<ReportDetailProps> = ({
  report,
  updates,
  onBack,
  onEdit,
  onDelete,
  onStatusUpdate,
  onAddUpdate,
  isLoading = false,
}) => {
  const handleShare = useCallback(async () => {
    try {
      const message = `Reporte: ${report.titulo}\nEstado: ${report.estado}\nUbicación: ${report.direccion || formatLocation(report.latitud, report.longitud)}`;
      
      await Share.share({
        message,
        title: 'Reporte Ciudadano',
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  }, [report]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  }, [onDelete]);

  return (
    <SafeAreaView style={styles.container}>
      <ReportHeader
        report={report}
        onBack={onBack}
        onShare={handleShare}
        onEdit={onEdit}
        onDelete={handleDelete}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información básica */}
        <ReportInfo report={report} />

        {/* Descripción */}
        <ReportDescription description={report.descripcion} />

        {/* Acciones rápidas */}
        <QuickActions
          onStatusUpdate={onStatusUpdate}
          onAddUpdate={onAddUpdate}
          currentStatus={report.estado}
        />

        {/* Timeline de actualizaciones */}
        <AnimatedEntrance type="slideInUp" config={{ duration: 400, delay: 500 }}>
          <Card variant="elevated" size="medium" style={styles.timelineCard}>
            <CardHeader title="Historial de Actualizaciones" />
            <CardContent>
              <View style={styles.timelinePlaceholder}>
                <Text variant="bodyMedium" style={styles.timelinePlaceholderText}>
                  Timeline de actualizaciones se mostrará aquí
                </Text>
                {updates.map((update, index) => (
                  <View key={update.id} style={styles.updateItem}>
                    <Text variant="bodySmall" style={styles.updateDate}>
                      {formatDate(update.fecha)}
                    </Text>
                    <Text variant="bodyLarge" style={styles.updateStatus}>
                      Estado: {update.estado}
                    </Text>
                    <Text variant="bodyMedium" style={styles.updateComment}>
                      {update.comentario}
                    </Text>
                    <Text variant="bodySmall" style={styles.updateUser}>
                      Por: {update.usuario}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        </AnimatedEntrance>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
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

  header: {
    backgroundColor: COLORS.surface.card,
    paddingBottom: SPACING.base,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },

  headerContent: {
    paddingHorizontal: SPACING.base,
  },

  title: {
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },

  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },

  statusBadge: {
    height: 32,
    borderWidth: 1,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  smallBadge: {
    height: 24,
  },

  smallBadgeText: {
    fontSize: 10,
  },

  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.neutral[100],
    borderRadius: 16,
    height: 32,
  },

  priorityIcon: {
    fontSize: 12,
    marginRight: SPACING.xs,
  },

  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },

  categoryChip: {
    height: 32,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    margin: 0,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xl,
  },

  infoCard: {
    marginBottom: SPACING.base,
  },

  infoList: {
    gap: SPACING.base,
  },

  infoItem: {
    // Estilos para item de información
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
    marginTop: 2,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },

  infoValue: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  descriptionCard: {
    marginBottom: SPACING.base,
  },

  description: {
    color: COLORS.text.primary,
    lineHeight: 24,
  },

  actionsCard: {
    marginBottom: SPACING.base,
  },

  quickActionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },

  quickActionButton: {
    flex: 1,
  },

  timelineCard: {
    marginBottom: SPACING.base,
  },

  modalContent: {
    backgroundColor: COLORS.surface.card,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    minHeight: 300,
  },

  modalTitle: {
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },

  statusOptions: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  statusOption: {
    // Estilos para opción de estado
  },

  cancelButton: {
    alignSelf: 'center',
  },

  bottomSpacing: {
    height: 20,
  },

  // Estilos para timeline placeholder
  timelinePlaceholder: {
    padding: SPACING.sm,
  },

  timelinePlaceholderText: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },

  updateItem: {
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.neutral[100],
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary[500],
  },

  updateDate: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },

  updateStatus: {
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },

  updateComment: {
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },

  updateUser: {
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
});

export default ReportDetail;
