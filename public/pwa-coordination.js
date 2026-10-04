/* This worker helper handles only this registration's application scope. */
self.addEventListener('message', (event) => {
  const port = event.ports[0]
  if (
    !port ||
    !event.data ||
    !['PWA_CAN_UPDATE', 'PWA_ACTIVATE_IF_ALONE', 'PWA_CACHE_STATUS'].includes(
      event.data.type,
    )
  )
    return
  event.waitUntil(
    (async () => {
      const base = new URL(self.registration.scope)
      if (event.data.type === 'PWA_CACHE_STATUS') {
        const names = (await caches.keys()).filter((name) =>
          name.startsWith('keisan-no-hoshi-math-planet-precache'),
        )
        const paths = []
        for (const name of names) {
          for (const request of await (await caches.open(name)).keys())
            paths.push(new URL(request.url).pathname)
        }
        const ready =
          paths.includes(`${base.pathname}index.html`) &&
          paths.some((path) => /\/assets\/LearnPage-[^/]+\.js$/.test(path)) &&
          paths.some((path) => /\/assets\/ResultPage-[^/]+\.js$/.test(path)) &&
          paths.some((path) => /\/assets\/index-[^/]+\.css$/.test(path)) &&
          paths.some((path) => /\/assets\/index-[^/]+\.js$/.test(path))
        port.postMessage({ ready })
        return
      }
      const clients = (
        await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
      ).filter((client) => {
        const url = new URL(client.url)
        return (
          url.origin === base.origin && url.pathname.startsWith(base.pathname)
        )
      })
      const allowed = clients.length === 1 && clients[0].id === event.source?.id
      port.postMessage({ allowed, clients: clients.length })
      if (allowed && event.data.type === 'PWA_ACTIVATE_IF_ALONE')
        await self.skipWaiting()
    })().catch(() => port.postMessage({ allowed: false, ready: false })),
  )
})
