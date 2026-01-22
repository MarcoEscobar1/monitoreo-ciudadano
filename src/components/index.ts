/**
 * Índice principal de componentes - FASE 7
 * Exportaciones centralizadas para el nuevo sistema de diseño
 */

// ================================
// SISTEMA DE DISEÑO
// ================================
export { default as designSystem } from '../theme/designSystem';

// ================================
// COMPONENTES ANIMADOS
// ================================
export {
  AnimatedEntrance,
  CustomAnimated,
  AnimatedListItem,
  AnimatedPulse,
  useAnimatedValue,
  useAnimatedSequence,
} from './animated/AnimatedEntrance';

// ================================
// BOTONES
// ================================
export {
  Button,
  FloatingActionButton,
  ButtonGroup,
} from './buttons/Button';

// ================================
// TARJETAS
// ================================
export {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  StatCard,
  ListCard,
} from './cards/Card';

// ================================
// MAPAS
// ================================
export { LocationSelectorMap } from './maps/LocationSelectorMap';

// ================================
// NAVEGACIÓN
// ================================
export {
  AnimatedTabBar,
  FloatingTabBar,
  SegmentedControl,
} from './navigation/AnimatedNavigation';

// ================================
// PANTALLAS PRINCIPALES
// ================================
export { Dashboard } from './dashboard/Dashboard';
export { ReportDetail } from './reports/ReportDetail';
