// app/components/NewTaskModal.tsx
"use client";
import React, { useState } from 'react';

export default function NewTaskModal({ isOpen, onClose, onSave }: any) {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue); // Sends the string to addNewTask in page.tsx
      setInputValue("");   // Clears input for next time
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h3 className="text-2xl font-black text-slate-900 mb-6">Create New Task</h3>
        <input 
          autoFocus
          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-medium transition-all"
          placeholder="What needs to be done?"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
          <button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}