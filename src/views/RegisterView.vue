<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/ApiService'

const router = useRouter()
const auth = useAuthStore()

const nom = ref('')
const prenom = ref('')
const email = ref('')
const password = ref('')
const errors = ref<string[]>([])
const loading = ref(false)

async function submit() {
  errors.value = []
  loading.value = true

  try {
    const { data } = await api.post('/auth/register', {
      nom: nom.value,
      prenom: prenom.value,
      email: email.value,
      password: password.value,
    })

    auth.setAuth(data.token, data.patient)
    router.push('/')
  } catch (e: any) {
    const messages = e.response?.data?.messages
    errors.value = messages ? Object.values(messages) : ['Une erreur est survenue.']
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-4">
    <UCard
      variant="subtle"
      class="w-full bg-white sm:w-3/5 md:w-2/5 lg:w-1/4 flex flex-col justify-center items-center"
    >
      <template #header>
        <h1 class="text-xl font-semibold text-brand-900">Créer un compte</h1>
      </template>

      <form class="flex flex-col gap-6 w-80" @submit.prevent="submit">
        <UFormField label="Nom" name="nom">
          <UInput v-model="nom" type="text" required class="w-full" />
        </UFormField>

        <UFormField label="Prénom" name="prenom">
          <UInput v-model="prenom" type="text" required class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="email" type="email" required autocomplete="email" class="w-full" />
        </UFormField>

        <UFormField label="Mot de passe" name="password">
          <UInput
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="errors.length" color="error" variant="subtle" title="Erreur">
          <template #description>
            <ul class="list-disc pl-4">
              <li v-for="(message, i) in errors" :key="i">{{ message }}</li>
            </ul>
          </template>
        </UAlert>

        <UButton class="my-2 p-2" type="submit" :loading="loading" block>
          {{ loading ? 'Création...' : 'Créer mon compte' }}
        </UButton>

        <p class="text-center text-sm">
          Déjà un compte ?
          <router-link to="/login" class="text-primary font-medium">Se connecter</router-link>
        </p>
      </form>
    </UCard>
  </main>
</template>
