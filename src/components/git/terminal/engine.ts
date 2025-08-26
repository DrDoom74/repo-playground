import { useGitStore } from '@/state/gitStore';
import { formatStatus, formatBranches, formatLog, formatShow, formatReflog } from '@/git/text/format';
import { isAncestor, getBranchTip, getHeadCommitId } from '@/git/utils';

export function executeCommand(cmd: string, git: ReturnType<typeof useGitStore.getState>): string {
  const trimmed = cmd.trim();
  let parts = trimmed.split(/\s+/);
  
  // Handle git prefix - remove it if present
  if (parts[0] === 'git') {
    parts = parts.slice(1);
  }
  
  if (parts.length === 0) {
    throw new Error('No command specified');
  }
  
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
      if (args.length === 0 || args[0] === '-a') {
        const showAll = args.includes('-a');
        return formatBranches(git.repo, showAll);
      } else {
        // Create new branch
        const branchName = args[0];
        if (git.repo.branches[branchName]) {
          throw new Error(`Branch '${branchName}' already exists`);
        }
        git.createBranch(branchName);
        return `Created branch '${branchName}'`;
      }

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
    case 'switch':
      if (args[0] === '-b' && args[1]) {
        // Create and switch to new branch
        const branchName = args[1];
        if (git.repo.branches[branchName]) {
          throw new Error(`Branch '${branchName}' already exists`);
        }
        git.createBranch(branchName);
        git.checkout(branchName);
        return `Switched to a new branch '${branchName}'`;
      } else if (args[0]) {
        const ref = args[0];
        if (git.repo.branches[ref]) {
          git.checkout(ref);
          return `Switched to branch '${ref}'`;
        } else if (git.repo.commits[ref]) {
          git.checkout(ref);
          return `Switched to commit ${ref} (detached)`;
        } else {
          throw new Error(`Ref not found: ${ref}`);
        }
      } else {
        throw new Error('checkout/switch requires a branch or commit');
      }

    case 'commit':
      const msgIndex = args.indexOf('-m');
      if (msgIndex === -1) {
        throw new Error('commit requires -m flag with message');
      }
      
      // Parse message - handle quotes and multiple words
      let message = '';
      if (msgIndex + 1 < args.length) {
        const msgArg = args[msgIndex + 1];
        // Check if quoted
        const quotedMatch = msgArg.match(/^(['"])(.*)\1$/);
        if (quotedMatch) {
          message = quotedMatch[2];
        } else {
          // Collect all arguments after -m
          message = args.slice(msgIndex + 1).join(' ');
          // Remove surrounding quotes if present
          message = message.replace(/^(['"])|(['"])$/g, '');
        }
      }
      
      if (!message.trim()) {
        throw new Error('commit message cannot be empty');
      }
      
      const newCommitId = git.commit(message);
      return `[${git.repo.head.type === 'branch' ? git.repo.head.ref : 'detached'} ${newCommitId}] ${message}`;

    case 'merge':
      if (!args[0]) throw new Error('merge requires a branch name');
      if (git.repo.head.type !== 'branch') {
        throw new Error('Merge requires HEAD at a branch');
      }
      if (args[0] === git.repo.head.ref) {
        throw new Error('Cannot merge a branch into itself');
      }
      if (!git.repo.branches[args[0]]) {
        throw new Error(`Branch not found: ${args[0]}`);
      }
      
      const currentBranch = git.repo.head.ref;
      const targetTip = getBranchTip(git.repo, currentBranch);
      const fromTip = getBranchTip(git.repo, args[0]);
      
      if (targetTip === fromTip) {
        return 'Already up-to-date';
      }
      
      if (targetTip && fromTip && isAncestor(git.repo.commits, targetTip, fromTip)) {
        git.merge(args[0]);
        return `Fast-forwarded '${currentBranch}' to '${args[0]}'`;
      } else {
        git.merge(args[0]);
        return `Merged '${args[0]}' into '${currentBranch}' creating a merge commit`;
      }

    case 'rebase':
      if (!args[0]) throw new Error('rebase requires a branch name');
      if (git.repo.head.type !== 'branch') {
        throw new Error('Rebase requires HEAD at a branch');
      }
      if (!git.repo.branches[args[0]]) {
        throw new Error(`Branch not found: ${args[0]}`);
      }
      
      const curTip = getHeadCommitId(git.repo);
      const ontoTip = getBranchTip(git.repo, args[0]);
      
      if (curTip && ontoTip && isAncestor(git.repo.commits, ontoTip, curTip)) {
        return 'Already up-to-date';
      }
      
      git.rebase(args[0]);
      return `Successfully rebased onto '${args[0]}'`;

    case 'reset':
      if (args[0] !== '--hard' || !args[1]) {
        throw new Error('Only "reset --hard <commit>" is supported');
      }
      if (!git.repo.commits[args[1]]) {
        throw new Error(`Commit not found: ${args[1]}`);
      }
      git.resetHard(args[1]);
      return `HEAD is now at ${args[1]}`;

    case 'cherry-pick':
      if (!args[0]) throw new Error('cherry-pick requires a commit');
      if (!git.repo.commits[args[0]]) {
        throw new Error(`Commit not found: ${args[0]}`);
      }
      git.cherryPick(args[0]);
      return `Picked commit ${args[0]}`;

    default:
      throw new Error(`Unknown command: ${command}. Type "help" for available commands.`);
  }
}