import React from 'react';
import { Layers, Sliders, RefreshCw, Mail, Search, Camera } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  onTriggerEmail, 
  onTriggerMarket, 
  onTriggerReceiptScan 
}) {
  return (
    <header className="glass-card border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-black text-slate-950 text-lg">G</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">Master Life Automation Engine</h1>
            <p className="text-[11px] text-cyan-400 font-mono">Unified Task Model & Visual Agent Topology</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'workflow' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Workflow</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'graph' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Graph Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'skills' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Skills & Rules</span>
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onTriggerEmail}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center space-x-1.5 transition"
            title="Scan Emails for Bills"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Audit Inbox</span>
          </button>
          <button
            onClick={onTriggerMarket}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center space-x-1.5 transition"
            title="Scan Real Estate & Jobs"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Scan Markets</span>
          </button>
          <button
            onClick={onTriggerReceiptScan}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center space-x-1.5 transition"
            title="Scan Receipt Camera Photo"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Snap Receipt</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
