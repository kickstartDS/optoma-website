# kickstartDS Storyblok Starter

A **pnpm workspaces monorepo** containing a Next.js 13 website, a Storyblok MCP server, a shared services library, and an n8n community node — all powered by the **kickstartDS** design system (`@kickstartds/ds-agency-premium`).

## Monorepo Structure

```
packages/
  website/              — Next.js 13 site (Storyblok CMS, ISR, Visual Editor)
  storyblok-services/   — Shared library (schema, validation, transforms)
  mcp-server/           — Storyblok MCP server (Model Context Protocol)
  n8n-nodes/            — n8n community node for Storyblok workflows
```

**Package manager:** pnpm 9.15.0 · **Versioning:** Changesets for independent per-package publishing

## Quick Start

### Requirements

- **Node.js 18+** — `nvs use` or `nvm use` for automatic version selection
- **pnpm 9.15.0** — `corepack enable && corepack prepare pnpm@9.15.0 --activate`
- [`mkcert`](https://github.com/FiloSottile/mkcert#installation) — for local SSL (needed for Storyblok Visual Editor iframe)

### Install & Build

```bash
pnpm install                # Install all workspaces
pnpm -r run build           # Build all packages (topological order)
```

### Environment Variables

Create `packages/website/.env.local` (see `.env.local.sample`) with:

- `NEXT_STORYBLOK_API_TOKEN` — Preview API token
- `NEXT_STORYBLOK_OAUTH_TOKEN` — Management API token
- `NEXT_STORYBLOK_SPACE_ID` — Space ID (without `#`)

### Local Development

```bash
pnpm --filter website dev   # Start dev server with SSL proxy on :3010
```

Set Storyblok Visual Editor preview URL to `https://localhost:3010/api/preview/`

### Common Commands

```bash
pnpm -r run build                              # Build all packages
pnpm --filter website dev                      # Website dev server
pnpm --filter mcp-server dev                   # MCP server dev mode
pnpm --filter website push-components          # Push CMS schema to Storyblok
pnpm --filter website generate-content-types   # Pull + generate TypeScript types
pnpm changeset                                 # Create a new changeset
pnpm version-packages                          # Bump versions from changesets
pnpm publish-packages                          # Publish to npm
```

## MCP Server (AI Integration)

The project includes a **Storyblok MCP server** ([packages/mcp-server/](packages/mcp-server/)) that exposes CMS tools (content CRUD, AI generation, component introspection) to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/).

Key capabilities:

- **Multi-content-type support**: 5 content types (`page`, `blog-post`, `blog-overview`, `event-detail`, `event-list`) with per-type schema validation via a `SchemaRegistry`
- **Auto-schema derivation**: The `generate_content` tool can automatically derive OpenAI-compatible schemas from the kickstartDS Design System schema for any content type — no manual schema authoring needed
- **Automatic transforms**: Import tools automatically convert Design System props into Storyblok's flat `key_subKey` format
- **Full pipeline**: End-to-end content generation from prompt → schema preparation → OpenAI generation → post-processing → Storyblok import

Transport modes:

- **Local usage**: Run via stdio for Claude Desktop — `pnpm --filter mcp-server start`
- **Cloud deployment**: Deploy via Kamal with Streamable HTTP transport — `kamal deploy -d mcp`
  - Deploys to the same server as the main site under a separate subdomain
  - Endpoint: `https://mcp.your-domain.com/mcp`

See [packages/mcp-server/README.md](packages/mcp-server/README.md) for full setup and deployment instructions.

For event-driven automation (without an LLM), see the companion [n8n community nodes](packages/n8n-nodes/), which offer the same auto-schema and auto-transform capabilities as n8n workflow nodes.

## Prompter (In-Editor AI Generation)

The website includes a **Prompter component** that enables AI content generation directly inside Storyblok's Visual Editor. Editors place a Prompter inside a section, enter a prompt, and generate content via OpenAI — all without leaving the editor.

