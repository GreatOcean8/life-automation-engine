import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MasterKanbanBoard from './components/MasterKanbanBoard';
import VisualGraphInspector from './components/VisualGraphInspector';
import SkillEditor from './components/SkillEditor';
import { CreateTaskModal, EditTaskModal, ConfirmDeleteModal, AuditLogModal } from './components/TaskModals';

export default function App() {
  const [activeTab, setActiveTab] = useState('workflow');
  const [tasks, setTasks] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [skills, setSkills] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('master_orchestrator');

  // Modals & Notifications
  const [notification, setNotification] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        // Filter out archived tasks for main board view
        setTasks(data.filter(t => !t.is_archived && t.status !== 'ARCHIVED'));
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const fetchGraphNodes = async () => {
    try {
      const res = await fetch('/api/graph/nodes');
      if (res.ok) setNodes(await res.json());
    } catch (err) {
      console.error("Error fetching graph nodes:", err);
    }
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills');
      if (res.ok) setSkills(await res.json());
    } catch (err) {
      console.error("Error fetching skills:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setAuditLogs([]);
    }
  };


  const refreshAll = () => {
    fetchTasks();
    fetchGraphNodes();
    fetchSkills();
    fetchAuditLogs();
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      fetchTasks();
      fetchGraphNodes();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDescription })
      });
      if (res.ok) {
        showToast('Created new TODO task successfully!');
        setNewTitle('');
        setNewDescription('');
        setIsCreateModalOpen(false);
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to create task');
    }
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskToEdit) return;

    try {
      const res = await fetch(`/api/tasks/${taskToEdit.task_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskToEdit.title,
          description: taskToEdit.description,
          priority: taskToEdit.priority,
          status: taskToEdit.status
        })
      });
      if (res.ok) {
        showToast(`Updated task '${taskToEdit.title}'`);
        setTaskToEdit(null);
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to update task');
    }
  };

  const handleConfirmDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Moved task to Archive (revert available in Audit Log)');
        setTaskToDelete(null);
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to archive task');
    }
  };

  const handleRestoreTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/restore`, { method: 'POST' });
      if (res.ok) {
        showToast('Restored task back to active TODO list!');
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to restore task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Task status updated to ${newStatus}`);
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to move task');
    }
  };

  const handleDelegateTask = async (taskId, subagentId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/delegate?subagent_id=${subagentId}`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast(`Task delegated to ${subagentId}`);
        refreshAll();
      }
    } catch (err) {
      showToast('Delegation failed');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, { method: 'POST' });
      if (res.ok) {
        showToast('Approved task execution!');
        refreshAll();
      }
    } catch (err) {
      showToast('Approval failed');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (res.ok) {
        showToast('Rejected task');
        refreshAll();
      }
    } catch (err) {
      showToast('Rejection failed');
    }
  };

  const handleTriggerEmail = async () => {
    try {
      const res = await fetch('/api/triggers/email-triage', { method: 'POST' });
      if (res.ok) {
        showToast('Auditing email inbox for bills...');
        refreshAll();
      }
    } catch (err) {
      showToast('Trigger failed');
    }
  };

  const handleTriggerMarket = async () => {
    try {
      await fetch('/api/triggers/real-estate', { method: 'POST' });
      await fetch('/api/triggers/job-scanner', { method: 'POST' });
      showToast('Scanning real estate & job markets...');
      refreshAll();
    } catch (err) {
      showToast('Market scan failed');
    }
  };

  const handleTriggerReceiptScan = async () => {
    try {
      const res = await fetch('/api/triggers/expense-multimodal-scan', { method: 'POST' });
      if (res.ok) {
        showToast('Scanned physical receipt via camera!');
        refreshAll();
      }
    } catch (err) {
      showToast('Receipt scan failed');
    }
  };

  const handleSaveSkill = async (skillData) => {
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData)
      });
      if (res.ok) {
        showToast(`Saved and hot-reloaded skill '${skillData.name}'!`);
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to save skill');
    }
  };

  const handleRevertSkill = async (skillName, prevState) => {
    try {
      const res = await fetch(`/api/skills/${skillName}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prevState)
      });
      if (res.ok) {
        showToast(`Reverted skill '${skillName}' back to previous rules snapshot!`);
        refreshAll();
      }
    } catch (err) {
      showToast('Failed to revert skill');
    }
  };

  const handleRevertAuditEntry = async (auditId) => {

    try {
      const res = await fetch(`/api/audit-logs/${auditId}/revert`, { method: 'POST' });
      if (res.ok) {
        const updatedLogs = await res.json();
        if (Array.isArray(updatedLogs)) {
          setAuditLogs(updatedLogs);
        }
        showToast('Reverted action successfully!');
        refreshAll();
      } else {
        showToast('Failed to revert action');
      }
    } catch (err) {
      showToast('Failed to revert action');
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-xl shadow-amber-500/20 text-xs border border-amber-300 animate-bounce">
          {notification}
        </div>
      )}

      {/* Modular Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={refreshAll}
        onTriggerEmail={handleTriggerEmail}
        onTriggerMarket={handleTriggerMarket}
        onTriggerReceiptScan={handleTriggerReceiptScan}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        auditLogsCount={auditLogs.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'workflow' && (
          <MasterKanbanBoard
            tasks={tasks}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenEditModal={t => setTaskToEdit(t)}
            onDeleteTask={tId => setTaskToDelete(tasks.find(x => x.task_id === tId))}
            onDelegateTask={handleDelegateTask}
            onApproveTask={handleApproveTask}
            onRejectTask={handleRejectTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        )}

        {activeTab === 'graph' && (
          <VisualGraphInspector
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={id => setSelectedNodeId(id)}
          />
        )}

        {activeTab === 'skills' && (
          <SkillEditor
            skills={skills}
            onSaveSkill={handleSaveSkill}
          />
        )}
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={newTitle}
        setTitle={setNewTitle}
        description={newDescription}
        setDescription={setNewDescription}
        onSubmit={handleCreateTaskSubmit}
      />

      <EditTaskModal
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onChange={setTaskToEdit}
        onSubmit={handleEditTaskSubmit}
      />

      <ConfirmDeleteModal
        task={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        onRevertAuditEntry={handleRevertAuditEntry}
      />
    </div>
  );
}
