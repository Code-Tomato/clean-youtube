// Single source of truth for every toggle. Loaded by both the popup and the content script.
//   hide:   selectors set to display:none
//   css:    extra raw CSS (layout fixes)
//   thumbs: scope whose thumbnails get hidden (or blurred when blurThumbs is on)
//   sub:    render indented under the previous top-level option
//   needs:  only applies while that other option is also on
// ytd-* selectors target www.youtube.com, ytm-* target m.youtube.com (iPhone). The mobile site has no
// page-type attributes, so content.js mirrors location.pathname into html[cy-path] for page scoping.
// Options with none of these (disableAutoplay, shortsRedirect, blurThumbs) are handled in content.js.
// Gray box with a default-avatar silhouette, shown in place of hidden comment profile pics
const PLACEHOLDER = `rgba(128,128,128,.2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z'/%3E%3C/svg%3E") center/auto 45% no-repeat`;
// #author-thumbnail is the avatar itself in the reply box but a tall column wrapper in comments, so target the inner yt-img-shadow
const AVATAR = ':is(ytd-comment-view-model, ytd-comment-renderer, ytd-comment-simplebox-renderer) :is(#author-thumbnail yt-img-shadow, yt-img-shadow#author-thumbnail), :is(ytm-comment-renderer, ytm-comment-simplebox-renderer) ytm-profile-icon, comments-entry-point-teaser-view-model avatar-view-model';

// Turns YouTube's own top bar into a centered logo + search on the empty home page, so its suggestions and voice search keep working.
const HOME = 'html[cy-path="/"]';
const M = `${HOME} .mobile-topbar-header[data-mode="browse"]`; // m.youtube.com; data-mode flips to "searching" once tapped, restoring the normal bar
const HOME_SEARCH_CSS = `${HOME} #cy-home{display:none!important}
${HOME} #masthead-container{transform:none!important;background:transparent!important}
${HOME} ytd-masthead #background, ${HOME} ytd-masthead :is(#end, #guide-button){display:none!important}
${HOME} ytd-masthead ytd-topbar-logo-renderer{position:fixed;left:50%;top:calc(50vh - 120px);transform:translate(-50%,-50%) scale(2.2)}
${HOME} ytd-masthead #center{position:fixed;left:50%;top:50vh;transform:translate(-50%,-50%);width:min(720px,80vw);max-width:none;margin:0}
${HOME} ytd-masthead #center yt-searchbox{flex:1;max-width:none;margin:0}
${HOME} ytm-mobile-topbar-renderer:has(.mobile-topbar-header[data-mode="browse"]){background:transparent!important}
${M}{position:fixed;inset:0;height:auto;flex-direction:column;justify-content:center;align-items:center;gap:32px;padding-bottom:20vh;background:transparent;pointer-events:none}
${M} > *{pointer-events:auto}
${M} ytm-home-logo{transform:scale(1.6)}
${M} .mobile-topbar-header-content{flex:none;width:min(560px,86vw);padding:0}
${M} .mobile-topbar-header-content > :not(.topbar-button-search-button){display:none!important}
${M} .topbar-button-search-button{display:flex;align-items:center;gap:12px;width:100%;height:52px;margin:0;padding:0 18px;border-radius:26px;background:#8882;color:inherit}
${M} .topbar-button-search-button::after{content:"Search YouTube";font-size:17px;opacity:.6}`;

