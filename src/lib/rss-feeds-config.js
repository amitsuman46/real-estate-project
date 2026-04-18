/**
 * Macro / policy RSS sources (Harsh business brief).
 * RBI XML endpoints verified 200 OK as of implementation.
 * PIB may return 401 from some server/datacenter IPs; UI shows fallback link.
 * NHB RESIDEX is reference data (web UI), not a simple RSS — surfaced as a static card.
 */

export const HARSH_RSS_BUSINESS_NOTES = [
  {
    title: 'RBI RSS feeds',
    detail:
      'Press releases, notifications, and speeches — MPC minutes, repo changes, housing credit circulars. Poll frequently for macro signals that move housing demand and mortgage rates.',
  },
  {
    title: 'PIB RSS',
    detail:
      'Press Information Bureau releases; focus on Ministry of Housing & Urban Affairs and Ministry of Finance. PIB is organized by regional desk RSS; ministry-level filtering may need keyword rules or a future curated index.',
  },
  {
    title: 'NHB RESIDEX',
    detail:
      'Quarterly housing price index by city from NHB — reference for valuation trends rather than a classic RSS item stream.',
  },
  {
    title: 'Business newspapers & market data',
    detail:
      'Market-moving headlines and rates context; use reputable feeds (e.g. Economic Times markets) and respect publisher terms.',
  },
];

/** @typedef {'rss' | 'reference'} RssFeedKind */

/**
 * Default feed catalog. `id` keys are stored in Firestore `appSettings/rssFeeds.enabledById`.
 * @type {Array<{
 *   id: string,
 *   label: string,
 *   kind: RssFeedKind,
 *   category: 'rbi' | 'pib' | 'nhb' | 'markets',
 *   feedUrl?: string,
 *   referenceUrl?: string,
 *   referenceTitle?: string,
 *   harshNote: string,
 *   enabledDefault: boolean
 * }>}
 */
export const DEFAULT_RSS_FEEDS = [
  {
    id: 'rbi_press',
    label: 'RBI — Press releases',
    kind: 'rss',
    category: 'rbi',
    feedUrl: 'https://www.rbi.org.in/pressreleases_rss.xml',
    harshNote: 'Repo, regulation, and housing-finance press lines that affect buyer sentiment and lending.',
    enabledDefault: true,
  },
  {
    id: 'rbi_notifications',
    label: 'RBI — Notifications',
    kind: 'rss',
    category: 'rbi',
    feedUrl: 'https://www.rbi.org.in/notifications_rss.xml',
    harshNote: 'Circular-style updates; often where operational rules for banks/NBFCs change.',
    enabledDefault: true,
  },
  {
    id: 'rbi_speeches',
    label: 'RBI — Speeches',
    kind: 'rss',
    category: 'rbi',
    feedUrl: 'https://www.rbi.org.in/speeches_rss.xml',
    harshNote: 'Forward guidance and MPC narrative beyond the headline rate.',
    enabledDefault: true,
  },
  {
    id: 'pib_delhi_press_en',
    label: 'PIB — Delhi (English) press releases',
    kind: 'rss',
    category: 'pib',
    feedUrl: 'https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',
    harshNote:
      'Client brief: filter mentally for MoHUA + MoF. PIB RSS is desk-based; ministry tags may appear in titles/descriptions.',
    enabledDefault: true,
  },
  {
    id: 'nhb_residex',
    label: 'NHB — RESIDEX (housing price index)',
    kind: 'reference',
    category: 'nhb',
    referenceUrl: 'https://residex.nhbonline.org.in/',
    referenceTitle: 'Open RESIDEX portal',
    harshNote: 'Quarterly city index — gold-layer reference for valuation models, not a live RSS stream here.',
    enabledDefault: true,
  },
  {
    id: 'et_markets',
    label: 'Economic Times — Markets',
    kind: 'rss',
    category: 'markets',
    feedUrl: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    harshNote: 'Equity, debt, and macro market context that often correlates with property risk-on/off.',
    enabledDefault: true,
  },
  {
    id: 'et_top',
    label: 'Economic Times — Top stories',
    kind: 'rss',
    category: 'markets',
    feedUrl: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms',
    harshNote: 'Broad business headlines; use as a second signal alongside dedicated markets RSS.',
    enabledDefault: false,
  },
];

export const RSS_FEEDS_BY_ID = Object.fromEntries(DEFAULT_RSS_FEEDS.map((f) => [f.id, f]));
