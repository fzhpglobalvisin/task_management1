"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  LogOut,
  Plus,
  ListTodo,
  CheckCircle2,
  Clock,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';

import NewTaskModal from './NewTaskModal';

export default function ProductivityBoard() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // --- MOVE VARIABLES HERE SO THE UI CAN SEE THEM ---
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || "User";

  // --- REUSABLE FETCH FUNCTIONS ---
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data);
  }, [supabase]);

  // --- CONSOLIDATED INITIALIZATION ---
  useEffect(() => {
    setMounted(true);

    const initialize = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser); 
        await fetchTasks();
      }
    };

    initialize();
  }, [router, supabase, fetchTasks]);

  // --- HANDLERS ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newColumnId = destination.droppableId;

    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, column_id: newColumnId } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ column_id: newColumnId })
      .eq('id', draggableId);

    if (error) {
      console.error("Sync error:", error.message);
      fetchTasks();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const addNewTask = async (taskValue: string) => {
    if (!taskValue.trim()) return;
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ content: taskValue, user_id: currentUser?.id, column_id: 'todo' }])
      .select();

    if (!error && data) {
      setTasks(prev => [data[0], ...prev]);
      setIsModalOpen(false);
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTaskStatus = async (id: string, currentColumn: string) => {
    const newColumn = currentColumn === 'todo' ? 'done' : 'todo';
    const { error } = await supabase.from('tasks').update({ column_id: newColumn }).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, column_id: newColumn } : t));
  };

  const updateTaskContent = async (id: string, newContent: string) => {
    const { error } = await supabase.from('tasks').update({ content: newContent }).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t));
  };

  // --- INTERNAL COMPONENTS ---
  const TaskCard = ({ task, index }: { task: any, index: number }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.content);

    const handleSave = () => {
      if (editText.trim() !== task.content) updateTaskContent(task.id, editText);
      setIsEditing(false);
    };

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`group relative p-6 rounded-2xl border transition-all ${snapshot.isDragging
                ? "shadow-2xl border-blue-500 ring-4 ring-blue-500/20 scale-[1.02] z-50 bg-white dark:bg-slate-800"
                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-500"
              }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 mr-4">
                {isEditing ? (
                  <input
                    autoFocus
                    className="w-full font-bold text-lg text-slate-800 dark:text-slate-100 border-b-2 border-blue-500 outline-none bg-transparent"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                ) : (
                  <span
                    onClick={() => setIsEditing(true)}
                    className={`font-bold text-lg cursor-text block ${task.column_id === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'
                      }`}
                  >
                    {task.content || "Untitled Task"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.confirm("Delete this task?") && deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <CheckCircle2
                  onClick={() => toggleTaskStatus(task.id, task.column_id)}
                  className={`w-6 h-6 cursor-pointer transition-colors ${task.column_id === 'done' ? 'text-emerald-500' : 'text-slate-200 dark:text-slate-600 hover:text-emerald-500'
                    }`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  if (!mounted) return null;

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-slate-900 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          <div className="flex justify-between items-center mb-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span>{fullName[0].toUpperCase()}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  Workspace
                </p>
                <p className="text-slate-700 dark:text-slate-200 font-semibold">
                  {fullName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all active:scale-90"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
              <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">FocusFlow Board</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your tasks with precision.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
              <Plus className="w-5 h-5" /> New Task
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <ListTodo className="text-orange-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-sm">To Do</h3>
                </div>
                <Droppable droppableId="todo">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-col gap-4 p-4 rounded-3xl min-h-[500px] transition-colors ${snapshot.isDraggingOver ? "bg-slate-100/50 dark:bg-slate-800/40" : "bg-transparent"
                        }`}
                    >
                      {tasks.filter(t => t.column_id === 'todo').map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-sm">Completed</h3>
                </div>
                <Droppable droppableId="done">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-col gap-4 p-4 rounded-3xl min-h-[500px] transition-colors ${snapshot.isDraggingOver ? "bg-emerald-50/40 dark:bg-emerald-900/10" : "bg-transparent"
                        }`}
                    >
                      {tasks.filter(t => t.column_id === 'done').map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
        </div>
        <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addNewTask} />
      </div>
    </div>
  );
}