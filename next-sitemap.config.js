/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  changefreq: "daily",
  priority: 0.7,
  generateRobotsTxt: true,
  exclude: ["/server-sitemap.xml"],
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL}/server-sitemap.xml`,
    ],
    transformRobotsTxt: async () => {
      return `User-agent: *
Disallow: /`;
    },
  },
  transform: async () => {
    return null;
  },
};
