import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableColumnProps {
  id: string;
  className: string;
  children: React.ReactNode;
  key?: React.Key;
}

export default function DroppableColumn({ id, className, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  // Visually highlight column when drag hovers over it
  const activeStyle = isOver 
    ? 'ring-2 ring-emerald-500/40 bg-emerald-50/5 dark:bg-emerald-950/10 scale-[1.01]' 
    : '';

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${activeStyle} transition-all duration-250`}
      id={`droppable-column-${id}`}
    >
      {children}
    </div>
  );
}
