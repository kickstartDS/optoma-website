import { FC, PropsWithChildren, forwardRef, useContext } from "react";
import { SectionContext } from "@kickstartds/ds-agency-premium/section";
import { HeadlineLevelProvider } from "../headline/HeadlineLevelContext";
import AiBadgeComponent from "../prompter/prompter-badge/PrompterBadge";

export const SectionProvider: FC<PropsWithChildren<any>> = (props) => {
  const PrevSection = useContext(SectionContext);
  // eslint-disable-next-line react/display-name
  const Section = forwardRef<HTMLDivElement, any>(
    ({ aiDraft, children, ...props }, ref) => {
      return (
        <HeadlineLevelProvider>
          <PrevSection
            {...props}
            ref={ref}
            data-ai-draft={aiDraft || undefined}
          >
            {aiDraft && <AiBadgeComponent label="KI Draft" state={"saved"} />}
            {children}
          </PrevSection>
        </HeadlineLevelProvider>
      );
    }
  );
  return <SectionContext.Provider {...props} value={Section} />;
};
