import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';
import { NetworkGraph } from '@/components/NetworkGraph';
import { useGetGraph } from '@workspace/api-client-react';

export default function NetworkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const graphQuery = useGetGraph();
  const nodes = graphQuery.data?.nodes ?? [];
  const edges = graphQuery.data?.edges ?? [];

  const canvasSize = Math.max(width - 32, Math.min(nodes.length * 70, 900));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Network</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {nodes.length} {nodes.length === 1 ? 'person' : 'people'} · {edges.length}{' '}
          {edges.length === 1 ? 'connection' : 'connections'}
        </Text>
      </View>

      {graphQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : nodes.length === 0 ? (
        <EmptyState
          icon="share-2"
          title="Your network graph is empty"
          description="Add connections to see how your relationships link together."
        />
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={graphQuery.isRefetching}
              onRefresh={() => graphQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
            refreshControl={
              <RefreshControl
                refreshing={graphQuery.isRefetching}
                onRefresh={() => graphQuery.refetch()}
                tintColor={colors.primary}
              />
            }
          >
            <NetworkGraph
              nodes={nodes}
              edges={edges}
              size={canvasSize}
              onNodePress={(id) => router.push(`/person/${id}`)}
            />
          </ScrollView>
        </ScrollView>
      )}
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
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
