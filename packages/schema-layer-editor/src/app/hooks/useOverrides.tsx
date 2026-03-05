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
      type: "MOVE_FIELD";
      component: string;
      path: string;
      direction: "up" | "down";
      siblings: FieldNode[];
    }
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
      type: "SET_ALLOWED_COMPONENTS";
      component: string;
      path: string;
      allowedComponents: string[];
    }
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

    case "MOVE_FIELD": {
      let compOverrides = getComponentOverrides(state, action.component);

      // Step 1: Ensure all siblings have explicit order values
      // (initialized from schemaOrder if not already set)
      for (const sibling of action.siblings) {
        const existing = compOverrides.get(sibling.meta.path) || {};
        if (existing.order === undefined) {
          compOverrides = setOverride(compOverrides, sibling.meta.path, {
            ...existing,
            order: sibling.meta.schemaOrder,
          });
        }
      }

      // Step 2: Sort siblings by their current effective order
      const sorted = [...action.siblings].sort((a, b) => {
        const aOrder =
          compOverrides.get(a.meta.path)?.order ?? a.meta.schemaOrder;
        const bOrder =
          compOverrides.get(b.meta.path)?.order ?? b.meta.schemaOrder;
        return aOrder - bOrder;
      });

      // Step 3: Find the target field's position in the sorted list
      const idx = sorted.findIndex((f) => f.meta.path === action.path);
      if (idx < 0)
        return setComponentOverrides(state, action.component, compOverrides);

      const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) {
        return setComponentOverrides(state, action.component, compOverrides);
      }

      // Step 4: Swap the order values of the two fields
      const fieldA = sorted[idx];
      const fieldB = sorted[swapIdx];
      const orderA =
        compOverrides.get(fieldA.meta.path)?.order ?? fieldA.meta.schemaOrder;
      const orderB =
        compOverrides.get(fieldB.meta.path)?.order ?? fieldB.meta.schemaOrder;

      const existingA = compOverrides.get(fieldA.meta.path) || {};
      const existingB = compOverrides.get(fieldB.meta.path) || {};
      compOverrides = setOverride(compOverrides, fieldA.meta.path, {
        ...existingA,
        order: orderB,
      });
      compOverrides = setOverride(compOverrides, fieldB.meta.path, {
        ...existingB,
        order: orderA,
      });

      return setComponentOverrides(state, action.component, compOverrides);
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

    case "SET_ALLOWED_COMPONENTS": {
      const compOverrides = getComponentOverrides(state, action.component);
      const existing = compOverrides.get(action.path) || {};
      const updated = setOverride(compOverrides, action.path, {
        ...existing,
        allowedComponents:
          action.allowedComponents.length > 0
            ? action.allowedComponents
            : undefined,
      });
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
