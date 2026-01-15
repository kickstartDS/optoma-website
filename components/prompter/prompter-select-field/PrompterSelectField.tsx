import { forwardRef } from "react";
import { SelectField } from "@kickstartds/form/lib/select-field";

export const PrompterSelectField = forwardRef<HTMLSelectElement>(
  (props, ref) => {
    return (
      <div className="prompter-select-field">
        <SelectField ref={ref} {...props} hideLabel />
      </div>
    );
  }
);

PrompterSelectField.displayName = "PrompterSelectField";
