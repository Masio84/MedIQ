'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Shield, Table as TableIcon, Users } from 'lucide-react';

interface RLSVisualizerProps {
  tables: any[];
  policies: any[];
}

const TableNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white dark:bg-slate-900 border-2 border-blue-500 min-w-[150px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-blue-500" />
    <div className="flex items-center border-b border-gray-100 dark:border-slate-800 pb-1 mb-1">
      <TableIcon className="w-4 h-4 mr-2 text-blue-500" />
      <div className="text-sm font-bold text-slate-900 dark:text-white">{data.label}</div>
    </div>
    <div className="text-[10px] text-gray-500">
      {data.has_rls ? '✅ RLS Activado' : '⚠️ RLS Desactivado'}
    </div>
  </div>
);

const RoleNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-slate-800 border-2 border-slate-700 text-white min-w-[120px]">
    <div className="flex items-center">
      <Users className="w-4 h-4 mr-2 text-blue-400" />
      <div className="text-sm font-bold uppercase tracking-wider">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-blue-400" />
  </div>
);

const PolicyNode = ({ data }: any) => (
  <div className="px-3 py-2 shadow-md rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 min-w-[200px]">
    <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-emerald-400" />
    <div className="flex items-center border-b border-emerald-100 dark:border-emerald-900 pb-1 mb-1">
      <Shield className="w-3 h-3 mr-2 text-emerald-600" />
      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">{data.label}</div>
    </div>
    <div className="flex gap-1 mb-1">
      <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">
        {data.command}
      </span>
    </div>
    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-white/50 dark:bg-black/20 p-1 rounded font-mono truncate">
      {data.qual}
    </div>
    <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-emerald-500" />
  </div>
);

const nodeTypes = {
  table: TableNode,
  role: RoleNode,
  policy: PolicyNode,
};

export default function RLSVisualizer({ tables, policies }: RLSVisualizerProps) {
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    
    // 1. Extraer Roles únicos de las políticas
    const uniqueRolesSet = new Set<string>(['anon', 'authenticated']);
    policies.forEach(p => {
      p.roles.forEach((r: string) => {
        if (r && r !== '{public}') uniqueRolesSet.add(r);
      });
    });
    
    const uniqueRoles = Array.from(uniqueRolesSet);
    uniqueRoles.forEach((role, idx) => {
      nodes.push({
        id: `role-${role}`,
        type: 'role',
        data: { label: role },
        position: { x: 50, y: 100 + idx * 250 },
      });
    });

    // 2. Tablas
    tables.forEach((table, idx) => {
      nodes.push({
        id: `table-${table.name}`,
        type: 'table',
        data: { label: table.name, has_rls: table.has_rls },
        position: { x: 1000, y: 50 + idx * 120 },
      });
    });

    // 3. Políticas
    policies.forEach((policy, idx) => {
      nodes.push({
        id: `policy-${policy.table}-${policy.name}`,
        type: 'policy',
        data: { 
          label: policy.name, 
          command: policy.command, 
          qual: policy.qual 
        },
        position: { x: 500, y: 50 + idx * 180 },
      });
    });

    return nodes;
  }, [tables, policies]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    policies.forEach((policy) => {
      const policyId = `policy-${policy.table}-${policy.name}`;
      const tableId = `table-${policy.table}`;

      // Edge de Política a Tabla
      edges.push({
        id: `edge-${policyId}-${tableId}`,
        source: policyId,
        target: tableId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      });

      // Edges de Roles a Políticas
      policy.roles.forEach((role: string) => {
          const cleanRole = role === '{public}' ? 'authenticated' : role;
          const targetRoleNodeId = `role-${cleanRole}`;
          
          edges.push({
            id: `edge-${targetRoleNodeId}-${policyId}`,
            source: targetRoleNodeId,
            target: policyId,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 }
          });
      });
    });

    return edges;
  }, [policies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-slate-50 dark:bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-right" className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-xl">
           <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">Simulador de Acceso</div>
           <p className="text-[10px] text-slate-500">Mueve los nodos para organizar tu vista de seguridad.</p>
        </Panel>
      </ReactFlow>
    </div>
  );
}
