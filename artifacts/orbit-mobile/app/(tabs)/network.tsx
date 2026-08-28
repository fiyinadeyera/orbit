import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { NetworkGraph } from '@/components/NetworkGraph';
import { TagPill } from '@/components/TagPill';
import {
  DEMO_THRESHOLD,
  SAMPLE_EDGES,
  SAMPLE_PEOPLE,
  type MapEdge,
  type MapPerson,
} from '@/lib/sampleNetwork';
import { useGetGraph } from '@workspace/api-client-react';

function formatDateMet(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function NetworkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const graphQuery = useGetGraph();
  const [selected, setSelected] = useState<MapPerson | null>(null);

  const realPeople: MapPerson[] = (graphQuery.data?.nodes ?? []).map((node) => ({
    id: node.id,
    name: node.name,
    initials: node.initials,
    company: node.company,
    role: null,
    location: null,
    howMet: null,
    dateMet: null,
    tags: node.tags,
    isDemo: false,
  }));
  const realEdges: MapEdge[] = (graphQuery.data?.edges ?? []).map((edge) => ({
    id: edge.id,
    aId: edge.personAId,
    bId: edge.personBId,
  }));

  // Fall back to the demo network while the user's own network is still sparse,
  // so the map never looks empty on first open.
  const isDemo = realPeople.length < DEMO_THRESHOLD;
  const people = isDemo ? SAMPLE_PEOPLE : realPeople;
  const edges = isDemo ? SAMPLE_EDGES : realEdges;

  const canvasSize = Math.min(width - 40, 420);
  const dateMet = selected ? formatDateMet(selected.dateMet) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Network</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {people.length} {people.length === 1 ? 'person' : 'people'} in your orbit
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: insets.bottom + 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={graphQuery.isRefetching}
            onRefresh={() => graphQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
          {isDemo ? (
            <View style={[styles.demoBanner, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={13} color={colors.secondaryForeground} />
              <Text style={[styles.demoBannerText, { color: colors.secondaryForeground }]}>
                Sample network. Capture a few notes to see your own.
              </Text>
            </View>
          ) : null}

          <View style={{ height: canvasSize, width: canvasSize, marginTop: 8 }}>
            <NetworkGraph
              people={people}
              edges={edges}
              size={canvasSize}
              selectedId={selected?.id ?? null}
              onSelectPerson={setSelected}
            />
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Tap a circle to see how you know them.
          </Text>
        </ScrollView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetAvatar, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                    <Text style={[styles.sheetAvatarText, { color: colors.foreground }]}>
                      {selected.initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetName, { color: colors.foreground }]}>{selected.name}</Text>
                    {selected.role || selected.company ? (
                      <Text style={[styles.sheetRole, { color: colors.mutedForeground }]}>
                        {[selected.role, selected.company].filter(Boolean).join(' at ')}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.sheetRows}>
                  {selected.howMet ? (
                    <View style={styles.sheetRow}>
                      <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.sheetRowText, { color: colors.foreground }]}>
                        {selected.howMet}
                      </Text>
                    </View>
                  ) : null}
                  {dateMet ? (
                    <View style={styles.sheetRow}>
                      <Feather name="calendar" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.sheetRowText, { color: colors.foreground }]}>
                        Met {dateMet}
                      </Text>
                    </View>
                  ) : null}
                  {selected.location ? (
                    <View style={styles.sheetRow}>
                      <Feather name="navigation" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.sheetRowText, { color: colors.foreground }]}>
                        {selected.location}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {selected.tags.length > 0 ? (
                  <View style={styles.sheetTags}>
                    {selected.tags.map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </View>
                ) : null}

                {selected.isDemo ? (
                  <Text style={[styles.sheetDemoNote, { color: colors.mutedForeground }]}>
                    Sample contact
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => {
                      const id = selected.id;
                      setSelected(null);
                      router.push(`/person/${id}`);
                    }}
                    style={({ pressed }) => [
                      styles.sheetButton,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Text style={[styles.sheetButtonText, { color: colors.primaryForeground }]}>
                      View full profile
                    </Text>
                    <Feather name="arrow-right" size={15} color={colors.primaryForeground} />
                  </Pressable>
                )}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 4,
  },
  demoBannerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 16,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  sheetName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  sheetRole: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 2,
  },
  sheetRows: {
    gap: 10,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetRowText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    flex: 1,
  },
  sheetTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetDemoNote: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  sheetButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
