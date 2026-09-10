<script setup lang="ts">
import type { RendezVous } from "@/types";
import { statutColor, statutLabel } from "@/utils/statut";

defineProps<{ historique: RendezVous[]; hasLoadedOnce: boolean }>();
</script>

<template>
  <div v-if="!hasLoadedOnce" class="flex flex-col gap-2">
    <div
      v-for="i in 2"
      :key="i"
      class="flex flex-col gap-2 rounded-md border p-3"
    >
      <USkeleton class="h-4 w-40" />
      <USkeleton class="h-3 w-56" />
    </div>
  </div>

  <p v-else-if="historique.length === 0" class="text-sm text-muted">
    Aucun rendez-vous passé.
  </p>

  <UTimeline
    v-else
    :items="
      historique.map((rdv) => ({
        date: rdv.date_heure.slice(0, 16).replace('T', ' '),
        title: `${rdv.medecin_prenom} ${rdv.medecin_nom}`,
        description: rdv.specialite_nom,
        statut: rdv.statut,
      }))
    "
    size="sm"
    class="w-full"
  >
    <template #indicator="{ item }">
      <span
        class="size-2.5 rounded-full"
        :class="{
          'bg-success': statutColor(item.statut as string) === 'success',
          'bg-error': statutColor(item.statut as string) === 'error',
          'bg-info': statutColor(item.statut as string) === 'info',
          'bg-muted': statutColor(item.statut as string) === 'neutral',
        }"
      />
    </template>

    <template #title="{ item }">
      <div class="flex items-center gap-2">
        <span>{{ item.title }}</span>
        <UBadge
          :color="statutColor(item.statut as string)"
          variant="subtle"
          size="sm"
        >
          {{ statutLabel(item.statut as string) }}
        </UBadge>
      </div>
    </template>
  </UTimeline>
</template>
