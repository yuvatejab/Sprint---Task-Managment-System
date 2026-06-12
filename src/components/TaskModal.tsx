import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, AlertTriangle, FileText, Upload, 
  Trash2, Plus, Clock, ExternalLink, Image, Paperclip, 
  CheckCircle, MessageSquare, ListTodo, ShieldAlert
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskActivity, TaskAttachment } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null; // If provided, we are editing. If null, we are creating.
  onSave: (taskData: any) => Promise<void>;
  token: string;
}

export default function TaskModal({ isOpen, onClose, task, onSave, token }: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'attachments'>('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Attachments & logs
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);

  // Local errors / file load triggers
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setAttachments(task.attachments || []);
      setActivities(task.activities || []);
      setActiveTab('details');
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate.toISOString().split('T')[0]);
      setAttachments([]);
      setActivities([]);
      setActiveTab('details');
    }
    setError(null);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('A task title is required.');
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: new Date(dueDate).toISOString(),
      attachments // pass along if editing other tabs
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the task.');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // File Upload Management
  // ----------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setError(null);
    setFileLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const response = await fetch(`/api/tasks/${task.id}/attachments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: file.name,
            url: base64String,
            type: file.type.startsWith('image/') ? 'image' : 'document'
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to upload attachment');

        setAttachments(prev => [...prev, data]);
        
        // Push in a fresh activity log entry mimicking the server update
        const newLog: TaskActivity = {
          id: Math.random().toString(36),
          action: 'attachment_added',
          details: `Added file attachment: "${file.name}"`,
          userEmail: task.userEmail || 'You',
          timestamp: new Date().toISOString()
        };
        setActivities(prev => [newLog, ...prev]);

      } catch (err: any) {
        setError(err.message || 'Failed to attach file');
      } finally {
        setFileLoading(false);
      }
    };

    reader.onerror = () => {
      setError('FileReader encountered an error encoding file.');
      setFileLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const selectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop with Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/40 dark:bg-black/60 backdrop-blur-md"
      />

      {/* Modal Surface with Spring Physics */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
          mass: 0.95
        }}
        className="relative w-full max-w-2xl apple-glass rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.4)] overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200/25 dark:border-zinc-900/35 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-neutral-950 dark:text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-neutral-700 dark:text-zinc-300 stroke-[1.5]" />
              {task ? 'Amend Deliverable Details' : 'Orchestrate New Task'}
            </h3>
            {task && (
              <p className="text-[10px] font-mono text-neutral-400 dark:text-zinc-550 mt-1 uppercase tracking-wider">
                ID: {task.id.slice(0, 8)} • OWNER: {task.userEmail}
              </p>
            )}
          </div>
          <button
            id="close-modal-trigger"
            onClick={onClose}
            className="p-1 px-2.5 rounded-xl border border-neutral-200/30 dark:border-zinc-800/40 text-neutral-450 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-all cursor-pointer text-xs select-none"
          >
            Cancel
          </button>
        </div>

        {/* Segmented Tab Selection Navigator */}
        {task && (
          <div className="px-6 py-3 bg-neutral-50/20 dark:bg-zinc-950/25 border-b border-neutral-205/20 dark:border-zinc-90 w-full">
            <div className="flex p-0.5 bg-neutral-150/40 dark:bg-zinc-900/60 border border-neutral-205/15 dark:border-zinc-800/30 rounded-2xl max-w-md select-none">
              <button
                id="details-tab-trigger"
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-1.5 px-3 text-[11px] font-semibold tracking-tight rounded-xl transition-all ${
                  activeTab === 'details'
                    ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm border border-neutral-205/20 dark:border-zinc-750/30'
                    : 'text-neutral-450 hover:text-neutral-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                Requirements
              </button>
              <button
                id="attachments-tab-trigger"
                type="button"
                onClick={() => setActiveTab('attachments')}
                className={`flex-1 py-1.5 px-3 text-[11px] font-semibold tracking-tight rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'attachments'
                    ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm border border-neutral-205/20 dark:border-zinc-750/30'
                    : 'text-neutral-450 hover:text-neutral-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                Attachments
                <span className="bg-neutral-200/70 dark:bg-zinc-750 text-neutral-500 dark:text-zinc-400 font-mono text-[9px] px-1.5 py-0.5 rounded-full">
                  {attachments.length}
                </span>
              </button>
              <button
                id="activities-tab-trigger"
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`flex-1 py-1.5 px-3 text-[11px] font-semibold tracking-tight rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'activities'
                    ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm border border-neutral-205/20 dark:border-zinc-750/30'
                    : 'text-neutral-450 hover:text-neutral-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                History
                <span className="bg-neutral-200/70 dark:bg-zinc-750 text-neutral-500 dark:text-zinc-400 font-mono text-[9px] px-1.5 py-0.5 rounded-full">
                  {activities.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'details' && (
              <motion.form
                id="task-details-form"
                key="details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-neutral-450 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                    Task Title *
                  </label>
                  <input
                    id="task-title-input"
                    type="text"
                    required
                    className="block w-full px-4 py-2.5 bg-neutral-100/40 dark:bg-zinc-905/50 border border-neutral-200/45 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-150"
                    placeholder="e.g. Conduct compliance security scan"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-450 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="task-description-input"
                    rows={4}
                    className="block w-full px-4 py-2.5 bg-neutral-100/40 dark:bg-zinc-905/50 border border-neutral-200/45 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-150"
                    placeholder="Provide supportive parameters, instructions, links or requirements..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-450 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                      Status Level
                    </label>
                    <select
                      id="task-status-dropdown"
                      className="block w-full px-3 py-2.5 bg-neutral-100/40 dark:bg-zinc-905/50 border border-neutral-200/45 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={status}
                      onChange={e => setStatus(e.target.value as TaskStatus)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-450 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                      Priority Rank
                    </label>
                    <select
                      id="task-priority-dropdown"
                      className="block w-full px-3 py-2.5 bg-neutral-100/40 dark:bg-zinc-905/50 border border-neutral-200/45 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={priority}
                      onChange={e => setPriority(e.target.value as TaskPriority)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[11px] font-bold text-neutral-450 dark:text-zinc-450 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      Target Due Date
                    </label>
                    <input
                      id="task-duedate-picker"
                      type="date"
                      required
                      className="block w-full px-3 py-2 bg-neutral-100/40 dark:bg-zinc-905/50 border border-neutral-200/45 dark:border-zinc-800/50 rounded-2xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4.5 border-t border-neutral-200/25 dark:border-zinc-900/35 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold border border-neutral-200/40 dark:border-zinc-805 rounded-xl text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="save-task-submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 select-none shadow-[0_2px_8px_rgba(59,130,246,0.15)]"
                  >
                    {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {task ? 'Commit Details' : 'Create Task'}
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'attachments' && (
              <motion.div
                key="attachments"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Drag / Drop visual area */}
                <div 
                  onClick={selectFile}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50/30 dark:bg-gray-900/20 cursor-pointer transition-all duration-200 group"
                >
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-750 shadow-sm text-gray-400 group-hover:text-emerald-500 group-hover:scale-110 transition-transform duration-200">
                    {fileLoading ? (
                      <span className="block w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload document attachment</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Image, PDF, Word, or plain-text files supported</p>
                  </div>
                </div>

                {/* Attachments List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Attached Dossiers ({attachments.length})</h4>
                  
                  {attachments.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-505 bg-gray-50/10 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                      No files are currently attached to this task.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="attachments-pool-grid">
                      {attachments.map((file) => (
                        <div 
                          key={file.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
                        >
                          <div className="flex items-center gap-3 overflow-hidden pr-2">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-emerald-500 shrink-0">
                              {file.type === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown Date'}
                              </p>
                            </div>
                          </div>
                          
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition cursor-pointer"
                            title="Open / View Attachment"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'activities' && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 col-span-2">Comprehensive Change Ledger</h4>
                  <div className="text-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Audit Compliant
                  </div>
                </div>

                <div className="relative border-l-2 border-gray-100 dark:border-gray-800 pl-5 ml-2.5 space-y-6 max-h-[40vh] overflow-y-auto pr-2" id="audit-logs-timeline">
                  {activities.length === 0 ? (
                    <div className="text-sm text-gray-400 dark:text-gray-500 py-2">No logs found.</div>
                  ) : (
                    activities.map((log, index) => (
                      <div key={log.id || index} className="relative">
                        {/* Timeline node */}
                        <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 bg-emerald-500 shadow-sm" />
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold font-mono text-gray-800 dark:text-gray-200">
                              {log.action.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">•</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-medium">
                              {log.userEmail}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {log.details}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
