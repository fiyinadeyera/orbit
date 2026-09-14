import React, { useEffect, useRef, useState } from 'react';
import { useGetGraph } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { Network } from 'lucide-react';
import { track } from '@/lib/track';

export default function GraphView() {
  const { data: graph, isLoading, isError } = useGetGraph();
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  // Simple force-directed graph state
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});

  useEffect(() => {
    track('graph_opened');
  }, []);

  // Measure the visible card so the layout is centered on the real viewport,
  // on phones as well as desktop.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: Math.max(rect.width, 280),
        height: Math.max(rect.height, 280),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [graph, isLoading]);

  useEffect(() => {
    if (!graph || graph.nodes.length === 0 || !size) return;

    // Distribute nodes in a circle around the real center of the container.
    const width = size.width;
    const height = size.height;
    const layoutPos: Record<string, {x: number, y: number}> = {};
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    graph.nodes.forEach((node, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      layoutPos[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    // Nudge connected nodes closer
    graph.edges.forEach(edge => {
      const p1 = layoutPos[edge.personAId];
      const p2 = layoutPos[edge.personBId];
      if(p1 && p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        p1.x += dx * 0.1;
        p1.y += dy * 0.1;
        p2.x -= dx * 0.1;
        p2.y -= dy * 0.1;
      }
    });

    setPositions(layoutPos);
  }, [graph, size]);

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Network Map</h1>
        <p className="text-muted-foreground mt-1">See how the people in your network connect.</p>
      </div>

      <Card className="flex-1 relative overflow-hidden bg-card/50 border-border/80 rounded-2xl shadow-sm">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4 text-muted-foreground">
              <Network className="w-8 h-8 opacity-50" />
              <p>Connecting the dots...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6 text-muted-foreground">
            Couldn't load your network map. Check your connection and try again.
          </div>
        ) : !graph || graph.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No connections established yet.
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            {size && (
              <div className="relative" style={{ width: size.width, height: size.height }}>
                {/* Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-border stroke-[1.5px] opacity-40">
                  {graph.edges.map(edge => {
                    const p1 = positions[edge.personAId];
                    const p2 = positions[edge.personBId];
                    if (!p1 || !p2) return null;
                    return (
                      <line
                        key={edge.id}
                        x1={p1.x} y1={p1.y}
                        x2={p2.x} y2={p2.y}
                      />
                    );
                  })}
                </svg>

                {/* Nodes */}
                {graph.nodes.map(node => {
                  const pos = positions[node.id];
                  if (!pos) return null;
                  return (
                    <div
                      key={node.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: pos.x, top: pos.y }}
                      onClick={() => setLocation(`/people/${node.id}`)}
                    >
                      <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-sm group-hover:border-primary group-hover:scale-110 transition-all text-sm font-medium text-foreground">
                        {node.initials}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center font-medium border border-border">
                        {node.name}
                        {node.company && <div className="text-[10px] text-muted-foreground font-normal">{node.company}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
