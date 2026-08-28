import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/Toast';
import { TextField } from '@/components/TextField';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import {
  getGetPersonQueryKey,
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
  useCreatePerson,
  useGetPerson,
  useUpdatePerson,
} from '@workspace/api-client-react';

export default function PersonFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const personQuery = useGetPerson(id ?? '', {
    query: { enabled: isEditing, queryKey: getGetPersonQueryKey(id ?? '') },
  });
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const isPending = createPerson.isPending || updatePerson.isPending;

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [howMet, setHowMet] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isEditing && personQuery.data && !hydrated) {
      const person = personQuery.data;
      setName(person.name);
      setRole(person.role ?? '');
      setCompany(person.company ?? '');
      setLocation(person.location ?? '');
      setHowMet(person.howMet ?? '');
      setTags(person.tags.join(', '));
      setNotes(person.notes ?? '');
      setHydrated(true);
    }
  }, [isEditing, personQuery.data, hydrated]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName || isPending) return;

    const payload = {
      name: trimmedName,
      role: role.trim() || undefined,
      company: company.trim() || undefined,
      location: location.trim() || undefined,
      howMet: howMet.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (isEditing && id) {
      updatePerson.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(id) });
            queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
            showToast(`${trimmedName} updated`);
            router.back();
          },
          onError: () => showToast("Couldn't save changes — try again", 'error'),
        },
      );
    } else {
      createPerson.mutate(
        { data: payload },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
            showToast(`${trimmedName} added to your network`);
            router.back();
          },
          onError: () => showToast("Couldn't add this person — try again", 'error'),
        },
      );
    }
  };

  const showLoading = isEditing && personQuery.isLoading;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? 'Edit Person' : 'Add Person'}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!name.trim() || isPending}
          hitSlop={8}
          style={styles.headerButton}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather
              name="check"
              size={20}
              color={!name.trim() ? colors.mutedForeground : colors.primary}
            />
          )}
        </Pressable>
      </View>

      {showLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 16 }}
        >
          <TextField label="Name" required value={name} onChangeText={setName} placeholder="Jane Doe" />
          <TextField label="Role" value={role} onChangeText={setRole} placeholder="Product Designer" />
          <TextField label="Company" value={company} onChangeText={setCompany} placeholder="Acme Co." />
          <TextField label="Location" value={location} onChangeText={setLocation} placeholder="San Francisco, CA" />
          <TextField
            label="How you met"
            value={howMet}
            onChangeText={setHowMet}
            placeholder="Introduced by a mutual friend"
          />
          <TextField
            label="Tags"
            value={tags}
            onChangeText={setTags}
            placeholder="design, mentor, sf (comma separated)"
          />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth remembering"
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
        </KeyboardAwareScrollViewCompat>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    padding: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
