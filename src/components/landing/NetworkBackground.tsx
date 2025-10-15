'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  x: number;
  y: number;
  layer: number; // 0, 1, 2 for three dimensional layers
  type: 'person' | 'organization' | 'government';
  vx: number;
  vy: number;
  opacity: number;
  appearing: boolean;
}

interface Connection {
  from: string;
  to: string;
  opacity: number;
}

interface NodeColors {
  person: string;
  organization: string;
  government: string;
}

const LAYER_OPACITY = [0.6, 0.4, 0.25]; // Front to back layers

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodeColors, setNodeColors] = useState<NodeColors>({
    person: '#7A9278',
    organization: '#C67B5C',
    government: '#5C8B89',
  });
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationFrameRef = useRef<number>();

  // Read colors from CSS variables on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styles = getComputedStyle(document.documentElement);
      const sage = styles.getPropertyValue('--brand-sage').trim();
      const terracotta = styles.getPropertyValue('--brand-terracotta').trim();
      const teal = styles.getPropertyValue('--brand-teal').trim();

      if (sage && terracotta && teal) {
        setNodeColors({
          person: sage,
          organization: terracotta,
          government: teal,
        });
      }
    }
  }, []);

  const generateInitialNodes = (width: number, height: number) => {
    const idealCount = 27; // 3 layers × 9 nodes each
    const aspectRatio = width / height;
    const columns = Math.max(4, Math.round(Math.sqrt(idealCount * aspectRatio)));
    const rows = Math.max(4, Math.ceil(idealCount / columns));
    const horizontalSpacing = width / (columns + 1);
    const verticalSpacing = height / (rows + 1);

    const nodeTypes: Array<'person' | 'organization' | 'government'> = [
      'person',
      'organization',
      'government',
    ];

    const nodes: Node[] = [];
    let nodeIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (nodeIndex >= idealCount) {
          break;
        }

        const jitterX = (Math.random() - 0.5) * horizontalSpacing * 0.5;
        const jitterY = (Math.random() - 0.5) * verticalSpacing * 0.5;
        const baseX = horizontalSpacing * (col + 1) + jitterX;
        const baseY = verticalSpacing * (row + 1) + jitterY;

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.25 + Math.random() * 0.55; // keep motion noticeable

        nodes.push({
          id: `node-${nodeIndex}`,
          x: Math.min(Math.max(baseX, 0), width),
          y: Math.min(Math.max(baseY, 0), height),
          layer: Math.floor(Math.random() * 3),
          type: nodeTypes[nodeIndex % nodeTypes.length],
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          opacity: 1,
          appearing: true,
        });

        nodeIndex += 1;
      }
    }

    return nodes;
  };

  // Initialize network
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) {
      return;
    }

    const evenlySpaced = generateInitialNodes(dimensions.width, dimensions.height);
    nodesRef.current = evenlySpaced;
    updateConnections();
  }, [dimensions.width, dimensions.height]);

  // Update connections based on proximity
  const updateConnections = () => {
    const nodes = nodesRef.current;
    const newConnections: Connection[] = [];
    const maxDistance = 260;
    const maxConnectionsPerNode = 3;
    const addedPairs = new Set<string>();

    for (let i = 0; i < nodes.length; i++) {
      const distances: Array<{ index: number; distance: number }> = [];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance < maxDistance) {
          distances.push({ index: j, distance });
        }
      }

      distances.sort((a, b) => a.distance - b.distance);

      for (let k = 0; k < Math.min(maxConnectionsPerNode, distances.length); k++) {
        const { index: j, distance } = distances[k];
        const fromNode = nodes[i];
        const toNode = nodes[j];
        const pairKey = fromNode.id < toNode.id ? `${fromNode.id}-${toNode.id}` : `${toNode.id}-${fromNode.id}`;

        if (addedPairs.has(pairKey)) {
          continue;
        }

        const layerDiff = Math.abs(fromNode.layer - toNode.layer);
        const baseOpacity = 1 - distance / maxDistance;
        const layerOpacity = layerDiff === 0 ? 1 : layerDiff === 1 ? 0.65 : 0.4;

        newConnections.push({
          from: fromNode.id,
          to: toNode.id,
          opacity: baseOpacity * layerOpacity * 0.5,
        });
        addedPairs.add(pairKey);
      }
    }

    connectionsRef.current = newConnections;
  };

  // Periodically retarget velocities so nodes keep roaming
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) {
      return;
    }

    const interval = setInterval(() => {
      const nodes = nodesRef.current;
      nodes.forEach((node) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.45;
        node.vx = node.vx * 0.4 + Math.cos(angle) * speed * 0.6;
        node.vy = node.vy * 0.4 + Math.sin(angle) * speed * 0.6;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [dimensions.width, dimensions.height]);

  // Reconnection dynamics
  useEffect(() => {
    const interval = setInterval(() => {
      updateConnections();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Animation loop
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Update and draw connections
      connections.forEach((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);

        if (fromNode && toNode && fromNode.opacity > 0 && toNode.opacity > 0) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          const connColor = hexToRgba(
            nodeColors.person,
            conn.opacity * Math.min(fromNode.opacity, toNode.opacity)
          );
          ctx.strokeStyle = connColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Update and draw nodes
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];

        // Update opacity for appearing/disappearing
        if (node.appearing) {
          node.opacity = Math.min(1, node.opacity + 0.02);
        } else {
          node.opacity = Math.max(0, node.opacity - 0.02);
          if (node.opacity === 0) {
            nodes.splice(i, 1);
            continue;
          }
        }

        // Update position with drift
        node.x += node.vx;
        node.y += node.vy;

        // Gentle steering to keep nodes exploring the canvas evenly
        node.vx += (Math.random() - 0.5) * 0.02;
        node.vy += (Math.random() - 0.5) * 0.02;

        const maxSpeed = 0.8;
        const speed = Math.hypot(node.vx, node.vy);
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
        }

        // Bounce off edges
        if (node.x < 0 || node.x > dimensions.width) node.vx *= -1;
        if (node.y < 0 || node.y > dimensions.height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(dimensions.width, node.x));
        node.y = Math.max(0, Math.min(dimensions.height, node.y));

        // Draw node
        const baseSize = node.type === 'person' ? 4 : node.type === 'organization' ? 5 : 6;
        const layerScale = [1, 0.8, 0.6][node.layer];
        const size = baseSize * layerScale;

        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        const color = nodeColors[node.type];
        const layerOpacity = LAYER_OPACITY[node.layer];
        ctx.fillStyle = hexToRgba(color, node.opacity * layerOpacity);
        ctx.fill();

        // Outer glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, node.opacity * layerOpacity * 0.2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, nodeColors]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{ opacity: 0.4 }}
      />
    </div>
  );
}
