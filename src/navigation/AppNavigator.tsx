import React from 'react';
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
import LocationTestScreen from '../screens/test/LocationTestScreen';
import OpenStreetMapTestScreen from '../screens/test/OpenStreetMapTestScreen';
import SimpleMapTest from '../screens/test/SimpleMapTest';
import OSMMapTest from '../screens/test/OSMMapTest';
import WebMapTest from '../screens/test/WebMapTest';
import CreateReportScreen from '../screens/reports/CreateReportScreen-fixed';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';

// Constantes de colores
import DESIGN_SYSTEM from '../theme/designSystem';

// Importar contexto de autenticación
import { useAuth } from '../context/AuthContext';

// Crear navegadores
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Configuración de las pestañas principales
const getTabBarIcon = (routeName: keyof MainTabParamList, focused: boolean, size: number) => {
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

  return (
    <MaterialIcons 
      name={iconName} 
      size={size} 
      color={focused ? DESIGN_SYSTEM.COLORS.primary[500] : DESIGN_SYSTEM.COLORS.neutral[500]} 
    />
  );
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
      options={{ title: 'Detalle del Reporte' }}
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
      name="LocationTest" 
      component={LocationTestScreen}
      options={{ title: 'Prueba de Ubicación' }}
    />
    <MapStack.Screen 
      name="OpenStreetMapTest" 
      component={OpenStreetMapTestScreen}
      options={{ title: 'Prueba OpenStreetMap' }}
    />
    <MapStack.Screen 
      name="SimpleMapTest" 
      component={SimpleMapTest}
      options={{ title: 'Mapa Simple' }}
    />
    <MapStack.Screen 
      name="OSMMapTest" 
      component={OSMMapTest}
      options={{ title: 'Mapa OSM con Tiles' }}
    />
    <MapStack.Screen 
      name="WebMapTest" 
      component={WebMapTest}
      options={{ title: 'Mapa Web Leaflet' }}
    />
    <MapStack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ title: 'Detalle del Reporte' }}
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
  </ProfileStack.Navigator>
);

// Navegador de pestañas principales
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => getTabBarIcon(route.name, focused, size),
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
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoading ? (
        <RootStack.Screen name="Loading" component={LoadingScreen} />
      ) : isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
