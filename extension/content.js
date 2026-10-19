const api = globalThis.browser ?? chrome;
const style = document.createElement('style');
let settings = { ...DEFAULTS };

// "Home feed hidden" message for the empty home page (shown by CSS in options.js when the search box option is off).
// display:none inline keeps it hidden when the extension is off; the homeFeed rule overrides it with !important.
const home = Object.assign(document.createElement('div'), { id: 'cy-home', textContent: 'Home feed hidden' });
home.style.display = 'none';

function apply() {
  style.textContent = buildCss(settings);
  if (!style.isConnected) document.documentElement.append(style);
}

// ponytail: 500ms poll covers YouTube's SPA navigation and lazy player; switch to yt-navigate-finish + MutationObserver if it ever shows up in profiles.
function tick() {
  document.documentElement.setAttribute('cy-path', location.pathname);
  if (!home.isConnected) document.body?.append(home);
  syncAutoplay();
  if (!settings.enabled) return;
  if (settings.shortsRedirect && location.pathname.startsWith('/shorts/')) {
    location.replace('/watch?v=' + location.pathname.split('/')[2]);
  }
}

// Autoplay is YouTube's own saved preference, not something CSS can undo. Remember (in youtube.com's localStorage, so it
// survives reloads) that we switched it off, and switch it back on once the option or the extension is turned off.
function syncAutoplay() {
  const toggle = document.querySelector('.ytp-autonav-toggle-button');
  if (!toggle) return;
  const on = toggle.getAttribute('aria-checked') === 'true';
  const block = settings.enabled && settings.disableAutoplay;
  if (block && on) {
    toggle.closest('button').click();
    localStorage.setItem('cy-autoplay-off', '1');
  } else if (!block && !on && localStorage.getItem('cy-autoplay-off')) {
    toggle.closest('button').click();
    localStorage.removeItem('cy-autoplay-off');
  }
}

api.storage.sync.get(DEFAULTS).then(s => { settings = s; apply(); tick(); });
api.storage.onChanged.addListener(changes => {
  for (const [k, { newValue }] of Object.entries(changes)) settings[k] = newValue;
  apply();
  tick(); // undo/redo script-driven changes (autoplay) right away instead of on the next poll
});
setInterval(tick, 500);
// Drop the home overlay as soon as an in-app navigation starts so it never sits over the next page; tick re-adds it.
// yt-navigate-* fire on www, state-navigate* on m.youtube.com.
for (const e of ['yt-navigate-start', 'state-navigatestart']) addEventListener(e, () => home.remove());
for (const e of ['yt-navigate-finish', 'state-navigateend']) addEventListener(e, tick);
