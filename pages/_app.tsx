import path from "path";
import { useEffect } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

import DsaProviders from "@kickstartds/ds-agency-premium/providers";
import { Header } from "@kickstartds/ds-agency-premium/header";
import { Footer } from "@kickstartds/ds-agency-premium/footer";
import { Breadcrumb } from "@kickstartds/ds-agency-premium/breadcrumb";
import { initStoryblok } from "@/helpers/storyblok";
import { unflatten } from "@/helpers/unflatten";
import Meta from "@/components/Meta";
import "lazysizes/plugins/attrchange/ls.attrchange";

import ComponentProviders from "@/components/ComponentProviders";
import ImageSizeProviders from "@/components/ImageSizeProviders";
import ImageRatioProviders from "@/components/ImageRatioProviders";

import palette from "@kickstartds/ds-agency-premium/global.client.js";
import "@kickstartds/ds-agency-premium/global.css";
import "@/index.scss";
import { BlurHashProvider } from "@/components/BlurHashContext";
import { LanguageProvider } from "@/components/LanguageContext";
import { Section } from "@kickstartds/ds-agency-premium/components/section/index.js";

initStoryblok(process.env.NEXT_STORYBLOK_API_TOKEN);
if (typeof window !== "undefined") {
  console.log(palette);
}

const handleRouteChange = (url: string) => {
  // close mobile nav
  window._ks.radio.emit("location.change", url);
  // https://github.com/vercel/next.js/issues/33060
  document.activeElement instanceof HTMLElement &&
    document.activeElement.blur();
};

const setActiveNavItem = (navItems: any[] = [], currentRoute: string) => {
  const route = currentRoute.replace(/^\/|\/$/g, "");
  for (const navItem of navItems) {
    const href = navItem.url.replace(/^\/|\/$/g, "");
    navItem.active = href === route;

    if (navItem.items && Array.isArray(navItem.items)) {
      for (const item of navItem.items) {
        const itemHref = item.url.replace(/^\/|\/$/g, "");
        item.active = itemHref === route;
        navItem.active ||= item.active;
      }
    }
  }
};

export default function App({
  Component,
  pageProps,
}: AppProps & {
  Component: NextPage;
}) {
  const { settings, story, blurHashes, language } = pageProps;
  const headerProps = settings?.header ? unflatten(settings?.header) : {};
  const footerProps = settings?.footer ? unflatten(settings?.footer) : {};
  const token = settings?.token || "";
  const storyProps = story?.content ? unflatten(story?.content) : {};
  const router = useRouter();

  const invertHeader = storyProps?.header?.inverted
    ? !headerProps?.inverted
    : headerProps?.inverted;
  const floatHeader = storyProps?.header?.floating
    ? !headerProps?.floating
    : headerProps?.floating;
  const invertFooter = storyProps?.footer?.inverted
    ? !footerProps?.inverted
    : footerProps?.inverted;

  setActiveNavItem(headerProps?.navItems, router.asPath);
  setActiveNavItem(footerProps?.navItems, router.asPath);

  useEffect(() => {
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events]);

  const url = new URL(router.asPath, "http://dummy-base");
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const pages = pathSegments.map((segment) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    url: path.join(
      "/",
      ...pathSegments.slice(0, pathSegments.indexOf(segment) + 1)
    ),
  }));
  if (pages.length > 0 && pages[0]?.label.toLowerCase() === "_preview") {
    pages.shift();
  }
  if (pages[0]?.label !== "Home") {
    pages.unshift({ label: "Home", url: "/" });
  }

  return (
    <LanguageProvider language={language}>
      <BlurHashProvider blurHashes={blurHashes}>
        <DsaProviders>
          <ComponentProviders>
            <ImageSizeProviders>
              <ImageRatioProviders>
                <Meta
                  globalSeo={settings?.seo}
                  pageSeo={story?.content.seo}
                  fallbackName={story?.name}
                />
                {token && <style data-tokens>{token}</style>}
                {headerProps && (
                  <Header
                    logo={{}}
                    {...headerProps}
                    inverted={invertHeader}
                    floating={floatHeader}
                  />
                )}
                <Section width="max" spaceAfter="none" spaceBefore="none">
                  {pages && pages.length > 1 && <Breadcrumb pages={pages} />}
                </Section>
                <Component {...pageProps} />
                {footerProps && (
                  <Footer
                    logo={{}}
                    {...footerProps}
                    inverted={invertFooter || false}
                  />
                )}
              </ImageRatioProviders>
            </ImageSizeProviders>
          </ComponentProviders>
        </DsaProviders>
      </BlurHashProvider>
    </LanguageProvider>
  );
}
