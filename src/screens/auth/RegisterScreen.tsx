import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { Input } from '../../components/inputs/Input';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState({
    name: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  // Validaciones
  const validateName = (name: string): boolean => {
    if (!name) {
      setErrors(prev => ({ ...prev, name: 'El nombre es requerido' }));
      return false;
    }
    if (name.length < 2) {
      setErrors(prev => ({ ...prev, name: 'El nombre debe tener al menos 2 caracteres' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

  const validateApellidos = (apellidos: string): boolean => {
    if (!apellidos) {
      setErrors(prev => ({ ...prev, apellidos: 'Los apellidos son requeridos' }));
      return false;
    }
    if (apellidos.length < 2) {
      setErrors(prev => ({ ...prev, apellidos: 'Los apellidos deben tener al menos 2 caracteres' }));
      return false;
    }
    setErrors(prev => ({ ...prev, apellidos: '' }));
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'El email es requerido' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'La contraseña es requerida' }));
      return false;
    }
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres' }));
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setErrors(prev => ({ 
        ...prev, 
        password: 'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula y 1 número' 
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Confirma tu contraseña' }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const validateTerms = (): boolean => {
    if (!acceptTerms) {
      setErrors(prev => ({ ...prev, terms: 'Debes aceptar los términos y condiciones' }));
      return false;
    }
    setErrors(prev => ({ ...prev, terms: '' }));
    return true;
  };

  // Manejar cambios en los campos
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar en tiempo real
    switch (field) {
      case 'name':
        validateName(value);
        break;
      case 'email':
        validateEmail(value);
        break;
      case 'password':
        validatePassword(value);
        if (formData.confirmPassword) {
          validateConfirmPassword(formData.confirmPassword, value);
        }
        break;
      case 'confirmPassword':
        validateConfirmPassword(value, formData.password);
        break;
    }
  };

  // Manejar registro con email
  const handleEmailRegister = async () => {
    const isNameValid = validateName(formData.name);
    const isApellidosValid = validateApellidos(formData.apellidos);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword, formData.password);
    const isTermsValid = validateTerms();

    if (isNameValid && isApellidosValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isTermsValid) {
      try {
        const success = await register(formData.name, formData.email, formData.password, undefined, formData.apellidos);
        if (!success) {
          Alert.alert(
            'Error en registro',
            'No se pudo crear la cuenta. Verifica que el email no esté en uso.',
            [{ text: 'Entendido' }]
          );
        }
      } catch (error: any) {
        // Si requiere validación, mostrar mensaje especial y volver a login
        if (error.message === 'REQUIRES_VALIDATION') {
          Alert.alert(
            'Cuenta creada exitosamente',
            'Tu cuenta ha sido creada. Un administrador debe validarla antes de que puedas iniciar sesión. Te notificaremos cuando tu cuenta esté lista.',
            [
              { 
                text: 'Entendido',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
          return;
        }
        
        const errorMessage = error.message || 'No se pudo crear la cuenta. Intenta nuevamente.';
        
        Alert.alert(
          'Error en registro',
          errorMessage,
          [{ text: 'Entendido' }]
        );
      }
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance type="slideInDown">
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>MC</Text>
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a nuestra comunidad para mejorar tu ciudad
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance type="fadeIn">
          <Card style={styles.card}>
            <CardContent>
              {/* Formulario de Registro */}
              <Input
                label="Nombre(s)"
                value={formData.name}
                onChangeText={(value: string) => handleInputChange('name', value)}
                error={errors.name}
                style={styles.input}
              />

              <Input
                label="Apellidos"
                value={formData.apellidos}
                onChangeText={(value: string) => handleInputChange('apellidos', value)}
                error={errors.apellidos}
                style={styles.input}
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value: string) => handleInputChange('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Input
                label="Contraseña"
                value={formData.password}
                onChangeText={(value: string) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry={!showPassword}
                onRightIconPress={() => setShowPassword(!showPassword)}
                style={styles.input}
              />

              <Input
                label="Confirmar contraseña"
                value={formData.confirmPassword}
                onChangeText={(value: string) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.input}
              />

              {/* Términos y Condiciones */}
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => {
                  setAcceptTerms(!acceptTerms);
                  if (!acceptTerms) {
                    setErrors(prev => ({ ...prev, terms: '' }));
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  Acepto los{' '}
                  <Text style={styles.termsLink}>Términos y Condiciones</Text>
                  {' '}y la{' '}
                  <Text style={styles.termsLink}>Política de Privacidad</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}

              <Button
                variant="filled"
                title="Crear Cuenta"
                onPress={handleEmailRegister}
                loading={isLoading}
                style={styles.registerButton}
                disabled={isLoading}
              />

            </CardContent>
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance type="fadeIn">
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Text style={styles.loginButtonText}>Inicia sesión aquí</Text>
            </TouchableOpacity>
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.surface.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: DESIGN_SYSTEM.SPACING.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
    marginTop: DESIGN_SYSTEM.SPACING.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DESIGN_SYSTEM.COLORS.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.base,
    elevation: 2,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.text.primary,
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  subtitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    elevation: 4,
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
  },
  cardContent: {
    padding: DESIGN_SYSTEM.SPACING.lg,
  },
  input: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  errorText: {
    color: DESIGN_SYSTEM.COLORS.error[500],
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.xs,
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
    marginLeft: DESIGN_SYSTEM.SPACING.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DESIGN_SYSTEM.SPACING.base,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[400],
    borderRadius: 4,
    marginRight: DESIGN_SYSTEM.SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    borderColor: DESIGN_SYSTEM.COLORS.primary[500],
  },
  checkmark: {
    color: DESIGN_SYSTEM.COLORS.neutral[0],
    fontSize: 12,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
  },
  termsText: {
    flex: 1,
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.text.secondary,
    lineHeight: 20,
  },
  termsLink: {
    color: DESIGN_SYSTEM.COLORS.primary[500],
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: DESIGN_SYSTEM.SPACING.lg,
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  footer: {
    alignItems: 'center',
    marginTop: DESIGN_SYSTEM.SPACING.lg,
  },
  footerText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.text.secondary,
  },
  loginButton: {
    marginTop: DESIGN_SYSTEM.SPACING.xs,
  },
  loginButtonText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.primary[500],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
