<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useToast } from "@nuxt/ui/composables";
import api from "@/api/ApiService";
import type { Medecin, Specialite } from "@/types";
import { normalize } from "@/utils/normalize";
import { apiErrorMessage } from "@/utils/apiError";

const toast = useToast();

const medecins = ref<Medecin[]>([]);
const specialites = ref<Specialite[]>([]);
const loading = ref(false);

async function fetchAll() {
  loading.value = true;

  try {
    const [medecinsRes, specialitesRes] = await Promise.all([
      api.get<Medecin[]>("/medecins"),
      api.get<Specialite[]>("/specialites"),
    ]);
    medecins.value = medecinsRes.data;
    specialites.value = specialitesRes.data;
  } finally {
    loading.value = false;
  }
}

fetchAll();

const search = ref("");

const filteredMedecins = computed(() => {
  const q = normalize(search.value.trim());
  if (!q) return medecins.value;

  return medecins.value.filter(
    (m) =>
      normalize(m.nom).includes(q) ||
      normalize(m.prenom).includes(q) ||
      normalize(m.specialite_nom).includes(q),
  );
});

const specialiteOptions = computed(() =>
  specialites.value.map((s) => ({ label: s.nom, value: s.id })),
);

const page = ref(1);
const itemsPerPage = 10;

const paginatedMedecins = computed(() =>
  filteredMedecins.value.slice((page.value - 1) * itemsPerPage, page.value * itemsPerPage),
);

watch(search, () => {
  page.value = 1;
});

const columns = [
  { accessorKey: "prenom", header: "Prénom" },
  { accessorKey: "nom", header: "Nom" },
  { accessorKey: "specialite_nom", header: "Spécialité" },
  { id: "actions", header: "" },
];

const modalOpen = ref(false);
const editing = ref<Medecin | null>(null);
const saving = ref(false);
const form = ref<{ nom: string; prenom: string; specialite_id: number | null }>(
  {
    nom: "",
    prenom: "",
    specialite_id: null,
  },
);

function openCreate() {
  editing.value = null;
  form.value = { nom: "", prenom: "", specialite_id: null };
  modalOpen.value = true;
}

function openEdit(medecin: Medecin) {
  editing.value = medecin;
  form.value = {
    nom: medecin.nom,
    prenom: medecin.prenom,
    specialite_id: medecin.specialite_id,
  };
  modalOpen.value = true;
}

async function save() {
  saving.value = true;

  try {
    if (editing.value) {
      await api.patch(`/admin/medecins/${editing.value.id}`, form.value);
      toast.add({ title: "Médecin modifié", color: "success" });
    } else {
      await api.post("/admin/medecins", form.value);
      toast.add({ title: "Médecin créé", color: "success" });
    }

    modalOpen.value = false;
    search.value = "";
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
const toDelete = ref<Medecin | null>(null);
const deleting = ref(false);

function askRemove(medecin: Medecin) {
  toDelete.value = medecin;
  confirmOpen.value = true;
}

async function confirmRemove() {
  if (!toDelete.value) return;

  deleting.value = true;

  try {
    await api.delete(`/admin/medecins/${toDelete.value.id}`);
    toast.add({ title: "Médecin supprimé", color: "success" });
    confirmOpen.value = false;
    search.value = "";
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
      <h2 class="font-semibold text-brand-900">Médecins</h2>
      <UButton icon="i-lucide-plus" class="cursor-pointer" @click="openCreate"
        >Ajouter</UButton
      >
    </div>

    <UInput
      v-model="search"
      placeholder="Nom, prénom, spécialité..."
      icon="i-lucide-search"
      class="w-full"
    />

    <UTable
      :data="paginatedMedecins"
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
            <USkeleton class="h-4 w-12" />
          </div>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-center gap-2">
          <UButton
            icon="i-lucide-pencil"
            aria-label="Modifier"
            size="xs"
            variant="ghost"
            color="neutral"
            class="cursor-pointer"
            @click="openEdit(row.original)"
          />
          <UButton
            icon="i-lucide-trash-2"
            aria-label="Supprimer"
            size="xs"
            variant="ghost"
            color="error"
            class="cursor-pointer"
            @click="askRemove(row.original)"
          />
        </div>
      </template>
    </UTable>

    <div v-if="filteredMedecins.length > itemsPerPage" class="flex justify-center">
      <UPagination v-model:page="page" :items-per-page="itemsPerPage" :total="filteredMedecins.length" />
    </div>

    <UModal
      v-model:open="modalOpen"
      :title="editing ? 'Modifier le médecin' : 'Ajouter un médecin'"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Prénom">
            <UInput v-model="form.prenom" class="w-full" />
          </UFormField>
          <UFormField label="Nom">
            <UInput v-model="form.nom" class="w-full" />
          </UFormField>
          <UFormField label="Spécialité">
            <USelectMenu
              v-model="form.specialite_id"
              :items="specialiteOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UButton block :loading="saving" class="cursor-pointer" @click="save"
            >Enregistrer</UButton
          >
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" title="Supprimer ce médecin ?">
      <template #body>
        <div class="flex flex-col gap-4">
          <p class="text-sm text-muted">
            {{ toDelete?.prenom }} {{ toDelete?.nom }} sera définitivement
            supprimé. Cette action est irréversible.
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
