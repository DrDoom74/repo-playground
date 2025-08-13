import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGitStore } from '@/state/gitStore';

interface ActionsPanelProps {
  allowedOps?: string[];
}

export const ActionsPanel = ({ allowedOps }: ActionsPanelProps) => {
  const git = useGitStore();
  const [branchName, setBranchName] = useState('feature');
  const [checkoutRef, setCheckoutRef] = useState('main');
  const [mergeFrom, setMergeFrom] = useState('feature');
  const [rebaseOnto, setRebaseOnto] = useState('main');
  const [resetTo, setResetTo] = useState('A');
  const [pickId, setPickId] = useState('C');
  const [message, setMessage] = useState('commit');
  const [cmd, setCmd] = useState('');

  const can = (op: string) => !allowedOps || allowedOps.includes(op);

  const runCmd = () => {
    const text = cmd.trim();
    if (!text) return;
    parseAndRun(text, git);
    setCmd('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Действия</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!can('checkout')} onClick={() => git.checkout(checkoutRef)}>Checkout</Button>
            <Input value={checkoutRef} onChange={(e) => setCheckoutRef(e.target.value)} placeholder="branch|commit" />

            <Button disabled={!can('branch.create')} onClick={() => git.createBranch(branchName)}>Branch</Button>
            <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="new-branch" />

            <Button disabled={!can('commit')} onClick={() => git.commit(message)}>Commit</Button>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="message" />

            <Button disabled={!can('merge')} onClick={() => git.merge(mergeFrom)}>Merge</Button>
            <Input value={mergeFrom} onChange={(e) => setMergeFrom(e.target.value)} placeholder="from-branch" />

            <Button disabled={!can('rebase')} onClick={() => git.rebase(rebaseOnto)}>Rebase</Button>
            <Input value={rebaseOnto} onChange={(e) => setRebaseOnto(e.target.value)} placeholder="onto-branch" />

            <Button disabled={!can('reset.hard')} onClick={() => git.resetHard(resetTo)}>Reset --hard</Button>
            <Input value={resetTo} onChange={(e) => setResetTo(e.target.value)} placeholder="to-commit" />

            <Button disabled={!can('cherry-pick')} onClick={() => git.cherryPick(pickId)}>Cherry-pick</Button>
            <Input value={pickId} onChange={(e) => setPickId(e.target.value)} placeholder="commitId" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Командная строка</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="git ..." onKeyDown={(e) => e.key==='Enter' && runCmd()} />
          <Button onClick={runCmd}>Run</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Лог действий</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-56 overflow-auto text-sm">
            {git.logs.map((l, i) => (
              <div key={i} className="flex items-center justify-between">
                <span>{new Date(l.ts).toLocaleTimeString()} • {l.op}</span>
                <span className="text-muted-foreground">{l.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function parseAndRun(cmd: string, git: ReturnType<typeof useGitStore.getState>) {
  const parts = cmd.split(/\s+/);
  if (parts[0] !== 'git') return;
  const sub = parts[1];
  switch (sub) {
    case 'checkout':
      git.checkout(parts[2]);
      break;
    case 'branch':
      if (parts[2]) git.createBranch(parts[2]);
      break;
    case 'commit': {
      const msgIdx = parts.indexOf('-m');
      const msg = msgIdx !== -1 ? parts.slice(msgIdx + 1).join(' ').replace(/^"|"$/g, '') : 'commit';
      git.commit(msg);
      break;
    }
    case 'merge':
      git.merge(parts[2]);
      break;
    case 'rebase':
      git.rebase(parts[2]);
      break;
    case 'reset':
      if (parts[2] === '--hard') git.resetHard(parts[3]);
      break;
    case 'cherry-pick':
      git.cherryPick(parts[2]);
      break;
    default:
      break;
  }
}
