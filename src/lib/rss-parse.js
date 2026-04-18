import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

function stripHtml(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asArray(x) {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

/**
 * @param {string} xml
 * @param {number} [limit=20]
 * @returns {{ title?: string, items: Array<{ title: string, link: string, pubDate: string, description: string }> }}
 */
export function parseRss2(xml, limit = 20) {
  let root;
  try {
    root = parser.parse(xml);
  } catch {
    return { items: [] };
  }
  const rss = root?.rss || root?.RSS;
  const channel = rss?.channel;
  if (!channel) return { items: [] };

  const channelTitle = typeof channel.title === 'string' ? channel.title : channel.title?.['#text'];
  const rawItems = asArray(channel.item).filter(Boolean);

  const items = rawItems.slice(0, limit).map((it) => {
    const title = typeof it.title === 'string' ? stripHtml(it.title) : stripHtml(it.title?.['#text'] || '');
    let link = typeof it.link === 'string' ? it.link.trim() : '';
    if (!link && it.link?.['#text']) link = String(it.link['#text']).trim();
    if (!link && it.guid) {
      const g = it.guid;
      link = typeof g === 'string' ? g : g?.['#text'] ? String(g['#text']).trim() : '';
    }
    const pubDate =
      (typeof it.pubDate === 'string' && it.pubDate) ||
      (it.pubDate?.['#text'] && String(it.pubDate['#text'])) ||
      '';
    const descRaw =
      (typeof it.description === 'string' && it.description) ||
      it.description?.['#text'] ||
      it['content:encoded'] ||
      it['content:encoded']?.['#text'] ||
      '';
    const description = stripHtml(typeof descRaw === 'string' ? descRaw : descRaw?.['#text'] || '');
    return { title: title || '(No title)', link: link || '', pubDate, description };
  });

  return { title: channelTitle, items };
}
