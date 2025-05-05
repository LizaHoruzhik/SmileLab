const CACHE_NAME = 'smilelab-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/auth.js',
  '/js/admin.js',
  '/js/teacher.js',
  '/js/parent.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Установка и кэширование
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

// Активация с очисткой старого кэша
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      )
  ));
});

// Стратегия: Сначала кэш, потом сеть
self.addEventListener('fetch', event => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});