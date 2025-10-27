'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  x: number;
  y: number;
  type: 'person' | 'organization' | 'government';
  size: number;
  layer: number;
  color: string;
  connections: string[];
}

interface Connection {
  from: string;
  to: string;
  layer: number;
  strength: number;
}

const NODE_COLORS = {
  person: '#7A9278',
  organization: '#C67B5C',
  government: '#5C8B89',
};

const LAYER_OPACITIES = [0.15, 0.25, 0.35];

export function NetworkBackground() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const initialNodes: Node[] = [];
    const types: Array<'person' | 'organization' | 'government'> = [
      'person',
      'organization',
      'government',
    ];

    for (let i = 0; i < 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const layer = Math.floor(Math.random() * 3);

      initialNodes.push({
        id: `node-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        type,
        size: type === 'government' ? 12 : type === 'organization' ? 10 : 8,
        layer,
        color: NODE_COLORS[type],
        connections: [],
      });
    }

    const initialConnections: Connection[] = [];
    initialNodes.forEach((node, i) => {
      const numConnections = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < numConnections; j++) {
        const targetIndex = Math.floor(Math.random() * initialNodes.length);
        if (targetIndex !== i) {
          const target = initialNodes[targetIndex];
          const layerDiff = Math.abs(node.layer - target.layer);

          if (layerDiff <= 1 || Math.random() > 0.7) {
            initialConnections.push({
              from: node.id,
              to: target.id,
              layer: Math.min(node.layer, target.layer),
              strength: Math.random(),
            });

            if (!node.connections.includes(target.id)) {
              node.connections.push(target.id);
            }
          }
        }
      }
    });

    setNodes(initialNodes);
    setConnections(initialConnections);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setConnections((prevConnections) => {
        const newConnections = [...prevConnections];

        if (newConnections.length < 20 && nodes.length > 0 && Math.random() > 0.7) {
          const fromNode = nodes[Math.floor(Math.random() * nodes.length)];
          const toNode = nodes[Math.floor(Math.random() * nodes.length)];

          if (fromNode.id !== toNode.id) {
            const layerDiff = Math.abs(fromNode.layer - toNode.layer);
            if (layerDiff <= 1 || Math.random() > 0.8) {
              newConnections.push({
                from: fromNode.id,
                to: toNode.id,
                layer: Math.min(fromNode.layer, toNode.layer),
                strength: Math.random(),
              });
            }
          }
        } else if (newConnections.length > 25 && Math.random() > 0.7) {
          const removeIndex = Math.floor(Math.random() * newConnections.length);
          newConnections.splice(removeIndex, 1);
        }

        return newConnections;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [nodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full opacity-60">
        <defs>
          <linearGradient id="connection-gradient-0" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7A9278" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7A9278" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="connection-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C67B5C" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C67B5C" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="connection-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C8B89" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#5C8B89" stopOpacity="0.05" />
          </linearGradient>

          <filter id="node-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 1, 2].map((layer) => (
          <g key={`layer-${layer}`} opacity={LAYER_OPACITIES[layer]}>
            {connections
              .filter((conn) => conn.layer === layer)
              .map((conn, i) => {
                const fromNode = nodeMap.get(conn.from);
                const toNode = nodeMap.get(conn.to);

                if (!fromNode || !toNode) return null;

                const x1 = (fromNode.x / 100) * dimensions.width;
                const y1 = (fromNode.y / 100) * dimensions.height;
                const x2 = (toNode.x / 100) * dimensions.width;
                const y2 = (toNode.y / 100) * dimensions.height;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;

                const pathId = `path-${conn.from}-${conn.to}-${layer}`;

                return (
                  <g key={`${conn.from}-${conn.to}-${i}`}>
                    <motion.path
                      id={pathId}
                      d={`M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`}
                      stroke={`url(#connection-gradient-${layer})`}
                      strokeWidth={1 + conn.strength * 2}
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: 0.6,
                      }}
                      transition={{
                        pathLength: { duration: 2, ease: 'easeInOut' },
                        opacity: { duration: 2, ease: 'easeInOut' },
                      }}
                    />

                    <motion.circle
                      r="2.5"
                      fill={fromNode.color}
                      opacity="0.5"
                      filter="url(#node-glow)"
                    >
                      <animateMotion dur={`${8 + i * 0.5}s`} repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </motion.circle>
                  </g>
                );
              })}
          </g>
        ))}

        {[0, 1, 2].map((layer) => (
          <g key={`nodes-layer-${layer}`}>
            {nodes
              .filter((node) => node.layer === layer)
              .map((node, i) => {
                const baseX = (node.x / 100) * dimensions.width;
                const baseY = (node.y / 100) * dimensions.height;

                return (
                  <motion.g
                    key={node.id}
                    animate={{
                      x: [0, Math.sin(i * 0.5) * 20, 0],
                      y: [0, Math.cos(i * 0.5) * 15, 0],
                    }}
                    transition={{
                      x: {
                        duration: 30 + i * 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.8,
                      },
                      y: {
                        duration: 35 + i * 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.5,
                      },
                    }}
                  >
                    <motion.circle
                      cx={baseX}
                      cy={baseY}
                      r={node.size}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="1"
                      opacity={LAYER_OPACITIES[layer] * 0.8}
                      animate={{
                        r: [node.size, node.size * 2, node.size],
                        opacity: [
                          LAYER_OPACITIES[layer] * 0.8,
                          LAYER_OPACITIES[layer] * 0.2,
                          LAYER_OPACITIES[layer] * 0.8,
                        ],
                      }}
                      transition={{
                        duration: 6 + i * 0.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    <circle
                      cx={baseX}
                      cy={baseY}
                      r={node.size / 2}
                      fill={node.color}
                      opacity={LAYER_OPACITIES[layer] * 2.5}
                      filter="url(#node-glow)"
                    />

                    <circle
                      cx={baseX}
                      cy={baseY}
                      r={node.size / 4}
                      fill={node.color}
                      opacity={LAYER_OPACITIES[layer] * 3}
                    />
                  </motion.g>
                );
              })}
          </g>
        ))}

        <g opacity="0.04">
          {[0, 1, 2].map((layer) => (
            <motion.circle
              key={`dimension-${layer}`}
              cx="50%"
              cy="50%"
              r={200 + layer * 150}
              fill="none"
              stroke={layer === 0 ? '#7A9278' : layer === 1 ? '#C67B5C' : '#5C8B89'}
              strokeWidth="1"
              strokeDasharray="10 20"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.02, 1],
              }}
              transition={{
                rotate: { duration: 80 + layer * 30, repeat: Infinity, ease: 'linear' },
                scale: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          ))}
        </g>
      </svg>

      <div className="absolute inset-0 opacity-[0.08]">
        <svg className="w-full h-full">
          <motion.path
            d="M 0,50% Q 25%,30% 50%,50% T 100%,50%"
            stroke="#7A9278"
            strokeWidth="1.5"
            fill="none"
            animate={{
              d: [
                'M 0,50% Q 25%,30% 50%,50% T 100%,50%',
                'M 0,50% Q 25%,70% 50%,50% T 100%,50%',
                'M 0,50% Q 25%,30% 50%,50% T 100%,50%',
              ],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 0,33% Q 25%,20% 50%,33% T 100%,33%"
            stroke="#C67B5C"
            strokeWidth="1"
            fill="none"
            animate={{
              d: [
                'M 0,33% Q 25%,20% 50%,33% T 100%,33%',
                'M 0,33% Q 25%,46% 50%,33% T 100%,33%',
                'M 0,33% Q 25%,20% 50%,33% T 100%,33%',
              ],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.path
            d="M 0,66% Q 25%,53% 50%,66% T 100%,66%"
            stroke="#5C8B89"
            strokeWidth="1"
            fill="none"
            animate={{
              d: [
                'M 0,66% Q 25%,53% 50%,66% T 100%,66%',
                'M 0,66% Q 25%,79% 50%,66% T 100%,66%',
                'M 0,66% Q 25%,53% 50%,66% T 100%,66%',
              ],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </svg>
      </div>
    </div>
  );
}
