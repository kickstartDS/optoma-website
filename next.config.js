const cspHeader = `
    default-src 'self';
    connect-src 'self' https://api.storyblok.com https://*.${process.env.NEXT_PUBLIC_PRIMARY_PUBLIC_SITE_DOMAIN};
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.storyblok.com https://*.${process.env.NEXT_PUBLIC_PRIMARY_PUBLIC_SITE_DOMAIN} https://journeyengine.production.wlp.cloud;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://journeyengine.production.wlp.cloud;
    frame-src 'self' https://youtube.com https://www.youtube.com https://player.vimeo.com *.google.com;
    img-src 'self' blob: data: https://a.storyblok.com https://placehold.co;
    media-src 'self' blob: data: https://a.storyblok.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors https://app.storyblok.com;
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@kickstartds/base",
    "@kickstartds/blog",
    "@kickstartds/content",
    "@kickstartds/core",
    "@kickstartds/form",
    "@kickstartds/ds-agency-premium",
  ],
  output: "standalone",
};

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "host",
            value: process.env.NEXT_PUBLIC_SECONDARY_PUBLIC_SITE_DOMAIN,
          },
        ],
        destination: `https://${process.env.NEXT_PUBLIC_PRIMARY_PUBLIC_SITE_DOMAIN}/:path*`,
        permanent: true,
      },
    ];
  },
  images: {
    domains: ["a.storyblok.com", "placehold.co"].filter(Boolean),
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/c15t/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_C15T_URL}/:path*`,
  //     },
  //   ];
  // },
  ...nextConfig,
};