const OPTIONS = [
  { id: 'homeFeed', label: 'Hide Home Feed', on: true, hide: 'ytd-browse[page-subtype="home"], html[cy-path="/"] ytm-browse', css: 'html[cy-path="/"] #cy-home{display:flex!important}' },
  { id: 'homeSearch', label: 'Search box in its place', sub: true, on: true, needs: 'homeFeed', css: HOME_SEARCH_CSS },

  { id: 'shorts', label: 'Hide Shorts', on: true, hide: [
    'ytd-reel-shelf-renderer', 'ytd-rich-shelf-renderer[is-shorts]', 'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
    'grid-shelf-view-model', 'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2', 'ytd-reel-item-renderer',
    ':is(ytd-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, yt-lockup-view-model, ytm-video-with-context-renderer, ytm-rich-item-renderer):has(a[href^="/shorts/"])',
    'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
    ':is(ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer):has(a[title="Shorts"], a[href="/shorts/"])',
    'yt-tab-shape[tab-title="Shorts"]', 'ytd-shorts',
  ].join() },
  { id: 'shortsRedirect', label: 'Open Shorts in normal player', sub: true, on: true },

  { id: 'mixes', label: 'Hide Mixes', on: true, hide: 'ytd-radio-renderer, ytd-compact-radio-renderer, ytm-radio-renderer, :is(ytd-rich-item-renderer, yt-lockup-view-model, ytm-rich-item-renderer, ytm-video-with-context-renderer):has(a[href*="start_radio=1"])' },

  { id: 'inaptSearch', label: 'Hide Inapt Search Results', on: true, hide: ':is(ytd-search, ytm-search) :is(ytd-shelf-renderer, ytd-horizontal-card-list-renderer, ytd-reel-shelf-renderer, grid-shelf-view-model, ytm-shelf-renderer, ytm-horizontal-card-list-renderer, ytm-reel-shelf-renderer)' },

  { id: 'thumbs', label: 'Hide Thumbnails (everywhere)', thumbs: 'html' },
  { id: 'thumbsHome', label: 'Home', sub: true, thumbs: 'ytd-browse[page-subtype="home"], html[cy-path="/"] ytm-browse' },
  { id: 'thumbsSubs', label: 'Subscriptions feed', sub: true, thumbs: 'ytd-browse[page-subtype="subscriptions"], html[cy-path="/feed/subscriptions"] ytm-browse' },
  { id: 'thumbsSearch', label: 'Search results', sub: true, thumbs: 'ytd-search, ytm-search' },
  { id: 'thumbsChannel', label: 'Channel pages', sub: true, thumbs: 'ytd-browse[page-subtype="channels"], html:is([cy-path^="/@"], [cy-path^="/channel/"], [cy-path^="/c/"]) ytm-browse' },
  { id: 'thumbsSidebar', label: 'Video sidebar', sub: true, thumbs: 'ytd-watch-flexy :is(#secondary, #related), ytm-item-section-renderer[section-identifier="related-items"]' },
  { id: 'thumbsPlaylist', label: 'Playlists', sub: true, thumbs: 'ytd-browse[page-subtype="playlist"], ytd-playlist-panel-renderer, html[cy-path="/playlist"] ytm-browse' },
  { id: 'thumbsHistory', label: 'History & library', sub: true, thumbs: 'ytd-browse:is([page-subtype="history"], [page-subtype="library"], [page-subtype="you"]), html:is([cy-path="/feed/history"], [cy-path="/feed/library"], [cy-path="/feed/you"]) ytm-browse' },
  { id: 'thumbsEnd', label: 'End screen', sub: true, thumbs: '.html5-video-player' },
  { id: 'blurThumbs', label: 'Blur instead of hide (hover to peek)', sub: true },

  { id: 'sidebar', label: 'Hide Video Sidebar', hide: 'ytd-watch-flexy :is(#secondary, #related, #playlist, #chat-container, ytd-live-chat-frame, ytd-donation-shelf-renderer)' },
  { id: 'recommended', label: 'Recommended', sub: true, on: true, hide: 'ytd-watch-flexy #related, ytd-watch-next-secondary-results-renderer, ytm-item-section-renderer[section-identifier="related-items"]' },
  { id: 'liveChat', label: 'Live Chat', sub: true, hide: 'ytd-watch-flexy #chat-container, ytd-live-chat-frame' },
  { id: 'playlist', label: 'Playlist', sub: true, hide: 'ytd-watch-flexy ytd-playlist-panel-renderer#playlist' },
  { id: 'fundraiser', label: 'Fundraiser', sub: true, hide: 'ytd-donation-shelf-renderer' },

  { id: 'comments', label: 'Hide Comments', hide: 'ytd-comments#comments, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"], ytm-item-section-renderer:has(yt-comment-teaser-carousel-item-view-model), ytm-engagement-panel-section-list-renderer.engagement-panel-comments-section' },
  { id: 'commentAvatars', label: 'Comment profile pics', sub: true, css: `:is(${AVATAR}){background:${PLACEHOLDER}!important;border-radius:50%}:is(${AVATAR}) img{opacity:0!important}` },

  { id: 'videoInfo', label: 'Hide Video Info (keeps title)', hide: 'ytd-watch-metadata :is(#top-row, #description)' },
  { id: 'buttonsBar', label: 'Buttons bar', sub: true, hide: 'ytd-watch-metadata #actions' },
  { id: 'channel', label: 'Channel', sub: true, hide: 'ytd-watch-metadata #owner' },
  { id: 'description', label: 'Description', sub: true, hide: 'ytd-watch-metadata #description' },

  { id: 'merch', label: 'Hide Merch, Tickets, Offers', hide: 'ytd-merch-shelf-renderer, ytd-ticket-shelf-renderer, ytd-movie-offer-module-renderer, #ticket-shelf, #offer-module' },

  { id: 'disableAutoplay', label: 'Disable Autoplay', on: true },
  { id: 'endFeed', label: 'Hide End Screen Feed', on: true, hide: '.html5-endscreen, .ytp-endscreen-content, .ytp-fullscreen-grid, .ytp-fullscreen-grid-peek, .ytp-pause-overlay' },
  { id: 'endCards', label: 'Hide End Screen Cards', on: true, hide: '.ytp-ce-element' },
  { id: 'annotations', label: 'Disable Annotations', on: true, hide: '.annotation, .iv-branding, .ytp-cards-button, .ytp-cards-teaser, .ytp-paid-content-overlay, .ytp-suggested-action' },

  { id: 'guide', label: 'Hide Left Menu', hide: 'tp-yt-app-drawer#guide, ytd-mini-guide-renderer, #guide-button', css: 'ytd-app #page-manager.ytd-app{margin-left:0!important}' },
  { id: 'explore', label: 'Explore, Trending', sub: true, hide: 'ytd-guide-section-renderer:has(a[href="/gaming"], a[href^="/feed/trending"], a[href^="/feed/explore"], a[href="/podcasts"], a[href="/feed/storefront"]), ytd-mini-guide-entry-renderer:has(a[href^="/feed/trending"], a[href^="/feed/explore"])' },
  { id: 'moreFromYT', label: 'More from YouTube', sub: true, hide: 'ytd-guide-section-renderer:has(a[href*="music.youtube.com"], a[href*="youtubekids"])' },
  { id: 'subscriptions', label: 'Subscriptions', sub: true, hide: 'ytd-guide-section-renderer:has(a[href="/feed/channels"]), :is(ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer):has(a[href="/feed/subscriptions"])' },

  { id: 'notifications', label: 'Hide Notifications Bell', hide: 'ytd-notification-topbar-button-renderer' },
];

