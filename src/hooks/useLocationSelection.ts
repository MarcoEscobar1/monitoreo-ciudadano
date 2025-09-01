import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { UbicacionCompleta, Coordenada } from '../types';

interface UseLocationSelectionOptions {
  title?: string;
  subtitle?: string;
  initialLocation?: Coordenada;
}

interface UseLocationSelectionResult {
  selectedLocation: UbicacionCompleta | null;
  openLocationSelector: () => void;
  clearLocation: () => void;
  setLocation: (location: UbicacionCompleta) => void;
}

export const useLocationSelection = (
  options: UseLocationSelectionOptions = {}
): UseLocationSelectionResult => {
  const navigation = useNavigation();
  const [selectedLocation, setSelectedLocation] = useState<UbicacionCompleta | null>(null);

  const openLocationSelector = useCallback(() => {
    (navigation as any).navigate('LocationSelection', {
      onLocationSelect: (location: UbicacionCompleta) => {
        setSelectedLocation(location);
      },
      initialLocation: options.initialLocation,
      title: options.title || 'Selecciona la ubicación',
      subtitle: options.subtitle || 'Toca en el mapa o arrastra el marcador para seleccionar la ubicación exacta',
    });
  }, [navigation, options]);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  const setLocation = useCallback((location: UbicacionCompleta) => {
    setSelectedLocation(location);
  }, []);

  return {
    selectedLocation,
    openLocationSelector,
    clearLocation,
    setLocation,
  };
};

export default useLocationSelection;
