import { Calendar, Paperclip, MessageSquare, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleComplete: (task: Task) => Promise<void>;
  currentUser: any;
}

export default function TaskList({ tasks, onEditTask, onDeleteTask, onToggleComplete, currentUser }: TaskListProps) {
  
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/5 border-red-500/10 dark:text-red-400';
      case 'medium':
        return 'text-amber-500 bg-amber-550/5 border-amber-500/10 dark:text-amber-400';
      default:
        return 'text-blue-500 bg-blue-550/5 border-blue-500/10 dark:text-blue-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/5 text-emerald-650 dark:text-emerald-400 border border-emerald-500/10';
      case 'in-progress':
        return 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10';
      default:
        return 'bg-neutral-100/80 text-neutral-600 dark:bg-zinc-800/40 dark:text-zinc-350 border border-neutral-200/40 dark:border-zinc-800/40';
    }
  };

  const isOverdue = (dueDateStr: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(dueDateStr) < new Date();
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No deliverables found matching current queries</p>
        <p className="text-xs text-gray-400 mt-1">Try relaxing filters or adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-950/30 border border-neutral-200/45 dark:border-zinc-800/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.02)] overflow-hidden" id="task-list-table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/50 dark:bg-zinc-900/40 border-b border-neutral-200/25 dark:border-zinc-850 text-[10px] text-neutral-450 dark:text-zinc-500 font-bold uppercase tracking-wider select-none">
              <th className="py-4 px-5 w-12 text-center">Done</th>
              <th className="py-4 px-4">Task Requirement</th>
              <th className="py-4 px-4 w-32">Status</th>
              <th className="py-4 px-4 w-28">Priority</th>
              <th className="py-4 px-4 w-40">Target Date</th>
              <th className="py-4 px-4 w-24">Refs</th>
              <th className="py-4 px-5 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              const isOwnerAdminView = currentUser?.role === 'admin' && task.userEmail !== currentUser?.email;

              return (
                <tr 
                  key={task.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all group"
                >
                  {/* Complete status */}
                  <td className="py-4 px-5 text-center">
                    <button
                      type="button"
                      id={`toggle-complete-list-${task.id}`}
                      onClick={() => onToggleComplete(task)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 dark:text-gray-600 transition cursor-pointer"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Title & Description */}
                  <td className="py-4 px-4 max-w-xs md:max-w-md overflow-hidden">
                    <div className="flex flex-col gap-0.5">
                      <span 
                        className={`text-sm font-semibold text-gray-800 dark:text-gray-200 truncate ${
                          task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500 font-medium' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 truncate">
                          {task.description}
                        </span>
                      )}
                      
                      {/* Show creator badges if Admin */}
                      {isOwnerAdminView && (
                        <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 mt-1 rounded border border-teal-100 dark:border-teal-900/30 truncate self-start">
                          Creator: {task.userEmail}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="py-4 px-4">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusBadge(task.status)}`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status}
                    </span>
                  </td>

                  {/* Priority pill */}
                  <td className="py-4 px-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Target Due date */}
                  <td className="py-4 px-4">
                    <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${overdue ? 'text-rose-500 font-bold animate-pulse' : 'text-gray-600 dark:text-gray-300'}`}>
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{new Date(task.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>

                  {/* References & Document tags */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5 text-gray-400">
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="text-xs font-mono flex items-center gap-0.5" title="Attached dossiers">
                          <Paperclip className="w-3.5 h-3.5" />
                          {task.attachments.length}
                        </span>
                      )}
                      {task.activities && task.activities.length > 0 && (
                        <span className="text-xs font-mono flex items-center gap-0.5" title="Activity Logs">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {task.activities.length}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        id={`edit-row-list-${task.id}`}
                        onClick={() => onEditTask(task)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`delete-row-list-${task.id}`}
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
