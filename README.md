# ACowork Website

The official marketing site for the **[ACowork](https://github.com/tranxon/ACowork)** open-source project — an AI agents collaboration platform.

## Stack

- Pure static site: HTML5 + native CSS + vanilla JavaScript
- No build step, no framework lock-in, no npm dependencies
- Deployed to **Cloudflare Pages** (git-integrated, branch `main` → production)

## Local preview

Just open `index.html` in a browser, or run any static server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve -l 8080 ./

# PowerShell (Windows) — uses .NET HttpListener
$h=[System.Net.HttpListener]::new(); $h.Prefixes.Add('http://localhost:8080/'); $h.Start();
while ($h.IsListening) { $c=$h.GetContext(); $r=$c.Response; $p=Join-Path (Get-Location) ($c.Request.Url.LocalPath.TrimStart('/')); if ($p -and (Test-Path $p) -and (Get-Item $p).PSIsContainer -eq $false) { $b=[IO.File]::ReadAllBytes($p); $r.ContentLength64=$b.Length; $r.OutputStream.Write($b,0,$b.Length) } else { $r.StatusCode=404 }; $r.Close() }
```

Then visit <http://localhost:8080>.

## File layout

```
.
├── index.html         # Single-page site (Hero / Download / Features / Get Started / CTA)
├── styles.css         # All styles, color tokens, responsive, dark+light
├── main.js            # Nav scroll, mobile menu, year stamp, GitHub stars fetch
├── _headers           # Cloudflare Pages response headers (security only)
├── assets/
│   ├── logo.svg         # Brand mark (warm yellow → orange gradient)
│   ├── logo-gray.svg    # Footer-friendly monochrome logo
│   ├── architecture.svg # System architecture diagram (from the ACowork repo)
│   ├── hero-1.jpg       # Product screenshot — multi-agent collaboration
│   ├── hero-2.jpg       # Product screenshot — debug panel & context snapshots
│   └── fonts/             # Self-hosted Inter + JetBrains Mono variable woff2
├── research/            # Market research write-ups
├── README.md
├── LICENSE
└── .gitignore
```

## Agents & Apps

There is no agent or app catalog page on this site. The registries live on
sibling Cloudflare sites, so the marketing homepage only links out:

| Registry | URL |
|---|---|
| Agent Hub (`.agent` packages) | <https://hub.acowork.ai> |
| App Gallery (hosted apps) | <https://gallery.acowork.ai> |

```html
<a href="https://hub.acowork.ai">Agent Hub</a>
<a href="https://gallery.acowork.ai">App Gallery</a>
```

Agents are published via [ACoworkAgentHub](https://github.com/acowork/ACoworkAgentHub);
apps are registered in [ACoworkAppGallery](https://github.com/acowork/ACoworkAppGallery).
Nothing here mirrors those catalogs, so there is no second copy to go stale.

## Editing content

- **Hero copy and sections**: edit `index.html`. Sections are marked with clear comments (`<!-- ============ HERO ============ -->` etc.).
- **Colors**: tweak the CSS custom properties at the top of `styles.css` (`--brand-1`, `--brand-2`, `--bg`, etc.).
- **GitHub stars**: `main.js` reads `tranxon/ACowork` — change `REPO` to point at a fork or to also display stars for this site repo.

## Deployment (Cloudflare Pages)

The project is already connected to this repo; a push to `main` builds and publishes.

1. Cloudflare dashboard → **Workers & Pages** → this project.
2. Build settings: *Root directory* `/`, *Build command* empty, *Output directory* `/`
   — what you commit is what gets served, there is no build step.
3. Every branch and PR gets a `*.pages.dev` preview URL automatically.

`_headers` is read by Pages at the edge. It now only sets
`X-Content-Type-Options: nosniff`; the rule that forced `Content-Disposition:
attachment` on `/agents/downloads/*` went away with that directory, because agent
packages are served by the Agent Hub, not by this site.

> Note: `*.pages.dev` has no mainland-China PoP and cannot be ICP-filed. Serve the
> site from a custom domain if mainland users matter. Reachability has four names
> to weigh here: this site, `hub.acowork.ai` (agents), `gallery.acowork.ai` (apps),
> and GitHub Releases (Desktop binaries) — a user can reach one and not the others.

The previous instructions here described a GitHub Pages setup; the site has since moved
to Cloudflare Pages.

## Contributing

Issues and PRs are welcome. For project-level conventions, see [`AGENTS.md`](https://github.com/tranxon/ACowork/blob/develop/AGENTS.md) in the upstream repo.

## License

[Apache-2.0](./LICENSE) © ACowork contributors.

