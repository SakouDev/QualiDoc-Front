import { defineStore } from 'pinia'

export interface Patient {
  id: number
  nom: string
  prenom: string
  email: string
  admin: boolean
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    patient: JSON.parse(localStorage.getItem('patient') ?? 'null') as Patient | null,
  }),

  getters: {
    isAuthenticated: (state) => state.token !== null,
    isAdmin: (state) => state.patient?.admin === true,
  },

  actions: {
    setAuth(token: string, patient: Patient) {
      this.token = token
      this.patient = patient
      localStorage.setItem('token', token)
      localStorage.setItem('patient', JSON.stringify(patient))
    },

    logout() {
      this.token = null
      this.patient = null
      localStorage.removeItem('token')
      localStorage.removeItem('patient')
    },
  },
})
