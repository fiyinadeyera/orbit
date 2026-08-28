import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Source = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  href?: Href;
  soon?: boolean;
};

const SOURCES: Source[] = [
  {
    icon: 'smartphone',
    title: 'Phone contacts',
    subtitle: 'Pick from the contacts already on your phone.',
    href: '/import-contacts' as Href,
  },
  {
    icon: 'mail',
    title: 'Google contacts',
    subtitle: 'Sign in with Google and choose who to add.',
    href: '/import-google' as Href,
  },
  {
    icon: 'linkedin',
    title: 'LinkedIn',
    subtitle: 'Import from a LinkedIn connections export.',
    href: '/import-linkedin' as Href,
  },
];

export default function ImportHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.close}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Add people</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.lead, { color: colors.mutedForeground }]}>
          Bring your network into Orbit. You always choose who gets added.
        </Text>

        {SOURCES.map((source) => (
          <Pressable
            key={source.title}
            disabled={source.soon || !source.href}
            onPress={() => source.href && router.push(source.href)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: source.soon ? 0.55 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}>
              <Feather name={source.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {source.title}
                {source.soon ? '  ·  Soon' : ''}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                {source.subtitle}
              </Text>
            </View>
            {!source.soon && <Feather name="chevron-right" size={20} color={colors.mutedForeground} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: { padding: 4 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  body: { padding: 20, gap: 12 },
  lead: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12.5, marginTop: 2, lineHeight: 17 },
});
