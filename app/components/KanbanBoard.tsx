'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 1. THE TASK CARD COMPONENT ---
function TaskCard({ id, content }: { id: string; content: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-3 bg-white rounded shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-blue-500 text-black"
    >
      {content}
    </div>
  );
}

// --- 2. THE COLUMN COMPONENT ---
function DroppableColumn({ id, tasks }: { id: string; tasks: any[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="w-80 bg-slate-200 p-4 rounded-lg flex flex-col min-h-[500px]"
    >
      <h2 className="font-bold uppercase text-slate-600 mb-4">{id}</h2>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1">
          {tasks.map((t) => (
            <TaskCard key={t.id} id={t.id} content={t.content} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// --- 3. THE MAIN KANBAN BOARD ---
export default function KanbanBoard() {
  // State hooks must be at the top
  const [tasks, setTasks] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState(''); 

  // Sensor hooks must be declared before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    setMounted(true);
    async function fetchTasks() {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) console.error('Supabase Error:', error.message);
      else setTasks(data || []);
    }
    fetchTasks();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ content: newTaskContent, column_id: 'todo' }])
      .select();

    if (error) {
      console.error('Error adding task:', error.message);
    } else if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskContent('');
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isColumn = ['todo', 'done'].includes(overId);
    const overColumnId = isColumn ? overId : tasks.find((t) => t.id === overId)?.column_id;

    if (overColumnId && activeTask.column_id !== overColumnId) {
      setTasks((prev) =>
        prev.map((t) => t.id === activeId ? { ...t, column_id: overColumnId } : t)
      );
      await supabase.from('tasks').update({ column_id: overColumnId }).eq('id', activeId);
    } else if (activeId !== overId) {
      setTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // The "mounted" check goes here, after all Hooks are initialized
  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-100 p-10">
      {/* New Task Form */}
      <form onSubmit={addTask} className="mb-10 flex gap-2">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          className="px-4 py-2 rounded shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 text-black"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition"
        >
          Add Task
        </button>
      </form>

      <div className="flex gap-6 justify-center">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          {['todo', 'done'].map((colId) => (
            <DroppableColumn
              key={colId}
              id={colId}
              tasks={tasks.filter(t => t.column_id === colId)}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}