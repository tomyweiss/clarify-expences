import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ScrapeTask {
  id: string;
  vendor: string;
  status: 'started' | 'success' | 'failed';
  message?: string;
  triggered_by: string;
  created_at: string;
}

interface ScrapeContextType {
  tasks: ScrapeTask[];
  addTask: (vendor: string, triggeredBy: string) => string;
  updateTask: (id: string, status: 'success' | 'failed', message?: string) => void;
  clearCompleted: () => void;
}

const ScrapeContext = createContext<ScrapeContextType | undefined>(undefined);

export function ScrapeProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<ScrapeTask[]>([]);

  const addTask = (vendor: string, triggeredBy: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTask: ScrapeTask = {
      id,
      vendor,
      triggered_by: triggeredBy,
      status: 'started',
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return id;
  };

  const updateTask = (id: string, status: 'success' | 'failed', message?: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status, message } : task
    ));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(task => task.status === 'started'));
  };

  return (
    <ScrapeContext.Provider value={{ tasks, addTask, updateTask, clearCompleted }}>
      {children}
    </ScrapeContext.Provider>
  );
}

export function useScrape() {
  const context = useContext(ScrapeContext);
  if (context === undefined) {
    throw new Error('useScrape must be used within a ScrapeProvider');
  }
  return context;
}