- **Section mode**: Generate a single section by picking a component type and entering a prompt
- **Page mode**: AI plans a multi-section page structure, generates each section sequentially, and imports them all at once
- **CMS-configurable**: Default mode, allowed component types, content type, and upload behavior are all configurable as Storyblok fields

API routes live under `/api/prompter/` (patterns, recipes, plan, generate-section, import, ideas). The Prompter consumes the same shared service library (`@kickstartds/storyblok-services`) as the MCP server and n8n nodes.

## Local Development

### Setup

#### TODO

- Favicon
- Fonts
- HTML lang
- (robots.txt)
- 404 / 500
- initial branding seems broken currently, at least for Premium Starter. Maybe a consequence of failed merges with Lughausen repository
- add general note that nothing here _needs_ to be done with Github and / or Netlify, and while some commands might change slightly... everything should be much the same no matter where you want to host
- maybe add info about exit preview-URL, to preview / compare with published content... and to remove the cookie that might stick outside of the preview, too
- move initial demo page to slug `/`?
- add section pointing at and explaining DSA DS
- mention mp4-requirement for premium (project has to be verified by Storyblok)
- add note about initial initialization taking a while (without any feedback currently)

### Adding initial content

#### Root page (your index page)

TODO

#### Global Settings (header, footer, seo)

TODO

#### 404

TODO

### Creating branded component and preset previews

`YOUR_WEBSITE` should be the path pointing to your website project, the one you want to update the previews for.

TODO adjust this to `ds-agency` on non-premium version

1. Clone the Design System this is based on locally: https://github.com/kickstartDS/ds-agency-premium
2. Switch to the freshly cloned directory, and inside (ensure you're using the correct Node version 18+; `nvs use`, `nvm use` for automatic selection, if you use one of those tools):
   1. `yarn` to install dependencies
   2. `rm -rf src/token` to remove the existing default theme
   3. `cp -r YOUR_WEBSITE/token src/token` to copy your Design Token / Style Dictionary configuration to the Design System project
   4. Adjust the `background-color` for the `.preview--wrapper` CSS class in `global.scss`, to a color suitable for your component screenshots (depends on your applied design)
      1. Optionally, if you've done customizations in `index.scss`, you should add an import to the file `.storybook/preview.tsx` (e.g. right after the already existing `import "./preview.css";`): `import YOUR_WEBSITE/index.scss`
      2. If you've also changed your fonts, you should probably change the content of `fonts.scss` accordingly (if not done already). Finally uncomment the font import in `index.scss` temporarily, to include the correct fonts in preview generation. Fonts are normally loaded by Next.js, which is missing when building from Storybook.
   5. `yarn build-storybook` to build a Storybook that can then be used to create screenshots
   6. `yarn create-component-previews` to re-create the existing previews with your branding
   7. `mkdir -p YOUR_WEBSITE/public/img && rm -rf YOUR_WEBSITE/public/img/screenshots && cp -r static/img/screenshots YOUR_WEBSITE/public/img/` to copy the generated screenshots to your project
   8. `cd YOUR_WEBSITE` to switch to your website project
   9. `npm run update-previews` to update those newly created screenshots in your Storyblok space (can take 2-3 mins)
3. That's it!

Reminder: Undo the import for `fonts.scss` in `index.scss` if you had to change that for your previews, otherwise you'd load redundant fonts on your page later.

## Working with the content schema

### Typescript Support

Generate ts types according to the content schema by running
`pnpm --filter website generate-content-types`.

### Migrations

When changing the content schema we recommend sticking to [Storyblok's Best
Practices](https://www.storyblok.com/tp/storyblok-cli-best-practices#modify-blok-structure).

## Contributing

Contributions are welcome. Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as below, without any additional terms or conditions.

## License

This project is licensed under either of

- [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) ([LICENSE-APACHE](LICENSE-APACHE))
- [MIT license](https://opensource.org/license/mit/) ([LICENSE-MIT](LICENSE-MIT))

at your option.

The SPDX license identifier for this project is MIT OR Apache-2.0.

---

For more information and updates, please visit the project's GitHub repository.

## Support

Join our [Discord community](https://discord.gg/mwKzD5gejY) for support, or leave an issue on this repository!
