import React from 'react';
import { AlertTriangle, RotateCcw, History, Trash2, X, Check, Lock } from 'lucide-react';



export function CreateTaskModal({
  isOpen,
  onClose,
  title,
  setTitle,
  description,
  setDescription,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 w-full max-w-md space-y-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Create New Master TODO Task</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-amber-300 font-medium">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Book dental cleaning..."
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional task details..."
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 text-xs font-bold rounded-lg hover:brightness-110 shadow-lg shadow-amber-500/20"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditTaskModal({
  task,
  onClose,
  onChange,
  onSubmit
}) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 w-full max-w-md space-y-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Edit Task Details</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-amber-300 font-medium">Task Title</label>
            <input
              type="text"
              value={task.title}
              onChange={e => onChange({ ...task, title: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              value={task.description || ''}
              onChange={e => onChange({ ...task, description: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Priority</label>
              <select
                value={task.priority}
                onChange={e => onChange({ ...task, priority: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white cursor-pointer"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Status</label>
              <select
                value={task.status}
                onChange={e => onChange({ ...task, status: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white cursor-pointer"
              >
                <option value="TODO">TODO</option>
                <option value="RUNNING">RUNNING</option>
                <option value="WAITING_FOR_APPROVAL">WAITING_FOR_APPROVAL</option>
                <option value="DONE">DONE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 text-xs font-bold rounded-lg hover:brightness-110 shadow-lg shadow-amber-500/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({
  task,
  onClose,
  onConfirm
}) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-rose-500/40 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center space-x-3 text-rose-400">
          <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Confirm Task Deletion</h2>
            <p className="text-xs text-slate-400">Prevent accidental loss with soft-delete archiving.</p>
          </div>
        </div>

        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1">
          <div className="text-white font-semibold">{task.title}</div>
          <div className="text-slate-400">Task will be moved to Archive and can be restored anytime from Audit Logs.</div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(task.task_id)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-rose-600/20 flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
}

class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AuditLogModal ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-rose-500/40 w-full max-w-md space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Audit Log Display Issue</h3>
            <p className="text-xs text-slate-300 font-medium">An unexpected formatting error occurred while rendering activity audit logs.</p>
            <p className="text-[10px] text-rose-400 font-mono bg-slate-900 p-2 rounded border border-rose-500/20 truncate">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onClose) this.props.onClose();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700"
            >
              Close Audit Drawer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuditLogModalInner({
  isOpen,
  onClose,
  auditLogs,
  onRevertAuditEntry
}) {
  const [categoryFilter, setCategoryFilter] = React.useState('ALL'); // ALL, TASKS, SKILLS
  const [targetFilter, setTargetFilter] = React.useState('ALL');
  const [searchText, setSearchText] = React.useState('');

  if (!isOpen) return null;

  const safeLogs = Array.isArray(auditLogs) ? auditLogs : [];

  // Build friendly target list from audit logs defensively
  const targetOptions = React.useMemo(() => {
    const map = new Map();
    safeLogs.forEach(log => {
      if (!log || !log.target_id) return;
      if (!map.has(log.target_id)) {
        let label = String(log.target_id);
        const actionType = String(log.action_type || '');
        if (actionType.startsWith('SKILL')) {
          label = `Skill: ${log.target_id}`;
        } else if (actionType.startsWith('TASK')) {
          const rawDetails = typeof log.details === 'string' ? log.details : '';
          const newStateTitle = typeof log.new_state === 'object' && log.new_state !== null ? log.new_state.title : null;
          const prevStateTitle = typeof log.previous_state === 'object' && log.previous_state !== null ? log.previous_state.title : null;
          const taskTitle = newStateTitle || prevStateTitle || rawDetails.replace(/^(Created task|Archived task|Restored task|Updated details for) '(.*)'$/, '$2');
          label = `Task: ${taskTitle || log.target_id}`;
        }
        map.set(log.target_id, { id: log.target_id, label, isSkill: actionType.startsWith('SKILL') });
      }
    });
    return Array.from(map.values());
  }, [safeLogs]);

  // Filter logs based on category, target, and search text
  const filteredLogs = safeLogs.filter(log => {
    if (!log) return false;
    const actionType = String(log.action_type || '');

    // 1. Category Filter
    if (categoryFilter === 'TASKS' && !actionType.startsWith('TASK')) return false;
    if (categoryFilter === 'SKILLS' && !actionType.startsWith('SKILL')) return false;

    // 2. Target Filter
    if (targetFilter !== 'ALL' && log.target_id !== targetFilter) return false;

    // 3. Search Text Filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matchDetails = String(log.details || '').toLowerCase().includes(q);
      const matchTarget = String(log.target_id || '').toLowerCase().includes(q);
      const matchAction = actionType.toLowerCase().includes(q);
      if (!matchDetails && !matchTarget && !matchAction) return false;
    }
    return true;
  });

  const formatNYTime = (isoStr) => {
    if (!isoStr || typeof isoStr !== 'string') return '';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) {
        return isoStr.length >= 19 ? isoStr.slice(11, 19) : isoStr;
      }
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date) + ' EDT';
    } catch (e) {
      return (isoStr || '').slice(11, 19);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 w-full max-w-3xl space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Activity Audit Trail & Revert Engine</h2>
              <p className="text-xs text-slate-400">Track all changes, filter history, and revert tasks or skill rules.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md text-[10px] font-mono">
              🕒 NY Time (America/New_York)
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition ${categoryFilter === 'ALL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setCategoryFilter('TASKS')}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition ${categoryFilter === 'TASKS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Tasks Only
            </button>
            <button
              onClick={() => setCategoryFilter('SKILLS')}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition ${categoryFilter === 'SKILLS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Skills Only
            </button>
          </div>

          {/* Target/Skill Selector Dropdown */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500/50 truncate max-w-full"
          >
            <option value="ALL">All Targets ({targetOptions.length})</option>
            {targetOptions.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search details..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Audit Logs Item List */}
        <div className="flex-1 overflow-auto space-y-2.5 pr-1">
          {filteredLogs.length > 0 ? filteredLogs.map(log => (
            <div key={log.id || Math.random()} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5 flex items-start justify-between hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    log.action_type === 'TASK_DELETED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    log.action_type === 'SKILL_UPDATED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    log.action_type === 'SKILL_REVERTED' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    log.action_type === 'TASK_RESTORED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {log.action_type || 'EVENT'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatNYTime(log.timestamp)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">by {log.author || 'System'}</span>
                </div>
                <div className="text-slate-200 font-medium">{log.details || 'Activity event'}</div>
              </div>

              {log.is_reverted ? (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px] font-medium flex items-center space-x-1 shrink-0 ml-2">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Reverted</span>
                </span>
              ) : log.can_revert ? (
                <button
                  onClick={() => typeof onRevertAuditEntry === 'function' && onRevertAuditEntry(log.id)}
                  className={`px-3 py-1 border rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 ml-2 ${
                    log.action_type === 'SKILL_UPDATED' ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40' :
                    log.action_type === 'SKILL_REVERTED' ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40' :
                    log.action_type === 'TASK_DELETED' ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40' :
                    'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {log.action_type === 'SKILL_UPDATED' ? 'Revert Skill' :
                     log.action_type === 'SKILL_REVERTED' ? 'Undo Revert' :
                     log.action_type === 'TASK_DELETED' ? 'Restore Task' :
                     'Undo Restore'}
                  </span>
                </button>
              ) : log.is_blocked ? (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-medium flex items-center space-x-1 shrink-0 ml-2" title="You must revert newer changes for this target first">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Revert newer change first</span>
                </span>
              ) : null}
            </div>
          )) : (
            <div className="text-slate-500 text-xs py-12 text-center">No activity audit logs found matching filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditLogModal(props) {
  if (!props.isOpen) return null;
  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <AuditLogModalInner {...props} />
    </ModalErrorBoundary>
  );
}




