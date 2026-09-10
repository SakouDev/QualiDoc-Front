<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MedecinsPanel from '@/components/admin/MedecinsPanel.vue'
import SpecialitesPanel from '@/components/admin/SpecialitesPanel.vue'
import RendezVousPanel from '@/components/admin/RendezVousPanel.vue'

const router = useRouter()
const auth = useAuthStore()

function logout() {
  auth.logout()
  router.push('/login')
}

const items = [
  { label: 'Médecins', slot: 'medecins' as const },
  { label: 'Spécialités', slot: 'specialites' as const },
  { label: 'Rendez-vous', slot: 'rendez-vous' as const },
]
</script>

<template>
  <main class="min-h-screen">
    <header class="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
      <h1 class="text-lg font-semibold text-brand-900">Espace admin</h1>
      <div class="flex items-center gap-4">
        <UButton to="/" variant="ghost" color="neutral">Espace patient</UButton>
        <UButton variant="outline" color="neutral" @click="logout">Se déconnecter</UButton>
      </div>
    </header>

    <section class="mx-auto max-w-5xl p-6">
      <UTabs :items="items" class="w-full">
        <template #medecins>
          <MedecinsPanel />
        </template>
        <template #specialites>
          <SpecialitesPanel />
        </template>
        <template #rendez-vous>
          <RendezVousPanel />
        </template>
      </UTabs>
    </section>
  </main>
</template>
