/**
 * Bulk actions toolbar: Show All, Hide All, Reset, Expand/Collapse All.
 */

import type { FieldNode } from "../../shared/types.js";
import { useOverrides } from "../hooks/useOverrides.js";

interface BulkActionsProps {
  componentName: string;
  fields: FieldNode[];
}

export function BulkActions({ componentName, fields }: BulkActionsProps) {
  const { dispatch } = useOverrides();

  return (
    <div className="bulk-actions">
      <button
        className="bulk-btn"
        onClick={() =>
          dispatch({
            type: "BULK_SHOW_ALL",
            component: componentName,
            fields,
          })
        }
        title="Set all fields to visible"
      >
        Show All
      </button>
      <button
        className="bulk-btn"
        onClick={() =>
          dispatch({
            type: "BULK_HIDE_ALL",
            component: componentName,
            fields,
          })
        }
        title="Set all fields to hidden"
      >
        Hide All
      </button>
      <button
        className="bulk-btn bulk-btn-danger"
        onClick={() =>
          dispatch({
            type: "RESET_COMPONENT",
            component: componentName,
          })
        }
        title="Remove all overrides for this component"
      >
        Reset
      </button>
    </div>
  );
}
