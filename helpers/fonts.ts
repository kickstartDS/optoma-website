import localFont from "next/font/local";

const displayFont = localFont({
  src: [
    {
      path: "../token/fonts/novelpro-regular.woff",
      weight: "400",
      style: "normal",
    },
  ],
  preload: true,
  display: "swap",
  variable: "--ks-brand-font-family-display",
  fallback: [
    "Baskerville",
    "'Baskerville Old Face'",
    "'Hoefler Text'",
    "'Times New Roman'",
    "serif",
  ],
  adjustFontFallback: false,
});

const copyFont = localFont({
  src: [
    {
      path: "../token/fonts/novelsanspro-regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../token/fonts/novelsanspro-bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  preload: true,
  display: "swap",
  variable: "--ks-brand-font-family-copy",
  fallback: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
  adjustFontFallback: false,
});

const displayFontPreview = localFont({
  src: [
    {
      path: "../token/fonts/novelpro-regular.woff",
      weight: "400",
      style: "normal",
    },
  ],
  preload: false,
  display: "auto",
  variable: "--ks-brand-font-family-display",
  fallback: [
    "Baskerville",
    "'Baskerville Old Face'",
    "'Hoefler Text'",
    "'Times New Roman'",
    "serif",
  ],
  adjustFontFallback: false,
});

const copyFontPreview = localFont({
  src: [
    {
      path: "../token/fonts/novelsanspro-regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../token/fonts/novelsanspro-bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  preload: false,
  display: "auto",
  variable: "--ks-brand-font-family-copy",
  fallback: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
  adjustFontFallback: false,
});

export const fontClassNames = `${displayFont.variable} ${copyFont.variable}`;
export const fontClassNamesPreview = `${displayFontPreview.variable} ${copyFontPreview.variable}`;
