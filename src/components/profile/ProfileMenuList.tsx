import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DESIGN_SYSTEM from '../../theme/designSystem';

interface MenuItem {
  label: string;
  icon?: string;
  onPress: () => void;
}

interface ProfileMenuListProps {
  items: MenuItem[];
}

export const ProfileMenuList: React.FC<ProfileMenuListProps> = ({ items }) => {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.menuItem,
            index < items.length - 1 && styles.menuItemBorder
          ]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemContent}>
            {item.icon && (
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📋</Text>
              </View>
            )}
            <Text style={styles.menuLabel}>{item.label}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[0],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DESIGN_SYSTEM.SPACING.base,
    paddingHorizontal: DESIGN_SYSTEM.SPACING.sm,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.COLORS.neutral[200],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DESIGN_SYSTEM.SPACING.sm,
  },
  icon: {
    fontSize: 16,
  },
  menuLabel: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.base,
    color: DESIGN_SYSTEM.COLORS.neutral[800],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.medium,
  },
  chevron: {
    fontSize: 20,
    color: DESIGN_SYSTEM.COLORS.neutral[400],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.light,
  },
});
