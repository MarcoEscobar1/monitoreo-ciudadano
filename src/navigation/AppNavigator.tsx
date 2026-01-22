import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importar tipos de navegación
import { 
  RootStackParamList, 
  AuthStackParamList, 
  MainTabParamList, 
  HomeStackParamList, 
  MapStackParamList, 
  ProfileStackParamList 
} from '../types';

// Importar pantallas usando rutas relativas
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MapScreen from '../screens/map/MapScreen';
import LocationSelectionScreen from '../screens/map/LocationSelectionScreen';
import CreateReportScreen from '../screens/reports/CreateReportScreen-fixed';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';

// Importar pantallas de administración
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import PendingReportsScreen from '../screens/admin/PendingReportsScreen';
import { PendingUsersScreen } from '../screens/admin/PendingUsersScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import CategoryManagementScreen from '../screens/admin/CategoryManagementScreen';
import ReportsByCategoryScreen from '../screens/admin/ReportsByCategoryScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

// Constantes de colores
import DESIGN_SYSTEM from '../theme/designSystem';

// Importar contextos
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAdminBadges } from '../context/AdminBadgeContext';

// Crear navegadores
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const AdminTabs = createBottomTabNavigator();
const AdminStack = createStackNavigator();
const HomeStack = createStackNavigator<HomeStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Configuración de las pestañas principales
const getTabBarIcon = (routeName: keyof MainTabParamList, focused: boolean, size: number, unreadCount?: number) => {
  let iconName: keyof typeof MaterialIcons.glyphMap = 'home';

  switch (routeName) {
    case 'Home':
      iconName = 'home';
      break;
    case 'Map':
      iconName = 'map';
      break;
    case 'CreateReport':
      iconName = 'add-circle';
      break;
    case 'Notifications':
      iconName = 'notifications';
      break;
    case 'Profile':
      iconName = 'person';
      break;
  }

  const icon = (
    <MaterialIcons 
      name={iconName} 
      size={size} 
      color={focused ? DESIGN_SYSTEM.COLORS.primary[500] : DESIGN_SYSTEM.COLORS.neutral[500]} 
    />
  );

  // Agregar badge solo para notificaciones
  if (routeName === 'Notifications' && unreadCount && unreadCount > 0) {
    return (
      <View style={{ position: 'relative' }}>
        {icon}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      </View>
    );
  }

  return icon;
};

// Configuración de las pestañas de administrador con badges
const getAdminTabBarIcon = (
  routeName: string, 
  focused: boolean, 
  size: number, 
  pendingReportsCount?: number,
  pendingUsersCount?: number
) => {
  let iconName: keyof typeof MaterialIcons.glyphMap = 'dashboard';
  let badgeCount = 0;

  switch (routeName) {
    case 'AdminDashboard':
      iconName = 'dashboard';
      break;
    case 'PendingReports':
      iconName = 'assignment';
      badgeCount = pendingReportsCount || 0;
      break;
    case 'PendingUsers':
      iconName = 'person-add';
      badgeCount = pendingUsersCount || 0;
      break;
    case 'UserManagement':
      iconName = 'people';
      break;
    case 'AdminProfile':
      iconName = 'person';
      break;
  }

  const icon = (
    <MaterialIcons 
      name={iconName} 
      size={size} 
      color={focused ? DESIGN_SYSTEM.COLORS.primary[500] : DESIGN_SYSTEM.COLORS.neutral[500]} 
    />
  );

  // Agregar badge si hay items pendientes
  if (badgeCount > 0) {
    return (
      <View style={{ position: 'relative' }}>
        {icon}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      </View>
    );
  }

  return icon;
};

// Stack de Home
const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <HomeStack.Screen 
      name="HomeScreen" 
      component={HomeScreen}
      options={{ title: 'Inicio' }}
    />
    <HomeStack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ 
        title: 'Detalle del Reporte',
        headerLeft: () => null 
      }}
    />
  </HomeStack.Navigator>
);

// Stack de Mapa
const MapStackNavigator = () => (
  <MapStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <MapStack.Screen 
      name="MapScreen" 
      component={MapScreen}
      options={{ title: 'Mapa' }}
    />
    <MapStack.Screen 
      name="LocationSelection" 
      component={LocationSelectionScreen}
      options={{ title: 'Seleccionar Ubicación' }}
    />
    <MapStack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ 
        title: 'Detalle del Reporte',
        headerLeft: () => null 
      }}
    />
  </MapStack.Navigator>
);

