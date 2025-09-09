import { useState, useRef, useEffect } from 'react';
import { useGitStore } from '@/state/gitStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Play } from 'lucide-react';
import { executeCommand } from './engine';

interface TerminalLine {
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: number;
}

interface GitTerminalProps {
  key?: string | number;
}

export function GitTerminal({ key }: GitTerminalProps = {}) {
  const git = useGitStore();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'output', content: 'Git Terminal ready. Type "help" for available commands.', timestamp: Date.now() },
    { type: 'output', content: 'Commands can be prefixed with "git" or used directly (e.g., "status" or "git status")', timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addLine = (type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      type,
      content,
      timestamp: Date.now()
    };
    setHistory(prev => [...prev, newLine]);
  };

  const executeCmd = () => {
    if (!command.trim()) return;
    
    // Handle clear command specially
    if (command.trim() === 'clear' || command.trim() === 'git clear') {
      setHistory([
        { type: 'output', content: 'Git Terminal ready. Type "help" for available commands.', timestamp: Date.now() },
        { type: 'output', content: 'Commands can be prefixed with "git" or used directly (e.g., "status" or "git status")', timestamp: Date.now() }
      ]);
      setCommand('');
      return;
    }
    
    // Add command to history
    addLine('command', `$ ${command}`);
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    try {
      const output = executeCommand(command, git);
      if (output) {
        addLine('output', output);
      }
    } catch (error) {
      addLine('error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setCommand('');
  };

  const clearTerminal = () => {
    setHistory([
      { type: 'output', content: 'Git Terminal ready. Type "help" for available commands.', timestamp: Date.now() },
      { type: 'output', content: 'Commands can be prefixed with "git" or used directly (e.g., "status" or "git status")', timestamp: Date.now() }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      inputRef.current?.focus();
      return;
    }
    
    if (e.key === 'Enter') {
      executeCmd();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  // Auto-scroll to bottom using sentinel
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getCurrentPrompt = () => {
    const state = git.repo;
    const branch = state.head.type === 'branch' ? state.head.ref : 'HEAD';
    return `(${branch})`;
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  return (
    <Card 
      className="h-full min-h-[300px] flex flex-col" 
      onKeyDownCapture={handleCardKeyDown}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Terminal className="h-4 w-4" />
          Git Terminal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 gap-3 min-h-0">
        <ScrollArea className="flex-1 border border-border rounded p-3 bg-muted/20" tabIndex={-1}>
          <div className="font-mono text-sm space-y-1">
            {history.map((line, index) => (
              <div
                key={index}
                className={`whitespace-pre-wrap ${
                  line.type === 'command' 
                    ? 'text-primary font-medium' 
                    : line.type === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {line.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 ring-1 ring-border focus-within:ring-primary rounded px-3 py-2 bg-background transition-colors">
            <span className="text-sm font-mono text-muted-foreground">
              {getCurrentPrompt()} $
            </span>
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="git status | status, git branch | branch, git commit -m 'message'..."
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
            />
          </div>
          <Button 
            onClick={executeCmd}
            size="sm"
            disabled={!command.trim()}
            className="px-3"
            tabIndex={-1}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Press ↑/↓ for command history, Enter to execute
        </div>
      </CardContent>
    </Card>
  );
}