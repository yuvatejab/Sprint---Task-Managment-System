import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Calendar, Paperclip, MessageSquare, Edit2, Trash2, CheckCircle2, Circle, GripVertical } from 'lucide-react';
import { Task } from '../types';

interface DraggableTaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleComplete: (task: Task) => Promise<void>;
  currentUser: any;
  getPriorityStyle: (priority: string) => string;
  isOverdue: (dueDateStr: string, status: string) => boolean;
  key?: React.Key;
}

export default function DraggableTaskCard({
  task,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  currentUser,
  getPriorityStyle,
  isOverdue,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const overdue = isOverdue(task.dueDate, task.status);
  const isOwnerAdminView = currentUser?.role === 'admin' && task.userEmail !== currentUser?.email;

  // Construct inline style for translation during drag
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group backdrop-blur-md bg-white/80 dark:bg-zinc-900/60 border border-neutral-200/50 dark:border-zinc-800/60 rounded-2xl p-4.5 shadow-[0_4px_20px_-3px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_25px_-4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_25px_-4px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 relative select-none ${
        isDragging ? 'ring-1.5 ring-blue-500/70 shadow-xl scale-[1.01]' : ''
      }`}
      id={`draggable-task-card-${task.id}`}
    >
      <div className="flex items-start gap-2.5">
        {/* Grip Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-neutral-300 dark:text-zinc-600 hover:text-neutral-500 dark:hover:text-zinc-400 p-0.5 shrink-0 transition-colors"
          title="Drag to organize status"
          id={`drag-handle-${task.id}`}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Checkbox Quick Toggle complete */}
        <button
          type="button"
          id={`toggle-complete-board-${task.id}`}
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 p-0.5 text-neutral-300 hover:text-emerald-500 dark:text-zinc-600 dark:hover:text-emerald-450 transition-colors cursor-pointer shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
          ) : (
            <Circle className="w-4.5 h-4.5" />
          )}
        </button>
        
        <div className="flex-1 overflow-hidden ml-0.5">
          <h5 
            className={`text-xs font-semibold text-neutral-800 dark:text-zinc-100 tracking-tight transition-all duration-200 truncate ${
              task.status === 'completed' ? 'line-through text-neutral-400 dark:text-zinc-500 font-medium' : ''
            }`}
          >
            {task.title}
          </h5>
          
          {task.description && (
            <p className="text-[11px] text-neutral-400 dark:text-zinc-550 mt-1 leading-normal line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Display Creator Email if Admin Audit mode */}
      {isOwnerAdminView && (
        <div className="mt-2.5 ml-8 text-[9px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/5 px-2 py-0.5 rounded-lg border border-sky-500/10 truncate">
          By: {task.userEmail}
        </div>
      )}

      {/* Meta Pills & Actions */}
      <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-neutral-100/50 dark:border-zinc-800/40 gap-2 ml-8">
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Priority pill */}
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
            {task.priority}
          </span>

          {/* Due Date Indicator */}
          <div className={`flex items-center gap-1 text-[9.5px] font-mono px-2 py-0.5 rounded-full border ${
            overdue 
              ? 'text-red-600 bg-red-500/10 border-red-500/15 dark:text-red-400' 
              : 'text-neutral-450 bg-neutral-50 dark:bg-zinc-800/30 border-neutral-150/40 dark:border-zinc-800/40 text-neutral-450 dark:text-zinc-500'
          }`}>
            <Calendar className="w-2.5 h-2.5 opacity-70" />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Attachments and Activities badges */}
          {task.attachments && task.attachments.length > 0 && (
            <span className="text-[9.5px] text-neutral-400 dark:text-zinc-500 font-mono flex items-center gap-0.5" title="Attachments">
              <Paperclip className="w-2.5 h-2.5 opacity-70" />
              <span>{task.attachments.length}</span>
            </span>
          )}
          {task.activities && task.activities.length > 0 && (
            <span className="text-[9.5px] text-neutral-400 dark:text-zinc-500 font-mono flex items-center gap-0.5" title="Activity Logs">
              <MessageSquare className="w-2.5 h-2.5 opacity-70" />
              <span>{task.activities.length}</span>
            </span>
          )}
        </div>

        {/* Card Hover Action buttons - simple modern icons without chunky circles */}
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            id={`edit-card-board-${task.id}`}
            onClick={() => onEditTask(task)}
            className="p-1 rounded-md text-neutral-450 hover:text-neutral-800 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title="Edit Details"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            id={`delete-card-board-${task.id}`}
            onClick={() => onDeleteTask(task.id)}
            className="p-1 rounded-md text-neutral-450 hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
