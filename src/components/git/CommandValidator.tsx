import { RepoState } from '@/git/types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

export function validateCommand(command: string, repo: RepoState): ValidationResult {
  const parts = command.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { valid: false, error: 'Введите команду' };
  }
  
  if (parts[0] !== 'git') {
    return { valid: false, error: 'Команды должны начинаться с "git"' };
  }
  
  if (parts.length === 1) {
    return { valid: false, error: 'Укажите подкоманду' };
  }
  
  const subcommand = parts[1];
  
  switch (subcommand) {
    case 'checkout':
      return validateCheckout(parts, repo);
    case 'branch':
      return validateBranch(parts, repo);
    case 'commit':
      return validateCommit(parts, repo);
    case 'merge':
      return validateMerge(parts, repo);
    case 'rebase':
      return validateRebase(parts, repo);
    case 'reset':
      return validateReset(parts, repo);
    case 'cherry-pick':
      return validateCherryPick(parts, repo);
    default:
      return { valid: false, error: `Неизвестная команда: ${subcommand}` };
  }
}

function validateCheckout(parts: string[], repo: RepoState): ValidationResult {
  if (parts.length < 3) {
    const branches = Object.keys(repo.branches).filter(b => 
      repo.head.type !== 'branch' || b !== repo.head.ref
    );
    return { 
      valid: false, 
      error: 'Укажите ветку или коммит для checkout',
      suggestion: branches.length > 0 ? `Доступные ветки: ${branches.join(', ')}` : undefined
    };
  }
  
  const target = parts[2];
  
  if (repo.branches[target]) {
    if (repo.head.type === 'branch' && repo.head.ref === target) {
      return { valid: false, error: `Уже находитесь на ветке ${target}` };
    }
    return { valid: true };
  }
  
  if (repo.commits[target]) {
    return { valid: true };
  }
  
  const branches = Object.keys(repo.branches);
  const commits = Object.keys(repo.commits);
  return { 
    valid: false, 
    error: `Ветка или коммит "${target}" не найден`,
    suggestion: `Доступно: ${[...branches, ...commits].join(', ')}`
  };
}

function validateBranch(parts: string[], repo: RepoState): ValidationResult {
  if (parts.length < 3) {
    return { valid: false, error: 'Укажите имя новой ветки' };
  }
  
  const branchName = parts[2];
  
  if (repo.branches[branchName]) {
    return { valid: false, error: `Ветка "${branchName}" уже существует` };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(branchName)) {
    return { valid: false, error: 'Имя ветки может содержать только буквы, цифры, _ и -' };
  }
  
  return { valid: true };
}

function validateCommit(parts: string[], repo: RepoState): ValidationResult {
  const msgIndex = parts.indexOf('-m');
  
  if (msgIndex === -1) {
    return { valid: false, error: 'Используйте: git commit -m "message"' };
  }
  
  if (msgIndex + 1 >= parts.length) {
    return { valid: false, error: 'Укажите сообщение коммита после -m' };
  }
  
  return { valid: true };
}

function validateMerge(parts: string[], repo: RepoState): ValidationResult {
  if (repo.head.type !== 'branch') {
    return { valid: false, error: 'Merge требует, чтобы HEAD был на ветке' };
  }
  
  if (parts.length < 3) {
    const otherBranches = Object.keys(repo.branches).filter(b => b !== repo.head.ref);
    return { 
      valid: false, 
      error: 'Укажите ветку для merge',
      suggestion: otherBranches.length > 0 ? `Доступные ветки: ${otherBranches.join(', ')}` : undefined
    };
  }
  
  const sourceBranch = parts[2];
  
  if (!repo.branches[sourceBranch]) {
    return { valid: false, error: `Ветка "${sourceBranch}" не найдена` };
  }
  
  if (sourceBranch === repo.head.ref) {
    return { valid: false, error: 'Нельзя слить ветку саму в себя' };
  }
  
  return { valid: true };
}

function validateRebase(parts: string[], repo: RepoState): ValidationResult {
  if (repo.head.type !== 'branch') {
    return { valid: false, error: 'Rebase требует, чтобы HEAD был на ветке' };
  }
  
  if (parts.length < 3) {
    const otherBranches = Object.keys(repo.branches).filter(b => b !== repo.head.ref);
    return { 
      valid: false, 
      error: 'Укажите ветку для rebase',
      suggestion: otherBranches.length > 0 ? `Доступные ветки: ${otherBranches.join(', ')}` : undefined
    };
  }
  
  const targetBranch = parts[2];
  
  if (!repo.branches[targetBranch]) {
    return { valid: false, error: `Ветка "${targetBranch}" не найдена` };
  }
  
  if (targetBranch === repo.head.ref) {
    return { valid: false, error: 'Нельзя перебазировать ветку на саму себя' };
  }
  
  return { valid: true };
}

function validateReset(parts: string[], repo: RepoState): ValidationResult {
  if (parts.length < 4 || parts[2] !== '--hard') {
    return { valid: false, error: 'Используйте: git reset --hard <commit>' };
  }
  
  const targetCommit = parts[3];
  
  if (!repo.commits[targetCommit]) {
    const commits = Object.keys(repo.commits);
    return { 
      valid: false, 
      error: `Коммит "${targetCommit}" не найден`,
      suggestion: `Доступные коммиты: ${commits.join(', ')}`
    };
  }
  
  return { valid: true };
}

function validateCherryPick(parts: string[], repo: RepoState): ValidationResult {
  if (parts.length < 3) {
    const commits = Object.keys(repo.commits);
    return { 
      valid: false, 
      error: 'Укажите коммит для cherry-pick',
      suggestion: `Доступные коммиты: ${commits.join(', ')}`
    };
  }
  
  const commitId = parts[2];
  
  if (!repo.commits[commitId]) {
    const commits = Object.keys(repo.commits);
    return { 
      valid: false, 
      error: `Коммит "${commitId}" не найден`,
      suggestion: `Доступные коммиты: ${commits.join(', ')}`
    };
  }
  
  return { valid: true };
}