# Store listing assets

| Folder | Store | Format |
|---|---|---|
| `firefox/` | addons.mozilla.org | 2400×1800 PNG (the maximum AMO accepts) |
| `chrome/` | Chrome Web Store | 1280×800 JPEG screenshots + 440×280 small promo tile (exact sizes, no transparency) |

The store icon is `extension/icons/128.png`. AMO doesn't take it from the package, so upload it under **Images → Add-on icon**.

Screenshots were taken with the real extension running (Chrome, throwaway profile) and from the iOS Simulator for the phone shots, with Safari's address bar cropped off. YouTube's own feedback-survey popups were hidden.

## Screenshot captions

1. `1-home`: A clean start page: just the logo and YouTube's own search, no feed
2. `2-video`: Watch without recommendations; comment profile pictures replaced with a default avatar
3. `3-popup`: Turn each option on or off; changes apply instantly, no reload
4. `4-iphone`: Also works on YouTube's mobile site, in light and dark mode

## Summary

Search YouTube without the doom scroll. Hides the home feed, Shorts, recommendations, autoplay and other distractions, with a switch for each one. Changes apply instantly. No tracking, no data collected.

(Chrome uses the manifest `description` as its summary, max 132 characters.)

## Description

AMO renders the Markdown below. For the Chrome Web Store, which shows plain text, swap `**bold**` for plain text and `-` for `•`.

Clean YouTube turns YouTube back into a search box. Open it and you get the YouTube logo and search bar in the middle of the page, with no feed pulling you in. Search for what you came for, watch it, and leave.

**On by default**
- **Home feed hidden:** replaced by a centered logo and YouTube's own search bar (with suggestions and voice search), or a simple "Home feed hidden" message if you prefer
- **Shorts hidden:** removed from feeds, search results and the menu; Shorts links open in the normal video player
- **Recommended videos hidden:** gone from next to (or below) the video
- **Autoplay off:** no next video starting on its own; end-screen video walls and end cards are hidden too
- **Mixes and filler search results hidden:** Mixes are YouTube's endless auto-generated playlists; the filler is the extra rows YouTube mixes into search results

**Optional, one switch each**
- **Thumbnails:** hide them everywhere or only on certain pages (home, subscriptions, search, channels, playlists, history, end screen), or blur them and hover to peek
- **Comments:** hide them, or keep them and replace profile pictures with a plain default avatar
- **Watch page:** hide live chat, playlist panel, fundraisers, the like/share buttons, channel info or the description
- **Shopping:** hide merch, tickets and offers
- **Navigation:** hide the left menu or parts of it (Explore, More from YouTube, Subscriptions), and the notifications bell

**Details**
- Every change applies the moment you flip a switch, with no page reload, and turning a switch off puts the page back exactly as it was
- One master switch turns everything off
- Works on youtube.com and on the mobile site (m.youtube.com), with a touch-friendly settings panel that follows your light or dark theme

**Privacy:** Clean YouTube collects no data and sends nothing anywhere. It only changes how youtube.com looks in your browser, and your settings are stored by your browser.

Open source (MIT): https://github.com/Code-Tomato/clean-youtube. Bug reports and suggestions are welcome in the Issues tab.

## Chrome Web Store: Privacy practices tab

- **Single purpose:** Hides distracting parts of YouTube (home feed, Shorts, recommendations, autoplay) so people can search and watch without endless scrolling.
- **`storage` permission:** Saves which options the user has turned on or off.
- **Host permission (youtube.com, m.youtube.com):** The content script adds styles to YouTube pages to hide the parts the user chose, and switches YouTube's autoplay toggle off if the user asked for that.
- **Remote code:** No. All code ships in the package.
- **Data usage:** Collects no user data. Tick the three certifications (no selling, no unrelated use, no creditworthiness use).
- **Privacy policy URL:** Not required when no data is collected; the GitHub repo can be used if the form insists.

## Categories

- AMO: Privacy & Security, or Other
- Chrome: Productivity
