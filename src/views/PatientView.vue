<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <main class="min-h-screen">
    <header class="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
      <h1 class="text-lg font-semibold text-brand-900">Bonjour {{ auth.patient?.prenom }}</h1>
      <div class="flex items-center gap-4">
        <UButton v-if="auth.isAdmin" to="/admin" variant="ghost" color="neutral">
          Espace admin
        </UButton>
        <UButton variant="outline" color="neutral" @click="logout">Se déconnecter</UButton>
      </div>
    </header>

    <section class="p-6">
      <!-- TODO: barre de recherche, réservation, historique, calendrier -->
    </section>
  </main>
</template>
