// svg.js — central SVG icon registry (single source of truth)
// Keep icons as strings so they can be inlined into template literals easily.

(function initSvgIcons() {
  const svg = (attrs, inner) => `<svg ${attrs}>${inner}</svg>`;

  // Lab tab icon: a lab flask/beaker with small bubbles inside.
  const labTab = svg(
    'width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    [
      '<path d="M9 3h6"></path>',
      '<path d="M10 3v4"></path>',
      '<path d="M14 3v4"></path>',
      '<path d="M7 7h10"></path>',
      '<path d="M7.5 7l-2.5 10.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-2.5L16.5 7"></path>',
      '<path d="M8.5 14h7"></path>',
      '<circle cx="9.5" cy="16.5" r="0.8" fill="currentColor" stroke="none"></circle>',
      '<circle cx="13.5" cy="15" r="1" fill="currentColor" stroke="none"></circle>',
      '<circle cx="15.5" cy="17.5" r="0.7" fill="currentColor" stroke="none"></circle>',
    ].join('')
  );

  // Open item icon: external-link arrow with corner accents.
  const openItem = svg(
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    [
      '<path d="M14 3h7v7"></path><path d="M10 14L21 3"></path>',
      '<path d="M21 14v7h-7"></path><path d="M3 10v11h11"></path>',
    ].join('')
  );

  // Trash icon: trash can with lid + inner vertical lines.
  const trash14 = svg(
    'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 16H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>'
  );

  // Trash icon (simple): trash can with lid only (no inner lines).
  const trashNoX14 = svg(
    'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<path d="M3 6h18M8 6V4h8v2M19 6l-1 16H6L5 6"></path>'
  );

  // Clock icon (18px): round clock face with hands (header/title).
  const clock18 = svg(
    'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>'
  );

  // Clock icon (14px): round clock face with hands (sidebar).
  const clock14 = svg(
    'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>'
  );

  // Clock icon (32px muted): large, low-opacity clock used for empty states.
  const clock32Muted = svg(
    'width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" aria-hidden="true"',
    '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>'
  );

  // Gem icon (18px): diamond shape with subtle cross highlight (header/title).
  const gem18 = svg(
    'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<path d="M2 12 12 2l10 10-10 10L2 12z"></path><path d="M12 2v20M2 12h20" opacity="0.4"></path>'
  );

  // Gem icon (32px muted): large, low-opacity diamond used for empty states.
  const gem32Muted = svg(
    'width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" aria-hidden="true"',
    '<path d="M2 12 12 2l10 10-10 10L2 12z"></path>'
  );

  // Gem icon (14px): small diamond used for sidebar entries.
  const gem14 = svg(
    'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<path d="M2 12 12 2l10 10-10 10L2 12z"></path>'
  );

  // Guild Contribution icon (14px): concentric circles with simple marks.
  const gc14 = svg(
    'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    '<circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="5.5"></circle><path d="M12 7.8v8.4"></path><path d="M8.8 10.2h6.4"></path><path d="M9 16.5h6"></path>'
  );

  window.SVG_ICONS = {
    tabLab: labTab,
    openItem,
    trash14,
    trashNoX14,
    clock14,
    clock18,
    clock32Muted,
    gem18,
    gem32Muted,
    gem14,
    gc14,
  };

  window.applySvgIcons = function applySvgIcons(root = document) {
    const icons = window.SVG_ICONS || {};
    root.querySelectorAll?.('[data-svg-icon]')?.forEach(el => {
      const key = el.getAttribute('data-svg-icon');
      const icon = icons[key];
      if (icon) el.innerHTML = icon;
    });
  };
})();
