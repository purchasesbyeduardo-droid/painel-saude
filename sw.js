/* Service worker do Meu Painel de Saúde.
   Guarda os arquivos do próprio app (HTML, manifesto, ícones) para que ele
   abra mesmo sem internet. Os dados (Firestore) continuam precisando de
   internet para sincronizar, mas o Firestore já guarda um cache próprio
   dos dados recentes no aparelho (ativado no index.html). */

const CACHE_NAME = 'painel-saude-v1';
const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // só cuidamos de arquivos do próprio site (mesma origem);
  // chamadas ao Firebase/Firestore e fontes externas seguem direto para a rede.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((respostaEmCache) => {
      if (respostaEmCache) return respostaEmCache;
      return fetch(event.request)
        .then((respostaRede) => {
          const clone = respostaRede.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return respostaRede;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
