import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, User, Bot, AlertTriangle, CheckCircle2, Clock, Trash2, Edit3, Check, X, 
  Search, Filter, ArrowUpDown, MoveRight, ChevronRight, ChevronDown, Sparkles
} from 'lucide-react';

export default function MasterKanbanBoard({
  tasks,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteTask,
  onDelegateTask,
  onApproveTask,
  onRejectTask,
  onUpdateTaskStatus
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState('PRIORITY_DESC');
  const [activeMoveTaskId, setActiveMoveTaskId] = useState(null);

  // Column Collapsed State
  const [isTodoCollapsed, setIsTodoCollapsed] = useState(false);
  const [isRunningCollapsed, setIsRunningCollapsed] = useState(true);
  const [isApprovalCollapsed, setIsApprovalCollapsed] = useState(true);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(true);

  const priorityWeight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchSearch = 
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (t.assignee_id && t.assignee_id.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchAssignee = 
          filterAssignee === 'ALL' ||
          (filterAssignee === 'HUMAN' && t.assignee_type === 'HUMAN') ||
          (filterAssignee === 'AGENT' && t.assignee_type === 'AGENT');

        const matchPriority = filterPriority === 'ALL' || t.priority === filterPriority;

        return matchSearch && matchAssignee && matchPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'PRIORITY_DESC') return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (sortBy === 'NEWEST') return b.task_id.localeCompare(a.task_id);
        if (sortBy === 'OLDEST') return a.task_id.localeCompare(b.task_id);
        if (sortBy === 'TITLE_ASC') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [tasks, searchTerm, filterAssignee, filterPriority, sortBy]);

  const todoTasks = filteredAndSortedTasks.filter(t => t.status === 'TODO');
  const runningTasks = filteredAndSortedTasks.filter(t => t.status === 'RUNNING');
  const approvalTasks = filteredAndSortedTasks.filter(t => t.status === 'WAITING_FOR_APPROVAL');
  const doneTasks = filteredAndSortedTasks.filter(t => t.status === 'DONE' || t.status === 'CANCELLED');

  // Smart Auto-Expand NEED APPROVAL panel when items require human action
  useEffect(() => {
    if (approvalTasks.length > 0) {
      setIsApprovalCollapsed(false);
    } else {
      setIsApprovalCollapsed(true);
    }
  }, [approvalTasks.length]);

  const renderTaskCard = (t) => (
    <div 
      key={t.task_id} 
      className={`glass-card p-4 rounded-xl border transition-all duration-300 space-y-3 hover:scale-[1.02] ${
        t.status === 'RUNNING' ? 'border-amber-400/80 ring-1 ring-amber-400/40 pulse-node' :
        t.status === 'WAITING_FOR_APPROVAL' ? 'border-amber-500/60 bg-amber-950/20' :
        'border-slate-800 hover:border-amber-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-white text-xs leading-snug">{t.title}</h4>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm ${
          t.priority === 'URGENT' ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse' :
          t.priority === 'HIGH' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' :
          t.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
          'bg-slate-800 text-slate-400'
        }`}>
          {t.priority}
        </span>
      </div>

      {t.description && (
        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{t.description}</p>
      )}

      {/* Dynamic Skill Card Template rendering */}
      {t.ui_schema && t.ui_schema.card_template === 'property_deal_card' && (
        <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-500/40 text-[11px] space-y-1">
          <div className="text-amber-400 font-bold flex items-center justify-between">
            <span>🏠 Property Deal Card</span>
            <span className="text-emerald-400 font-mono">Cap Rate: {t.cap_rate}%</span>
          </div>
          <div className="text-slate-300">Price: ${t.price?.toLocaleString()} | Est. Rent: ${t.monthly_rent?.toLocaleString()}/mo</div>
        </div>
      )}

      {/* HITL Approval Block */}
      {t.status === 'WAITING_FOR_APPROVAL' && (
        <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/50 space-y-2">
          <div className="flex items-center space-x-1.5 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Human Approval Guardrail</span>
          </div>
          {t.amount && (
            <div className="text-xs text-white font-mono">Amount: ${t.amount.toFixed(2)} ({t.vendor || 'Bill'})</div>
          )}
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => onApproveTask(t.task_id)}
              className="flex-1 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 hover:brightness-110 shadow-md shadow-amber-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Payment</span>
            </button>
            <button
              onClick={() => onRejectTask(t.task_id)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="pt-2.5 flex items-center justify-between border-t border-slate-800/80 text-[11px]">
        <span className="text-slate-400 font-medium flex items-center space-x-1.5">
          {t.assignee_type === 'HUMAN' ? (
            <span className="flex items-center space-x-1 text-amber-400 font-semibold">
              <User className="w-3 h-3" />
              <span>Human</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-yellow-400 font-semibold">
              <Bot className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{t.assignee_id}</span>
            </span>
          )}
        </span>

        <div className="flex items-center space-x-1">
          <div className="relative">
            <button
              onClick={() => setActiveMoveTaskId(activeMoveTaskId === t.task_id ? null : t.task_id)}
              className="text-slate-400 hover:text-amber-300 p-1 flex items-center space-x-0.5 rounded hover:bg-slate-800"
              title="Move Status"
            >
              <MoveRight className="w-3.5 h-3.5" />
            </button>

            {activeMoveTaskId === t.task_id && (
              <div className="absolute right-0 bottom-full mb-1 z-40 w-36 glass-card bg-slate-900 border border-amber-500/30 rounded-xl p-1 shadow-2xl space-y-0.5 text-[11px]">
                <div className="text-[10px] text-slate-500 font-bold px-2 py-1 uppercase">Move To:</div>
                <button
                  onClick={() => { onUpdateTaskStatus(t.task_id, 'TODO'); setActiveMoveTaskId(null); }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                >
                  <span>TODO</span>
                  {t.status === 'TODO' && <Check className="w-3 h-3 text-amber-400" />}
                </button>
                <button
                  onClick={() => { onUpdateTaskStatus(t.task_id, 'RUNNING'); setActiveMoveTaskId(null); }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-amber-400 flex items-center justify-between"
                >
                  <span>RUNNING</span>
                  {t.status === 'RUNNING' && <Check className="w-3 h-3 text-amber-400" />}
                </button>
                <button
                  onClick={() => { onUpdateTaskStatus(t.task_id, 'DONE'); setActiveMoveTaskId(null); }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-emerald-400 flex items-center justify-between"
                >
                  <span>DONE</span>
                  {t.status === 'DONE' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          <button onClick={() => onOpenEditModal(t)} className="text-slate-400 hover:text-slate-200 p-1" title="Edit Task">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDeleteTask(t.task_id)} className="text-slate-500 hover:text-red-400 p-1" title="Delete Task">
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {t.status === 'TODO' && (
            <button
              onClick={() => onDelegateTask(t.task_id, 'email_triage_subagent')}
              className="px-2.5 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded font-semibold text-[10px] flex items-center space-x-1 ml-1"
            >
              <Bot className="w-3 h-3" />
              <span>Delegate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Board Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Unified Master Task Board</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono font-normal">
              {filteredAndSortedTasks.length} tasks
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Focused TODO view with click-to-expand agent panels.</p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Toolbar: Search, Filters & Sorting */}
      <div className="glass-card p-3 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tasks, assignees..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs">×</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 font-bold px-2">Assignee:</span>
            <button
              onClick={() => setFilterAssignee('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${filterAssignee === 'ALL' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterAssignee('HUMAN')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${filterAssignee === 'HUMAN' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Human
            </button>
            <button
              onClick={() => setFilterAssignee('AGENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${filterAssignee === 'AGENT' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Agents
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="PRIORITY_DESC">Priority (High → Low)</option>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="TITLE_ASC">Title (A → Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Grid Layout */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        
        {/* 1. TODO COLUMN (PRIMARY / FOCUSED VIEW) */}
        <div className={`transition-all duration-300 w-full ${isTodoCollapsed ? 'md:w-52 md:flex-none' : 'flex-1'}`}>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-amber-500/20 space-y-3 min-h-[400px]">
            <div 
              onClick={() => setIsTodoCollapsed(!isTodoCollapsed)}
              className="flex items-center justify-between text-xs font-bold text-amber-300 pb-2 border-b border-slate-800 cursor-pointer hover:opacity-90"
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm">My TODOs</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-mono text-xs border border-amber-500/30">
                  {todoTasks.length}
                </span>
                <span className="text-slate-400 p-1">
                  {isTodoCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>
            </div>

            {!isTodoCollapsed && (
              <div className="space-y-3 pt-1">
                {todoTasks.length > 0 ? todoTasks.map(renderTaskCard) : (
                  <div className="text-slate-500 text-xs py-12 text-center border border-dashed border-slate-800 rounded-xl">
                    No TODO items. Click "Create New Task" above to add one!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. WAITING FOR APPROVAL COLUMN */}
        <div className={`transition-all duration-300 w-full ${isApprovalCollapsed ? 'md:w-52 md:flex-none' : 'flex-1'}`}>
          <div className={`p-4 rounded-2xl border space-y-3 min-h-[400px] transition-all ${
            approvalTasks.length > 0 ? 'bg-amber-950/25 border-amber-500/60 shadow-lg shadow-amber-500/15' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div 
              onClick={() => setIsApprovalCollapsed(!isApprovalCollapsed)}
              className="flex items-center justify-between text-xs font-bold text-amber-300 pb-2 border-b border-slate-800 cursor-pointer hover:opacity-90"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`w-4 h-4 ${approvalTasks.length > 0 ? 'animate-bounce text-amber-400' : 'text-slate-500'}`} />
                <span className="text-sm">Need Approval</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs border ${
                  approvalTasks.length > 0 ? 'bg-amber-500/30 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  {approvalTasks.length}
                </span>
                <span className="text-slate-400 p-1">
                  {isApprovalCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>
            </div>

            {!isApprovalCollapsed && (
              <div className="space-y-3 pt-1">
                {approvalTasks.length > 0 ? approvalTasks.map(renderTaskCard) : (
                  <div className="text-slate-500 text-xs py-12 text-center border border-dashed border-slate-800/60 rounded-xl">
                    No pending HITL approvals
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. AGENT RUNNING COLUMN */}
        <div className={`transition-all duration-300 w-full ${isRunningCollapsed ? 'md:w-52 md:flex-none' : 'flex-1'}`}>
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3 min-h-[400px]">
            <div 
              onClick={() => setIsRunningCollapsed(!isRunningCollapsed)}
              className="flex items-center justify-between text-xs font-bold text-yellow-400 pb-2 border-b border-slate-800 cursor-pointer hover:opacity-90"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                <span className="text-sm">Agent Running</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-mono text-xs border border-amber-500/30">
                  {runningTasks.length}
                </span>
                <span className="text-slate-400 p-1">
                  {isRunningCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>
            </div>

            {!isRunningCollapsed && (
              <div className="space-y-3 pt-1">
                {runningTasks.length > 0 ? runningTasks.map(renderTaskCard) : (
                  <div className="text-slate-500 text-xs py-12 text-center border border-dashed border-slate-800 rounded-xl">
                    No active agent tasks
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. COMPLETED COLUMN */}
        <div className={`transition-all duration-300 w-full ${isDoneCollapsed ? 'md:w-52 md:flex-none' : 'flex-1'}`}>
          <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3 min-h-[400px]">
            <div 
              onClick={() => setIsDoneCollapsed(!isDoneCollapsed)}
              className="flex items-center justify-between text-xs font-bold text-emerald-400 pb-2 border-b border-slate-800 cursor-pointer hover:opacity-90"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono text-xs border border-emerald-500/30">
                  {doneTasks.length}
                </span>
                <span className="text-slate-400 p-1">
                  {isDoneCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>
            </div>

            {!isDoneCollapsed && (
              <div className="space-y-3 pt-1">
                {doneTasks.length > 0 ? doneTasks.map(renderTaskCard) : (
                  <div className="text-slate-500 text-xs py-12 text-center border border-dashed border-slate-800 rounded-xl">
                    No completed tasks
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
