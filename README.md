# Cave Daily / 山洞日報

A small daily news reader. Two sections (台灣 / World), four topic filters (Finance, Tech, Politics, Literature), and an explain panel for tapped or selected words.

## How to open

From this folder:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/` in a browser.

Or open `index.html` directly. Some browsers block `fetch` of local JSON from a `file://` page, so the local server is the reliable way once `taiwan-news.json` and `world-news.json` are in this folder.

## On your phone

Open the paper in the phone’s browser first (Safari on iPhone, Chrome on Android). It needs `https`, or a local server on your own machine. Then put it on the home screen so it opens full-screen, like a small magazine, not a browser tab.

### iPhone (Safari)

1. Open the Cave Daily URL in Safari.
2. Tap the Share button (the square with an arrow).
3. Scroll and tap **Add to Home Screen**.
4. Keep the name **Cave Daily**, then tap Add.

### Android (Chrome)

1. Open the Cave Daily URL in Chrome.
2. Tap the menu (three dots).
3. Tap **Add to Home screen** or **Install app**.
4. Confirm.

The cream nameplate icon is the one that should appear. After that, weekday news files still refresh when you have a network; if you are offline, the last copy stays readable.

## Data

The app loads:

- `./taiwan-news.json`
- `./world-news.json`

If a file is missing, that section falls back to one clearly marked sample story. It does not fetch live news.

## Interaction

- Switch 台灣 / World, then filter by topic.
- Literature on the Taiwan tab shows: “Literature is US-only.”
- Stories open in full. Use Fold / Open on a card to tuck the body away.
- Green-underlined words are glossary terms. Click one, or select any 1–40 characters in a story, and the Explain panel gives a short reading.
- Escape or Close clears the panel.
