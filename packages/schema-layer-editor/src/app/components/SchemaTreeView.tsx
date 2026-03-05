/**
 * Panel 3: Schema Tree View
 *
 * Renders the recursive field tree for a selected component or root field.
 * Includes bulk actions toolbar.
 */

import type { FieldNode, ComponentNode } from "../../shared/types.js";
import { FieldRow } from "./FieldRow.js";
import { BulkActions } from "./BulkActions.js";

interface SchemaTreeViewProps {
  /** The component or root field being edited */
  componentName: string;
  /** Display name for the header */
  displayName: string;
  /** The fields to render */
  fields: FieldNode[];
}

export function SchemaTreeView({
  componentName,
  displayName,
  fields,
}: SchemaTreeViewProps) {
  if (fields.length === 0) {
    return (
      <div className="panel panel-editor">
        <div className="panel-header">{displayName}</div>
        <div className="empty-state">No fields found for this component.</div>
      </div>
    );
  }

  return (
    <div className="panel panel-editor">
      <div className="panel-header">
        <span>{displayName}</span>
        <BulkActions componentName={componentName} fields={fields} />
      </div>
      <div className="field-tree">
        {fields.map((field) => (
          <FieldRow
            key={field.meta.path}
            field={field}
            componentName={componentName}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
