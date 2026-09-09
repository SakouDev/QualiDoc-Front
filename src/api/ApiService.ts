import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  return config
})

// Token expiré/invalide : on déconnecte et renvoie au login (§5.2 du sujet,
// "le renouvellement ou l'expiration du token doit être géré côté front").
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore().logout()
      router.push('/login')
    }

    return Promise.reject(error)
  },
)

export default api
