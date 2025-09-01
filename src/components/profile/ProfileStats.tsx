import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DESIGN_SYSTEM from '../../theme/designSystem';

interface Stat {
  label: string;
  value: number;
  icon?: string;
}

interface ProfileStatsProps {
  stats: Stat[];
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <View style={styles.statValueContainer}>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    marginBottom: DESIGN_SYSTEM.SPACING.lg,
  },
  statValueContainer: {
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[50],
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.SPACING.xs,
  },
  statValue: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: DESIGN_SYSTEM.TYPOGRAPHY.fontWeights.bold,
    color: DESIGN_SYSTEM.COLORS.primary[600],
  },
  statLabel: {
    fontSize: DESIGN_SYSTEM.TYPOGRAPHY.fontSizes.sm,
    color: DESIGN_SYSTEM.COLORS.neutral[600],
    textAlign: 'center',
    marginHorizontal: DESIGN_SYSTEM.SPACING.xs,
  },
});
