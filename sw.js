// ─── Sands of Time — Service Worker ─────────────────────────────────────────
const CACHE_NAME = "egypt-v1";

// すべての静的アセットをキャッシュ（学習コンテンツはオフラインでも閲覧可能）
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/App.js",
  "/manifest.json",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap"
];

// ── Install: キャッシュを構築 ────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 失敗してもインストールを継続（外部フォントなどが取得できない場合に備え個別に）
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

// ── Activate: 古いキャッシュを削除 ──────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: キャッシュ優先（静的）/ ネットワーク優先（API） ─────────────────
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Anthropic API は常にネットワーク（オフライン時はページ側でエラー表示）
  if (url.hostname === "api.anthropic.com") {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: "offline" }), {
        headers: { "Content-Type": "application/json" }
      })
    ));
    return;
  }

  // Google Fonts — ネットワーク優先、失敗時はキャッシュ
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // その他すべて — キャッシュ優先、なければネットワーク
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
