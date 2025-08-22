import { useEffect, useRef, useState } from 'react';
import { RepoState } from '@/git/types';
import { stateToMermaidGitGraph } from '@/git/mermaid/stateToMermaid';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

interface GitGraphMermaidProps {
  state: RepoState;
  height?: number;
  direction?: 'TB' | 'LR' | 'RL';
}

export function GitGraphMermaid({ state, height = 420, direction = 'TB' }: GitGraphMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);

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
        // Handle direction restrictions
        let actualDirection = direction;
        if (direction === 'RL') {
          actualDirection = 'LR';
          toast('Справа налево не поддерживается, используется слева направо', {
            duration: 3000,
          });
        }

        const mermaidCode = stateToMermaidGitGraph(state, actualDirection);
        console.log('Generated Mermaid code:', mermaidCode);
        
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          // Apply custom styles and zoom to the SVG
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            if (autoFit) {
              if (actualDirection === 'LR') {
                svgElement.style.width = '100%';
                svgElement.style.height = 'auto';
                svgElement.style.maxHeight = `${height}px`;
              } else {
                svgElement.style.maxWidth = '100%';
                svgElement.style.height = `${height}px`;
              }
            } else {
              svgElement.style.transform = `scale(${zoom})`;
              svgElement.style.transformOrigin = 'top left';
            }
            svgElement.style.background = 'transparent';
            
            // Apply RL visual effect if needed
            if (direction === 'RL') {
              svgElement.style.transform = `scaleX(-1) ${!autoFit ? `scale(${zoom})` : ''}`;
            }
          }
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error, 'State:', state, 'Direction:', direction);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="text-destructive p-4 text-sm">
              <p class="font-medium">Ошибка рендеринга графа</p>
              <p class="text-xs mt-1 opacity-75">Проверьте консоль для деталей</p>
            </div>
          `;
        }
      }
    };

    renderGraph();
  }, [state, height, direction, isInitialized, zoom, autoFit]);

  const handleZoomIn = () => {
    setAutoFit(false);
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleFitToContainer = () => {
    setAutoFit(true);
    setZoom(1);
  };

  const handleResetZoom = () => {
    setAutoFit(false);
    setZoom(1);
  };

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="p-2 h-8 w-8"
          disabled={autoFit || zoom >= 3}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="p-2 h-8 w-8"
          disabled={autoFit || zoom <= 0.5}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFitToContainer}
          className="p-2 h-8 w-8"
          disabled={autoFit}
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetZoom}
          className="p-2 h-8 w-8"
          disabled={autoFit || zoom === 1}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <div 
        ref={containerRef}
        className="w-full overflow-auto bg-background border rounded-md"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading git graph...
        </div>
      </div>
    </div>
  );
}