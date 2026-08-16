# Field Notes

A black-and-white magazine you click into. Home is an index — photo, headline, dek, byline — not a scroll of full articles. Tap a card to open the reader.

Two sections (台灣 / World), topic filters (All, Finance, Tech, Politics, Literature, Pop, Social), and a glossary for tapped or selected words.

## How to open

From this folder:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/` in a browser.

Or open `index.html` directly. Some browsers block `fetch` of local JSON from a `file://` page, so the local server is the reliable way once `taiwan-news.json` and `world-news.json` are in this folder.

## On your phone

Open Field Notes in the phone’s browser first (Safari on iPhone, Chrome on Android). It needs `https`, or a local server on your own machine. Then put it on the home screen so it opens full-screen, like a small magazine, not a browser tab.

### iPhone (Safari)

1. Open the Field Notes URL in Safari.
2. Tap the Share button (the square with an arrow).
3. Scroll and tap **Add to Home Screen**.
4. Keep the name **Field Notes**, then tap Add.

### Android (Chrome)

1. Open the Field Notes URL in Chrome.
2. Tap the menu (three dots).
3. Tap **Add to Home screen** or **Install app**.
4. Confirm.

The black-and-white FN mark is the icon that should appear. After that, weekday news files still refresh when you have a network; if you are offline, the last copy stays readable.

## Information architecture

**Home** is the index.

- Masthead: FIELD NOTES, the date, a small “Lean left”, 台灣 | World, and topic filters.
- One **featured** story at the top: split image and headline, then Read.
- A labeled mix grid (**Today**, or the active topic). Each card has a photo (or a black-and-white topic block if there is no image), a display headline, a short dek, and a source + date byline. No full caveman text on the cards.
- Click a card or the featured Read to open the reader.

**Reader** is the full piece.

- Back returns to the index.
- Hero image and credit, headline, dek, the caveman explanation, why it matters, and who thinks what.
- Dotted glossary terms, plus select-any-phrase explain.
- A source line that links out (https only).

Literature on the Taiwan tab still shows: “Literature is US-only.” Pop on the World tab shows: “Pop culture is Taiwan-only.” Social appears in both sections.

## Data

The app loads:

- `./taiwan-news.json`
- `./world-news.json`

Stories may include `image`, `image_alt`, and `image_credit`. If those fields are missing, the card shows a strict black-and-white topic block instead of a fake photo.

If a file is missing, that section falls back to one clearly marked sample story. It does not fetch live news.
