/**
 * Type badge, required badge, inherited-hidden badge.
 */

import type { FieldMeta } from "../../shared/types.js";

interface FieldBadgesProps {
  meta: FieldMeta;
  isHidden: boolean;
  isInheritedHidden: boolean;
  isPolymorphic: boolean;
}

export function FieldBadges({
  meta,
  isHidden,
  isInheritedHidden,
  isPolymorphic,
}: FieldBadgesProps) {
  // Build type label
  let typeLabel: string = meta.type;
  if (meta.format) {
    typeLabel += ` (${meta.format})`;
  }
  if (meta.enumValues && meta.enumValues.length > 0) {
    typeLabel = `enum`;
  }
  if (isPolymorphic) {
    typeLabel = "polymorphic";
  }

  return (
    <span className="field-badges">
      <span className={`badge badge-type badge-type-${meta.type}`}>
        {typeLabel}
      </span>
      {meta.required && <span className="badge badge-required">required</span>}
      {isHidden && !isInheritedHidden && (
        <span className="badge badge-hidden">hidden</span>
      )}
      {isInheritedHidden && (
        <span className="badge badge-inherited">inherited</span>
      )}
      {isPolymorphic && (
        <span className="badge badge-polymorphic">managed per component</span>
      )}
    </span>
  );
}
