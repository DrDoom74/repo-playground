import { useGitStore } from '@/state/gitStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Circle } from 'lucide-react';
import { getHeadCommitId } from '@/git/utils';

export function BranchOverview() {
  const { repo } = useGitStore();
  const branches = Object.values(repo.branches);
  const currentBranch = repo.head.type === 'branch' ? repo.head.ref : null;
  const headCommit = getHeadCommitId(repo);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4" />
          Branches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {branches.map((branch) => {
          const isActive = branch.name === currentBranch;
          const commit = repo.commits[branch.tip];
          
          return (
            <div 
              key={branch.name}
              className={`flex items-start gap-3 p-2 rounded-lg border ${
                isActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-muted/20'
              }`}
            >
              <Circle 
                className={`h-3 w-3 mt-1 flex-shrink-0 ${
                  isActive ? 'fill-primary text-primary' : 'fill-muted-foreground text-muted-foreground'
                }`} 
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-sm font-medium truncate ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}>
                    {branch.name}
                  </span>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      current
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-mono">
                    tip: {branch.tip}
                  </div>
                  {commit && (
                    <div className="truncate">
                      {commit.message}
                    </div>
                  )}
                  {commit && commit.parents.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      merge commit
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {repo.head.type === 'detached' && (
          <div className="flex items-start gap-3 p-2 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <Circle className="h-3 w-3 mt-1 flex-shrink-0 fill-orange-500 text-orange-500" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-medium text-orange-700 dark:text-orange-300">
                  HEAD (detached)
                </span>
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300">
                  detached
                </Badge>
              </div>
              
              <div className="text-xs text-orange-600 dark:text-orange-400">
                <div className="font-mono">
                  at: {repo.head.ref}
                </div>
                {repo.commits[repo.head.ref] && (
                  <div className="truncate">
                    {repo.commits[repo.head.ref].message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Total branches: {branches.length}</div>
            <div>Total commits: {Object.keys(repo.commits).length}</div>
            <div className="font-mono">HEAD: {headCommit}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}