import { useEffect, useRef, useState } from 'react';
import { RepoState } from '@/git/types';
import { stateToMermaidGitGraph } from '@/git/mermaid/stateToMermaid';
import mermaid from 'mermaid';

interface GitGraphMermaidProps {
  state: RepoState;
  height?: number;
  direction?: 'TB' | 'LR' | 'RL';
}

export function GitGraphMermaid({ state, height = 420, direction = 'TB' }: GitGraphMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize Mermaid
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
        themeVariables: {
          background: 'hsl(var(--background))',
          primaryColor: 'hsl(var(--primary))',
          primaryTextColor: 'hsl(var(--foreground))',
          primaryBorderColor: 'hsl(var(--border))',
          lineColor: 'hsl(var(--border))',
          secondaryColor: 'hsl(var(--muted))',
          tertiaryColor: 'hsl(var(--accent))',
        },
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized || !containerRef.current) return;

    const renderGraph = async () => {
      try {
        const mermaidCode = stateToMermaidGitGraph(state, direction);
        const id = `mermaid-${Date.now()}`;
        
        const { svg } = await mermaid.render(id, mermaidCode);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          // Apply custom styles to the SVG
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = `${height}px`;
            svgElement.style.background = 'hsl(var(--background))';
          }
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="text-destructive p-4">Error rendering git graph</div>`;
        }
      }
    };

    renderGraph();
  }, [state, height, direction, isInitialized]);

  return (
    <div 
      ref={containerRef}
      className="w-full overflow-auto bg-background border rounded-md"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading git graph...
      </div>
    </div>
  );
}