import React from 'react';

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-slate-800 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold text-white">Create New Master TODO Task</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Book dental cleaning..."
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional task details..."
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
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
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold rounded-lg hover:brightness-110"
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card p-6 rounded-2xl border border-slate-800 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold text-white">Edit Task Details</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium">Task Title</label>
            <input
              type="text"
              value={task.title}
              onChange={e => onChange({ ...task, title: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              value={task.description || ''}
              onChange={e => onChange({ ...task, description: e.target.value })}
              className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Priority</label>
              <select
                value={task.priority}
                onChange={e => onChange({ ...task, priority: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
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
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
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
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold rounded-lg hover:brightness-110"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
