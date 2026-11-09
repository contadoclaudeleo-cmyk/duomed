// Recebe os lembretes enviados pelo servidor e mostra a notificação (carregado pelo service worker)
self.addEventListener('push', (evento) => {
  let dados = {}
  try {
    dados = evento.data ? evento.data.json() : {}
  } catch {
    dados = { corpo: evento.data ? evento.data.text() : '' }
  }
  const titulo = dados.titulo || 'DuoMed'
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.corpo || 'Hora de estudar um pouquinho!',
      icon: 'brand/icon-192.png',
      badge: 'brand/icon-192.png',
      data: { url: dados.url || './' },
    }),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = new URL(evento.notification.data?.url || './', self.registration.scope).href
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abas) => {
      for (const aba of abas) if (aba.url.startsWith(self.registration.scope) && 'focus' in aba) return aba.focus()
      return self.clients.openWindow(destino)
    }),
  )
})
