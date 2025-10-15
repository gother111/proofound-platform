'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

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

    // Initialize nodes across 3 layers
    const initialNodes: Node[] = [];
    const nodeTypes: Array<'person' | 'organization' | 'government'> = [
      'person',
      'organization',
      'government',
    ];

    for (let i = 0; i < 25; i++) {
      initialNodes.push({
        id: `node-${i}`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        layer: Math.floor(Math.random() * 3),
        type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: 1,
        appearing: true,
      });
    }

    nodesRef.current = initialNodes;

    // Initialize connections
    updateConnections();

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update connections based on proximity
  const updateConnections = () => {
    const nodes = nodesRef.current;
    const newConnections: Connection[] = [];
    const maxDistance = 250;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          // Allow cross-layer connections
          const layerDiff = Math.abs(nodes[i].layer - nodes[j].layer);
          const baseOpacity = 1 - distance / maxDistance;
          const layerOpacity = layerDiff === 0 ? 1 : layerDiff === 1 ? 0.6 : 0.3;

          newConnections.push({
            from: nodes[i].id,
            to: nodes[j].id,
            opacity: baseOpacity * layerOpacity * 0.4,
          });
        }
      }
    }

    connectionsRef.current = newConnections;
  };

  // Self-regulating system: nodes appear/disappear
  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = nodesRef.current;

      // Randomly add or remove nodes
      if (nodes.length < 30 && Math.random() > 0.5) {
        // Add a new node
        const nodeTypes: Array<'person' | 'organization' | 'government'> = [
          'person',
          'organization',
          'government',
        ];
        const newNode: Node = {
          id: `node-${Date.now()}`,
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          layer: Math.floor(Math.random() * 3),
          type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: 0,
          appearing: true,
        };
        nodes.push(newNode);
      } else if (nodes.length > 15 && Math.random() > 0.7) {
        // Remove a random node
        const indexToRemove = Math.floor(Math.random() * nodes.length);
        nodes[indexToRemove].appearing = false;
      }

      updateConnections();
    }, 8000);

    return () => clearInterval(interval);
  }, [dimensions]);

  // Reconnection dynamics
  useEffect(() => {
    const interval = setInterval(() => {
      updateConnections();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Animation loop
  useEffect(() => {
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
