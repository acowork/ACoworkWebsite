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
├── _headers           # Cloudflare Pages response headers (.agent → attachment)
├── agents/              # Agent Library — browse + download signed .agent packages
│   ├── index.html         # Page shell, toolbar, cards, install + submit sections
│   ├── agents.js          # Client-side search / filter / detail dialog (no backend)
│   ├── data/agents.json   # GENERATED — never hand-edit (see below)
│   ├── downloads/*.agent  # Signed packages, copied from the ACowork repo
│   └── avatars/*          # Agent avatars, copied from the ACowork repo
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

## Agent Library

`agents/` is a static directory of ACowork agents. Its contents are **generated**,
not authored here — the single source of truth is `examples/*/manifest.toml` in the
[ACowork](https://github.com/acowork/ACowork) repo.

After adding or changing an example agent, regenerate from the ACowork repo:

```bash
# 1. build + sign the package
./dev/common/build-agent.sh examples/my-agent

# 2. project it into this site (writes agents/data/agents.json, copies .agent + avatar)
python dev/common/sync-agent-hub.py --site ../ACoworkWebSite

# 3. verify the hub still behaves
NODE_PATH=<dir-with-jsdom>/node_modules node dev/agent-hub/hub.test.js ../ACoworkWebSite
```

The test suite runs the page's real JavaScript in jsdom **and** in headless Chrome
(both over `file://` and `http://`), so a CSS regression that makes `hidden`
stop working is caught. Set `CHROME_PATH` if Chrome is not in a standard location.

`sync-agent-hub.py` fails loudly on a missing package, a missing manifest field, or
an unknown `role` — it never silently drops an agent. Stale packages and avatars are
pruned, so a deleted example cannot keep downloading.

It writes two projections of the same manifests: `agents/data/agents.json` (the live
index) and a `<script type="application/json">` snapshot inside `agents/index.html`.
The snapshot is the `file://` fallback — browsers block `fetch()` of a local file,
so opening `agents/index.html` straight off disk would otherwise show nothing. Over
HTTP the JSON file wins and the snapshot is ignored.

There is deliberately **no backend**: search, filtering and detail views all run in the
browser against `data/agents.json` (~15 KB). Publishing happens through a pull request
to the ACowork repo, not an upload form. See `docs/prd/zh/prd-agent-hub.md` in the
ACowork repo for the reasoning and the non-goals.

### Previewing locally

Opening `index.html` directly from disk works, but the browser blocks `fetch()` of
local files, so the Agent Library falls back to its embedded snapshot and shows an
"offline snapshot" notice. For the live experience, serve the directory:

```bash
python3 -m http.server 8080      # then open http://localhost:8080/agents/
```

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

`_headers` is read by Pages at the edge; it forces `Content-Disposition: attachment`
on `/agents/downloads/*` so a `.agent` URL opened directly downloads instead of
rendering as text.

> Note: `*.pages.dev` has no mainland-China PoP and cannot be ICP-filed. Serve the
> site from a custom domain if mainland users matter; the download links are
> same-origin, so they inherit whatever the site's reachability is.

The previous instructions here described a GitHub Pages setup; the site has since moved
to Cloudflare Pages.

## Contributing

Issues and PRs are welcome. For project-level conventions, see [`AGENTS.md`](https://github.com/tranxon/ACowork/blob/develop/AGENTS.md) in the upstream repo.

## License

[Apache-2.0](./LICENSE) © ACowork contributors.

