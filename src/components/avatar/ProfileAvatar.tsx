import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import DESIGN_SYSTEM from '../../theme/designSystem';

interface ProfileAvatarProps {
  size?: number;
  uri?: string;
  name: string;
  style?: ViewStyle;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = 80,
  uri,
  name,
  style,
}) => {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, avatarStyle, style as ImageStyle]}
      />
    );
  }

  return (
    <View style={[styles.avatarPlaceholder, avatarStyle, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: DESIGN_SYSTEM.COLORS.neutral[200],
  },
  avatarPlaceholder: {
    backgroundColor: DESIGN_SYSTEM.COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: DESIGN_SYSTEM.COLORS.neutral[0],
    fontWeight: '600',
    fontFamily: DESIGN_SYSTEM.TYPOGRAPHY.fontFamilies.body,
  },
});
