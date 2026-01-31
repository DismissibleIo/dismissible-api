import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { WizardConfig } from '../config/schema';
import { defaultConfig } from '../config/defaults';
import { getValidationErrors } from '../utils/validateWizard';

export interface WizardState {
  currentStep: number;
  config: WizardConfig;
  validation: Record<string, string[]>;
  isDirty: boolean;
}

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_CONFIG'; payload: Partial<WizardConfig> }
  | { type: 'SET_VALIDATION'; payload: Record<string, string[]> }
  | { type: 'RESET' };

/** Total number of steps in the wizard */
export const TOTAL_STEPS = 10;
/** Index of the review step (last step) */
export const REVIEW_STEP_INDEX = TOTAL_STEPS - 1;

function buildInitialState(config: WizardConfig, initialStep = 0): WizardState {
  return {
    currentStep: initialStep,
    config,
    validation: getValidationErrors(config),
    isDirty: false,
  };
}

type ReducerInitialArg = WizardConfig | { config: WizardConfig; startAtReview: true };

function getInitialState(arg: ReducerInitialArg): WizardState {
  if (
    arg &&
    typeof arg === 'object' &&
    'startAtReview' in arg &&
    arg.startAtReview === true &&
    'config' in arg
  ) {
    return buildInitialState(arg.config, REVIEW_STEP_INDEX);
  }
  return buildInitialState(arg as WizardConfig, 0);
}

const defaultInitialState: WizardState = buildInitialState(defaultConfig);

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: Math.max(0, Math.min(REVIEW_STEP_INDEX, action.payload)),
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(REVIEW_STEP_INDEX, state.currentStep + 1),
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };
    case 'UPDATE_CONFIG': {
      const nextConfig = {
        ...state.config,
        ...action.payload,
      } as WizardConfig;
      return {
        ...state,
        config: nextConfig,
        validation: getValidationErrors(nextConfig),
        isDirty: true,
      };
    }
    case 'SET_VALIDATION':
      return {
        ...state,
        validation: action.payload,
      };
    case 'RESET':
      return defaultInitialState;
    default:
      return state;
  }
}

const WizardContext = createContext<
  | {
      state: WizardState;
      dispatch: React.Dispatch<WizardAction>;
    }
  | undefined
>(undefined);

export interface WizardProviderProps {
  children: ReactNode;
  /** Initial config (e.g. from share URL). When provided, wizard starts with this config. */
  initialConfig?: WizardConfig | null;
}

export function WizardProvider({ children, initialConfig }: WizardProviderProps) {
  const initialStateArg: ReducerInitialArg =
    initialConfig != null ? { config: initialConfig, startAtReview: true } : defaultConfig;
  const [state, dispatch] = useReducer(wizardReducer, initialStateArg, getInitialState);

  return <WizardContext.Provider value={{ state, dispatch }}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

/**
 * Custom hook for working with a specific section of the wizard config.
 * Eliminates the repetitive update pattern in step components.
 *
 * @example
 * const { section: cors, update: updateCors, getError } = useConfigSection('cors');
 * updateCors({ enabled: true });
 */
export function useConfigSection<K extends keyof WizardConfig>(sectionKey: K) {
  const { state, dispatch } = useWizard();
  const section = state.config[sectionKey];
  const { validation } = state;

  const update = useCallback(
    (updates: Partial<WizardConfig[K]>) => {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: {
          [sectionKey]: {
            ...section,
            ...updates,
          },
        } as Partial<WizardConfig>,
      });
    },
    [dispatch, section, sectionKey],
  );

  const getError = useCallback(
    (fieldName: string) => {
      const path = `${sectionKey}.${fieldName}`;
      const messages = validation[path];
      return messages?.[0];
    },
    [sectionKey, validation],
  );

  return { section, update, getError, validation };
}
