/**
 * LoginScreen Actualizado - FASE 7
 * Pantalla de login con animaciones y nuevos componentes
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Importar nuevos componentes de FASE 7
import { AnimatedEntrance, AnimatedListItem } from '../../components/animated/AnimatedEntrance';
import { Button } from '../../components/buttons/Button';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import DESIGN_SYSTEM from '../../theme/designSystem';

import { useAuth } from '../../context/AuthContext';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ================================
  // VALIDACIONES
  // ================================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('El email es requerido');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Formato de email inválido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('La contraseña es requerida');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // ================================
  // HANDLERS
  // ================================

  const handleLogin = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    if (!emailValid || !passwordValid) {
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert(
          'Error de autenticación',
          'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales e intenta nuevamente.',
          [{ text: 'Entendido' }]
        );
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      
      // Si la cuenta está pendiente de validación
      if (error.message === 'ACCOUNT_PENDING_VALIDATION') {
        Alert.alert(
          'Cuenta pendiente de validación',
          'Tu cuenta está esperando aprobación del administrador. Te notificaremos cuando puedas iniciar sesión.',
          [{ text: 'Entendido' }]
        );
        return;
      }
      
      const errorMessage = error.message || 'Usuario o contraseña incorrectos';
      
      Alert.alert(
        'Error de autenticación',
        errorMessage,
        [{ text: 'Entendido' }]
      );
    }
  };



  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  // ================================
  // RENDER
  // ================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Header con logo y título */}
        <AnimatedEntrance type="fadeIn" config={{ duration: 800 }}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/escudo-bolivia.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text variant="headlineMedium" style={styles.title}>
              Monitoreo Ciudadano
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Inicia sesión para reportar problemas en tu ciudad
            </Text>
          </View>
        </AnimatedEntrance>

        {/* Formulario de login */}
        <AnimatedEntrance type="slideInUp" config={{ duration: 600, delay: 200 }}>
          <Card variant="elevated" size="large" style={styles.formCard}>
            <CardHeader title="Iniciar Sesión" />
            <CardContent>
              <View style={styles.form}>
                <AnimatedListItem index={0} staggerDelay={100}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Correo electrónico"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                      }}
                      mode="outlined"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      error={!!emailError}
                      style={styles.input}
                      left={<TextInput.Icon icon="email" />}
                    />
                    {emailError ? (
                      <Text variant="bodySmall" style={styles.errorText}>
                        {emailError}
                      </Text>
                    ) : null}
                  </View>
                </AnimatedListItem>

                <AnimatedListItem index={1} staggerDelay={100}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Contraseña"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                      }}
                      mode="outlined"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      error={!!passwordError}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                    />
                    {passwordError ? (
                      <Text variant="bodySmall" style={styles.errorText}>
                        {passwordError}
                      </Text>
                    ) : null}
                  </View>
                </AnimatedListItem>

                <AnimatedListItem index={2} staggerDelay={100}>
                  <Button
                    title={isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    onPress={handleLogin}
                    variant="filled"
                    color="primary"
                    size="large"
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.loginButton}
                    icon={isLoading ? undefined : <MaterialIcons name="login" size={20} color="white" />}
                  />
                </AnimatedListItem>

                <AnimatedListItem index={3} staggerDelay={100}>
                  <Button
                    title="¿Olvidaste tu contraseña?"
                    onPress={handleForgotPassword}
                    variant="text"
                    color="primary"
                    size="medium"
                    style={styles.forgotButton}
                  />
                </AnimatedListItem>
              </View>
            </CardContent>
          </Card>
        </AnimatedEntrance>

        {/* Registro */}
        <AnimatedEntrance type="fadeIn" config={{ duration: 400, delay: 600 }}>
          <View style={styles.registerContainer}>
            <Text variant="bodyMedium" style={styles.registerText}>
              ¿No tienes cuenta?
            </Text>
            <Button
              title="Regístrate aquí"
              onPress={handleRegister}
              variant="text"
              color="primary"
              size="medium"
              style={styles.registerButton}
            />
          </View>
        </AnimatedEntrance>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ================================
// ESTILOS
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    padding: DESIGN_SYSTEM.SPACING.base,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.xl,
  },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  logoImage: {
    width: 60,
    height: 60,
  },

  title: {
    color: DESIGN_SYSTEM.COLORS.neutral[800],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },

  subtitle: {
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },

  formCard: {
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
  },

  form: {
    gap: DESIGN_SYSTEM.SPACING.base,
  },

  inputContainer: {
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },

  input: {
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[100],
  },

  errorText: {
    color: DESIGN_SYSTEM.COLORS.error[500],
    marginTop: DESIGN_SYSTEM.SPACING.xs,
    marginLeft: DESIGN_SYSTEM.SPACING.sm,
  },

  loginButton: {
    marginTop: DESIGN_SYSTEM.SPACING.sm,
  },

  forgotButton: {
    alignSelf: 'center',
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.SPACING.xs,
  },

  registerText: {
    color: DESIGN_SYSTEM.COLORS.neutral[600],
  },

  registerButton: {
    minWidth: 'auto',
  },

  bottomSpacing: {
    height: 40,
  },
});

export default LoginScreen;
