import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntrance, AnimatedListItem } from '../../components/animated/AnimatedEntrance';
import { Card, CardContent } from '../../components/cards/Card';
import adminService, { PendingReport } from '../../services/adminService';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { useAdminBadges } from '../../context/AdminBadgeContext';

const COLORS = DESIGN_SYSTEM.COLORS;
const SPACING = DESIGN_SYSTEM.SPACING;
const SHADOWS = DESIGN_SYSTEM.SHADOWS;

const PendingReportsScreen = ({ navigation }: any) => {
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const { refreshBadges } = useAdminBadges();

  const loadReports = async () => {
    try {
      const data = await adminService.getPendingReports();
      setReports(data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes pendientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Refrescar badges cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      refreshBadges();
    }, [refreshBadges])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleValidate = async (report: PendingReport) => {
    Alert.alert(
      'Validar Reporte',
      `¿Aprobar el reporte "${report.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: async () => {
            setProcessing(true);
            try {
              await adminService.validateReport(
                report.id,
                'Reporte aprobado por administrador'
              );
              Alert.alert('Éxito', 'Reporte validado correctamente');
              loadReports();
              await refreshBadges();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = (report: PendingReport) => {
    setSelectedReport(report);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Debes indicar el motivo del rechazo');
      return;
    }

    setProcessing(true);
    setShowRejectModal(false);

    try {
      await adminService.rejectReport(selectedReport!.id, rejectReason);
      Alert.alert('Éxito', 'Reporte rechazado');
      setRejectReason('');
      setSelectedReport(null);
      await refreshBadges();
      loadReports();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'CRITICA':
        return COLORS.error[500];
      case 'ALTA':
        return COLORS.warning[500];
      case 'MEDIA':
        return COLORS.info[500];
      default:
        return COLORS.text.secondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
        <Text variant="bodyLarge" style={styles.loadingText}>Cargando reportes...</Text>
      </SafeAreaView>
    );
  }

  if (reports.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <AnimatedEntrance type="fadeIn" config={{ duration: 600 }} style={styles.emptyContent}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success[500]} />
          <Text variant="headlineMedium" style={styles.emptyTitle}>¡Todo al día!</Text>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No hay reportes pendientes de validación
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={COLORS.neutral[0]} />
            <Text variant="labelLarge" style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </AnimatedEntrance>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AnimatedEntrance type="fadeIn" config={{ duration: 400 }}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {reports.length} Reporte{reports.length !== 1 ? 's' : ''} Pendiente{reports.length !== 1 ? 's' : ''}
          </Text>
          <Text variant="bodyLarge" style={styles.headerSubtitle}>
            Revisa y valida los reportes de los ciudadanos
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

        {reports.map((report, index) => (
          <AnimatedListItem key={report.id} index={index} staggerDelay={100}>
            <Card variant="elevated" size="medium" style={styles.reportCard}>
            {report.imagen_principal ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedImageUrl(report.imagen_principal!);
                  setShowImageModal(true);
                }}
              >
                <Image
                  source={{ uri: report.imagen_principal }}
                  style={styles.reportImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand" size={24} color={COLORS.neutral[0]} />
                  <Text style={styles.imageOverlayText}>Ver imagen completa</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={48} color={COLORS.neutral[400]} />
                <Text style={styles.noImageText}>Sin fotografía</Text>
              </View>
            )}

            <View style={styles.reportHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryName}>{report.categoria_nombre}</Text>
              </View>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(report.prioridad) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: getPriorityColor(report.prioridad) },
                  ]}
                >
                  {report.prioridad}
                </Text>
              </View>
            </View>

            <Text style={styles.reportTitle}>{report.titulo}</Text>
            <Text style={styles.reportDescription} numberOfLines={3}>
              {report.descripcion}
            </Text>

            <View style={styles.reportInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={16} color={COLORS.text.secondary} />
                <Text style={styles.infoText}>
                  {report.nombre} {report.apellidos}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={COLORS.text.secondary} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {report.direccion}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color={COLORS.text.secondary} />
                <Text style={styles.infoText}>
                  {new Date(report.fecha_creacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(report)}
                disabled={processing}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.neutral[0]} />
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleValidate(report)}
                disabled={processing}
              >
                <Ionicons name="checkmark-circle" size={20} color={COLORS.neutral[0]} />
                <Text style={styles.actionButtonText}>Aprobar</Text>
              </TouchableOpacity>
            </View>
            </Card>
          </AnimatedListItem>
        ))}
      </ScrollView>

      {/* Modal de Rechazo */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>Rechazar Reporte</Text>
            <Text variant="bodyMedium" style={styles.modalSubtitle}>
              Indica el motivo del rechazo:
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Ej: Información insuficiente, no corresponde a problema válido..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text variant="labelLarge" style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmReject}
              >
                <Text variant="labelLarge" style={styles.modalConfirmText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Imagen Expandida */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
            activeOpacity={0.9}
          >
            <View style={styles.closeButton}>
              <Ionicons name="close" size={30} color={COLORS.neutral[0]} />
            </View>
          </TouchableOpacity>
          
          {selectedImageUrl && (
            <Image
              source={{ uri: selectedImageUrl }}
              style={styles.expandedImage}
              resizeMode="contain"
            />
          )}
          
          <TouchableOpacity
            style={styles.imageModalInfo}
            activeOpacity={1}
          >
            <Text style={styles.imageModalText}>
              Toca fuera de la imagen para cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={COLORS.neutral[0]} />
          <Text variant="titleMedium" style={styles.processingText}>Procesando...</Text>
        </View>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[50],
    paddingHorizontal: SPACING.xl,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.text.primary,
    marginTop: SPACING.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.base,
    marginBottom: SPACING.xl,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.base,
    marginTop: SPACING.xl,
    ...SHADOWS.base,
  },
  refreshButtonText: {
    color: COLORS.neutral[0],
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.neutral[50],
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  reportCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  imageOverlayText: {
    color: COLORS.neutral[0],
    fontSize: 12,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  noImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: COLORS.neutral[500],
    fontSize: 14,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    padding: SPACING.sm,
  },
  expandedImage: {
    width: '100%',
    height: '80%',
  },
  imageModalInfo: {
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.base,
  },
  imageModalText: {
    color: COLORS.neutral[0],
    fontSize: 14,
    textAlign: 'center',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  reportDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  reportInfo: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.neutral[50],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.base,
    gap: SPACING.xs,
  },
  rejectButton: {
    backgroundColor: COLORS.error[500],
  },
  approveButton: {
    backgroundColor: COLORS.success[500],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral[0],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface.card,
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  modalTitle: {
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.base,
  },
  textArea: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.base,
    padding: SPACING.base,
    minHeight: 100,
    marginBottom: SPACING.base,
    backgroundColor: COLORS.neutral[0],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.base,
    borderRadius: DESIGN_SYSTEM.BORDERS.radius.base,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.neutral[100],
  },
  modalConfirmButton: {
    backgroundColor: COLORS.error[500],
  },
  modalCancelText: {
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: COLORS.neutral[0],
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: COLORS.neutral[0],
    marginTop: SPACING.base,
    fontWeight: '600',
  },
});

export default PendingReportsScreen;
