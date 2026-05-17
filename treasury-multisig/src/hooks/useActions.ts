import { ACTIONS_CONFIG } from "@/lib/constants";
import { ActionType, ActionConfig } from "@/types";

export function useActions() {
  const getAllActions = (): ActionConfig[] => Object.values(ACTIONS_CONFIG);

  const getActionsByCategory = (
    category: "governance" | "voting" | "emergency" | "treasury"
  ): ActionConfig[] =>
    Object.values(ACTIONS_CONFIG).filter((action) => action.category === category);

  const getAction = (id: ActionType): ActionConfig | undefined => ACTIONS_CONFIG[id];

  const requiresGovernance = (id: ActionType): boolean =>
    ACTIONS_CONFIG[id]?.requiresApproval ?? false;

  return { getAllActions, getActionsByCategory, getAction, requiresGovernance };
}
