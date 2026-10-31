import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-03',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
  },
  nitro: {
    // Статическая проверка учебной части не должна экспортировать страницы с сессией пользователя.
    prerender: { ignore: ['/admin', '/tests', '/notes', '/profile', '/login'] },
  },
})
