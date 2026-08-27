import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { PersonListItem } from '@/components/PersonListItem';
import { Skeleton } from '@/components/Skeleton';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import {
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
  useConfirmCapture,
  useExtractCapture,
  useListPeople,
  useListReconnects,
} from '@workspace/api-client-react';

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [note, setNote] = useState('');

  const reconnectsQuery = useListReconnects();
  const peopleQuery = useListPeople();
  // Capture is a two-step API: extract runs the note through Claude, then
  // confirm persists the (here, unedited) fields. The screen keeps a single
  // one-tap flow by chaining them, so the UX is unchanged from the user's side.
  const extractCapture = useExtractCapture();
  const confirmCapture = useConfirmCapture();
  const isCapturing = extractCapture.isPending || confirmCapture.isPending;

  const invalidateAfterCapture = () => {
    queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
  };

  const failCapture = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showToast("Couldn't save that note. Try again.", 'error');
  };

  const handleCapture = () => {
    const trimmed = note.trim();
    if (!trimmed || isCapturing) return;

    extractCapture.mutate(
      { data: { note: trimmed } },
      {
        onSuccess: ({ extracted, rawNote }) => {
          confirmCapture.mutate(
            {
              data: {
                name: extracted.name,
                company: extracted.company ?? undefined,
                role: extracted.role ?? undefined,
                location: extracted.location ?? undefined,
                context: extracted.context ?? undefined,
                interests: extracted.interests,
                connectedTo: extracted.connectedTo,
                status: extracted.status ?? undefined,
                date: extracted.date,
                rawNote,
              },
            },
            {
              onSuccess: (result) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setNote('');
                invalidateAfterCapture();
                showToast(
                  result.created
                    ? `Added ${result.person.name} to your network`
                    : `Logged an update for ${result.person.name}`,
                );
              },
              onError: failCapture,
            },
          );
        },
        onError: failCapture,
      },
    );
  };

  const refreshing = reconnectsQuery.isRefetching || peopleQuery.isRefetching;
  const onRefresh = () => {
    reconnectsQuery.refetch();
    peopleQuery.refetch();
  };

  const recentPeople = (peopleQuery.data ?? []).slice(0, 4);
  const reconnects = (reconnectsQuery.data ?? []).slice(0, 4);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: colors.foreground }]}>Orbit</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Relationship Intelligence
          </Text>
        </View>

        <View style={[styles.composerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.composerLabel, { color: colors.mutedForeground }]}>
            Capture a moment
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ran into Maya at the conference, she just started a new role at..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            style={[styles.composerInput, { color: colors.foreground }]}
          />
          <Pressable
            onPress={handleCapture}
            disabled={!note.trim() || isCapturing}
            style={({ pressed }) => [
              styles.captureButton,
              {
                backgroundColor: colors.primary,
                opacity: !note.trim() || isCapturing ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="send" size={15} color={colors.primaryForeground} />
                <Text style={[styles.captureButtonText, { color: colors.primaryForeground }]}>
                  Save note
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Time to reconnect</Text>
          {reconnectsQuery.isLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton style={{ height: 74 }} />
              <Skeleton style={{ height: 74 }} />
            </View>
          ) : reconnects.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="You're all caught up"
              description="No one is overdue for a reconnect right now."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {reconnects.map((prompt) => (
                <PersonListItem
                  key={prompt.person.id}
                  person={prompt.person}
                  subtitle={
                    prompt.lastInteraction ?? `${prompt.daysSinceContact} days since last contact`
                  }
                  trailingLabel={`${prompt.daysSinceContact}d`}
                  trailingSublabel="since contact"
                  showTags={false}
                  onPress={() => router.push(`/person/${prompt.person.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent connections
            </Text>
            <Pressable onPress={() => router.push('/people')} hitSlop={8}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View all</Text>
            </Pressable>
          </View>
          {peopleQuery.isLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton style={{ height: 74 }} />
              <Skeleton style={{ height: 74 }} />
            </View>
          ) : recentPeople.length === 0 ? (
            <EmptyState
              icon="users"
              title="No connections yet"
              description="Capture a note above to start building your network."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {recentPeople.map((person) => (
                <PersonListItem
                  key={person.id}
                  person={person}
                  onPress={() => router.push(`/person/${person.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 26,
  },
  header: {
    gap: 2,
  },
  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
  },
  tagline: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  composerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  composerLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12.5,
  },
  composerInput: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    minHeight: 76,
    lineHeight: 21,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  captureButtonText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 19,
  },
  viewAll: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
});
