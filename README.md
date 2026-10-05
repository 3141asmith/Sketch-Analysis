# Sketch Analysis

Interactive exploration of Google's Quick, Draw! drawings: galleries, morphing animations, cumulative heatmaps, average images, density interpretation, and statistical analysis.

## GitHub Pages

The `docs/` folder is a standalone browser version. Build it with `npm run build:pages`, commit the resulting files, and publish `main` / `docs` through GitHub Pages. No server, API token, or paid service is needed. Dataset files are fetched from Google's public storage on demand, stored in IndexedDB on the visitor's device, and analyzed in a Web Worker. Large downloads need sufficient browser storage; browsers can evict cached data. Downloads on one device are not shared with other visitors. Only application code and the official category list are published; the full dataset is not in this repository.

Both the browser version and local Node version share the analysis algorithms. Browser category comparisons use up to 48 evenly spaced drawings per other downloaded category. Data and results stay on the visitor's device; clearing site data removes them. The draw page seeds its matching library with the cat category if no data has been downloaded yet.

A local, dependency-free website for viewing Google's Quick, Draw! dataset as SVG images, with category search, pagination, random pages and drawing details.

## Run

From this directory run `npm start` (Node 22+) or, with this workspace's bundled Node, `powershell -ExecutionPolicy Bypass -File .\start.ps1`. Open http://localhost:4173. Set `PORT` to change the port. The server binds to the local machine only.

## Draw & discover

Follow **Draw & discover** from the gallery, or open http://localhost:4173/draw. Draw with a mouse, pen or finger; a neighboring panel updates with the closest visual shape while drawing. Undo removes the last stroke and Clear starts again. Matching runs in a browser worker and your sketch is never uploaded.

This initial matcher uses symmetric chamfer distance on centered, scale-normalized 28×28 stroke rasters. It searches up to 512 real drawings spread across each locally downloaded category, not every drawing in the full dataset. It compares visual geometry, not semantic meaning, and does not report classification confidence. Download more categories in the gallery and reload the drawing page to include them. Reference samples are cached by the server until the downloaded category list changes.

## Category animation

Open **Animate drawings** from the gallery or visit http://localhost:4173/animate. Choose a category and press Play to smoothly morph through every drawing in dataset order. Pause, step forward, adjust the interval from 0.5 to 5 seconds, or jump to a drawing number. Playback loops after the final drawing. Only the current and upcoming batches are retained, and playback stops advancing while the tab is hidden. Strokes are paired by geometric similarity and direction, then their points move between shapes. Extra strokes grow from or shrink to a point. Original corners are preserved at transition endpoints.

## Downloading data

The official category list and complete **cat** and **dog** categories have been downloaded. Other categories download in full from Google's public storage when first selected, and are cached in `data/`. Internet access is needed only for categories that have not been downloaded. Downloads may take several minutes; failed downloads can be retried. Downloaded categories are available offline while the local server is running. No account, API key, npm dependencies, or build step is required.

To download all 345 categories ahead of time, run `npm run download:all`. This is the full simplified dataset, containing tens of millions of drawings, and requires substantial disk space (many gigabytes). To download selected categories: `node download.cjs dog "ice cream"`. Existing files are reused. Do not run the downloader and server concurrently for the same uncached category.

The server indexes line offsets in memory and reads only the requested 48 records from disk. Original stroke data and metadata are retained as NDJSON; the browser renders centered SVG images. Large data files are excluded from Git. No sample drawings are fabricated.

Source: https://github.com/googlecreativelab/quickdraw-dataset

Data provided by Google, Inc., drawn by Quick, Draw! players, under Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/. Rendering changes: simplified vectors are centered and styled with rounded dark strokes for display.

## Ink coverage histogram
The gallery measures all drawings in the selected category and displays a frequency distribution in 1-percentage-point bins. Coverage counts pixel centers inside the union of 3-pixel rounded strokes on the gallery's centered 279 x 279 canvas; antialiasing is excluded. The chart zooms its horizontal axis to the occupied range. Analysis runs in a server worker and caches results in data/*.ink.json, invalidated when the source file changes. The first calculation can take a minute; subsequent visits reuse the cache.


## Category average
The Average button beside the selected category opens the arithmetic mean image of every drawing. Centered binary ink masks are averaged pixel by pixel at 279 x 279 with 3-pixel strokes. White means no ink; black means ink in every drawing. The displayed average uses 8-bit grayscale without contrast enhancement. Results share the histogram analysis and disk cache.


## All histograms
Open /histograms using All histograms in the gallery header. All 345 categories appear alphabetically with a filter. Each category has a download-and-populate button immediately below its title. Already downloaded categories are analyzed as they enter view; other categories require a button click. Work is queued one category at a time. Each chart uses the full category and the shared histogram cache, with an exact frequency table and independently scaled axes.


## Statistical analysis
Open /analysis from the gallery's Analysis link and choose Analyze category. The analysis downloads missing category data and runs in a Node worker; results are cached in data/*.analysis.json. Full-category outputs include stroke-count and line-length distributions, recognition-group comparisons, mirrored 28x28 ink-overlap symmetry, bounding-box aspect ratio, and country summaries with counts and recognition rates.
Shape exploration uses 512 evenly spaced drawings: smoothed pixel variance maps, typical/outlier examples ranked by mean pairwise squared shape distance, six deterministic k-means clusters with means and representatives, and cumulative stroke-order maps. Similarity compares the selected sample mean to up to 48 drawings spread across each other downloaded category. These are descriptive geometric analyses, not semantic classification or causal evidence. Sample coverage and limitations appear beside each section. Run analysis-test.cjs with the workspace Node/Playwright installation to check totals, variance bounds, cluster membership, stroke-order maps and dashboard rendering.

