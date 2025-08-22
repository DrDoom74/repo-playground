import { memo } from 'react';
import { RepoState } from '@/git/types';
import { GitGraphVertical } from './GitGraphVertical';
import { GitGraphMermaid } from './GitGraphMermaid';

interface GitGraphProps {
  state: RepoState;
  height?: number | string;
  renderer?: 'custom' | 'mermaid';
  direction?: 'TB' | 'LR' | 'RL';
}

export const GitGraph = memo(({ state, height = 420, renderer = 'custom', direction = 'TB' }: GitGraphProps) => {
  const numericHeight = typeof height === 'number' ? height : parseInt(String(height)) || 420;
  
  if (renderer === 'mermaid') {
    return <GitGraphMermaid state={state} height={numericHeight} direction={direction} />;
  }
  
  return (
    <GitGraphVertical 
      state={state} 
      height={numericHeight}
      width={600}
    />
  );
});

