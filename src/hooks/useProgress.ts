import { useState, useEffect, useCallback } from 'react';

export interface Progress {
  solvedTaskIds: string[];
  scoreByTask: Record<string, number>;
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  const totalScore = Object.values(progress.scoreByTask).reduce((sum, score) => sum + score, 0);

  const updateProgress = useCallback((newProgress: Progress) => {
    setProgress(newProgress);
    saveProgress(newProgress);
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('progress-updated'));
  }, []);

  const resetProgress = useCallback(() => {
    const emptyProgress = { solvedTaskIds: [], scoreByTask: {} };
    setProgress(emptyProgress);
    localStorage.removeItem('git-trainer:v1:progress');
  }, []);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      setProgress(loadProgress());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('progress-reset', handleStorageChange);
    window.addEventListener('progress-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('progress-reset', handleStorageChange);
      window.removeEventListener('progress-updated', handleStorageChange);
    };
  }, []);

  return {
    progress,
    totalScore,
    updateProgress,
    resetProgress
  };
}

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem('git-trainer:v1:progress') || '{"solvedTaskIds":[],"scoreByTask":{}}');
  } catch {
    return { solvedTaskIds: [], scoreByTask: {} };
  }
}

function saveProgress(progress: Progress) {
  localStorage.setItem('git-trainer:v1:progress', JSON.stringify(progress));
}