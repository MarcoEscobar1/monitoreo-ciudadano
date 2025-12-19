/**
 * EditProfileScreen - Pantalla de edición de perfil del ciudadano
 * Permite editar: foto de perfil, nombre, apellidos, teléfono y dirección
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { Input } from '../../components/inputs/Input';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellidos: user?.apellidos || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    avatar_url: user?.avatar_url || '',
  });

  const [errors, setErrors] = useState({
    nombre: '',
    apellidos: '',
    telefono: '',
  });

  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatar_url);

  // Actualizar formData cuando el usuario cambie
  useEffect(() => {
    if (user) {
      console.log('📝 Datos del usuario cargados:', {
        nombre: user.nombre,
        apellidos: user.apellidos,
        telefono: user.telefono,
        direccion: user.direccion,
      });
      
      setFormData({
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        avatar_url: user.avatar_url || '',
      });
      
      setAvatarUri(user.avatar_url);
    }
  }, [user]);

  // Validaciones
  const validateNombre = (nombre: string): boolean => {
    if (!nombre || nombre.trim().length < 2) {
      setErrors(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 2 caracteres' }));
      return false;
    }
    setErrors(prev => ({ ...prev, nombre: '' }));
    return true;
  };

  const validateTelefono = (telefono: string): boolean => {
    if (telefono && !/^[0-9]{8}$/.test(telefono)) {
      setErrors(prev => ({ ...prev, telefono: 'El teléfono debe tener 8 dígitos' }));
      return false;
    }
    setErrors(prev => ({ ...prev, telefono: '' }));
    return true;
  };

  // Manejar cambios en campos
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validar en tiempo real
    if (field === 'nombre') {
      validateNombre(value);
    } else if (field === 'telefono') {
      validateTelefono(value);
    }
  };

  // Seleccionar imagen del perfil
  const handleSelectAvatar = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Se requieren permisos para acceder a la galería de fotos',
          [{ text: 'OK' }]
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        setFormData(prev => ({ ...prev, avatar_url: uri }));
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con cámara
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Se requieren permisos para acceder a la cámara',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        setFormData(prev => ({ ...prev, avatar_url: uri }));
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Mostrar opciones para seleccionar avatar
  const handleAvatarOptions = () => {
    Alert.alert(
      'Foto de perfil',
      'Selecciona una opción',
      [
        {
          text: 'Tomar foto',
          onPress: handleTakePhoto,
        },
        {
          text: 'Elegir de galería',
          onPress: handleSelectAvatar,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  // Guardar cambios
  const handleSave = async () => {
    // Validar
    const isNombreValid = validateNombre(formData.nombre);
    const isTelefonoValid = validateTelefono(formData.telefono);

    if (!isNombreValid || !isTelefonoValid) {
      Alert.alert('Error de validación', 'Por favor corrige los errores antes de continuar');
      return;
    }

    try {
      setSaving(true);

      // LOG: Datos que se enviarán al backend
      const dataToSend = {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim() || null,  // Convertir string vacío a null
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null,
        avatar_url: formData.avatar_url || null,
      };
      console.log('📤 Enviando datos al backend:', dataToSend);

      // Llamar al servicio para actualizar perfil
      const response = await apiService.users.updateProfile(dataToSend);

      if (response.success && response.data) {
        console.log('📥 Respuesta del backend:', response.data);
        
        // Actualizar contexto del usuario con los datos que retorna el backend
        await updateUser({
          ...user,
          nombre: response.data.nombre,
          apellidos: response.data.apellidos,
          telefono: response.data.telefono,
          direccion: response.data.direccion,
          avatar_url: response.data.avatar_url,
        });

        Alert.alert(
          'Perfil actualizado',
          'Tus datos se han actualizado correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <AnimatedEntrance type="fadeIn">
            <Card style={styles.card}>
              <CardHeader title="Foto de perfil" />
              <CardContent>
                <View style={styles.avatarSection}>
                  <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={handleAvatarOptions}
                    activeOpacity={0.7}
                  >
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {formData.nombre ? formData.nombre.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.cameraIconContainer}>
                      <Text style={styles.cameraIcon}>📷</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.avatarHint}>Toca para cambiar</Text>
                </View>
              </CardContent>
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance type="fadeIn">
            <Card style={styles.card}>
              <CardHeader title="Información personal" />
              <CardContent>
                <Input
                  label="Nombre(s) *"
                  value={formData.nombre}
                  onChangeText={(value: string) => handleInputChange('nombre', value)}
                  error={errors.nombre}
                  leftIcon="👤"
                />

                <Input
                  label="Apellidos"
                  value={formData.apellidos}
                  onChangeText={(value: string) => handleInputChange('apellidos', value)}
                  leftIcon="👤"
                />

                <Input
                  label="Teléfono"
                  value={formData.telefono}
                  onChangeText={(value: string) => handleInputChange('telefono', value)}
                  error={errors.telefono}
                  leftIcon="📱"
                  keyboardType="phone-pad"
                  placeholder="12345678 (8 dígitos)"
                  maxLength={8}
                />

                <Input
                  label="Dirección"
                  value={formData.direccion}
                  onChangeText={(value: string) => handleInputChange('direccion', value)}
                  leftIcon="📍"
                  placeholder="Ej: Av. Arce #123, La Paz"
                  multiline
                  numberOfLines={2}
                />

                <Text style={styles.requiredNote}>* Campos obligatorios</Text>
              </CardContent>
            </Card>
          </AnimatedEntrance>

          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              title="Cancelar"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={saving}
            />
            <Button
              variant="filled"
              title="Guardar cambios"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: DESIGN_SYSTEM.SPACING.base,
    paddingBottom: DESIGN_SYSTEM.SPACING['2xl'],
  },
  card: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.SPACING.base,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[200],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.neutral[0],
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cameraIcon: {
    fontSize: 20,
  },
  avatarHint: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.text.secondary,
  },
  input: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  requiredNote: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.xs,
    color: DESIGN_SYSTEM.COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: DESIGN_SYSTEM.SPACING.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: DESIGN_SYSTEM.SPACING.lg,
    gap: DESIGN_SYSTEM.SPACING.base,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default EditProfileScreen;
