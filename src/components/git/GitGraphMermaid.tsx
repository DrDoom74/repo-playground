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
        theme: 'base',
        themeVariables: {
          background: '#ffffff',
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#d1d5db',
          lineColor: '#6b7280',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#e5e7eb',
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
            svgElement.style.background = 'transparent';
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