import { useGitStore } from '@/state/gitStore';
import { formatStatus, formatBranches, formatLog, formatShow, formatReflog } from '@/git/text/format';

export function executeCommand(cmd: string, git: ReturnType<typeof useGitStore.getState>): string {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return `Available commands:
  status              - Show working tree status
  branch [-a]         - List branches (-a for all)
  log [--oneline]     - Show commit history
  show [commit]       - Show commit details
  reflog              - Show reference logs
  checkout <branch>   - Switch to branch
  branch <name>       - Create new branch
  commit -m "<msg>"   - Create commit
  merge <branch>      - Merge branch
  rebase <branch>     - Rebase onto branch
  reset --hard <ref>  - Reset to commit
  cherry-pick <commit> - Cherry-pick commit
  clear               - Clear terminal`;

    case 'status':
      return formatStatus(git.repo);

    case 'branch':
      const showAll = args.includes('-a');
      return formatBranches(git.repo, showAll);

    case 'log':
      const oneline = args.includes('--oneline');
      return formatLog(git.repo, oneline);

    case 'show':
      const showCommitId = args[0];
      return formatShow(git.repo, showCommitId);

    case 'reflog':
      return formatReflog(git.logs);

    case 'clear':
      return ''; // Terminal component should handle clearing

    // Write commands (existing functionality)
    case 'checkout':
      if (!args[0]) throw new Error('checkout requires a branch or commit');
      git.checkout(args[0]);
      return `Switched to '${args[0]}'`;

    case 'commit':
      const msgIndex = args.indexOf('-m');
      if (msgIndex === -1 || !args[msgIndex + 1]) {
        throw new Error('commit requires -m flag with message');
      }
      const message = args[msgIndex + 1];
      const newCommitId = git.commit(message);
      return `[${git.repo.head.type === 'branch' ? git.repo.head.ref : 'detached'} ${newCommitId}] ${message}`;

    case 'merge':
      if (!args[0]) throw new Error('merge requires a branch name');
      const mergeResult = git.merge(args[0]);
      return `Merged '${args[0]}' into current branch`;

    case 'rebase':
      if (!args[0]) throw new Error('rebase requires a branch name');
      git.rebase(args[0]);
      return `Successfully rebased onto '${args[0]}'`;

    case 'reset':
      if (args[0] !== '--hard' || !args[1]) {
        throw new Error('Only "reset --hard <commit>" is supported');
      }
      git.resetHard(args[1]);
      return `HEAD is now at ${args[1]}`;

    case 'cherry-pick':
      if (!args[0]) throw new Error('cherry-pick requires a commit');
      git.cherryPick(args[0]);
      return `Picked commit ${args[0]}`;

    default:
      throw new Error(`Unknown command: ${command}. Type "help" for available commands.`);
  }
}