import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

type TagPillProps = {
  label: string;
  tone?: 'secondary' | 'accent';
  style?: ViewStyle;
};

export function TagPill({ label, tone = 'secondary', style }: TagPillProps) {
  const colors = useColors();
  const background = tone === 'accent' ? colors.accent : colors.secondary;
  const foreground = tone === 'accent' ? colors.accentForeground : colors.secondaryForeground;

  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});
