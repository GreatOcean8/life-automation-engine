import React, { useState, useRef, useEffect } from 'react';
import { Layers, Sliders, RefreshCw, Mail, Search, Camera, History, Zap, ChevronDown, Bot, Sparkles } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  onTriggerEmail, 
  onTriggerMarket, 
  onTriggerReceiptScan,
  onOpenAuditModal
}) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="glass-card border-b border-amber-500/20 sticky top-0 z-30 backdrop-blur-md bg-slate-950/85">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title & Brand Icon */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <span className="font-black text-slate-950 text-lg">G</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">Master Life Automation Engine</h1>
            <p className="text-[11px] text-amber-400 font-mono">Unified Task Model & Visual Agent Topology</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-amber-500/20">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'workflow' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Workflow</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'graph' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Graph Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'skills' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Skills & Rules</span>
          </button>
        </div>

        {/* Scalable Controls */}
        <div className="flex items-center space-x-2">
          {/* Audit Log Button */}
          <button
            onClick={onOpenAuditModal}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 rounded-xl text-xs text-slate-200 flex items-center space-x-1.5 transition hover:border-amber-400"
            title="Activity Audit Log & Undo"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Audit Log & Undo</span>
          </button>

          {/* Scalable Action Dispatcher Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>Action Dispatcher</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-950" />
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 glass-card bg-slate-900 border border-amber-500/40 rounded-2xl p-2 shadow-2xl space-y-2 text-xs z-50">
                <div className="text-[10px] text-amber-400 font-bold px-2 py-1 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>Registered Agent Actions</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>

                {/* Subagent Group 1: Email Triage */}
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold px-2 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Email & Bill Triage Subagent</span>
                  </div>
                  <button
                    onClick={() => { onTriggerEmail(); setIsActionsOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 flex items-center space-x-2 transition"
                  >
                    <span>Audit Inbox for Bills</span>
                  </button>
                </div>

                {/* Subagent Group 2: Market Scanner */}
                <div className="space-y-0.5 pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-500 font-semibold px-2 flex items-center space-x-1">
                    <Search className="w-3 h-3 text-slate-400" />
                    <span>Market Scanner Subagent</span>
                  </div>
                  <button
                    onClick={() => { onTriggerMarket(); setIsActionsOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 flex items-center space-x-2 transition"
                  >
                    <span>Scan Real Estate & Jobs</span>
                  </button>
                </div>

                {/* Subagent Group 3: Expense Tracker */}
                <div className="space-y-0.5 pt-1 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-500 font-semibold px-2 flex items-center space-x-1">
                    <Camera className="w-3 h-3 text-slate-400" />
                    <span>Expense Tracker Subagent</span>
                  </div>
                  <button
                    onClick={() => { onTriggerReceiptScan(); setIsActionsOpen(false); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 flex items-center space-x-2 transition"
                  >
                    <span>Scan Receipt Camera Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 rounded-xl text-amber-300"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
