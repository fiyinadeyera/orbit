import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import type { Connection, GraphNodesItem } from '@workspace/api-client-react';

type NetworkGraphProps = {
  nodes: GraphNodesItem[];
  edges: Connection[];
  size: number;
  onNodePress: (id: string) => void;
};

const NODE_SIZE = 58;

export function NetworkGraph({ nodes, edges, size, onNodePress }: NetworkGraphProps) {
  const colors = useColors();

  const positions = useMemo(() => {
    const center = size / 2;
    const radius = Math.max(size * 0.36, 40);
    const map: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      map[node.id] = {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
    return map;
  }, [nodes, size]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {edges.map((edge) => {
          const a = positions[edge.personAId];
          const b = positions[edge.personBId];
          if (!a || !b) return null;
          return (
            <Line
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={colors.border}
              strokeWidth={1.5}
            />
          );
        })}
      </Svg>
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        return (
          <Pressable
            key={node.id}
            onPress={() => onNodePress(node.id)}
            style={({ pressed }) => [
              styles.node,
              {
                left: pos.x - NODE_SIZE / 2,
                top: pos.y - NODE_SIZE / 2,
                backgroundColor: colors.card,
                borderColor: colors.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.initials, { color: colors.foreground }]}>{node.initials}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  initials: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
});
