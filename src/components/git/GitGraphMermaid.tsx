import { useEffect, useRef, useState, useCallback } from 'react';
import { RepoState } from '@/git/types';
import { stateToMermaidGitGraph } from '@/git/mermaid/stateToMermaid';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from 'lucide-react';
import { toast } from 'sonner';

interface GitGraphMermaidProps {
  state: RepoState;
  height?: number;
  direction?: 'TB' | 'LR' | 'RL';
}

export function GitGraphMermaid({ state, height = 420, direction = 'TB' }: GitGraphMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize Mermaid
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        gitGraph: {
          rotateCommitLabel: false, // Disable commit label rotation
        },
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
        }

        const mermaidCode = stateToMermaidGitGraph(state, actualDirection);
        console.log('Generated Mermaid code:', mermaidCode);
        
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // Get SVG dimensions for proper fitting
            const bbox = svgElement.getBBox();
            const svgWidth = bbox.width;
            const svgHeight = bbox.height;
            
            if (autoFit) {
              // Calculate scale to fit container
              const containerWidth = containerRef.current.clientWidth - 20; // padding
              const containerHeight = height - 20; // padding
              
              let scale = 1;
              if (actualDirection === 'LR') {
                scale = Math.min(containerWidth / svgWidth, containerHeight / svgHeight);
              } else {
                scale = Math.min(containerWidth / svgWidth, containerHeight / svgHeight);
              }
              
              // Don't upscale - max scale is 1
              scale = Math.min(scale, 1);
              
              const scaledWidth = svgWidth * scale;
              const scaledHeight = svgHeight * scale;
              
              // Center the graph
              const offsetX = (containerWidth - scaledWidth) / 2;
              const offsetY = (containerHeight - scaledHeight) / 2;
              
              svgElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})${direction === 'RL' ? ' scaleX(-1)' : ''}`;
              svgElement.style.transformOrigin = '0 0';
            } else {
              // Manual zoom mode
              const transformX = panX + (containerRef.current.clientWidth / 2 - svgWidth * zoom / 2);
              const transformY = panY + (height / 2 - svgHeight * zoom / 2);
              
              svgElement.style.transform = `translate(${transformX}px, ${transformY}px) scale(${zoom})${direction === 'RL' ? ' scaleX(-1)' : ''}`;
              svgElement.style.transformOrigin = '0 0';
            }
            
            svgElement.style.background = 'transparent';
            svgElement.style.width = `${svgWidth}px`;
            svgElement.style.height = `${svgHeight}px`;
            
            // Fix text rotation for RL direction
            if (direction === 'RL') {
              const textElements = svgElement.querySelectorAll('text');
              textElements.forEach(textEl => {
                textEl.style.transform = 'scaleX(-1)';
              });
            }
          }
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        console.error('Generated Mermaid code:', stateToMermaidGitGraph(state, direction === 'RL' ? 'LR' : direction));
        console.error('State:', state);
        console.error('Direction:', direction);
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
  }, [state, height, direction, isInitialized, zoom, autoFit, panX, panY]);

  const handleZoomIn = useCallback(() => {
    setAutoFit(false);
    setZoom(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setAutoFit(false);
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleFitToContainer = useCallback(() => {
    setAutoFit(true);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const handleResetZoom = useCallback(() => {
    setAutoFit(false);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Pan functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (autoFit) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [autoFit, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || autoFit) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  }, [isDragging, autoFit, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (autoFit) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  }, [autoFit]);

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
          title="Увеличить"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="p-2 h-8 w-8"
          disabled={autoFit || zoom <= 0.5}
          title="Уменьшить"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFitToContainer}
          className="p-2 h-8 w-8"
          disabled={autoFit}
          title="Вписать в контейнер"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetZoom}
          className="p-2 h-8 w-8"
          disabled={autoFit || zoom === 1}
          title="Сбросить масштаб"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Pan Controls Info */}
      {!autoFit && (
        <div className="absolute top-2 left-2 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          <Move className="h-3 w-3 inline mr-1" />
          Перетаскивание: ЛКМ • Масштаб: колесо мыши
        </div>
      )}

      <div 
        ref={containerRef}
        className={`w-full bg-background border rounded-md overflow-hidden ${!autoFit ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading git graph...
        </div>
      </div>
    </div>
  );
}