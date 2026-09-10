<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/api/ApiService";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;

  try {
    const { data } = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    auth.setAuth(data.token, data.patient);
    router.push("/");
  } catch (e: any) {
    error.value =
      e.response?.data?.messages?.error ?? "Une erreur est survenue.";
  } finally {
    loading.value = false;
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
        <h1 class="text-xl font-semibold text-brand-900">Connexion</h1>
      </template>

      <form class="flex flex-col gap-10 w-80" @submit.prevent="submit">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Mot de passe" name="password">
          <UInput
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :description="error"
        />

        <UButton class="my-2 p-2" type="submit" :loading="loading" block>
          {{ loading ? "Connexion..." : "Se connecter" }}
        </UButton>

        <p class="text-center text-sm">
          Pas encore de compte ?
          <router-link to="/register" class="text-primary font-medium"
            >S'inscrire</router-link
          >
        </p>
      </form>
    </UCard>
  </main>
</template>
