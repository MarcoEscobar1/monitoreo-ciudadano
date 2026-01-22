/**
 * CreateReportScreen - VERSIÓN CORREGIDA SIN SUPERPOSICIONES
 * Pantalla de creación de reportes con layout limpio y espaciado
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  RadioButton,
  ActivityIndicator,
  Snackbar,
  Portal,
  Modal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

// Importar componentes de FASE 7
import { Button } from '../../components/buttons/Button';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { LocationSelectorMap } from '../../components/maps/LocationSelectorMap';

// Importar servicios y sistema de diseño
import designSystem from '../../theme/designSystem';
import { reporteService } from '../../services/reporteService';
import { categoriaService } from '../../services/categoriaService';
import { useLocation } from '../../services/locationService';
import { useNotifications } from '../../context/NotificationContext';
import { PrioridadReporte } from '../../types';

// ================================
// TIPOS E INTERFACES
// ================================

interface CategoriaOption {
  id: string;
  nombre: string;
  descripcion: string;
}

// ================================
// COMPONENTE PRINCIPAL
// ================================

const CreateReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getCurrentLocation } = useLocation();
  const { refreshUnreadCount } = useNotifications();

  // Estados del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [prioridad, setPrioridad] = useState<PrioridadReporte>('media');
  const [imagen, setImagen] = useState<string | null>(null);
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [direccion, setDireccion] = useState('');

  // Estados de ubicación
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [mostrarMapaSelector, setMostrarMapaSelector] = useState(false);

  // Estados de categorías
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  // Estados de envío
  const [enviando, setEnviando] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ================================
  // EFECTOS Y DATOS INICIALES
  // ================================

  useEffect(() => {
    cargarCategorias();
    obtenerUbicacionActual();
  }, []);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // ================================
  // FUNCIONES DE DATOS
  // ================================

  const cargarCategorias = async () => {
    try {
      setCargandoCategorias(true);
      
      // Forzar actualización para limpiar cache y obtener datos frescos
      await categoriaService.forceUpdate();
      
      const categoriasDisponibles = await categoriaService.getCategorias();
      
      const categoriasUI: CategoriaOption[] = categoriasDisponibles.map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion || '',
      }));
      
      setCategorias(categoriasUI);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      showSnackbar('Error al cargar categorías');
    } finally {
      setCargandoCategorias(false);
    }
  };

  const obtenerUbicacionActual = async () => {
    try {
      setObteniendoUbicacion(true);
      const location = await getCurrentLocation();
      if (location) {
        setUbicacion({ lat: location.latitude, lng: location.longitude });
        setDireccion(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      showSnackbar('Error al obtener ubicación');
    } finally {
      setObteniendoUbicacion(false);
    }
  };

  // ================================
  // FUNCIONES DE IMAGEN
  // ================================

  const seleccionarImagen = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagen(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      showSnackbar('Error al seleccionar imagen');
    }
  };

  const tomarFoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImagen(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      showSnackbar('Error al tomar foto');
    }
  };

  // ================================
  // FUNCIONES DE UBICACIÓN
  // ================================

  const manejarSeleccionUbicacion = (locationData: { latitude: number; longitude: number; address?: string }) => {
    setUbicacion({ lat: locationData.latitude, lng: locationData.longitude });
    setDireccion(locationData.address || 'Ubicación seleccionada en el mapa');
    setMostrarMapaSelector(false);
    showSnackbar('Ubicación seleccionada correctamente');
  };

  // ================================
  // FUNCIONES DE ENVÍO
  // ================================

  const validarFormulario = (): boolean => {
    if (!titulo.trim()) {
      showSnackbar('El título es obligatorio');
      return false;
    }
    if (!descripcion.trim()) {
      showSnackbar('La descripción es obligatoria');
      return false;
    }
    if (!categoriaSeleccionada) {
      showSnackbar('Selecciona una categoría');
      return false;
    }
    if (!ubicacion) {
      showSnackbar('La ubicación es obligatoria');
      return false;
    }
    if (!imagen) {
      showSnackbar('Debes tomar al menos una fotografía del problema');
      return false;
    }
    return true;
  };

  const enviarReporte = async () => {
    if (!validarFormulario()) return;

    try {
      setEnviando(true);
      
      const nuevoReporte = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria_id: categoriaSeleccionada!,
        ubicacion: {
          lat: ubicacion!.lat,
          lng: ubicacion!.lng,
        },
        direccion: direccion.trim() || undefined,
        prioridad,
        es_anonimo: esAnonimo,
        imagen: imagen || undefined,
      };

      await reporteService.crearReporte(nuevoReporte);
      
      // Actualizar el contador de notificaciones inmediatamente
      await refreshUnreadCount();
      
      Alert.alert(
        'Reporte enviado',
        'Tu reporte ha sido enviado correctamente. En unos minutos será revisado y validado por nuestro equipo antes de aparecer en el mapa.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              limpiarFormulario();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error enviando reporte:', error);
      showSnackbar('Error al enviar el reporte. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const limpiarFormulario = () => {
    setTitulo('');
    setDescripcion('');
    setCategoriaSeleccionada(null);
    setPrioridad('media');
    setImagen(null);
    setEsAnonimo(false);
    setDireccion('');
    setUbicacion(null);
  };

  // ================================
  // RENDER
  // ================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Título de la pantalla */}
        <View style={styles.section}>
          <Text variant="headlineMedium" style={styles.title}>
            Crear Nuevo Reporte
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Describe el problema que has identificado
          </Text>
        </View>

        {/* Información básica */}
        <View style={styles.section}>
          <Card variant="elevated" size="medium" style={styles.card}>
            <CardHeader title="Información Básica" />
            <CardContent>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Título del problema"
                  value={titulo}
                  onChangeText={setTitulo}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ej: Semáforo dañado en Av. Principal"
                />
                <TextInput
                  label="Descripción detallada"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textArea}
                  placeholder="Describe el problema con el mayor detalle posible..."
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Categorías */}
        <View style={styles.section}>
          <Card variant="elevated" size="medium" style={styles.card}>
            <CardHeader title="Categoría del Problema" />
            <CardContent>
              {cargandoCategorias ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={designSystem.COLORS.primary[500]} />
                  <Text style={styles.loadingText}>Cargando categorías...</Text>
                </View>
              ) : (
                <View style={styles.categoriasContainer}>
                  {categorias.map((categoria) => (
                    <TouchableOpacity
                      key={categoria.id}
                      style={[
                        styles.categoriaOption,
                        categoriaSeleccionada === categoria.id && styles.categoriaSeleccionada,
                      ]}
                      onPress={() => setCategoriaSeleccionada(categoria.id)}
                    >
                      <Text
                        style={[
                          styles.categoriaNombre,
                          categoriaSeleccionada === categoria.id && styles.categoriaTextoSeleccionado,
                        ]}
                      >
                        {categoria.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* Prioridad */}
        <View style={styles.section}>
          <Card variant="elevated" size="medium" style={styles.card}>
            <CardHeader title="Nivel de Prioridad" />
            <CardContent>
              <RadioButton.Group
                onValueChange={(value) => setPrioridad(value as PrioridadReporte)}
                value={prioridad}
              >
                <View style={styles.prioridadContainer}>
                  <TouchableOpacity 
                    style={styles.prioridadOption}
                    onPress={() => setPrioridad('baja')}
                  >
                    <RadioButton value="baja" />
                    <View style={styles.prioridadInfo}>
                      <Text style={styles.prioridadTexto}>Baja</Text>
                      <Text style={styles.prioridadDescripcion}>No es urgente</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.prioridadOption}
                    onPress={() => setPrioridad('media')}
                  >
                    <RadioButton value="media" />
                    <View style={styles.prioridadInfo}>
                      <Text style={styles.prioridadTexto}>Media</Text>
                      <Text style={styles.prioridadDescripcion}>Atención moderada</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.prioridadOption}
                    onPress={() => setPrioridad('alta')}
                  >
                    <RadioButton value="alta" />
                    <View style={styles.prioridadInfo}>
                      <Text style={styles.prioridadTexto}>Alta</Text>
                      <Text style={styles.prioridadDescripcion}>Atención urgente</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </RadioButton.Group>
            </CardContent>
          </Card>
        </View>

        {/* Imagen */}
        <View style={styles.section}>
          <Card variant="elevated" size="medium" style={styles.card}>
            <CardHeader title="Imagen (Opcional)" />
            <CardContent>
              {imagen ? (
                <View style={styles.imagenContainer}>
                  <Image source={{ uri: imagen }} style={styles.imagenPreview} />
                  <View style={styles.botonesImagen}>
                    <Button
                      title="Cambiar"
                      variant="outlined"
                      color="primary"
                      onPress={seleccionarImagen}
                      style={styles.botonImagen}
                    />
                    <Button
                      title="Quitar"
                      variant="outlined"
                      color="error"
                      onPress={() => setImagen(null)}
                      style={styles.botonImagen}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.botonesImagen}>
                  <Button
                    title="Tomar Foto"
                    variant="outlined"
                    color="primary"
                    onPress={tomarFoto}
                    style={styles.botonImagen}
                  />
                  <Button
                    title="Galería"
                    variant="outlined"
                    color="primary"
                    onPress={seleccionarImagen}
                    style={styles.botonImagen}
                  />
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* Ubicación */}
        <View style={styles.section}>
          <Card variant="elevated" size="medium" style={styles.card}>
            <CardHeader title="Ubicación" />
            <CardContent>
              <View style={styles.ubicacionContainer}>
                {obteniendoUbicacion ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={designSystem.COLORS.primary[500]} />
                    <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
                  </View>
                ) : ubicacion ? (
                  <View>
                    <Text style={styles.ubicacionTexto}>
                      {direccion}
                    </Text>
                    <View style={styles.botonesUbicacion}>
                      <Button
                        title="Seleccionar en Mapa"
                        variant="outlined"
                        color="primary"
                        onPress={() => setMostrarMapaSelector(true)}
                        style={styles.botonUbicacion}
                      />
                      <Button
                        title="Mi Ubicación"
                        variant="filled"
                        color="primary"
                        onPress={obtenerUbicacionActual}
                        style={styles.botonUbicacion}
                      />
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.placeholderText}>
                      No se ha seleccionado ubicación
                    </Text>
                    <View style={styles.botonesUbicacion}>
                      <Button
                        title="Seleccionar en Mapa"
                        variant="outlined"
                        color="primary"
                        onPress={() => setMostrarMapaSelector(true)}
                        style={styles.botonUbicacion}
                      />
                      <Button
                        title="Obtener Mi Ubicación"
                        variant="filled"
                        color="primary"
                        onPress={obtenerUbicacionActual}
                        style={styles.botonUbicacion}
                      />
                    </View>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Botón de envío */}
        <View style={styles.section}>
          <Button
            title={enviando ? "Enviando..." : "Enviar Reporte"}
            variant="filled"
            color="primary"
            onPress={enviarReporte}
            disabled={enviando}
            style={styles.enviarButton}
          />
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Modal para Selector de Mapa */}
      <Portal>
        <Modal
          visible={mostrarMapaSelector}
          onDismiss={() => setMostrarMapaSelector(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <LocationSelectorMap
            onLocationSelect={(locationData) => {
              manejarSeleccionUbicacion(locationData);
            }}
            onCancel={() => setMostrarMapaSelector(false)}
            initialLocation={ubicacion ? { latitude: ubicacion.lat, longitude: ubicacion.lng } : undefined}
          />
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

// ================================
// ESTILOS
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.COLORS.surface.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: designSystem.SPACING.base,
    paddingBottom: designSystem.SPACING.xl,
  },

  section: {
    marginBottom: designSystem.SPACING.lg,
  },

  title: {
    color: designSystem.COLORS.text.primary,
    fontWeight: '700',
    marginBottom: designSystem.SPACING.xs,
  },

  subtitle: {
    color: designSystem.COLORS.text.secondary,
    lineHeight: 24,
  },

  card: {
    // Sin margin bottom aquí porque lo maneja la section
  },

  inputContainer: {
    gap: designSystem.SPACING.base,
  },

  input: {
    backgroundColor: designSystem.COLORS.surface.card,
  },

  textArea: {
    backgroundColor: designSystem.COLORS.surface.card,
    minHeight: 100,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.SPACING.base,
  },

  loadingText: {
    marginLeft: designSystem.SPACING.sm,
    color: designSystem.COLORS.text.secondary,
  },

  categoriasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.SPACING.sm,
    justifyContent: 'space-between',
  },

  categoriaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: designSystem.COLORS.neutral[300],
    backgroundColor: designSystem.COLORS.surface.card,
    minWidth: '45%',
    marginBottom: designSystem.SPACING.xs,
  },

  categoriaSeleccionada: {
    borderColor: designSystem.COLORS.primary[500],
    backgroundColor: `${designSystem.COLORS.primary[500]}10`,
  },

  categoriaIcono: {
    fontSize: 20,
    marginRight: designSystem.SPACING.sm,
  },

  categoriaNombre: {
    fontSize: 14,
    color: designSystem.COLORS.text.primary,
    fontWeight: '500',
    flex: 1,
  },

  categoriaTextoSeleccionado: {
    color: designSystem.COLORS.primary[600],
    fontWeight: '600',
  },

  prioridadContainer: {
    gap: designSystem.SPACING.sm,
  },

  prioridadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: designSystem.COLORS.neutral[200],
    backgroundColor: designSystem.COLORS.surface.card,
  },

  prioridadInfo: {
    marginLeft: designSystem.SPACING.sm,
    flex: 1,
  },

  prioridadTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: designSystem.COLORS.text.primary,
  },

  prioridadDescripcion: {
    fontSize: 12,
    color: designSystem.COLORS.text.secondary,
    marginTop: 2,
  },

  imagenContainer: {
    alignItems: 'center',
    gap: designSystem.SPACING.base,
  },

  imagenPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },

  botonesImagen: {
    flexDirection: 'row',
    gap: designSystem.SPACING.base,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  botonImagen: {
    minWidth: 120,
  },

  ubicacionContainer: {
    gap: designSystem.SPACING.base,
  },

  ubicacionTexto: {
    fontSize: 14,
    color: designSystem.COLORS.text.primary,
    textAlign: 'center',
    marginBottom: designSystem.SPACING.sm,
  },

  botonesUbicacion: {
    flexDirection: 'row',
    gap: designSystem.SPACING.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: designSystem.SPACING.sm,
  },

  botonUbicacion: {
    minWidth: 140,
  },

  cambiarUbicacionButton: {
    alignSelf: 'center',
  },

  enviarButton: {
    marginTop: designSystem.SPACING.base,
  },

  bottomSpacing: {
    height: designSystem.SPACING.xl,
  },

  snackbar: {
    backgroundColor: designSystem.COLORS.error[500],
  },

  placeholderText: {
    fontSize: 14,
    color: designSystem.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: designSystem.SPACING.base,
  },

  modalContainer: {
    backgroundColor: 'white',
    margin: 0,
    flex: 1,
  },
});

export default CreateReportScreen;
