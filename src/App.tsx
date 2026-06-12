import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, ListFilter, SlidersHorizontal, LogOut, 
  LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw, 
  ShieldAlert, Sparkles, CheckSquare, Layers, Clock, ShieldCheck, HelpCircle,
  Download, Shield
} from 'lucide-react';

import AuthCard from './components/AuthCard';
import AdminManager from './components/AdminManager';
import ThemeToggle from './components/ThemeToggle';
import StatsGrid from './components/StatsGrid';
import TaskBoard from './components/TaskBoard';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import { Task, TaskStatus, TaskPriority } from './types';

const GlassBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
    {/* Ambient gradient circles */}
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/8 dark:bg-blue-600/4 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
    <div className="absolute bottom-[20%] left-[25%] w-[35%] h-[35%] rounded-full bg-emerald-500/6 dark:bg-emerald-600/3 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
    <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-500/8 dark:bg-indigo-600/4 blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
    <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/6 dark:bg-purple-600/3 blur-[130px] animate-pulse" style={{ animationDuration: '11s' }} />
    {/* Subtle grid pattern background overlay if wanted */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
  </div>
);

export default function App() {
  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // View mode switcher: 'tasks' default or 'admin'
  const [viewMode, setViewMode] = useState<'tasks' | 'admin'>('tasks');

  // Task lists and pagination
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  
  // Query Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // App layouts: 'board' (Kanban) or 'list'
  const [layoutMode, setLayoutMode] = useState<'board' | 'list'>('board');

  // Trigger states for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ----------------------------------------------------
  // Persistent login lifecycle hook
  // ----------------------------------------------------
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    const cachedToken = localStorage.getItem('auth_token');

    if (cachedUser && cachedToken) {
      try {
        setUser(JSON.parse(cachedUser));
        setToken(cachedToken);
      } catch (err) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setAuthLoading(false);
  }, []);

  // ----------------------------------------------------
  // Fetch Tasks with query builders
  // ----------------------------------------------------
  const fetchTasks = async (resetPageToFirst = false) => {
    if (!token) return;
    setTasksLoading(true);
    setTasksError(null);

    const targetPage = resetPageToFirst ? 1 : page;
    if (resetPageToFirst) setPage(1);

    const queryParams = new URLSearchParams({
      search,
      status: statusFilter,
      priority: priorityFilter,
      sortBy,
      sortOrder,
      page: targetPage.toString(),
      limit: '12' // Fetch 12 items per page for tidy grids
    });

    try {
      const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch task listings');
      }

      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
      setTotalTasks(data.totalTasks || 0);
    } catch (err: any) {
      setTasksError(err.message || 'Underlying database failed to synchronize.');
    } finally {
      setTasksLoading(false);
    }
  };

  // Re-fetch when filter status, priority, sort or page updates
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, statusFilter, priorityFilter, sortBy, sortOrder, page]);

  // Handle manual Enter / search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks(true);
  };

  const clearSearch = () => {
    setSearch('');
    // Wait for state batching then fetch
    setTimeout(() => {
      fetchTasks(true);
    }, 10);
  };

  // ----------------------------------------------------
  // Operations section
  // ----------------------------------------------------
  const handleAuthSuccess = (authUser: any, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    localStorage.setItem('auth_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setTasks([]);
    setViewMode('tasks');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  // Core Orchestrator handler: Task creation or updates
  const handleSaveTask = async (taskPayload: any) => {
    if (!token) return;

    const method = selectedTask ? 'PATCH' : 'POST';
    const endpoint = selectedTask ? `/api/tasks/${selectedTask.id}` : '/api/tasks';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to execute task mutation');
    }

    // Refresh layout page content
    fetchTasks();
  };

  // ----------------------------------------------------
  // ADVANCED OPTIMISTIC UI: Status toggler complete with fallback logic
  // ----------------------------------------------------
  const handleToggleComplete = async (targetTask: Task) => {
    if (!token) return;

    // Cache the original array state in case we encounter exceptions
    const originalTasks = [...tasks];
    
    // Compute targeted toggle value
    const isNowCompleted = targetTask.status === 'completed';
    const nextStatus: TaskStatus = isNowCompleted ? 'in-progress' : 'completed';

    // 1. Optimistic Update: instantly update React state
    setTasks(prevTasks => 
      prevTasks.map(t => {
        if (t.id === targetTask.id) {
          // Append client-side activity projection to preserve history list feel
          const projectedLog = {
            id: 'optimistic-log-' + Math.random(),
            action: 'status_updated',
            details: `Status toggled to "${nextStatus}" (pending database confirmation)`,
            userEmail: user?.email || 'You',
            timestamp: new Date().toISOString()
          };
          return {
            ...t,
            status: nextStatus,
            activities: [projectedLog, ...(t.activities || [])]
          };
        }
        return t;
      })
    );

    // 2. Transmit Background Network Command
    try {
      const response = await fetch(`/api/tasks/${targetTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change task status on server');
      }

      // Successful update: Replace the optimistic record with server-confirmed values
      setTasks(prevTasks => prevTasks.map(t => (t.id === targetTask.id ? data : t)));
    } catch (err: any) {
      // 3. Rollback Action: Revert the tasks back because backend failed
      console.warn("Optimistic status change failed. Reverting...", err);
      setTasks(originalTasks);
      setTasksError(`Action Failed: Could not update "${targetTask.title}". Reverted changes.`);
      
      // Auto fade errors after 4 seconds
      setTimeout(() => {
        setTasksError(null);
      }, 4000);
    }
  };

  // ----------------------------------------------------
  // ADVANCED OPTIMISTIC UI: Status modification with drag and drop
  // ----------------------------------------------------
  const handleUpdateTaskStatus = async (taskId: string, nextStatus: TaskStatus) => {
    if (!token) return;

    const originalTasks = [...tasks];
    const targetTask = originalTasks.find(t => t.id === taskId);
    if (!targetTask) return;
    if (targetTask.status === nextStatus) return; // No change needed

    // 1. Optimistic Update: instantly move columns
    setTasks(prevTasks => 
      prevTasks.map(t => {
        if (t.id === taskId) {
          const projectedLog = {
            id: 'optimistic-log-' + Math.random(),
            action: 'status_updated',
            details: `Status updated to "${nextStatus}" via drag and drop`,
            userEmail: user?.email || 'You',
            timestamp: new Date().toISOString()
          };
          return {
            ...t,
            status: nextStatus,
            activities: [projectedLog, ...(t.activities || [])]
          };
        }
        return t;
      })
    );

    // 2. Transmit Background Network Command
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to modify task status on server');
      }

      // Re-fetch or replace with actual server data to update activity history and timestamp
      setTasks(prevTasks => prevTasks.map(t => (t.id === taskId ? data : t)));
    } catch (err: any) {
      // 3. Rollback Logic
      console.warn("Optimistic drag status change failed. Reverting...", err);
      setTasks(originalTasks);
      setTasksError(`Action Failed: Could not move "${targetTask.title}" columns.`);
      
      setTimeout(() => {
        setTasksError(null);
      }, 4000);
    }
  };

  // ----------------------------------------------------
  // ADVANCED OPTIMISTIC UI: Task deletion complete with fallback logic
  // ----------------------------------------------------
  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const confirmDeletion = window.confirm(`Are you sure you want to delete "${targetTask.title}"? This is irreversible.`);
    if (!confirmDeletion) return;

    // Cache local state before deleting
    const originalTasks = [...tasks];

    // 1. Optimistic Update: instantly slice from tasks state
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    setTotalTasks(prev => Math.max(0, prev - 1));

    // 2. Dispatch Server delete
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected deleting task');
      }

      // Everything succeeds, refresh stats securely
      fetchTasks();
    } catch (err: any) {
      // 3. Rollback Logic
      console.warn("Optimistic deletion failed. Reverting...", err);
      setTasks(originalTasks);
      setTotalTasks(originalTasks.length);
      setTasksError(`Deletion Failed: Could not erase "${targetTask.title}". Reverted cards on board.`);

      setTimeout(() => {
        setTasksError(null);
      }, 4500);
    }
  };

  // ----------------------------------------------------
  // Open Modals helper
  // ----------------------------------------------------
  const openCreateModal = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // ----------------------------------------------------
  // CSV Export utility of current view's tasks
  // ----------------------------------------------------
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      alert("No tasks available to export in the current view.");
      return;
    }

    // Define columns
    const headers = [
      'Task ID', 
      'Title', 
      'Description', 
      'Status', 
      'Priority', 
      'Target Date', 
      'Creator Email', 
      'Created At', 
      'Updated At',
      'Number of Attachments',
      'Number of Activities'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    // Convert task list to rows
    for (const task of tasks) {
      const values = [
        task.id,
        task.title || '',
        task.description || '',
        task.status,
        task.priority,
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        task.userEmail || '',
        task.createdAt ? new Date(task.createdAt).toISOString() : '',
        task.updatedAt ? new Date(task.updatedAt).toISOString() : '',
        task.attachments ? task.attachments.length.toString() : '0',
        task.activities ? task.activities.length.toString() : '0'
      ];

      // Format line according to standard CSV guidelines (escaping quotes, nesting commas)
      const mappedLine = values.map(val => {
        const cleaned = String(val).replace(/"/g, '""');
        if (cleaned.includes(',') || cleaned.includes('\n') || cleaned.includes('\r') || cleaned.includes('"')) {
          return `"${cleaned}"`;
        }
        return cleaned;
      }).join(',');

      csvRows.push(mappedLine);
    }

    // Download the blob
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    
    const viewName = `${statusFilter}_${priorityFilter}`.toLowerCase();
    downloadAnchor.setAttribute('download', `tasks_${viewName}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center relative">
        <GlassBackground />
        <span className="w-8 h-8 border-2 border-neutral-300 dark:border-zinc-805 border-t-neutral-800 dark:border-t-white rounded-full animate-spin mb-4" />
        <h4 className="text-xs font-medium text-neutral-500 dark:text-zinc-400 font-sans tracking-tight">Syncing secure parameters...</h4>
      </div>
    );
  }

  // Not authenticated? Show the Authentication Login screen
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-transparent transition-colors duration-300 py-16 px-4 relative">
        <GlassBackground />
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
          {/* Header */}
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="p-3 bg-neutral-100/70 dark:bg-zinc-900/60 border border-neutral-200/20 dark:border-zinc-800/20 text-neutral-800 dark:text-neutral-100 rounded-3xl shadow-sm mb-4">
              <Layers className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-sans">
              S.P.R.I.N.T
            </h1>
            <p className="text-neutral-400 dark:text-zinc-500 text-[10px] tracking-wider mt-2.5 uppercase font-mono">
              Task managment System
            </p>
          </div>

          <AuthCard onAuthSuccess={handleAuthSuccess} />
          
          <div className="fixed bottom-6 right-6">
            <ThemeToggle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-neutral-900 dark:text-neutral-100 transition-colors duration-300 pb-16 relative">
      <GlassBackground />
      {/* Top Navigation Panel bar */}
      <nav className="sticky top-0 z-40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-2xl border-b border-neutral-200/20 dark:border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* App title logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl shadow-sm shrink-0">
              <Layers className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5 leading-none">
                S.P.R.I.N.T
                <span className="text-[10px] font-mono bg-neutral-100/80 dark:bg-zinc-900 text-neutral-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                  v1.2
                </span>
              </h1>
              <p className="text-[9px] text-neutral-400 dark:text-zinc-550 tracking-wider mt-1.5 uppercase font-mono">
                Task managment System
              </p>
            </div>
          </div>

          {/* User account tags & actions */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Admin role indicator badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-neutral-200/35 dark:border-zinc-800/40 bg-neutral-100/50 dark:bg-zinc-900/40 shadow-[0_2px_8px_rgba(0,0,0,0.01)] text-xs select-none">
              {user.role === 'admin' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-[10px] tracking-widest">OVERSEER</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-neutral-600 dark:text-zinc-400 font-mono text-[10px] tracking-widest uppercase">CONTRIBUTOR ({user.email.split('@')[0]})</span>
                </>
              )}
            </div>

            {user.role === 'admin' && (
              <button
                id="admin-deck-toggle-trigger"
                onClick={() => setViewMode(viewMode === 'admin' ? 'tasks' : 'admin')}
                className={`p-1.5 px-3 rounded-2xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-200 cursor-pointer select-none ${
                  viewMode === 'admin'
                    ? 'bg-amber-500/15 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_1px_8px_rgba(245,158,11,0.15)]'
                    : 'bg-white/50 dark:bg-zinc-900/60 hover:bg-neutral-100 dark:hover:bg-zinc-850 text-neutral-600 dark:text-zinc-300 border-neutral-200/40 dark:border-zinc-800/55 shadow-xs'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>{viewMode === 'admin' ? 'Tasks Board' : 'Overseer Deck'}</span>
              </button>
            )}

            <ThemeToggle />

            <button
              id="user-logout-trigger"
              onClick={handleLogout}
              className="p-1.5 px-3 rounded-2xl text-neutral-500 hover:text-red-500 hover:bg-red-500/5 border border-neutral-200/40 dark:border-zinc-800/55 bg-white/50 dark:bg-zinc-900/60 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold select-none"
              title="Sign Out Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {viewMode === 'admin' && user.role === 'admin' ? (
          <AdminManager token={token} currentUser={user} onBackToBoard={() => setViewMode('tasks')} />
        ) : (
          <>
            {/* Floating Admin Banner Warnings */}
        {user.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 shrink-0 animate-spin" />
            <span>Logged in as <b>Administrator</b>. You can view, modify, and audit task cards across all company personnel.</span>
          </motion.div>
        )}

        {tasksError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-start gap-2.5 text-orange-700 dark:text-orange-400 text-xs"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice Event</p>
              <p className="mt-0.5">{tasksError}</p>
            </div>
          </motion.div>
        )}

        {/* Dashboard KPIs statistics */}
        <StatsGrid tasks={tasks} />

        {/* Filters, layout modes, Search panel bar */}
        <div className="apple-glass rounded-3xl p-5 mb-6 shadow-[0_12px_40px_-5px_rgba(0,0,0,0.03)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            
            {/* Search tasks by title */}
            <form onSubmit={handleSearchSubmit} className="w-full xl:w-80 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-zinc-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  id="search-input-field"
                  type="text"
                  className="block w-full pl-9 pr-6 py-2 border border-neutral-200/50 dark:border-zinc-800/60 bg-neutral-100/50 dark:bg-zinc-900/50 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder-neutral-450 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search task title/details..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    type="button" 
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="submit"
                id="search-button-trigger"
                className="px-4 py-2 text-xs font-semibold rounded-2xl text-white bg-neutral-905 dark:bg-zinc-800 hover:bg-neutral-950 dark:hover:bg-zinc-700 transition duration-200 cursor-pointer shrink-0 select-none"
              >
                Find
              </button>
            </form>

            {/* Dynamic filter selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  id="status-filter-dropdown"
                  className="px-3 py-1.5 bg-neutral-100/60 dark:bg-zinc-900/50 border border-neutral-200/40 dark:border-zinc-800/50 text-[11px] font-medium text-neutral-700 dark:text-zinc-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <select
                id="priority-filter-dropdown"
                className="px-3 py-1.5 bg-neutral-100/60 dark:bg-zinc-900/50 border border-neutral-200/40 dark:border-zinc-800/50 text-[11px] font-medium text-neutral-700 dark:text-zinc-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <option value="all">Priority: All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Sort field */}
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  id="sort-by-dropdown"
                  className="px-3 py-1.5 bg-neutral-100/60 dark:bg-zinc-900/50 border border-neutral-200/40 dark:border-zinc-800/50 text-[11px] font-medium text-neutral-700 dark:text-zinc-300 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="createdAt">Sort: Date Written</option>
                </select>

                {/* Sort Order switchers */}
                <button
                  type="button"
                  id="sort-order-toggle"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 px-2.5 rounded-xl border border-neutral-200/40 dark:border-zinc-800/50 bg-neutral-100/60 dark:bg-zinc-900/50 text-neutral-500 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-white text-xs cursor-pointer select-none transition"
                  title="Toggle Order"
                >
                  <span className="font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                </button>
              </div>

              {/* Layout mode buttons - Apple segment design */}
              <div className="flex p-0.5 bg-neutral-100/80 dark:bg-zinc-900/70 border border-neutral-200/20 dark:border-zinc-800/30 rounded-2xl md:ml-0">
                <button
                  id="layout-mode-board"
                  type="button"
                  className={`p-1.5 px-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                    layoutMode === 'board' 
                      ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm border border-neutral-250/20 dark:border-zinc-750/30' 
                      : 'text-neutral-400 hover:text-neutral-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}
                  onClick={() => setLayoutMode('board')}
                  title="Kanban Board"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  id="layout-mode-list"
                  type="button"
                  className={`p-1.5 px-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                    layoutMode === 'list' 
                      ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm border border-neutral-250/20 dark:border-zinc-750/30' 
                      : 'text-neutral-400 hover:text-neutral-600 dark:text-zinc-500 dark:hover:text-zinc-300'
                  }`}
                  onClick={() => setLayoutMode('list')}
                  title="Compact List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                id="export-csv-trigger"
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-semibold rounded-2xl border border-neutral-200/40 dark:border-zinc-805 bg-white/50 dark:bg-zinc-900/40 text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-850 hover:shadow-sm transition cursor-pointer shrink-0 flex items-center gap-1.5 select-none"
                title="Export list as CSV"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-zinc-450" /> Export CSV
              </button>

              <button
                type="button"
                id="create-task-floating-trigger"
                onClick={openCreateModal}
                className="px-4 py-2 text-xs font-semibold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 select-none"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>

            </div>
          </div>
        </div>

        {/* Main tasks containers (board / lists) */}
        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200/45 dark:bg-gray-900/40 rounded-2xl p-5 border border-transparent h-96 shimmer-bg flex flex-col gap-3">
                <div className="h-6 w-2/3 bg-gray-300/40 dark:bg-gray-800/50 rounded-md" />
                <div className="h-4 w-full bg-gray-300/30 dark:bg-gray-800/30 rounded-md mt-4" />
                <div className="h-4 w-5/6 bg-gray-300/30 dark:bg-gray-800/30 rounded-md" />
                <div className="h-10 w-full bg-gray-300/40 dark:bg-gray-800/40 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {tasks.length === 0 ? (
              <div className="text-center py-24 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-750 text-gray-400 rounded-2xl mb-4 shadow-sm shrink-0">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">No deliverables recorded yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  Establish parameters, target deadlines, and track milestones on your team taskboard.
                </p>
                <button
                  id="create-task-empty-trigger"
                  onClick={openCreateModal}
                  className="mt-6 px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 cursor-pointer shadow-md"
                >
                  Launch First Task
                </button>
              </div>
            ) : (
              <div>
                {layoutMode === 'board' ? (
                  <TaskBoard 
                    tasks={tasks}
                    onEditTask={openEditModal}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                    currentUser={user}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                  />
                ) : (
                  <TaskList 
                    tasks={tasks}
                    onEditTask={openEditModal}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                    currentUser={user}
                  />
                )}

                {/* Pagination panel footer elements */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-250 dark:border-gray-800">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    Showing 1 to {tasks.length} of {totalTasks} deliverables ({page} of {totalPages} pages)
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      id="pagination-prev"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="p-2 border border-gray-205 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      id="pagination-next"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="p-2 border border-gray-205 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
          </>
        )}
      </main>

      {/* Slide-out Task Creation and Modification sheet modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TaskModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            task={selectedTask}
            onSave={handleSaveTask}
            token={token}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
