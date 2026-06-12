import React from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Task, TaskStatus } from '../types';
import DroppableColumn from './DroppableColumn';
import DraggableTaskCard from './DraggableTaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleComplete: (task: Task) => Promise<void>;
  currentUser: any;
  onUpdateTaskStatus: (taskId: string, nextStatus: TaskStatus) => Promise<void>;
}

export default function TaskBoard({ 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onToggleComplete, 
  currentUser,
  onUpdateTaskStatus
}: TaskBoardProps) {
  const columns: { id: TaskStatus; title: string; labelColor: string; bgClass: string }[] = [
    { id: 'todo', title: 'To Do', labelColor: 'bg-blue-500', bgClass: 'bg-white/15 dark:bg-white/2 backdrop-blur-md' },
    { id: 'in-progress', title: 'In Progress', labelColor: 'bg-amber-500', bgClass: 'bg-white/15 dark:bg-white/2 backdrop-blur-md' },
    { id: 'completed', title: 'Completed', labelColor: 'bg-emerald-500', bgClass: 'bg-white/15 dark:bg-white/2 backdrop-blur-md' }
  ];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-550/5 border-red-500/10 dark:text-red-400';
      case 'medium':
        return 'text-amber-500 bg-amber-550/5 border-amber-500/10 dark:text-amber-400';
      default:
        return 'text-blue-500 bg-blue-550/5 border-blue-500/10 dark:text-blue-400';
    }
  };

  const isOverdue = (dueDateStr: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(dueDateStr) < new Date();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const nextStatus = over.id as TaskStatus;

    const draggedTask = tasks.find(t => t.id === taskId);
    if (draggedTask && draggedTask.status !== nextStatus) {
      onUpdateTaskStatus(taskId, nextStatus);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 align-start" id="kanban-columns-container">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);

          return (
            <DroppableColumn 
              key={column.id}
              id={column.id}
              className={`flex flex-col rounded-3xl border border-neutral-200/20 dark:border-white/5 p-4.5 min-h-[550px] ${column.bgClass}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4.5 pb-2.5 border-b border-neutral-200/25 dark:border-zinc-850">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${column.labelColor}`} />
                  <h4 className="text-xs font-semibold tracking-tight text-neutral-850 dark:text-zinc-205 font-sans">
                    {column.title}
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold text-neutral-450 dark:text-zinc-500 px-2 py-0.5 rounded-full bg-white/80 dark:bg-zinc-900 border border-neutral-200/35 dark:border-zinc-800/35 shadow-sm select-none">
                  {columnTasks.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border border-dashed border-gray-150 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                    No deliverables in {column.title}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onToggleComplete={onToggleComplete}
                      currentUser={currentUser}
                      getPriorityStyle={getPriorityStyle}
                      isOverdue={isOverdue}
                    />
                  ))
                )}
              </div>
            </DroppableColumn>
          );
        })}
      </div>
    </DndContext>
  );
}
