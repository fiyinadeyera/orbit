import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Avatar } from '@/components/Avatar';
import { TagPill } from '@/components/TagPill';
import { joinTruthy } from '@/lib/utils';

type PersonSummary = {
  id: string;
  name: string;
  company?: string | null;
  role?: string | null;
  tags?: string[];
};

type PersonListItemProps = {
  person: PersonSummary;
  subtitle?: string;
  trailingLabel?: string;
  trailingSublabel?: string;
  showTags?: boolean;
  onPress: () => void;
};

export function PersonListItem({
  person,
  subtitle,
  trailingLabel,
  trailingSublabel,
  showTags = true,
  onPress,
}: PersonListItemProps) {
  const colors = useColors();
  const roleLine = joinTruthy([person.role, person.company], ' at ');
  const line = subtitle ?? roleLine;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Avatar name={person.name} size={46} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {person.name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {line || 'New connection'}
        </Text>
        {showTags && person.tags && person.tags.length > 0 ? (
          <View style={styles.tags}>
            {person.tags.slice(0, 3).map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </View>
        ) : null}
      </View>
      {trailingLabel ? (
        <View style={styles.trailing}>
          <Text style={[styles.trailingLabel, { color: colors.accent }]}>{trailingLabel}</Text>
          {trailingSublabel ? (
            <Text style={[styles.trailingSublabel, { color: colors.mutedForeground }]}>
              {trailingSublabel}
            </Text>
          ) : null}
        </View>
      ) : (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  trailingLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  trailingSublabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
});
