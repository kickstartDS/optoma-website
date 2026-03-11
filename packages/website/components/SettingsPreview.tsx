import { SbBlokData, storyblokEditable } from "@storyblok/react";
import { Section } from "@kickstartds/design-system/components/section/index.js";
import { Headline } from "@kickstartds/design-system/components/headline/index.js";
import { Text } from "@kickstartds/design-system/components/text/index.js";

type SettingsPreviewProps = {
  blok: SbBlokData;
};

const SettingsPreview: React.FC<SettingsPreviewProps> = ({ blok }) => (
  <main {...storyblokEditable(blok)}>
    <Section spaceBefore="default" spaceAfter="default">
      <Headline
        text="Global Settings Preview"
        sub="This is what your website looks like with the current header, footer, and theme settings applied."
        align="center"
        level="h1"
        style="h1"
      />
      <Text
        text={`The **header** and **footer** shown on this page reflect your current site-wide settings. Use the sidebar to configure navigation items, logo, social links, and other global options.\n\nAny changes you make to the settings will be reflected here in real-time, so you can preview exactly how your site's chrome will appear to visitors.`}
        layout="singleColumn"
        align="center"
      />
    </Section>
  </main>
);

export default SettingsPreview;
