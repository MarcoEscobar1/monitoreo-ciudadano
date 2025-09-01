import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import LocationSelector from '../../components/maps/LocationSelector';
import { UbicacionCompleta } from '../../types';

type LocationSelectionScreenProps = StackScreenProps<any, 'LocationSelection'>;

const LocationSelectionScreen: React.FC<LocationSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { 
    onLocationSelect, 
    initialLocation, 
    title, 
    subtitle 
  } = route.params || {};

  /**
   * Manejar selección de ubicación
   */
  const handleLocationSelect = (location: UbicacionCompleta) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    navigation.goBack();
  };

  /**
   * Manejar cancelación
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LocationSelector
        onLocationSelect={handleLocationSelect}
        onCancel={handleCancel}
        initialLocation={initialLocation}
        title={title}
        subtitle={subtitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LocationSelectionScreen;
