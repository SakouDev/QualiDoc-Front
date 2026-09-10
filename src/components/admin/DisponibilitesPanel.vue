<script setup lang="ts">
import { ref, shallowRef, computed, watch } from "vue";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  today as calendarToday,
} from "@internationalized/date";
import { useToast } from "@nuxt/ui/composables";
import api from "@/api/ApiService";
import type { Medecin, Disponibilite } from "@/types";
import { apiErrorMessage } from "@/utils/apiError";

const toast = useToast();
const df = new DateFormatter("fr-FR", { dateStyle: "long" });
const minDate = calendarToday(getLocalTimeZone());

// CalendarDate -> "YYYY-MM-DD" sans passer par un objet Date (donc sans
// risque de décalage de fuseau).
function calendarDateToStr(d: CalendarDate): string {
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${d.year}-${m}-${day}`;
}

const medecins = ref<Medecin[]>([]);
api.get<Medecin[]>("/medecins").then(({ data }) => (medecins.value = data));

const medecinOptions = computed(() =>
  medecins.value.map((m) => ({ label: `${m.prenom} ${m.nom}`, value: m.id })),
);

const medecinId = ref<number | null>(null);
const dispos = ref<Disponibilite[]>([]);
const loading = ref(false);

async function fetchAll() {
  if (!medecinId.value) {
    dispos.value = [];
    return;
  }

  loading.value = true;

  try {
    const { data } = await api.get<Disponibilite[]>("/admin/disponibilites", {
      params: { medecin_id: medecinId.value },
    });
    dispos.value = data;
  } finally {
    loading.value = false;
  }
}

watch(medecinId, fetchAll, { immediate: true });

const page = ref(1);
const itemsPerPage = 10;

const paginatedDispos = computed(() =>
  dispos.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage),
);

watch(medecinId, () => {
  page.value = 1;
});

// Après une suppression, si la page courante ne contient plus rien (ex :
// on supprime le dernier créneau de la dernière page) on retombe sur la
// dernière page qui a encore des données, plutôt que d'afficher une page
// vide alors qu'il reste des créneaux ailleurs.
watch(dispos, () => {
  const maxPage = Math.max(1, Math.ceil(dispos.value.length / itemsPerPage));
  if (page.value > maxPage) page.value = maxPage;
});

const columns = [
  { accessorKey: "date_dispo", header: "Date" },
  { id: "horaires", header: "Horaires" },
  { accessorKey: "duree_creneau", header: "Durée créneau" },
  { id: "actions", header: "" },
];

const modalOpen = ref(false);
const saving = ref(false);
const formDate = shallowRef<CalendarDate | null>(null);
const form = ref({
  heure_debut: "",
  heure_fin: "",
  duree_creneau: 20,
});

function openCreate() {
  formDate.value = null;
  form.value = { heure_debut: "", heure_fin: "", duree_creneau: 20 };
  modalOpen.value = true;
}

async function save() {
  saving.value = true;

  try {
    await api.post("/admin/disponibilites", {
      medecin_id: medecinId.value,
      date_dispo: formDate.value ? calendarDateToStr(formDate.value) : "",
      heure_debut: `${form.value.heure_debut}:00`,
      heure_fin: `${form.value.heure_fin}:00`,
      duree_creneau: form.value.duree_creneau,
    });
    toast.add({ title: "Disponibilité ajoutée", color: "success" });
    modalOpen.value = false;
    await fetchAll();
  } catch (e: any) {
    toast.add({
      title: apiErrorMessage(e),
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}

const confirmOpen = ref(false);
const toDelete = ref<Disponibilite | null>(null);
const deleting = ref(false);

function askRemove(dispo: Disponibilite) {
  toDelete.value = dispo;
  confirmOpen.value = true;
}

async function confirmRemove() {
  if (!toDelete.value) return;

  deleting.value = true;

  try {
    await api.delete(`/admin/disponibilites/${toDelete.value.id}`);
    toast.add({ title: "Disponibilité supprimée", color: "success" });
    confirmOpen.value = false;
    await fetchAll();
  } catch (e: any) {
    toast.add({
      title: apiErrorMessage(e),
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-brand-900">Disponibilités</h2>
      <UButton
        icon="i-lucide-plus"
        class="cursor-pointer"
        :disabled="!medecinId"
        @click="openCreate"
        >Ajouter</UButton
      >
    </div>

    <USelectMenu
      v-model="medecinId"
      :items="medecinOptions"
      value-key="value"
      placeholder="Choisir un médecin"
      class="w-64"
    />

    <p v-if="!medecinId" class="text-sm text-muted">
      Sélectionnez un médecin pour voir et gérer ses disponibilités.
    </p>

    <template v-else>
      <UTable
        :data="paginatedDispos"
        :columns="columns"
        :loading="loading"
        class="rounded-lg bg-white ring ring-default"
        :ui="{ tbody: 'isolation-auto', th: 'text-center', td: 'text-center' }"
      >
        <template #loading>
          <div class="flex flex-col gap-4 p-4">
            <div v-for="i in 4" :key="i" class="flex items-center gap-6">
              <USkeleton class="h-4 flex-1" />
              <USkeleton class="h-4 flex-1" />
              <USkeleton class="h-4 flex-1" />
              <USkeleton class="h-4 w-12" />
            </div>
          </div>
        </template>

        <template #horaires-cell="{ row }">
          {{ row.original.heure_debut.slice(0, 5) }} – {{ row.original.heure_fin.slice(0, 5) }}
        </template>

        <template #actions-cell="{ row }">
          <UButton
            icon="i-lucide-trash-2"
            aria-label="Supprimer"
            size="xs"
            variant="ghost"
            color="error"
            class="cursor-pointer"
            @click="askRemove(row.original)"
          />
        </template>
      </UTable>

      <div v-if="dispos.length > itemsPerPage" class="flex justify-center">
        <UPagination v-model:page="page" :items-per-page="itemsPerPage" :total="dispos.length" />
      </div>
    </template>

    <UModal v-model:open="modalOpen" title="Ajouter une disponibilité">
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Date">
            <UPopover>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-calendar"
                class="w-full cursor-pointer justify-start"
              >
                {{
                  formDate
                    ? df.format(formDate.toDate(getLocalTimeZone()))
                    : "Choisir une date"
                }}
              </UButton>

              <template #content>
                <UCalendar
                  v-model="formDate"
                  size="sm"
                  :min-value="minDate"
                  class="p-2"
                  :ui="{ cellTrigger: 'cursor-pointer' }"
                  :prev-month="{ class: 'cursor-pointer' }"
                  :next-month="{ class: 'cursor-pointer' }"
                  :prev-year="{ class: 'cursor-pointer' }"
                  :next-year="{ class: 'cursor-pointer' }"
                />
              </template>
            </UPopover>
          </UFormField>
          <div class="flex gap-4">
            <UFormField label="Heure de début" class="flex-1">
              <UInput v-model="form.heure_debut" type="time" class="w-full" />
            </UFormField>
            <UFormField label="Heure de fin" class="flex-1">
              <UInput v-model="form.heure_fin" type="time" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Durée d'un créneau (minutes)">
            <UInput v-model.number="form.duree_creneau" type="number" min="1" class="w-full" />
          </UFormField>
          <UButton block :loading="saving" class="cursor-pointer" @click="save"
            >Enregistrer</UButton
          >
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" title="Supprimer cette disponibilité ?">
      <template #body>
        <div class="flex flex-col gap-4">
          <p class="text-sm text-muted">
            Le créneau du {{ toDelete?.date_dispo }} de
            {{ toDelete?.heure_debut.slice(0, 5) }} à {{ toDelete?.heure_fin.slice(0, 5) }}
            sera définitivement supprimé.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              variant="outline"
              color="neutral"
              class="cursor-pointer"
              @click="confirmOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              :loading="deleting"
              class="cursor-pointer"
              @click="confirmRemove"
            >
              Supprimer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
