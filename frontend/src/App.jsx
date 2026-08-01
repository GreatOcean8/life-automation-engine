import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MasterKanbanBoard from './components/MasterKanbanBoard';
import VisualGraphInspector from './components/VisualGraphInspector';
import SkillEditor from './components/SkillEditor';
import { CreateTaskModal, EditTaskModal } from './components/TaskModals';

export default function App() {
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow', 'graph', 'skills'
  const [tasks, setTasks] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('master_orchestrator');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Polling real-time state every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resTasks, resNodes, resSkills] = await Promise.all([
        fetch('/api/tasks').then(res => res.json()),
        fetch('/api/graph/nodes').then(res => res.json()),
        fetch('/api/skills').then(res => res.json()),
      ]);
      setTasks(resTasks || []);
      setNodes(resNodes || []);
      setSkills(resSkills || []);
    } catch (err) {
      console.error("Error fetching state:", err);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, description: newTaskDesc, priority: 'MEDIUM' })
      });
      const created = await res.json();
      setTasks([...tasks, created]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsTaskModalOpen(false);
      showNotification(`Task "${created.title}" added to your Master TODO board!`);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchData();
      showNotification("Task deleted completely.");
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await fetch(`/api/tasks/${editingTask.task_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          status: editingTask.status
        })
      });
      fetchData();
      setEditingTask(null);
      showNotification("Task details updated successfully!");
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDelegateTask = async (taskId, targetSubagentId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/delegate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_subagent_id: targetSubagentId })
      });
      const updated = await res.json();
      fetchData();
      showNotification(`Task delegated to subagent.`);
    } catch (err) {
      console.error("Failed to delegate task:", err);
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}/approve`, { method: 'POST' });
      fetchData();
      showNotification("HITL Bill Payment approved & executed!");
    } catch (err) {
      console.error("Failed to approve task:", err);
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      fetchData();
      showNotification("Task dismissed.");
    } catch (err) {
      console.error("Failed to reject task:", err);
    }
  };

  const handleTriggerEmail = async () => {
    try {
      await fetch('/api/triggers/email-triage', { method: 'POST' });
      fetchData();
      showNotification("Triggered periodic Email Inbox & Bill Audit!");
    } catch (err) {
      console.error("Failed to trigger email scan:", err);
    }
  };

  const handleTriggerMarket = async () => {
    try {
      await fetch('/api/triggers/market-scan', { method: 'POST' });
      fetchData();
      showNotification("Triggered periodic Real Estate & Job Market scan!");
    } catch (err) {
      console.error("Failed to trigger market scan:", err);
    }
  };

  const handleTriggerReceiptScan = async () => {
    try {
      await fetch('/api/expenses/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: "base64_camera_receipt", mock_vendor: "Whole Foods" })
      });
      fetchData();
      showNotification("Multimodal Receipt Photo scanned & parsed into Expense Task!");
    } catch (err) {
      console.error("Failed to scan receipt:", err);
    }
  };

  const handleSaveSkill = async (skillData) => {
    try {
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData)
      });
      fetchData();
      showNotification(`Skill package "${skillData.name}" saved & hot-reloaded!`);
    } catch (err) {
      console.error("Failed to save skill:", err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
      showNotification(`Task status updated to ${newStatus}`);
    } catch (err) {
      console.error("Failed to update task status:", err);
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
        onRefresh={fetchData}
        onTriggerEmail={handleTriggerEmail}
        onTriggerMarket={handleTriggerMarket}
        onTriggerReceiptScan={handleTriggerReceiptScan}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'workflow' && (
          <MasterKanbanBoard
            tasks={tasks}
            onOpenCreateModal={() => setIsTaskModalOpen(true)}
            onOpenEditModal={setEditingTask}
            onDeleteTask={handleDeleteTask}
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
            onSelectNode={setSelectedNodeId}
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
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={newTaskTitle}
        setTitle={setNewTaskTitle}
        description={newTaskDesc}
        setDescription={setNewTaskDesc}
        onSubmit={handleCreateTask}
      />

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onChange={setEditingTask}
        onSubmit={handleUpdateTask}
      />
    </div>
  );
}
