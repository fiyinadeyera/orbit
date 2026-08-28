import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import type { MapEdge, MapPerson } from '@/lib/sampleNetwork';

type NetworkGraphProps = {
  people: MapPerson[];
  edges: MapEdge[];
  size: number;
  selectedId: string | null;
  onSelectPerson: (person: MapPerson) => void;
};

const NODE_SIZE = 62;
const CENTER_SIZE = 78;

// A small harmonious palette so each contact reads as its own node instead of
// a wall of identical circles. Assigned by position; works on light and dark.
export const NODE_COLORS = ['#326755', '#c69653', '#4a7ba6', '#b0654f', '#7a6aa8', '#3f8a7a'];

export function nodeColorForIndex(index: number): string {
  return NODE_COLORS[index % NODE_COLORS.length];
}

export function NetworkGraph({
  people,
  edges,
  size,
  selectedId,
  onSelectPerson,
}: NetworkGraphProps) {
  const colors = useColors();
  const center = size / 2;

  // Contacts sit on a ring around the central "You" node.
  const radius = Math.min(size * 0.36, center - NODE_SIZE / 2 - 6);

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    const count = Math.max(people.length, 1);
    people.forEach((person, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      map[person.id] = {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
    return map;
  }, [people, center, radius]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Decorative orbit rings for the "network universe" feel. */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="2 6"
          fill="none"
          opacity={0.7}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.6}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="2 6"
          fill="none"
          opacity={0.4}
        />

        {/* Spokes: every contact links back to You at the center. */}
        {people.map((person) => {
          const pos = positions[person.id];
          if (!pos) return null;
          return (
            <Line
              key={`spoke-${person.id}`}
              x1={center}
              y1={center}
              x2={pos.x}
              y2={pos.y}
              stroke={colors.mutedForeground}
              strokeWidth={1}
              opacity={0.35}
            />
          );
        })}

        {/* Direct connections between two contacts. */}
        {edges.map((edge) => {
          const a = positions[edge.aId];
          const b = positions[edge.bId];
          if (!a || !b) return null;
          return (
            <Line
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={colors.primary}
              strokeWidth={1.5}
              opacity={0.35}
            />
          );
        })}
      </Svg>

      {/* Center "You" node. */}
      <View
        style={[
          styles.center,
          {
            left: center - CENTER_SIZE / 2,
            top: center - CENTER_SIZE / 2,
            backgroundColor: colors.primary,
            borderColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.centerText, { color: colors.primaryForeground }]}>You</Text>
      </View>

      {/* Contact nodes. */}
      {people.map((person, index) => {
        const pos = positions[person.id];
        if (!pos) return null;
        const isSelected = person.id === selectedId;
        const nodeColor = nodeColorForIndex(index);
        return (
          <Pressable
            key={person.id}
            onPress={() => onSelectPerson(person)}
            style={({ pressed }) => [
              styles.node,
              {
                left: pos.x - NODE_SIZE / 2,
                top: pos.y - NODE_SIZE / 2,
                backgroundColor: colors.card,
                borderColor: nodeColor,
                borderWidth: isSelected ? 4 : 2.5,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.94 : isSelected ? 1.08 : 1 }],
              },
            ]}
          >
            <Text style={[styles.initials, { color: nodeColor }]}>{person.initials}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  centerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  node: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  initials: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
