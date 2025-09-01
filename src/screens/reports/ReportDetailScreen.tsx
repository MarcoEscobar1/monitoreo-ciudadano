import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Snackbar } from 'react-native-paper';

// Importar el nuevo componente ReportDetail de FASE 7
import { ReportDetail } from '../../components/reports/ReportDetail';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { HomeStackParamList } from '../../types';

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

  // Usar el reportId real si está disponible, sino usar datos de ejemplo
  const reportData = {
    ...SAMPLE_REPORT,
    id: reportId.toString(),
    titulo: `Reporte #${reportId} - ${SAMPLE_REPORT.titulo}`,
  };

  return (
    <View style={styles.container}>
      <ReportDetail
        report={reportData}
        updates={SAMPLE_UPDATES}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
        onAddUpdate={handleAddUpdate}
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
  snackbar: {
    backgroundColor: '#424242',
  },
});

export default ReportDetailScreen;
