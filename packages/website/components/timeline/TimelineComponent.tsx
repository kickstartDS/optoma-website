import {
  forwardRef,
  createContext,
  useContext,
  HTMLAttributes,
  FC,
  PropsWithChildren,
} from "react";
import classnames from "classnames";
import { TimelineProps } from "./TimelineProps";
import { Picture } from "@kickstartds/base/lib/picture";
import { deepMergeDefaults } from "../helpers";
import defaults from "./TimelineDefaults";
import { unflatten } from "@/helpers/unflatten";
import { useKsComponent } from "@kickstartds/core/lib/react";
import { identifier } from "./Timeline.client";

export type { TimelineProps };

export const TimelineContextDefault = forwardRef<
  HTMLDivElement,
  TimelineProps & HTMLAttributes<HTMLDivElement>
>(({ timelineItems, className, ...rest }, ref) => {
  const mergedProps = deepMergeDefaults(defaults, { timelineItems });
  const componentProps = useKsComponent(identifier, ref);

  return (
    <div
      {...componentProps}
      {...rest}
      ref={ref}
      className={classnames("dsa-timeline", className)}
    >
      {mergedProps.timelineItems
        ?.map((item) => unflatten(item))
        ?.map((item, index) => {
          const hasTextLeft = !!item.textLeft;
          const hasTextRight = !!item.textRight;
          const hasImage = !!item.image?.src;

          return (
            <div key={index} className="dsa-timeline__item">
              <div className="dsa-timeline__content-left">
                {hasTextLeft && <p>{item.textLeft}</p>}
                {hasImage && hasTextLeft && (
                  <div className="dsa-timeline__image">
                    <Picture src={item.image.src!} alt={item.image.alt || ""} />
                  </div>
                )}
              </div>

              <div className="dsa-timeline__marker">{item.year}</div>

              <div className="dsa-timeline__content-right">
                {hasTextRight && <p>{item.textRight}</p>}
                {hasImage && hasTextRight && (
                  <div className="dsa-timeline__image">
                    <Picture src={item.image.src!} alt={item.image.alt || ""} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
});
TimelineContextDefault.displayName = "TimelineContextDefault";

export const TimelineContext = createContext(TimelineContextDefault);
export const Timeline = forwardRef<
  HTMLDivElement,
  TimelineProps & HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const Component = useContext(TimelineContext);
  return <Component {...deepMergeDefaults(defaults, props)} ref={ref} />;
});
Timeline.displayName = "Timeline";

export const TimelineProvider: FC<PropsWithChildren> = (props) => (
  <TimelineContext.Provider {...props} value={Timeline} />
);
