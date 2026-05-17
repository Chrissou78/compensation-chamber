import { ACTIONS } from '@/lib/constants';
import { ActionType, ActionConfig } from '@/types';

export function useActions() {
  const getAllActions = (): ActionConfig[] => {
    return Object.values(ACTIONS);
  };

  const getActionsByCategory = (
    category: 'governance' | 'voting' | 'emergency' | 'treasury'
  ): ActionConfig[] => {
    return Object.values(ACTIONS).filter((action) => action.category === category);
  };

  const getAction = (id: ActionType): ActionConfig | undefined => {
    return ACTIONS[id];
  };

  const requiresGovernance = (id: ActionType): boolean => {
    return ACTIONS[id]?.requiresApproval ?? false;
  };

  return {
    getAllActions,
    getActionsByCategory,
    getAction,
    requiresGovernance,
  };
}
