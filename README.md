# ACowork Website

The official marketing site for the **[ACowork](https://github.com/tranxon/ACowork)** open-source project — an AI agents collaboration platform.

## Stack

- Pure static site: HTML5 + native CSS + vanilla JavaScript
- No build step, no framework lock-in
- Designed to be deployed directly to **GitHub Pages** (root of the repo)

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
├── index.html         # Single-page site (Hero / Why / Highlights / Architecture / Quick Start / Roadmap / CTA)
├── styles.css         # All styles, color tokens, responsive
├── main.js            # Nav scroll, mobile menu, year stamp, GitHub stars fetch
├── assets/
│   ├── logo.svg         # Brand mark (warm yellow → orange gradient)
│   ├── logo-gray.svg    # Footer-friendly monochrome logo
│   ├── architecture.svg # System architecture diagram (from the ACowork repo)
│   ├── hero-1.jpg       # Product screenshot — multi-agent collaboration
│   └── hero-2.jpg       # Product screenshot — debug panel & context snapshots
├── README.md
├── LICENSE
└── .gitignore
```

## Editing content

- **Hero copy and sections**: edit `index.html`. Sections are marked with clear comments (`<!-- ============ HERO ============ -->` etc.).
- **Colors**: tweak the CSS custom properties at the top of `styles.css` (`--brand-1`, `--brand-2`, `--bg`, etc.).
- **GitHub stars**: `main.js` reads `tranxon/ACowork` — change `REPO` to point at a fork or to also display stars for this site repo.

## Deployment (GitHub Pages)

1. Push this repo to GitHub.
2. Settings → **Pages** → **Build and deployment** → Source: *Deploy from a branch* → Branch: `main` / `/ (root)`.
3. After a minute, the site is live at `https://<owner>.github.io/ACoworkWebsite/`.

The site contains **no build step** — what you commit is what gets served. PRs and edits can be previewed instantly via a `*.github.io` staging URL.

## Contributing

Issues and PRs are welcome. For project-level conventions, see [`AGENTS.md`](https://github.com/tranxon/ACowork/blob/develop/AGENTS.md) in the upstream repo.

## License

[Apache-2.0](./LICENSE) © ACowork contributors.

