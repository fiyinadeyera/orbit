import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';
import { PersonListItem } from '@/components/PersonListItem';
import { Skeleton } from '@/components/Skeleton';
import { useListPeople, type Person } from '@workspace/api-client-react';

export default function PeopleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const peopleQuery = useListPeople({ search: search.trim() || undefined });
  const people = peopleQuery.data ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>People</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {people.length} {people.length === 1 ? 'connection' : 'connections'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/import' as Href)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityLabel="Import people"
            >
              <Feather name="download" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/person-form')}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="plus" size={20} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search people, roles, companies..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      {peopleQuery.isLoading ? (
        <View style={[styles.list, { gap: 10 }]}>
          <Skeleton style={{ height: 76 }} />
          <Skeleton style={{ height: 76 }} />
          <Skeleton style={{ height: 76 }} />
        </View>
      ) : (
        <FlatList<Person>
          data={people}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 110 },
            people.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={peopleQuery.isRefetching}
              onRefresh={() => peopleQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <PersonListItem person={item} onPress={() => router.push(`/person/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title={search ? 'No matches found' : 'No connections yet'}
              description={
                search
                  ? 'Try a different name, role, or company.'
                  : 'Import your phone contacts, or tap + to add someone yourself.'
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 1,
  },
  listEmpty: {
    justifyContent: 'center',
  },
});
