import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListPeopleQueryKey,
  getListReconnectsQueryKey,
  useImportContacts,
  useListPeople,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';

type Candidate = {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
};

// Turn a raw device contact into the shape the import endpoint accepts, or
// null if it has no usable name (some contacts are just a phone number).
function toCandidate(contact: Contacts.Contact): Candidate | null {
  const name = (contact.name ?? '').trim();
  if (!name) return null;
  // Candidates are deduped by name before rendering, so the name is a safe,
  // stable FlatList key without depending on a contact id field.
  return {
    key: name,
    name,
    email: contact.emails?.[0]?.email?.trim() || undefined,
    phone: contact.phoneNumbers?.[0]?.number?.trim() || undefined,
    company: contact.company?.trim() || undefined,
  };
}

type Stage = 'intro' | 'loading' | 'denied' | 'review';

export default function ImportContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<Stage>('intro');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [alreadyCount, setAlreadyCount] = useState(0);

  const { data: people = [] } = useListPeople();
  const importMutation = useImportContacts();

  // Names already in Orbit, so the review list only offers people you don't
  // have yet (the server also dedupes, but hiding them keeps the list honest).
  const existingNames = useMemo(
    () => new Set(people.map((p) => p.name.trim().toLowerCase())),
    [people],
  );

  const loadContacts = useCallback(async () => {
    setStage('loading');
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      setStage('denied');
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.Emails,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Company,
      ],
    });

    const seen = new Set<string>();
    const fresh: Candidate[] = [];
    let already = 0;
    for (const contact of data) {
      const candidate = toCandidate(contact);
      if (!candidate) continue;
      const nameKey = candidate.name.toLowerCase();
      if (seen.has(nameKey)) continue;
      seen.add(nameKey);
      if (existingNames.has(nameKey)) {
        already += 1;
        continue;
      }
      fresh.push(candidate);
    }

    setCandidates(fresh);
    setSelected(new Set(fresh.map((c) => c.key))); // default: all selected
    setAlreadyCount(already);
    setStage('review');
  }, [existingNames]);

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const allSelected = selected.size === candidates.length && candidates.length > 0;
  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.key)));
  }, [allSelected, candidates]);

  const handleImport = useCallback(() => {
    const chosen = candidates
      .filter((c) => selected.has(c.key))
      .map(({ name, email, phone, company }) => ({ name, email, phone, company }));
    if (chosen.length === 0) return;

    importMutation.mutate(
      { data: { contacts: chosen } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListReconnectsQueryKey() });
          showToast(
            `Added ${res.imported} ${res.imported === 1 ? 'person' : 'people'} to your network.`,
            'success',
          );
          router.back();
        },
        onError: () => showToast('Import failed. Please try again.', 'error'),
      },
    );
  }, [candidates, selected, importMutation, queryClient, showToast]);

  const renderHeader = (title: string) => (
    <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.close}>
        <Feather name="x" size={22} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
    </View>
  );

  if (stage === 'intro') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {renderHeader('Import contacts')}
        <View style={styles.centered}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>
            Bring your network to Orbit
          </Text>
          <Text style={[styles.introBody, { color: colors.mutedForeground }]}>
            Orbit will look through your phone contacts and let you choose who to add. Nothing is
            added without your say so.
          </Text>
          <Pressable
            onPress={loadContacts}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Connect contacts
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (stage === 'loading') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {renderHeader('Import contacts')}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.introBody, { color: colors.mutedForeground, marginTop: 16 }]}>
            Reading your contacts...
          </Text>
        </View>
      </View>
    );
  }

  if (stage === 'denied') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {renderHeader('Import contacts')}
        <View style={styles.centered}>
          <EmptyState
            icon="lock"
            title="Contacts access is off"
            description="To import, allow Orbit to access your contacts in Settings, then try again."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {renderHeader('Choose who to add')}

      <View style={[styles.subBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.subText, { color: colors.mutedForeground }]}>
          {candidates.length} new{alreadyCount > 0 ? ` · ${alreadyCount} already in Orbit` : ''}
        </Text>
        {candidates.length > 0 && (
          <Pressable onPress={toggleAll} hitSlop={8}>
            <Text style={[styles.subAction, { color: colors.primary }]}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList<Candidate>
        data={candidates}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 96 },
          candidates.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle"
            title="Nothing new to import"
            description="Everyone in your contacts is already in Orbit."
          />
        }
        renderItem={({ item }) => {
          const isSelected = selected.has(item.key);
          const meta = [item.company, item.email, item.phone].filter(Boolean).join(' · ');
          return (
            <Pressable
              onPress={() => toggle(item.key)}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {meta ? (
                  <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {meta}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                  },
                ]}
              >
                {isSelected && <Feather name="check" size={14} color={colors.primaryForeground} />}
              </View>
            </Pressable>
          );
        }}
      />

      {candidates.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleImport}
            disabled={selected.size === 0 || importMutation.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: selected.size === 0 || importMutation.isPending ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {importMutation.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                {selected.size === 0
                  ? 'Select people to add'
                  : `Add ${selected.size} to Orbit`}
              </Text>
            )}
          </Pressable>
        </View>
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' },
  introBody: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  subAction: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 12, flexGrow: 1 },
  listEmpty: { justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowText: { flex: 1 },
  rowName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 12.5, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
