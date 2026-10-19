const api = globalThis.browser ?? chrome;
const list = document.getElementById('list');
const enabled = document.getElementById('enabled');

api.storage.sync.get(DEFAULTS).then(s => {
  enabled.checked = s.enabled;
  list.classList.toggle('off', !s.enabled);
  enabled.onchange = () => {
    list.classList.toggle('off', !enabled.checked);
    api.storage.sync.set({ enabled: enabled.checked });
  };

  for (const o of OPTIONS) {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = s[o.id];
    box.onchange = () => api.storage.sync.set({ [o.id]: box.checked });
    if (o.sub) label.className = 'sub';
    label.append(box, o.label);
    list.append(label);
  }
});
