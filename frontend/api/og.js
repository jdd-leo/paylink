// Serverless (Vercel) que serve a rota /p/:code com meta tags Open Graph
// preenchidas no servidor. Crawlers (WhatsApp, Telegram, etc.) não executam
// JS, então as tags precisam estar no HTML inicial para exibir a logo do
// vendedor ao compartilhar o link.

const API_URL =
  process.env.VITE_API_URL ?? process.env.API_URL ?? 'http://localhost:3000';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteAsset(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}

export default async function handler(req, res) {
  const { code } = req.query;
  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers.host;
  const baseHtmlUrl = `${proto}://${host}/index.html`;

  // HTML base do build (SPA). Sempre devolvido para o app inicializar normalmente.
  let html = '';
  try {
    html = await fetch(baseHtmlUrl).then((r) => r.text());
  } catch {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.status(502).send('Erro ao carregar a página.');
    return;
  }

  let link = null;
  try {
    const apiRes = await fetch(`${API_URL}/public/links/${encodeURIComponent(code)}`);
    if (apiRes.ok) link = await apiRes.json();
  } catch {
    // Sem dados: devolve o HTML base sem OG; o app ainda renderiza no cliente.
  }

  if (link) {
    const pageUrl = `${proto}://${host}/p/${code}`;
    const image =
      absoluteAsset(link.merchant?.logoPath) ?? absoluteAsset(link.photos?.[0]);
    const title = link.title ?? link.merchant?.tradeName ?? 'PagFacil';
    const description = link.description || link.ctaPhrase || 'Pagamento seguro via Pix';

    const tags = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${escapeHtml(link.merchant?.tradeName ?? 'PagFacil')}" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
      image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '',
      image ? `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />` : '',
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
      image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : '',
      `<title>${escapeHtml(title)}</title>`,
    ]
      .filter(Boolean)
      .join('\n    ');

    // Remove o <title> estático para não duplicar e injeta as tags no <head>.
    html = html.replace(/<title>.*?<\/title>/i, '');
    html = html.replace('</head>', `    ${tags}\n  </head>`);
  }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  // Cache curto na borda; crawlers refazem fetch e o app é dinâmico mesmo.
  res.setHeader('cache-control', 'public, max-age=0, s-maxage=300');
  res.status(200).send(html);
}
