import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ui from '@nuxt/ui/vue-plugin'

// Pas de vrai sélecteur de thème dans le cahier des charges : on reste
// en clair. Nuxt UI utilise useColorMode() de VueUse en interne (mode
// "auto" par défaut), qui réapplique ".dark" en continu si le système
// est en sombre — retirer la classe après coup ne suffit pas, il faut
// fixer la préférence source que VueUse lit.
localStorage.setItem('vueuse-color-scheme', 'light')
document.documentElement.classList.remove('dark')

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ui)

app.mount('#app')
