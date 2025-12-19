import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DESIGN_SYSTEM from '../../theme/designSystem';
import { AnimatedEntrance } from '../../components/animated/AnimatedEntrance';
import { Card, CardHeader, CardContent, StatCard } from '../../components/cards/Card';
import { Button } from '../../components/buttons/Button';
import { ProfileAvatar } from '../../components/avatar/ProfileAvatar';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  
  // Datos del usuario desde el contexto de autenticación
  const userData = {
    fullName: user?.nombre && user?.apellidos 
      ? `${user.nombre} ${user.apellidos}`
      : user?.nombre || 'Usuario',
    email: user?.email || 'email@ejemplo.com',
    phone: user?.telefono || 'No especificado',
    address: user?.direccion || 'Dirección no configurada',
    avatar: user?.avatar_url, // URL de la imagen de perfil
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar tu sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Iniciando logout desde ProfileScreen...');
              await logout();
              console.log('✅ Logout completado, navegación automática al login');
            } catch (error) {
              console.error('❌ Error en logout:', error);
              Alert.alert(
                '❌ Error',
                'Hubo un problema al cerrar sesión. Se cerrará la sesión localmente.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_SYSTEM.COLORS.neutral[50]} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <AnimatedEntrance type="slideInDown">
        <View style={styles.header}>
          <ProfileAvatar 
            size={120}
            uri={userData.avatar}
            name={userData.fullName}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userData.fullName}</Text>
          <Text style={styles.email}>{userData.email}</Text>
          <Text style={styles.phone}>{userData.phone}</Text>
          <Text style={styles.address}>{userData.address}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Ciudadano Verificado</Text>
            </View>
          </View>
        </View>
      </AnimatedEntrance>

      <View style={styles.content}>
        <AnimatedEntrance type="fadeIn">
          <View style={styles.actionButtons}>
            <Button              variant="filled"
              title="Editar perfil"
              onPress={() => navigation.navigate('EditProfile' as never)}
              style={styles.editButton}
            />
            <Button              variant="outlined"
              title="Cerrar sesión"
              onPress={handleLogout}
              style={styles.logoutButton}
              textStyle={styles.logoutButtonText}
            />
          </View>
        </AnimatedEntrance>
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
  },
  header: {
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    paddingVertical: DESIGN_SYSTEM.SPACING['3xl'],
    paddingHorizontal: DESIGN_SYSTEM.SPACING.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
    borderWidth: 4,
    borderColor: DESIGN_SYSTEM.COLORS.neutral[0],
  },
  name: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.neutral[0],
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  email: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.primary[100],
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  phone: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.primary[200],
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  address: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.primary[200],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  badgeContainer: {
    marginTop: DESIGN_SYSTEM.SPACING.sm,
  },
  badge: {
    backgroundColor: DESIGN_SYSTEM.COLORS.success[500],
    paddingHorizontal: DESIGN_SYSTEM.SPACING.base,
    paddingVertical: DESIGN_SYSTEM.SPACING.xs,
    borderRadius: 20,
  },
  badgeText: {
    color: DESIGN_SYSTEM.COLORS.neutral[0],
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
  },
  sectionCard: {
    marginBottom: DESIGN_SYSTEM.SPACING.base,
  },
  actionButtons: {
    marginTop: DESIGN_SYSTEM.SPACING.lg,
    marginBottom: DESIGN_SYSTEM.SPACING['2xl'],
    gap: DESIGN_SYSTEM.SPACING.base,
  },
  editButton: {
    marginBottom: DESIGN_SYSTEM.SPACING.sm,
  },
  logoutButton: {
    borderColor: DESIGN_SYSTEM.COLORS.error[500],
    borderWidth: 2,
  },
  logoutButtonText: {
    color: DESIGN_SYSTEM.COLORS.error[500],
  },
});

export default ProfileScreen;
