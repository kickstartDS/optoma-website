import dynamic from "next/dynamic";
import { SbBlokData, storyblokEditable } from "@storyblok/react";

const ColorDemo = dynamic(
  () => import("@kickstartds/design-system/playground/color-demo"),
  { ssr: false }
);
const FontDemo = dynamic(
  () => import("@kickstartds/design-system/playground/font-demo"),
  { ssr: false }
);
const SpacingDemo = dynamic(
  () => import("@kickstartds/design-system/playground/spacing-demo"),
  { ssr: false }
);

type SettingsPreviewProps = {
  blok: SbBlokData;
};

const SettingsPreview: React.FC<SettingsPreviewProps> = ({ blok }) => (
  <main {...storyblokEditable(blok)}>
    <ColorDemo />
    <FontDemo />
    <SpacingDemo />
  </main>
);

export default SettingsPreview;
