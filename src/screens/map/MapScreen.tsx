import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  Portal,
  Modal,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import DESIGN_SYSTEM from '../../theme/designSystem';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import WebMapComponent, { MapMarker } from '../../components/maps/WebMapComponent';
import ClusterMarker, { useMapClustering } from '../../components/maps/ClusterMarker';
import { useLocation } from '../../services/locationService';
import { reporteService } from '../../services/reporteService';
import { categoriaService } from '../../services/categoriaService';
import { Reporte, Coordenada, UbicacionCompleta, CategoriaProblema, MapStackParamList } from '../../types';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<MapStackParamList>>();
  const { getCurrentLocation, hasLocationPermissions } = useLocation();

  // Estados del mapa
  const [region, setRegion] = useState({
    latitude: 4.7110, // Bogotá, Colombia
    longitude: -74.0721,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [reports, setReports] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordenada | null>(null);
  
  // Estados de clustering
  const [enableClustering, setEnableClustering] = useState(true);
  const clusters = useMapClustering(reports, region, { width, height });
  
  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  // Estados de modales
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [selectedClusterReports, setSelectedClusterReports] = useState<Reporte[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Reporte | null>(null);

  // Estados dinámicos
  const [categorias, setCategorias] = useState<CategoriaProblema[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Estados de reporte
  const estados = ['nuevo', 'en_revision', 'en_progreso', 'resuelto', 'cerrado'];

  useEffect(() => {
    loadCategorias();
    loadReports();
    getUserLocation();
  }, []);

  /**
   * Cargar categorías dinámicamente
   */
  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const categoriasDisponibles = await categoriaService.getCategorias();
      
      // Convertir al formato esperado por CategoriaProblema
      const categoriasUI: CategoriaProblema[] = categoriasDisponibles.map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion || '',
        activa: true,
      }));
      
      setCategorias(categoriasUI);
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      // Fallback a categorías por defecto si falla
      setCategorias([
        { id: '1', nombre: 'Infraestructura', descripcion: '', activa: true },
        { id: '2', nombre: 'Seguridad', descripcion: '', activa: true },
        { id: '3', nombre: 'Servicios Públicos', descripcion: '', activa: true },
        { id: '4', nombre: 'Transporte', descripcion: '', activa: true },
        { id: '5', nombre: 'Medio Ambiente', descripcion: '', activa: true },
      ]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  /**
   * Cargar reportes reales desde el servicio
   */
  const loadReports = async () => {
    try {
      setLoading(true);
      
      console.log('🗺️ [MapScreen] Cargando reportes validados para el mapa...');
      const reportes = await reporteService.getReportesParaMapa();
      console.log('📥 [MapScreen] Reportes recibidos del backend:', reportes);

      if (reportes && reportes.length > 0) {
        // Convertir los reportes del servicio al formato esperado por el mapa
        const reportesParaMapa: Reporte[] = reportes.map((rep: any) => ({
          id: rep.id,
          usuario_id: rep.usuario_id || 0,
          categoria_id: rep.categoria_id,
          zona_id: rep.zona_id || 1,
          titulo: rep.titulo,
          descripcion: rep.descripcion || '',
          ubicacion: {
            // El endpoint /mapa devuelve coordenadas directamente
            latitude: rep.coordenadas?.latitude || rep.ubicacion?.latitude,
            longitude: rep.coordenadas?.longitude || rep.ubicacion?.longitude,
          },
          direccion: rep.direccion || '',
          estado: rep.estado,
          prioridad: rep.prioridad,
          fecha_creacion: new Date(rep.fecha_creacion),
          fecha_actualizacion: rep.fecha_actualizacion ? new Date(rep.fecha_actualizacion) : new Date(rep.fecha_creacion),
          imagenes: rep.imagenes || [],
          likes: rep.likes || 0,
          dislikes: rep.dislikes || 0,
          validaciones: rep.validaciones || 0,
          comentarios_count: rep.comentarios_count || 0,
          usuario: rep.usuario || { id: 0, nombre: 'Usuario Anónimo', email: '' },
          categoria: rep.categoria || categorias.find(cat => cat.id === rep.categoria_id) || categorias[0],
          zona: { id: 1, nombre: 'Zona General', tipo: 'barrio', coordenadas: [], activa: true },
        }));

        setReports(reportesParaMapa);
        console.log(`✅ ${reportesParaMapa.length} reportes cargados en el mapa`);
      } else {
        console.log('⚠️ No se encontraron reportes');
        setReports([]);
      }
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes del mapa');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener ubicación del usuario
   */
  const getUserLocation = async (showDialog = false) => {
    try {
      console.log('📍 Solicitando ubicación del usuario...');
      
      const location = await getCurrentLocation({ showDialog });
      
      if (location) {
        console.log('✅ Ubicación obtenida:', location);
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        // Centrar mapa en la ubicación del usuario
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        console.log('⚠️ No se pudo obtener la ubicación');
        // Si hay reportes y no es una solicitud manual, centrar en el primer reporte
        if (reports.length > 0 && !showDialog) {
          const firstReport = reports[0];
          setRegion({
            latitude: firstReport.ubicacion.latitude,
            longitude: firstReport.ubicacion.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo ubicación del usuario:', error);
    }
  };

  /**
   * Manejar presión en marcador individual
   */
  const handleMarkerPress = (item: Reporte | MapMarker) => {
    if ('titulo' in item) {
      // Es un reporte
      setSelectedReport(item as Reporte);
      setShowReportModal(true);
    }
  };

  /**
   * Manejar presión en cluster
   */
  const handleClusterPress = (clusterReports: Reporte[]) => {
    if (clusterReports.length === 1) {
      // Si solo hay un reporte, mostrarlo directamente
      setSelectedReport(clusterReports[0]);
      setShowReportModal(true);
    } else {
      // Si hay múltiples reportes, mostrar lista
      setSelectedClusterReports(clusterReports);
      setShowClusterModal(true);
    }
  };

  /**
   * Filtrar reportes según criterios seleccionados
   */
  const getFilteredReports = (): Reporte[] => {
    return reports.filter(report => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(report.categoria_id);
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(report.estado);
      return categoryMatch && statusMatch;
    });
  };

  /**
   * Refrescar reportes en el mapa
   */
  const refrescarReportes = async () => {
    console.log('🔄 Refrescando reportes del mapa...');
    await loadReports();
  };

  // Listener para refrescar cuando se regrese del formulario
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refrescar reportes cuando la pantalla vuelve a estar en foco
      refrescarReportes();
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * Ver detalles de un reporte
   */
  const handleViewReportDetails = (report: Reporte) => {
    setShowReportModal(false);
    setShowClusterModal(false);
    // Navegación temporal - en una implementación real usarías el stack navigator apropiado
    console.log('Navegando a detalles del reporte:', report.id);
  };

  const filteredReports = getFilteredReports();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} />
      
      {/* Mapa Principal */}
      <View style={styles.mapContainer}>
        <WebMapComponent
          reports={filteredReports}
          showUserLocation={true}
          onMarkerPress={handleMarkerPress}
          style={styles.map}
        />
        
        {/* Overlay para clusters */}
        {enableClustering && (
          <View style={styles.clusterOverlay}>
            {clusters.map((cluster, index) => (
              cluster.count > 1 ? (
                <ClusterMarker
                  key={`cluster-${index}`}
                  coordinate={cluster.coordinate}
                  count={cluster.count}
                  reports={cluster.reports}
                  onPress={handleClusterPress}
                />
              ) : null
            ))}
          </View>
        )}
      </View>

      {/* Controles Superiores */}
      <AnimatedEntrance type="slideInDown">
        <View style={styles.topControls}>
          <Card style={styles.statsCard}>
            <CardContent style={styles.statsContent}>
              <Text style={styles.statsText}>
                {filteredReports.length} reportes en el mapa
              </Text>
              {loading && <ActivityIndicator size="small" color={DESIGN_SYSTEM.COLORS.primary[500]} />}
            </CardContent>
          </Card>
        </View>
      </AnimatedEntrance>

      {/* Controles Laterales */}
      <AnimatedEntrance type="slideInRight">
        <View style={styles.sideControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.controlIcon}>🔍</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, enableClustering && styles.controlButtonActive]}
            onPress={() => setEnableClustering(!enableClustering)}
          >
            <Text style={styles.controlIcon}>{enableClustering ? "📊" : "📍"}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => getUserLocation(true)}
          >
            <Text style={styles.controlIcon}>🎯</Text>
          </TouchableOpacity>
        </View>
      </AnimatedEntrance>

      {/* Modal de Filtros */}
      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <CardHeader title="Filtros de Mapa" />
            <CardContent>
              <Text style={styles.filterSectionTitle}>Categorías:</Text>
              <View style={styles.chipContainer}>
                {categorias.map(categoria => (
                  <TouchableOpacity
                    key={categoria.id}
                    style={[
                      styles.chip,
                      selectedCategories.includes(categoria.id) && styles.chipSelected
                    ]}
                    onPress={() => {
                      const newSelection = selectedCategories.includes(categoria.id)
                        ? selectedCategories.filter(id => id !== categoria.id)
                        : [...selectedCategories, categoria.id];
                      setSelectedCategories(newSelection);
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedCategories.includes(categoria.id) && styles.chipTextSelected
                    ]}>
                      {categoria.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Estados:</Text>
              <View style={styles.chipContainer}>
                {estados.map(estado => (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.chip,
                      selectedStatuses.includes(estado) && styles.chipSelected
                    ]}
                    onPress={() => {
                      const newSelection = selectedStatuses.includes(estado)
                        ? selectedStatuses.filter(s => s !== estado)
                        : [...selectedStatuses, estado];
                      setSelectedStatuses(newSelection);
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedStatuses.includes(estado) && styles.chipTextSelected
                    ]}>
                      {estado.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  variant="text"
                  title="Limpiar"
                  onPress={() => {
                    setSelectedCategories([]);
                    setSelectedStatuses([]);
                  }}
                  style={styles.modalButton}
                />
                <Button
                  variant="filled"
                  title="Aplicar"
                  onPress={() => setShowFilters(false)}
                  style={styles.modalButton}
                />
              </View>
            </CardContent>
          </Card>
        </Modal>
      </Portal>

      {/* Modal de Cluster */}
      <Portal>
        <Modal
          visible={showClusterModal}
          onDismiss={() => setShowClusterModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <CardHeader title={`${selectedClusterReports.length} Reportes en esta zona`} />
            <CardContent style={styles.clusterModalContent}>
              {selectedClusterReports.map(report => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportItem}
                  onPress={() => handleViewReportDetails(report)}
                >
                  <View style={styles.reportItemHeader}>
                    <Text style={styles.reportIcon}>📍</Text>
                    <View style={styles.reportItemContent}>
                      <Text style={styles.reportTitle}>{report.titulo}</Text>
                      <Text style={styles.reportDescription} numberOfLines={2}>
                        {report.descripcion}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.estado) }]}>
                      <Text style={styles.statusText}>{report.estado.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </CardContent>
          </Card>
        </Modal>
      </Portal>

      {/* Modal de Reporte Individual */}
      <Portal>
        <Modal
          visible={showReportModal}
          onDismiss={() => setShowReportModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedReport && (
            <Card>
              <CardHeader 
                title={selectedReport.titulo}
                subtitle={selectedReport.direccion}
              />
              <CardContent>
                <Text style={styles.reportDescriptionModal}>
                  {selectedReport.descripcion}
                </Text>
                <View style={styles.reportStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>👍</Text>
                    <Text style={styles.statValue}>{selectedReport.likes}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>✅</Text>
                    <Text style={styles.statValue}>{selectedReport.validaciones}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>💬</Text>
                    <Text style={styles.statValue}>{selectedReport.comentarios_count}</Text>
                  </View>
                </View>
                
                <View style={styles.modalActions}>
                  <Button
                    variant="text"
                    title="Cerrar"
                    onPress={() => setShowReportModal(false)}
                    style={styles.modalButton}
                  />
                  <Button
                    variant="filled"
                    title="Ver Detalles"
                    onPress={() => handleViewReportDetails(selectedReport)}
                    style={styles.modalButton}
                  />
                </View>
              </CardContent>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );

  // Función auxiliar para obtener color del estado
  function getStatusColor(estado: string): string {
    switch (estado) {
      case 'nuevo': return DESIGN_SYSTEM.COLORS.info[500];
      case 'en_revision': return DESIGN_SYSTEM.COLORS.warning[500];
      case 'en_progreso': return DESIGN_SYSTEM.COLORS.secondary[500];
      case 'resuelto': return DESIGN_SYSTEM.COLORS.success[500];
      case 'cerrado': return DESIGN_SYSTEM.COLORS.neutral[500];
      default: return DESIGN_SYSTEM.COLORS.neutral[400];
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  clusterOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  topControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  sideControls: {
    position: 'absolute',
    top: 80,
    right: 10,
    gap: 10,
    zIndex: 1000,
  },
  // Nuevos estilos para controles personalizados
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 2,
  },
  controlButtonActive: {
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
  },
  controlIcon: {
    fontSize: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
  },
  fab: {
    backgroundColor: '#FFFFFF',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: height * 0.8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: DESIGN_SYSTEM.COLORS.neutral[800],
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    marginBottom: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[100],
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[300],
  },
  chipSelected: {
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[100],
    borderColor: DESIGN_SYSTEM.COLORS.primary[500],
  },
  chipText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.COLORS.neutral[700],
  },
  chipTextSelected: {
    color: DESIGN_SYSTEM.COLORS.primary[700],
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  clusterModalContent: {
    maxHeight: height * 0.5,
  },
  reportItem: {
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
    borderRadius: 8,
    marginVertical: 4,
    padding: 12,
  },
  reportItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.COLORS.neutral[800],
  },
  reportDescription: {
    fontSize: 14,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    marginBottom: 15,
    lineHeight: 20,
    marginTop: 4,
  },
  reportDescriptionModal: {
    fontSize: 16,
    lineHeight: 24,
    color: DESIGN_SYSTEM.COLORS.neutral[700],
    marginBottom: 16,
  },
  reportIcon: {
    fontSize: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 16,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
    borderRadius: 8,
    gap: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.COLORS.neutral[800],
  },
});

export default MapScreen;
