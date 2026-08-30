import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { TagPill } from '@/components/TagPill';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { formatDate, joinTruthy, todayIsoDate } from '@/lib/utils';
import {
  getGetPersonQueryKey,
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
  useCreateInteraction,
  useDeletePerson,
  useGetPerson,
} from '@workspace/api-client-react';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [note, setNote] = useState('');

  const personQuery = useGetPerson(id);
  const deletePerson = useDeletePerson();
  const createInteraction = useCreateInteraction();

  const person = personQuery.data;

  const performDelete = () => {
    if (!person) return;
    deletePerson.mutate(
      { id: person.id },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
          router.back();
        },
        onError: () => showToast("Couldn't delete this person — try again", 'error'),
      },
    );
  };

  const handleDelete = () => {
    if (!person) return;
    // React Native's Alert.alert is a no-op on web (react-native-web has no
    // implementation), so branch to window.confirm there to keep delete
    // working across native and the Expo web target.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Remove ${person.name} and their history?`)) {
        performDelete();
      }
      return;
    }
    Alert.alert('Remove connection?', `This will permanently delete ${person.name} and their history.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: performDelete },
    ]);
  };

  const handleAddInteraction = () => {
    const trimmed = note.trim();
    if (!trimmed || !person || createInteraction.isPending) return;

    createInteraction.mutate(
      { id: person.id, data: { summary: trimmed, date: todayIsoDate() } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNote('');
          queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(person.id) });
          queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
          showToast('Interaction logged');
        },
        onError: () => showToast("Couldn't log that interaction — try again", 'error'),
      },
    );
  };

  if (personQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (personQuery.isError || !person) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          This person could not be found.
        </Text>
      </View>
    );
  }

  const roleLine = joinTruthy([person.role, person.company], ' at ');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: person.name,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push(`/person-form?id=${person.id}`)}
                hitSlop={8}
                style={styles.headerButton}
              >
                <Feather name="edit-2" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8} style={styles.headerButton}>
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          ),
        }}
      />

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 60, gap: 22 }}
        refreshControl={
          <RefreshControl
            refreshing={personQuery.isRefetching}
            onRefresh={() => personQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.profileHeader}>
          <Avatar name={person.name} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{person.name}</Text>
            {roleLine ? (
              <Text style={[styles.role, { color: colors.mutedForeground }]}>{roleLine}</Text>
            ) : null}
            {person.location ? (
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {person.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {person.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {person.tags.map((tag) => (
              <TagPill key={tag} label={tag} tone="accent" />
            ))}
          </View>
        ) : null}

        {(person.howMet || person.notes || person.dateMet || person.lookingFor) && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Context</Text>
            {person.lookingFor ? (
              <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                <Text style={{ color: colors.foreground }}>Looking for: </Text>
                {person.lookingFor}
              </Text>
            ) : null}
            {person.howMet ? (
              <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                <Text style={{ color: colors.foreground }}>How you met: </Text>
                {person.howMet}
              </Text>
            ) : null}
            {person.dateMet ? (
              <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                <Text style={{ color: colors.foreground }}>Met on: </Text>
                {formatDate(person.dateMet)}
              </Text>
            ) : null}
            {person.notes ? (
              <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{person.notes}</Text>
            ) : null}
          </View>
        )}

        {person.connections.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Connections</Text>
            <View style={{ gap: 8 }}>
              {person.connections.map((connection) => (
                <View
                  key={connection.id}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {connection.relationshipType}
                  </Text>
                  {connection.notes ? (
                    <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                      {connection.notes}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Log an interaction</Text>
          <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What happened, and when?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              style={[styles.composerInput, { color: colors.foreground }]}
            />
            <Pressable
              onPress={handleAddInteraction}
              disabled={!note.trim() || createInteraction.isPending}
              style={({ pressed }) => [
                styles.composerButton,
                {
                  backgroundColor: colors.primary,
                  opacity: !note.trim() || createInteraction.isPending ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {createInteraction.isPending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Feather name="plus" size={16} color={colors.primaryForeground} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text>
          {person.interactions.length === 0 ? (
            <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
              No interactions logged yet.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {[...person.interactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((interaction) => (
                  <View
                    key={interaction.id}
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.timelineHeader}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                        {interaction.summary}
                      </Text>
                      <Text style={[styles.timelineDate, { color: colors.mutedForeground }]}>
                        {formatDate(interaction.date)}
                      </Text>
                    </View>
                    {interaction.rawNote ? (
                      <Text style={[styles.rawNote, { color: colors.mutedForeground }]}>
                        “{interaction.rawNote}”
                      </Text>
                    ) : null}
                  </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 18,
  },
  headerButton: {
    padding: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
  },
  role: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  cardText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  composer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  composerInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
  },
  composerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
  },
  rawNote: {
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
  },
});
