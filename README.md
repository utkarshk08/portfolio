# Utkarsh Khandelwal — Portfolio

A responsive personal portfolio featuring software projects, technical skills, and campus activities. Built with HTML, CSS, and JavaScript, with locally hosted fonts and assets.

This repository is the separate deployment for the planned `utkarshkhandelwal.me` domain. Until registration and DNS setup are complete, its GitHub Pages address is [https://utkarshk08.github.io/portfolio/](https://utkarshk08.github.io/portfolio/).

The original [https://utkarshk08.github.io](https://utkarshk08.github.io) site stays in the [`utkarshk08.github.io` repository](https://github.com/utkarshk08/utkarshk08.github.io) and must keep its custom-domain setting empty. Configure the `.me` domain and its `CNAME` file only in this repository after domain ownership is confirmed.

Both deployments use the same static site files. When updating the portfolio, sync `index.html`, `styles.css`, `app.js`, `.nojekyll`, and `assets/` to both repositories; preserve each repository's README and domain configuration. Never copy a `CNAME` file into the original user-site repository.

## Run locally

From this directory, start a static server:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

The static site files are at the repository root and require no build step.

## Files

- `index.html` — page structure and content
- `styles.css` — layout, themes, and responsive styles
- `app.js` — interactions and project details
- `assets/` — fonts, images, favicon, and résumé
