/**
 * useReducer-based state management for per-component overrides.
 *
 * Manages the in-memory override state as a ComponentOverrides map,
 * providing typed actions for all editing operations.
 */

import {
  useReducer,
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  ComponentOverrides,
  FieldOverride,
  OverrideMap,
  FieldNode,
} from "../../shared/types.js";
import {
  getComponentOverrides,
  setComponentOverrides,
  setOverride,
  bulkSetVisibility,
  resetOverrides,
  componentHasOverrides,
  recordToComponentOverrides,
} from "../lib/override-model.js";

// ─── Actions ────────────────────────────────────────────────────────────────

export type OverrideAction =
  | {
      type: "SET_VISIBILITY";
      component: string;
      path: string;
      hidden: boolean;
    }
  | { type: "SET_TITLE"; component: string; path: string; title: string }
  | {
      type: "SET_DESCRIPTION";
      component: string;
      path: string;
      description: string;
    }
  | { type: "SET_ORDER"; component: string; path: string; order: number }
  | {
      type: "BULK_SHOW_ALL";
      component: string;
      fields: FieldNode[];
    }
  | {
      type: "BULK_HIDE_ALL";
      component: string;
      fields: FieldNode[];
    }
  | { type: "RESET_COMPONENT"; component: string }
  | {
      type: "LOAD_OVERRIDES";
      overrides: Record<string, Record<string, FieldOverride>>;
    };

// ─── Reducer ────────────────────────────────────────────────────────────────

function overridesReducer(
  state: ComponentOverrides,
  action: OverrideAction
): ComponentOverrides {
  switch (action.type) {
    case "SET_VISIBILITY": {
      const compOverrides = getComponentOverrides(state, action.component);
      const existing = compOverrides.get(action.path) || {};
      const updated = setOverride(compOverrides, action.path, {
        ...existing,
        hidden: action.hidden,
      });
      return setComponentOverrides(state, action.component, updated);
    }

    case "SET_TITLE": {
      const compOverrides = getComponentOverrides(state, action.component);
      const existing = compOverrides.get(action.path) || {};
      const updated = setOverride(compOverrides, action.path, {
        ...existing,
        title: action.title,
      });
      return setComponentOverrides(state, action.component, updated);
    }

    case "SET_DESCRIPTION": {
      const compOverrides = getComponentOverrides(state, action.component);
      const existing = compOverrides.get(action.path) || {};
      const updated = setOverride(compOverrides, action.path, {
        ...existing,
        description: action.description,
      });
      return setComponentOverrides(state, action.component, updated);
    }

    case "SET_ORDER": {
      const compOverrides = getComponentOverrides(state, action.component);
      const existing = compOverrides.get(action.path) || {};
      const updated = setOverride(compOverrides, action.path, {
        ...existing,
        order: action.order,
      });
      return setComponentOverrides(state, action.component, updated);
    }

    case "BULK_SHOW_ALL": {
      const compOverrides = getComponentOverrides(state, action.component);
      const updated = bulkSetVisibility(compOverrides, action.fields, false);
      return setComponentOverrides(state, action.component, updated);
    }

    case "BULK_HIDE_ALL": {
      const compOverrides = getComponentOverrides(state, action.component);
      const updated = bulkSetVisibility(compOverrides, action.fields, true);
      return setComponentOverrides(state, action.component, updated);
    }

    case "RESET_COMPONENT": {
      const updated = resetOverrides();
      return setComponentOverrides(state, action.component, updated);
    }

    case "LOAD_OVERRIDES": {
      return recordToComponentOverrides(action.overrides);
    }

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface OverridesContextValue {
  overrides: ComponentOverrides;
  dispatch: Dispatch<OverrideAction>;
}

const OverridesContext = createContext<OverridesContextValue | null>(null);

export function OverridesProvider({ children }: { children: ReactNode }) {
  const [overrides, dispatch] = useReducer(
    overridesReducer,
    new Map() as ComponentOverrides
  );

  return (
    <OverridesContext.Provider value={{ overrides, dispatch }}>
      {children}
    </OverridesContext.Provider>
  );
}

export function useOverrides() {
  const ctx = useContext(OverridesContext);
  if (!ctx) {
    throw new Error("useOverrides must be used within an OverridesProvider");
  }
  return ctx;
}
