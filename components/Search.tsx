import { ComponentProps } from "react";
import { SbBlokData, storyblokEditable } from "@storyblok/react";
import { Section } from "@kickstartds/ds-agency-premium/components/section/index.js";
import { Search as DsaSearch } from "@kickstartds/ds-agency-premium/components/search/index.js";
import { Headline } from "@kickstartds/ds-agency-premium/components/headline/index.js";
import { SearchForm } from "@kickstartds/ds-agency-premium/components/search-form/index.js";
import { unflatten } from "@/helpers/unflatten";

type PageProps = {
  blok: ComponentProps<typeof DsaSearch> & SbBlokData;
};

const Search: React.FC<PageProps> = ({ blok }) => {
  if (blok) {
    const { headline } = blok;

    return (
      <main {...storyblokEditable(blok)}>
        <Section
          content={{
            mode: "list",
            gutter: "none",
          }}
          spaceAfter="small"
        >
          {/* @ts-expect-error */}
          {headline && <Headline {...unflatten(headline)} />}
          <SearchForm component="dsa.search-form.pagefind" />
        </Section>
      </main>
    );
  }
  return null;
};

export default Search;
