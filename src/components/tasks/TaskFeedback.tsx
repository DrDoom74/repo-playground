import { useMemo } from 'react';
import { RepoState, Assertion } from '@/git/types';
import { checkAssertion } from '@/tasks/assertions';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TaskFeedbackProps {
  currentState: RepoState;
  targetAssertions: Assertion[];
  className?: string;
}

export function TaskFeedback({ currentState, targetAssertions, className }: TaskFeedbackProps) {
  const results = useMemo(() => {
    return targetAssertions.map(assertion => ({
      assertion,
      passed: checkAssertion(currentState, assertion),
      description: getAssertionDescription(assertion)
    }));
  }, [currentState, targetAssertions]);

  const allPassed = results.every(r => r.passed);

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex items-center gap-2">
        {allPassed ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400">
              Задача выполнена! 🎉
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="font-medium">
              Прогресс: {results.filter(r => r.passed).length} из {results.length}
            </span>
          </>
        )}
      </div>

      <div className="space-y-2">
        {results.map((result, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {result.passed ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <span className={result.passed ? 'text-green-700 dark:text-green-400' : ''}>
              {result.description}
            </span>
            <Badge 
              variant={result.passed ? 'default' : 'outline'}
              className="ml-auto"
            >
              {result.passed ? 'Выполнено' : 'Требуется'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function getAssertionDescription(assertion: Assertion): string {
  switch (assertion.type) {
    case 'HEAD_AT_BRANCH':
      return `HEAD должен указывать на ветку "${assertion.branch}"`;
    
    case 'BRANCH_AT_COMMIT':
      return `Ветка "${assertion.branch}" должна указывать на коммит ${assertion.commit}`;
    
    case 'IS_FAST_FORWARD':
      return `Должен быть возможен fast-forward merge из "${assertion.fromBranch}" в "${assertion.targetBranch}"`;
    
    case 'HAS_MERGE_COMMIT_ON_BRANCH':
      return `На вершине ветки "${assertion.branch}" должен быть merge-коммит`;
    
    case 'BRANCH_CONTAINS_COMMITS':
      return `Ветка "${assertion.branch}" должна содержать коммиты: ${assertion.commits.join(', ')}`;
    
    case 'LINEAR_HISTORY':
      return `Ветка "${assertion.branch}" должна иметь линейную историю`;
    
    case 'HEAD_AT_COMMIT':
      return `HEAD должен указывать на коммит ${assertion.commit}`;
    
    case 'COMMIT_COUNT_ON_BRANCH':
      if (assertion.eq !== undefined) {
        return `Ветка "${assertion.branch}" должна содержать ровно ${assertion.eq} коммитов`;
      }
      if (assertion.gte !== undefined) {
        return `Ветка "${assertion.branch}" должна содержать минимум ${assertion.gte} коммитов`;
      }
      return `Проверка количества коммитов на ветке "${assertion.branch}"`;
    
    case 'BRANCH_EXISTS':
      return assertion.exists 
        ? `Ветка "${assertion.branch}" должна существовать`
        : `Ветка "${assertion.branch}" не должна существовать`;
    
    case 'EITHER':
      return `Должно выполняться одно из условий (${assertion.anyOf.length} вариантов)`;
    
    default:
      return 'Неизвестное условие';
  }
}