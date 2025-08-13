import { memo } from 'react';
import { RepoState } from '@/git/types';
import { GitGraphSVG } from './GitGraphSVG';

interface GitGraphProps {
  state: RepoState;
  height?: number | string;
}

export const GitGraph = memo(({ state, height = 420 }: GitGraphProps) => {
  return (
    <GitGraphSVG 
      state={state} 
      height={typeof height === 'number' ? height : parseInt(String(height)) || 420}
      width={800}
    />
  );
});

