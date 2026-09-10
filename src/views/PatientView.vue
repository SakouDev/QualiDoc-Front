<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import MedecinSearch from "@/components/MedecinSearch.vue";
import RendezVousCalendar from "@/components/RendezVousCalendar.vue";

const router = useRouter();
const auth = useAuthStore();

const refreshKey = ref(0);

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <main class="min-h-screen">
    <!-- NAVBAR -->
    <header
      class="flex items-center justify-between bg-white px-6 py-4 shadow-sm"
    >
      <h1 class="text-lg font-semibold text-brand-900">
        Bonjour {{ auth.patient?.prenom }}
      </h1>
      <div class="flex items-center gap-4">
        <UButton
          v-if="auth.isAdmin"
          to="/admin"
          variant="ghost"
          color="neutral"
        >
          Espace admin
        </UButton>
        <UButton variant="outline" color="neutral" @click="logout"
          >Se déconnecter</UButton
        >
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <section class="w-full flex items-center justify-center">
      <div class="w-full 2xl:w-1/2 grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <!-- LEFT CARD -->
        <div class="h-fit order-2 flex flex-col lg:order-1 lg:sticky lg:top-6">
          <MedecinSearch @booked="refreshKey++" />
        </div>
        
        <!-- RIGHT CARD -->
        <div class="h-fit order-1 flex flex-col lg:order-2 lg:sticky lg:top-6">
          <RendezVousCalendar :refresh-key="refreshKey" />
        </div>
      </div>
    </section>
  </main>
</template>
