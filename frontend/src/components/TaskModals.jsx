import React from 'react';
import { AlertTriangle, RotateCcw, History, Trash2, X } from 'lucide-react';

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

export function AuditLogModal({
  isOpen,
  onClose,
  auditLogs,
  onRestoreTask,
  onRevertSkill
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 w-full max-w-2xl space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Activity Audit Trail & Revert History</h2>
              <p className="text-xs text-slate-400">Track all changes and revert soft-deleted tasks or skill rules.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto space-y-2.5 pr-1">
          {auditLogs.length > 0 ? auditLogs.map(log => (
            <div key={log.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    log.action_type === 'TASK_DELETED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    log.action_type === 'SKILL_UPDATED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    log.action_type === 'TASK_RESTORED' || log.action_type === 'SKILL_REVERTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {log.action_type}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{log.timestamp.slice(11, 19)}</span>
                  <span className="text-[11px] text-slate-400 font-medium">by {log.author}</span>
                </div>
                <div className="text-slate-200 font-medium">{log.details}</div>
              </div>

              {log.is_reverted ? (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px] font-medium flex items-center space-x-1 shrink-0 ml-2">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Reverted</span>
                </span>
              ) : log.can_revert ? (
                <>
                  {log.action_type === 'TASK_DELETED' && (
                    <button
                      onClick={() => onRestoreTask(log.target_id)}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 ml-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Task</span>
                    </button>
                  )}

                  {log.action_type === 'SKILL_UPDATED' && log.previous_state && (
                    <button
                      onClick={() => onRevertSkill(log.target_id, log.previous_state)}
                      className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 ml-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revert Skill</span>
                    </button>
                  )}
                </>
              ) : null}
            </div>
          )) : (

            <div className="text-slate-500 text-xs py-12 text-center">No activity audit logs recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

