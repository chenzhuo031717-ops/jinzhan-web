// V6.9.13: online-only shell. Registration retires older static caches only.
// IndexedDB records and localStorage drafts are never touched.
const PREFIX='jinzhan-shell:'+self.registration.scope+':';
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith(PREFIX)).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
// No fetch handler, pre-cache, skipWaiting or forced reload of an open editor.

