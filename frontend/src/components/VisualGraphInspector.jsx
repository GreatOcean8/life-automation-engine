import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function VisualGraphInspector({ nodes, selectedNodeId, onSelectNode }) {
  const selectedNode = nodes.find(n => n.node_id === selectedNodeId) || nodes[0];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Visual Agent Graph Topology</h2>
        <p className="text-xs text-slate-400">Inspect active nodes, status indicators, and live JSON object state payload.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2D Topology Visualizer (Left 2 columns) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-6 min-h-[420px]">
          {/* MASTER ORCHESTRATOR NODE */}
          {nodes.filter(n => n.agent_type === 'Orchestrator').map(node => (
            <div
              key={node.node_id}
              onClick={() => onSelectNode(node.node_id)}
              className={`cursor-pointer glass-card p-5 rounded-2xl border transition duration-300 text-center w-72 glow-blue ${
                selectedNodeId === node.node_id ? 'border-cyan-400 ring-2 ring-cyan-500/50' : 'border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
                <h3 className="font-bold text-white text-base">{node.name}</h3>
              </div>
              <div className="text-xs text-cyan-300 font-mono">Status: {node.status}</div>
              <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg">
                Active Step: {node.active_step || 'Listening for triggers'}
              </div>
            </div>
          ))}

          {/* CONNECTING EDGE LINES */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500 to-slate-700"></div>

          {/* SUBAGENTS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {nodes.filter(n => n.agent_type === 'Subagent').map(node => (
              <div
                key={node.node_id}
                onClick={() => onSelectNode(node.node_id)}
                className={`cursor-pointer glass-card p-4 rounded-xl border transition text-center hover:scale-105 ${
                  selectedNodeId === node.node_id ? 'border-cyan-400 ring-2 ring-cyan-500/50' : 'border-slate-800'
                } ${node.status === 'RUNNING' ? 'pulse-node border-cyan-400' : ''}`}
              >
                <div className="flex items-center justify-center space-x-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${node.status === 'RUNNING' ? 'bg-cyan-400' : 'bg-slate-600'}`}></span>
                  <h4 className="font-semibold text-white text-xs truncate">{node.name}</h4>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{node.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live State Payload Inspector (Right 1 column) */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Node Inspector</h3>
              <p className="text-[11px] text-slate-400">{selectedNode ? selectedNode.name : 'Select a node'}</p>
            </div>
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
              {selectedNode ? selectedNode.status : 'N/A'}
            </span>
          </div>

          <div className="flex-1 bg-slate-900/90 rounded-xl p-3 font-mono text-[11px] text-cyan-300 overflow-auto max-h-[380px] border border-slate-800">
            {selectedNode ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(selectedNode.state_snapshot, null, 2)}</pre>
            ) : (
              <div className="text-slate-500 text-xs py-8 text-center">Click any node to view state snapshot</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
