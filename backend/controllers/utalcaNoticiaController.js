import Parser from 'rss-parser';

const parser = new Parser();

const FEED_URL = 'https://www.utalca.cl/noticias/feed/';
const CACHE_TTL = 20 * 60 * 1000; // 20 minutos

let cache = { data: null, timestamp: 0 };

/* Extrae og:image de la página de un artículo (timeout 6 s) */
async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const html = await res.text();

    // og:image
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (og) return og[1];

    // Fallback: primera imagen del artículo
    const img = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp))/i);
    return img ? img[1] : '';
  } catch {
    return '';
  }
}

export const obtenerNoticiasUtalca = async (req, res) => {
  try {
    const ahora = Date.now();

    if (cache.data && ahora - cache.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: cache.data, fromCache: true });
    }

    const feed = await parser.parseURL(FEED_URL);

    // Obtener og:image de cada artículo en paralelo
    const imageResults = await Promise.allSettled(
      feed.items.map((item) => fetchOgImage(item.link || ''))
    );

    const noticias = feed.items.map((item, i) => ({
      id: item.guid || item.link,
      titulo: item.title || '',
      descripcion: (item.contentSnippet || item.summary || '').replace(/La entrada .+$/, '').trim(),
      link: item.link || '',
      fecha: item.pubDate || item.isoDate || '',
      imagen: imageResults[i].status === 'fulfilled' ? imageResults[i].value : '',
      autor: item['dc:creator'] || '',
      categorias: item.categories || [],
    }));

    cache = { data: noticias, timestamp: ahora };

    res.json({ success: true, data: noticias, fromCache: false });
  } catch (error) {
    console.error('Error al obtener RSS de UTalca:', error.message);

    if (cache.data) {
      return res.json({ success: true, data: cache.data, fromCache: true, stale: true });
    }

    res.status(502).json({
      success: false,
      message: 'No se pudo obtener las noticias de UTalca en este momento.',
      error: error.message,
    });
  }
};