const THUMB = 'ytd-thumbnail, ytd-playlist-thumbnail, yt-thumbnail-view-model, .yt-lockup-view-model__content-image, .yt-lockup-view-model-wiz__content-image, ytd-video-preview, .ytp-videowall-still-image, .ytp-ce-covering-image, ytm-thumbnail-cover, ytm-compact-thumbnail, yt-collections-stack';

// "Home feed hidden" message; pointer-events:none keeps YouTube's header and bottom bar clickable through it.
const HOME_CSS = '#cy-home{position:fixed;inset:0;z-index:1000;align-items:center;justify-content:center;pointer-events:none;font:20px Roboto,Arial,sans-serif;color:#888}';

const DEFAULTS = { enabled: true, ...Object.fromEntries(OPTIONS.map(o => [o.id, !!o.on])) };

function buildCss(s) {
  if (!s.enabled) return '';
  return HOME_CSS + OPTIONS.filter(o => s[o.id] && (!o.needs || s[o.needs])).map(o => {
    let css = o.css || '';
    if (o.hide) css += `${o.hide}{display:none!important}`;
    // clip-path trims the blur halo so it doesn't bleed over neighbouring text
    if (o.thumbs) css += s.blurThumbs
      ? `:is(${o.thumbs}) :is(${THUMB}){filter:blur(24px)!important;clip-path:inset(0 round 12px)}:is(${o.thumbs}) :is(${THUMB}):hover{filter:none!important}`
      : `:is(${o.thumbs}) :is(${THUMB}){display:none!important}`;
    return css;
  }).join('\n');
}
