import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getListIntrosQueryKey,
  useListIntros,
  type IntroSuggestion,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';

const FIVE_MINUTES = 5 * 60 * 1000;

function Party({
  party,
  color,
  muted,
}: {
  party: IntroSuggestion['personA'];
  color: string;
  muted: string;
}) {
  const line = [party.role, party.company].filter(Boolean).join(' at ');
  return (
    <Pressable style={styles.party} onPress={() => router.push(`/person/${party.id}`)}>
      <Text style={[styles.partyName, { color }]} numberOfLines={1}>
        {party.name}
      </Text>
      {line ? (
        <Text style={[styles.partyMeta, { color: muted }]} numberOfLines={1}>
          {line}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function IntrosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const introsQuery = useListIntros({
    query: {
      queryKey: getListIntrosQueryKey(),
      staleTime: FIVE_MINUTES,
      gcTime: FIVE_MINUTES,
    },
  });
  const intros = introsQuery.data ?? [];

  const copyIntro = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('Intro copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy.', 'error');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Introductions</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Connections worth making, ranked by mutual value.
            </Text>
          </View>
          <Pressable
            onPress={() => introsQuery.refetch()}
            disabled={introsQuery.isFetching}
            style={({ pressed }) => [
              styles.refresh,
              { backgroundColor: colors.secondary, opacity: introsQuery.isFetching ? 0.5 : pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Refresh introductions"
          >
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {introsQuery.isLoading ? (
        <View style={styles.list}>
          <Skeleton style={{ height: 150, borderRadius: 14 }} />
          <View style={{ height: 12 }} />
          <Skeleton style={{ height: 150, borderRadius: 14 }} />
        </View>
      ) : introsQuery.isError ? (
        <View style={styles.centered}>
          <EmptyState
            icon="alert-circle"
            title="Couldn't load introductions"
            description="Something went wrong. Pull to refresh to try again."
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 110 },
            intros.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={introsQuery.isFetching}
              onRefresh={() => introsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {intros.length === 0 ? (
            <EmptyState
              icon="users"
              title="No introductions yet"
              description="Add more people, especially what they're working on or looking for, and Orbit will spot connections worth making."
            />
          ) : (
            intros.map((intro) => (
              <View
                key={`${intro.personA.id}-${intro.personB.id}`}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <Party party={intro.personA} color={colors.foreground} muted={colors.mutedForeground} />
                  <Feather name="repeat" size={15} color={colors.mutedForeground} style={styles.arrow} />
                  <Party party={intro.personB} color={colors.foreground} muted={colors.mutedForeground} />
                  <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{intro.score}</Text>
                  </View>
                </View>

                {intro.rationale ? (
                  <Text style={[styles.rationale, { color: colors.foreground }]}>{intro.rationale}</Text>
                ) : null}

                {intro.draftIntro ? (
                  <View style={[styles.draft, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.draftText, { color: colors.mutedForeground }]}>
                      {intro.draftIntro}
                    </Text>
                    <Pressable
                      onPress={() => copyIntro(intro.draftIntro)}
                      style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Feather name="copy" size={14} color={colors.primary} />
                      <Text style={[styles.copyText, { color: colors.primary }]}>Copy intro</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12.5, marginTop: 2 },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingTop: 12, flexGrow: 1 },
  listEmpty: { justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  party: { flex: 1, minWidth: 0 },
  partyName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  partyMeta: { fontFamily: 'Inter_400Regular', fontSize: 11.5, marginTop: 1 },
  arrow: { marginHorizontal: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  rationale: { fontFamily: 'Inter_400Regular', fontSize: 13.5, lineHeight: 19 },
  draft: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  draftText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  copyText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
