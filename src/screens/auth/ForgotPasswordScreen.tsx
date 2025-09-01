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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { Input } from '../../components/inputs/Input';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { resetPassword, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Validar email
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

  // Manejar envío de email de recuperación
  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      const success = await resetPassword(email);
      if (success) {
        setIsEmailSent(true);
        Alert.alert(
          'Email Enviado',
          'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'No se encontró una cuenta con ese email.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el email de recuperación. Inténtalo de nuevo.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance type="slideInDown">
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔑</Text>
            </View>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance type="fadeIn">
          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              {!isEmailSent ? (
                <>
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={(value: string) => {
                      setEmail(value);
                      if (emailError) {
                        validateEmail(value);
                      }
                    }}
                    error={emailError}
                    leftIcon="📧"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    placeholder="ejemplo@correo.com"
                  />

                  <Button
                    variant="filled"
                    title="Enviar Instrucciones"
                    onPress={handleForgotPassword}
                    loading={isLoading}
                    style={styles.sendButton}
                    disabled={isLoading}
                  />
                </>
              ) : (
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <Text style={styles.successIcon}>📧</Text>
                  </View>
                  <Text style={styles.successTitle}>¡Email Enviado!</Text>
                  <Text style={styles.successText}>
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </Text>
                  <View style={styles.successSteps}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <Text style={styles.stepText}>Revisa tu email</Text>
                    </View>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>2</Text>
                      </View>
                      <Text style={styles.stepText}>Haz clic en el enlace</Text>
                    </View>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>3</Text>
                      </View>
                      <Text style={styles.stepText}>Crea tu nueva contraseña</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Volver al Login</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </AnimatedEntrance>

        <AnimatedEntrance type="fadeIn">
          <Card style={styles.infoCard}>
            <CardContent>
              <View style={styles.infoHeader}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoTitle}>Información importante</Text>
              </View>
              
              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>
                    Revisa tu carpeta de spam si no recibes el email
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>
                    El enlace de recuperación expira en 24 horas
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoBullet}>•</Text>
                  <Text style={styles.infoText}>
                    Puedes solicitar un nuevo enlace si el anterior expiró
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </AnimatedEntrance>

        {/* Botón para reenviar email */}
        {isEmailSent && (
          <AnimatedEntrance type="fadeIn">
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>¿No recibiste el email?</Text>
              <Button
                variant="text"
                title="Reenviar instrucciones"
                onPress={() => {
                  setIsEmailSent(false);
                  handleForgotPassword();
                }}
                style={styles.resendButton}
              />
            </View>
          </AnimatedEntrance>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[50],
  },
  scrollContent: {
    flexGrow: 1,
    padding: DESIGN_SYSTEM.SPACING.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
    marginTop: DESIGN_SYSTEM.SPACING['2xl'],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.neutral[900],
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  subtitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: DESIGN_SYSTEM.SPACING.sm,
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
  sendButton: {
    marginTop: DESIGN_SYSTEM.SPACING.lg,
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  backButton: {
    marginTop: DESIGN_SYSTEM.SPACING.base,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.primary[500],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.SPACING.lg,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DESIGN_SYSTEM.COLORS.success[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.success[500],
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  successText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
  },
  successSteps: {
    width: '100%',
    gap: DESIGN_SYSTEM.SPACING.base,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.SPACING.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DESIGN_SYSTEM.SPACING.sm,
  },
  stepNumberText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.neutral[0],
  },
  stepText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.neutral[700],
  },
  infoCard: {
    backgroundColor: DESIGN_SYSTEM.COLORS.secondary[50],
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.COLORS.secondary[200],
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: DESIGN_SYSTEM.SPACING.sm,
  },
  infoTitle: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.semibold,
    color: DESIGN_SYSTEM.COLORS.secondary[700],
  },
  infoList: {
    gap: DESIGN_SYSTEM.SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.secondary[500],
    marginRight: DESIGN_SYSTEM.SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.secondary[700],
    lineHeight: 20,
    flex: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: DESIGN_SYSTEM.SPACING.lg,
  },
  resendText: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  resendButton: {
    // Los estilos del Button component se aplicarán automáticamente
  },
});

export default ForgotPasswordScreen;