// Stack de Perfil
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ProfileStack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen}
      options={{ title: 'Mi Perfil' }}
    />
    <ProfileStack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ title: 'Editar Perfil' }}
    />
  </ProfileStack.Navigator>
);

// Navegador de pestañas principales
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => getTabBarIcon(route.name, focused, size, unreadCount),
        tabBarActiveTintColor: DESIGN_SYSTEM.COLORS.primary[500],
        tabBarInactiveTintColor: DESIGN_SYSTEM.COLORS.neutral[500],
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: DESIGN_SYSTEM.COLORS.neutral[200],
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: Math.max(60, 60 + insets.bottom),
        },
        headerShown: false,
      })}
    >
    <MainTabs.Screen 
      name="Home" 
      component={HomeStackNavigator}
      options={{ title: 'Inicio' }}
    />
    <MainTabs.Screen 
      name="Map" 
      component={MapStackNavigator}
      options={{ title: 'Mapa' }}
    />
    <MainTabs.Screen 
      name="CreateReport" 
      component={CreateReportScreen}
      options={{ 
        title: 'Reportar',
        headerShown: true,
        headerStyle: {
          backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
        },
        headerTintColor: '#FFFFFF',
        headerTitle: 'Crear Reporte',
      }}
    />
    <MainTabs.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{ 
        title: 'Notificaciones',
        headerShown: true,
        headerStyle: {
          backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
        },
        headerTintColor: '#FFFFFF',
        headerTitle: 'Notificaciones',
      }}
    />
    <MainTabs.Screen 
      name="Profile" 
      component={ProfileStackNavigator}
      options={{ title: 'Perfil' }}
    />
  </MainTabs.Navigator>
  );
};

// Navegador de pestañas para administradores
const AdminTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { pendingReportsCount, pendingUsersCount } = useAdminBadges();
  
  return (
    <AdminTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => getAdminTabBarIcon(
          route.name, 
          focused, 
          size, 
          pendingReportsCount, 
          pendingUsersCount
        ),
        tabBarActiveTintColor: DESIGN_SYSTEM.COLORS.primary[500],
        tabBarInactiveTintColor: DESIGN_SYSTEM.COLORS.neutral[500],
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: DESIGN_SYSTEM.COLORS.neutral[200],
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: Math.max(60, 60 + insets.bottom),
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <AdminTabs.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <AdminTabs.Screen 
        name="PendingReports" 
        component={PendingReportsScreen}
        options={{ title: 'Validar' }}
      />
      <AdminTabs.Screen 
        name="PendingUsers" 
        component={PendingUsersScreen}
        options={{ title: 'Cuentas' }}
      />
      <AdminTabs.Screen 
        name="UserManagement" 
        component={UserManagementScreen}
        options={{ title: 'Usuarios' }}
      />
      <AdminTabs.Screen 
        name="AdminProfile" 
        component={AdminProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </AdminTabs.Navigator>
  );
};

// Stack Navigator para Admin con pantallas adicionales
const AdminStackNavigator = () => (
  <AdminStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <AdminStack.Screen 
      name="AdminTabs" 
      component={AdminTabNavigator}
      options={{ headerShown: false }}
    />
    <AdminStack.Screen 
      name="CategoryManagement" 
      component={CategoryManagementScreen}
      options={{ title: 'Gestionar Categorías' }}
    />
    <AdminStack.Screen 
      name="ReportsByCategory" 
      component={ReportsByCategoryScreen}
      options={{ title: 'Reportes por Categoría' }}
    />
  </AdminStack.Navigator>
);

// Navegador de autenticación
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <AuthStack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ headerShown: false }}
    />
    <AuthStack.Screen 
      name="ForgotPassword" 
      component={ForgotPasswordScreen}
      options={{ 
        title: 'Recuperar Contraseña',
      }}
    />
  </AuthStack.Navigator>
);

// Navegador principal de la aplicación
const AppNavigator = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Determinar si el usuario es administrador o moderador
  const isAdmin = user?.tipo_usuario === 'ADMINISTRADOR' || user?.tipo_usuario === 'MODERADOR';

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoading ? (
        <RootStack.Screen name="Loading" component={LoadingScreen} />
      ) : isAuthenticated ? (
        <>
          {isAdmin ? (
            <RootStack.Screen name="Admin" component={AdminStackNavigator} />
          ) : (
            <RootStack.Screen name="Main" component={MainTabNavigator} />
          )}
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
