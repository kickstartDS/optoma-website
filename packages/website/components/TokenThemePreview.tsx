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

type TokenThemePreviewProps = {
  blok: SbBlokData & {
    name?: string;
    tokens?: string;
    css?: string;
  };
};

const TokenThemePreview: React.FC<TokenThemePreviewProps> = ({ blok }) => (
  <main {...storyblokEditable(blok)}>
    {blok.css && (
      <style data-tokens dangerouslySetInnerHTML={{ __html: blok.css }} />
    )}
    <ColorDemo />
    <FontDemo />
    <SpacingDemo />
  </main>
);

export default TokenThemePreview;
