export interface TimelineItemProps {
  year: string;
  textLeft?: string;
  textRight?: string;
  image?: {
    src?: string;
    alt?: string;
  };
}

export interface TimelineProps {
  timelineItems: TimelineItemProps[];
}
