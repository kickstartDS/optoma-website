/**
 * Single field row with visibility toggle, title, description, type badge, and order.
 */

import { useState } from "react";
import type { FieldNode, FieldOverride } from "../../shared/types.js";
import { FieldBadges } from "./FieldBadges.js";
import { useOverrides } from "../hooks/useOverrides.js";
import { isParentHidden } from "../lib/override-model.js";

interface FieldRowProps {
  field: FieldNode;
  componentName: string;
  depth: number;
}

export function FieldRow({ field, componentName, depth }: FieldRowProps) {
  const { overrides, dispatch } = useOverrides();
  const [expanded, setExpanded] = useState(depth < 2);
  const [detailOpen, setDetailOpen] = useState(false);

  const compOverrides = overrides.get(componentName) || new Map();
  const fieldOverride: FieldOverride = compOverrides.get(field.meta.path) || {};
  const isHidden = fieldOverride.hidden === true;
  const inheritedHidden = isParentHidden(compOverrides, field.meta.path);
  const effectivelyHidden = isHidden || inheritedHidden;

  const hasChildren = field.children.length > 0 && !field.isPolymorphic;
  const displayTitle =
    fieldOverride.title || field.meta.title || field.meta.name;

  return (
    <div
      className={`field-row ${effectivelyHidden ? "field-hidden" : ""}`}
      style={{ paddingLeft: `${depth * 20}px` }}
    >
      <div className="field-row-main">
        {/* Expand/collapse for nested fields */}
        {hasChildren ? (
          <button
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="expand-spacer" />
        )}

        {/* Visibility checkbox */}
        <label className="visibility-toggle">
          <input
            type="checkbox"
            checked={!isHidden}
            disabled={field.isPolymorphic}
            onChange={(e) =>
              dispatch({
                type: "SET_VISIBILITY",
                component: componentName,
                path: field.meta.path,
                hidden: !e.target.checked,
              })
            }
          />
        </label>

        {/* Field name */}
        <code className="field-name">{field.meta.name}</code>

        {/* Title override (inline editable) */}
        <input
          className="field-title-input"
          type="text"
          value={fieldOverride.title ?? field.meta.title ?? ""}
          placeholder={field.meta.title || "Title…"}
          onChange={(e) =>
            dispatch({
              type: "SET_TITLE",
              component: componentName,
              path: field.meta.path,
              title: e.target.value,
            })
          }
        />

        {/* Detail edit button */}
        <button
          className="detail-btn"
          onClick={() => setDetailOpen(!detailOpen)}
          title="Edit details"
        >
          ○
        </button>

        {/* Order controls */}
        <span className="order-controls">
          {fieldOverride.order !== undefined && (
            <span className="order-number">⑦</span>
          )}
          <button
            className="order-btn"
            onClick={() =>
              dispatch({
                type: "SET_ORDER",
                component: componentName,
                path: field.meta.path,
                order: (fieldOverride.order || 0) - 1,
              })
            }
            title="Move up"
          >
            ▴
          </button>
          <button
            className="order-btn"
            onClick={() =>
              dispatch({
                type: "SET_ORDER",
                component: componentName,
                path: field.meta.path,
                order: (fieldOverride.order || 0) + 1,
              })
            }
            title="Move down"
          >
            ▾
          </button>
        </span>
      </div>

      {/* Type badges row */}
      <div
        className="field-row-meta"
        style={{ paddingLeft: `${depth * 20 + 56}px` }}
      >
        <FieldBadges
          meta={field.meta}
          isHidden={isHidden}
          isInheritedHidden={inheritedHidden}
          isPolymorphic={field.isPolymorphic}
        />
      </div>

      {/* Detail expansion panel */}
      {detailOpen && (
        <div
          className="field-detail-panel"
          style={{ paddingLeft: `${depth * 20 + 56}px` }}
        >
          <div className="detail-field">
            <label>Description</label>
            <textarea
              value={fieldOverride.description ?? field.meta.description ?? ""}
              placeholder={field.meta.description || "Description…"}
              rows={2}
              onChange={(e) =>
                dispatch({
                  type: "SET_DESCRIPTION",
                  component: componentName,
                  path: field.meta.path,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="detail-field">
            <label>Order (x-cms-order)</label>
            <input
              type="number"
              value={fieldOverride.order ?? ""}
              placeholder="Auto"
              onChange={(e) =>
                dispatch({
                  type: "SET_ORDER",
                  component: componentName,
                  path: field.meta.path,
                  order: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
          <div className="detail-readonly">
            <div>
              <strong>Type:</strong> {field.meta.type}
            </div>
            {field.meta.format && (
              <div>
                <strong>Format:</strong> {field.meta.format}
              </div>
            )}
            {field.meta.enumValues && (
              <div>
                <strong>Enum:</strong> {field.meta.enumValues.join(", ")}
              </div>
            )}
            {field.meta.defaultValue !== undefined && (
              <div>
                <strong>Default:</strong>{" "}
                {JSON.stringify(field.meta.defaultValue)}
              </div>
            )}
            <div>
              <strong>Required:</strong> {field.meta.required ? "Yes" : "No"}
            </div>
            <div>
              <strong>Path:</strong> <code>{field.meta.path}</code>
            </div>
          </div>
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div className="field-children">
          {field.children.map((child) => (
            <FieldRow
              key={child.meta.path}
              field={child}
              componentName={componentName}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
