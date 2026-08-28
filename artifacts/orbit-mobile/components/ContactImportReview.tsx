import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { dedupeCandidates, type ImportCandidate } from '@/lib/importCandidates';

/**
 * The shared "choose who to add" step. Any import source produces
 * ImportCandidate[] and renders this; dedupe, selection, and the call to the
 * import endpoint all live here so every source behaves identically.
 */
export function ContactImportReview({ candidates }: { candidates: ImportCandidate[] }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: people = [] } = useListPeople();
  const importMutation = useImportContacts();

  const existingNames = useMemo(
    () => new Set(people.map((p) => p.name.trim().toLowerCase())),
    [people],
  );

  const { fresh, alreadyCount } = useMemo(
    () => dedupeCandidates(candidates, existingNames),
    [candidates, existingNames],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Default every new person to selected; re-run if the fresh list changes
  // (e.g. the people query resolves after this screen first renders).
  useEffect(() => {
    setSelected(new Set(fresh.map((c) => c.key)));
  }, [fresh]);

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const allSelected = selected.size === fresh.length && fresh.length > 0;
  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(fresh.map((c) => c.key)));
  }, [allSelected, fresh]);

  const handleImport = useCallback(() => {
    const chosen = fresh
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
  }, [fresh, selected, importMutation, queryClient, showToast]);

  return (
    <View style={styles.fill}>
      <View style={[styles.subBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.subText, { color: colors.mutedForeground }]}>
          {fresh.length} new{alreadyCount > 0 ? ` · ${alreadyCount} already in Orbit` : ''}
        </Text>
        {fresh.length > 0 && (
          <Pressable onPress={toggleAll} hitSlop={8}>
            <Text style={[styles.subAction, { color: colors.primary }]}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList<ImportCandidate>
        data={fresh}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 96 },
          fresh.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle"
            title="Nothing new to import"
            description="Everyone from this source is already in Orbit."
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

      {fresh.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
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
                {selected.size === 0 ? 'Select people to add' : `Add ${selected.size} to Orbit`}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
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
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignSelf: 'stretch',
  },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
