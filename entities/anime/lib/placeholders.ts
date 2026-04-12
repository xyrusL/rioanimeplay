export function makePosterPlaceholder(title: string, accent: string) {
  const safeTitle = title.toUpperCase().replace(/&/g, "&amp;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="760" viewBox="0 0 520 760">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#111318" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="520" height="760" rx="28" fill="url(#bg)" />
      <circle cx="418" cy="118" r="88" fill="rgba(255,255,255,0.1)" />
      <circle cx="108" cy="664" r="124" fill="rgba(255,255,255,0.08)" />
      <path d="M56 214h408v6H56zm0 308h408v6H56z" fill="rgba(255,255,255,0.2)" />
      <text x="50%" y="44%" fill="#f7f4ef" font-family="Arial Narrow, sans-serif" font-size="28" font-weight="700" letter-spacing="6" text-anchor="middle">
        RIOANIME
      </text>
      <text x="50%" y="52%" fill="#f7f4ef" font-family="Trebuchet MS, sans-serif" font-size="42" font-weight="700" text-anchor="middle">
        ${safeTitle}
      </text>
      <text x="50%" y="86%" fill="rgba(255,255,255,0.72)" font-family="Trebuchet MS, sans-serif" font-size="20" letter-spacing="4" text-anchor="middle">
        DEMO POSTER
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function makeBannerPlaceholder(title: string, accent: string) {
  const safeTitle = title.toUpperCase().replace(/&/g, "&amp;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700" viewBox="0 0 1600 700">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#111318" />
          <stop offset="50%" stop-color="#1c1d24" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#bg)" />
      <circle cx="1210" cy="180" r="230" fill="rgba(255,255,255,0.08)" />
      <circle cx="290" cy="610" r="260" fill="rgba(255,255,255,0.05)" />
      <path d="M0 544c180-54 303-81 461-81 210 0 332 62 511 62 191 0 349-42 628-142v317H0z" fill="rgba(0,0,0,0.18)" />
      <text x="112" y="160" fill="rgba(255,255,255,0.52)" font-family="Arial Narrow, sans-serif" font-size="34" font-weight="700" letter-spacing="10">
        RIOANIME PLAY
      </text>
      <text x="112" y="320" fill="#f7f4ef" font-family="Arial Narrow, sans-serif" font-size="84" font-weight="700" letter-spacing="3">
        ${safeTitle}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
