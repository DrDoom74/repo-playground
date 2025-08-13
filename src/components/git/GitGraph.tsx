import { memo } from 'react';
import { RepoState } from '@/git/types';
import { GitGraphVertical } from './GitGraphVertical';

interface GitGraphProps {
  state: RepoState;
  height?: number | string;
}

export const GitGraph = memo(({ state, height = 420 }: GitGraphProps) => {
  return (
    <GitGraphVertical 
      state={state} 
      height={typeof height === 'number' ? height : parseInt(String(height)) || 420}
      width={600}
    />
  );
});

