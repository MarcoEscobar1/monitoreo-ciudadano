import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Snackbar } from 'react-native-paper';

// Importar el nuevo componente ReportDetail de FASE 7
import { ReportDetail } from '../../components/reports/ReportDetail';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { HomeStackParamList } from '../../types';
import { reportService } from '../../services/apiService';

type ReportDetailScreenRouteProp = RouteProp<HomeStackParamList, 'ReportDetail'>;
type NavigationProp = StackNavigationProp<any>;

interface Props {
  route: ReportDetailScreenRouteProp;
}

// Datos de ejemplo para demostración
const SAMPLE_REPORT = {
  id: '1',
  titulo: 'Semáforo dañado en Av. Principal',
  descripcion: 'El semáforo ubicado en la intersección de Av. Principal con Calle 15 presenta fallas intermitentes en la luz roja. Esto ha causado confusión entre los conductores y pone en riesgo la seguridad vial. Se requiere revisión técnica urgente.',
  categoria: 'Transporte',
  estado: 'En progreso',
  prioridad: 'alta' as const,
  fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  latitud: 4.6097,
  longitud: -74.0817,
  direccion: 'Av. Principal #123, Bogotá',
  ciudadano: {
    nombre: 'María González',
    email: 'maria.gonzalez@email.com',
  },
};

const SAMPLE_UPDATES = [
  {
    id: '1',
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estado: 'Nuevo',
    comentario: 'Reporte creado por el ciudadano',
    usuario: 'Sistema',
  },
  {
    id: '2',
    fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estado: 'En progreso',
    comentario: 'Caso asignado al equipo de mantenimiento vial. Se programó inspección técnica.',
    usuario: 'Juan Pérez - Coordinador de Tránsito',
  },
  {
    id: '3',
    fecha: new Date(Date.now() - 12 * 60 * 60 * 1000),
    estado: 'En progreso',
    comentario: 'Inspección realizada. Se confirmó falla en el controlador eléctrico. Piezas de repuesto en camino.',
    usuario: 'Técnico Especialista',
  },
];

const ReportDetailScreen: React.FC<Props> = ({ route }) => {
  const { reportId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    showSnackbar('Función "Editar Reporte" - Próximamente disponible');
  }, [showSnackbar]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            showSnackbar('Reporte eliminado correctamente');
            setTimeout(() => navigation.goBack(), 1500);
          },
        },
      ]
    );
  }, [navigation, showSnackbar]);

  const handleStatusUpdate = useCallback((newStatus: string) => {
    showSnackbar(`Estado actualizado a: ${newStatus}`);
  }, [showSnackbar]);

  const handleAddUpdate = useCallback(() => {
    showSnackbar('Función "Agregar Actualización" - Próximamente disponible');
  }, [showSnackbar]);

  // Cargar datos del reporte desde el backend
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        console.log('📥 Cargando reporte:', reportId);
        const response = await reportService.getById(reportId);
        
        if (response.success && response.data) {
          console.log('✅ Reporte cargado:', response.data);
          setReportData({
            id: response.data.id,
            titulo: response.data.titulo,
            descripcion: response.data.descripcion,
            categoria: response.data.categoria?.nombre || 'Sin categoría',
            estado: response.data.estado || 'Pendiente',
            prioridad: response.data.prioridad?.toLowerCase() || 'media',
            fechaCreacion: new Date(response.data.fecha_creacion),
            latitud: response.data.ubicacion?.latitude,
            longitud: response.data.ubicacion?.longitude,
            direccion: response.data.direccion && response.data.direccion.trim() !== '' 
              ? response.data.direccion 
              : undefined,
            ciudadano: {
              nombre: response.data.usuario?.nombre || 'Usuario',
              email: response.data.usuario?.email || '',
            },
            validado: response.data.validado,
            comentarios_validacion: response.data.comentarios_validacion,
          });
        } else {
          showSnackbar('No se pudo cargar el reporte');
          navigation.goBack();
        }
      } catch (error) {
        console.error('❌ Error cargando reporte:', error);
        showSnackbar('Error al cargar el reporte');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [reportId, navigation, showSnackbar]);

  if (loading || !reportData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={DESIGN_SYSTEM.COLORS.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReportDetail
        report={reportData}
        updates={SAMPLE_UPDATES}
      />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  snackbar: {
    backgroundColor: '#424242',
  },
});

export default ReportDetailScreen;
