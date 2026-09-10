<script setup lang="ts">
import { ref, shallowRef, computed, watch } from "vue";
import {
  DateFormatter,
  getLocalTimeZone,
  type CalendarDate,
} from "@internationalized/date";
import { useToast } from "@nuxt/ui/composables";
import api from "@/api/ApiService";
import type { Medecin, RendezVous } from "@/types";
import { statutColor, statutLabel } from "@/utils/statut";
import { apiErrorMessage } from "@/utils/apiError";

const toast = useToast();
const df = new DateFormatter("fr-FR", { dateStyle: "medium" });

const medecins = ref<Medecin[]>([]);
api.get<Medecin[]>("/medecins").then(({ data }) => (medecins.value = data));

const medecinOptions = computed(() =>
  medecins.value.map((m) => ({ label: `${m.prenom} ${m.nom}`, value: m.id })),
);

const statutOptions = [
  { label: "Confirmé", value: "confirme" },
  { label: "Annulé", value: "annule" },
  { label: "Honoré", value: "honore" },
];

const medecinId = ref<number | null>(null);
const statut = ref<string | null>(null);
const dateRange = shallowRef<{ start: CalendarDate; end: CalendarDate } | null>(
  null,
);

function dateToStr(d: CalendarDate): string {
  const m = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  return `${d.year}-${m}-${day}`;
}

const dateRangeLabel = computed(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) return "Période";
  const start = df.format(dateRange.value.start.toDate(getLocalTimeZone()));
  const end = df.format(dateRange.value.end.toDate(getLocalTimeZone()));
  return `${start} → ${end}`;
});

const query = computed(() => {
  const params: Record<string, string | number> = {};
  if (medecinId.value) params.medecin_id = medecinId.value;
  if (statut.value) params.statut = statut.value;
  if (dateRange.value?.start)
    params.date_from = `${dateToStr(dateRange.value.start)} 00:00:00`;
  if (dateRange.value?.end)
    params.date_to = `${dateToStr(dateRange.value.end)} 23:59:59`;
  return params;
});

function resetFilters() {
  medecinId.value = null;
  statut.value = null;
  dateRange.value = null;
}

const rdvs = ref<RendezVous[]>([]);
const loading = ref(false);

async function fetchAll() {
  loading.value = true;

  try {
    const { data } = await api.get<RendezVous[]>("/admin/rendez-vous", {
      params: query.value,
    });
    rdvs.value = data;
  } finally {
    loading.value = false;
  }
}

watch(query, fetchAll, { immediate: true });

const page = ref(1);
const itemsPerPage = 10;

const paginatedRdvs = computed(() =>
  rdvs.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage),
);

watch(query, () => {
  page.value = 1;
});

const columns = [
  { id: "patient", header: "Patient" },
  { id: "medecin", header: "Médecin" },
  { accessorKey: "specialite_nom", header: "Spécialité" },
  { id: "date", header: "Date" },
  { id: "statut", header: "Statut" },
  { id: "actions", header: "Annulation" },
];

const confirmOpen = ref(false);
const toCancel = ref<RendezVous | null>(null);
const cancelling = ref(false);

function askCancel(rdv: RendezVous) {
  toCancel.value = rdv;
  confirmOpen.value = true;
}

async function confirmCancel() {
  if (!toCancel.value) return;

  cancelling.value = true;

  try {
    await api.delete(`/admin/rendez-vous/${toCancel.value.id}`);
    toast.add({ title: "Rendez-vous annulé", color: "success" });
    confirmOpen.value = false;
    await fetchAll();
  } catch (e: any) {
    toast.add({
      title: apiErrorMessage(e),
      color: "error",
    });
  } finally {
    cancelling.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="font-semibold text-brand-900">Rendez-vous</h2>

    <div class="flex flex-wrap items-center gap-2">
      <USelectMenu
        v-model="medecinId"
        :items="medecinOptions"
        value-key="value"
        placeholder="Médecin"
        class="w-48"
      />
      <USelectMenu
        v-model="statut"
        :items="statutOptions"
        value-key="value"
        placeholder="Statut"
        class="w-40"
      />

      <UPopover>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar"
          class="cursor-pointer"
        >
          {{ dateRangeLabel }}
        </UButton>
        <template #content>
          <UCalendar
            v-model="dateRange"
            range
            size="sm"
            class="p-2"
            :ui="{ cellTrigger: 'cursor-pointer' }"
            :prev-month="{ class: 'cursor-pointer' }"
            :next-month="{ class: 'cursor-pointer' }"
            :prev-year="{ class: 'cursor-pointer' }"
            :next-year="{ class: 'cursor-pointer' }"
          />
        </template>
      </UPopover>

      <UButton
        variant="ghost"
        color="neutral"
        class="cursor-pointer"
        @click="resetFilters"
      >
        Réinitialiser
      </UButton>
    </div>

    <UTable
      :data="paginatedRdvs"
      :columns="columns"
      :loading="loading"
      class="rounded-lg bg-white ring ring-default"
      :ui="{ tbody: 'isolation-auto', th: 'text-center', td: 'text-center' }"
    >
      <template #loading>
        <div class="flex flex-col gap-4 p-4">
          <div v-for="i in 5" :key="i" class="flex items-center gap-6">
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-4 w-20" />
          </div>
        </div>
      </template>

      <template #patient-cell="{ row }">
        {{ row.original.patient_prenom }} {{ row.original.patient_nom }}
      </template>
      <template #medecin-cell="{ row }">
        {{ row.original.medecin_prenom }} {{ row.original.medecin_nom }}
      </template>
      <template #date-cell="{ row }">
        {{ row.original.date_heure.slice(0, 16) }}
      </template>
      <template #statut-cell="{ row }">
        <UBadge :color="statutColor(row.original.statut)" variant="subtle">
          {{ statutLabel(row.original.statut) }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <UButton
          v-if="row.original.statut === 'confirme'"
          icon="i-lucide-trash-2"
          aria-label="Annuler le rendez-vous"
          size="xs"
          variant="ghost"
          color="error"
          class="cursor-pointer"
          @click="askCancel(row.original)"
        />
      </template>
    </UTable>

    <div v-if="rdvs.length > itemsPerPage" class="flex justify-center">
      <UPagination v-model:page="page" :items-per-page="itemsPerPage" :total="rdvs.length" />
    </div>

    <UModal v-model:open="confirmOpen" title="Annuler ce rendez-vous ?">
      <template #body>
        <div class="flex flex-col gap-4">
          <p class="text-sm text-muted">
            Le rendez-vous de {{ toCancel?.patient_prenom }} {{ toCancel?.patient_nom }} avec
            {{ toCancel?.medecin_prenom }} {{ toCancel?.medecin_nom }} sera annulé.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" color="neutral" class="cursor-pointer" @click="confirmOpen = false">
              Retour
            </UButton>
            <UButton color="error" :loading="cancelling" class="cursor-pointer" @click="confirmCancel">
              Annuler le RDV
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
