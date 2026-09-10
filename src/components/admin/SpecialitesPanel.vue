<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "@nuxt/ui/composables";
import api from "@/api/ApiService";
import type { Specialite } from "@/types";
import { apiErrorMessage } from "@/utils/apiError";

const toast = useToast();

const specialites = ref<Specialite[]>([]);
const loading = ref(false);

async function fetchAll() {
  loading.value = true;

  try {
    const { data } = await api.get<Specialite[]>("/specialites");
    specialites.value = data;
  } finally {
    loading.value = false;
  }
}

fetchAll();

const columns = [
  { accessorKey: "nom", header: "Nom" },
  { id: "actions", header: "" },
];

const modalOpen = ref(false);
const editing = ref<Specialite | null>(null);
const saving = ref(false);
const nom = ref("");

function openCreate() {
  editing.value = null;
  nom.value = "";
  modalOpen.value = true;
}

function openEdit(specialite: Specialite) {
  editing.value = specialite;
  nom.value = specialite.nom;
  modalOpen.value = true;
}

async function save() {
  saving.value = true;

  try {
    if (editing.value) {
      await api.patch(`/admin/specialites/${editing.value.id}`, {
        nom: nom.value,
      });
      toast.add({ title: "Spécialité modifiée", color: "success" });
    } else {
      await api.post("/admin/specialites", { nom: nom.value });
      toast.add({ title: "Spécialité créée", color: "success" });
    }

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
const toDelete = ref<Specialite | null>(null);
const deleting = ref(false);

function askRemove(specialite: Specialite) {
  toDelete.value = specialite;
  confirmOpen.value = true;
}

async function confirmRemove() {
  if (!toDelete.value) return;

  deleting.value = true;

  try {
    await api.delete(`/admin/specialites/${toDelete.value.id}`);
    toast.add({ title: "Spécialité supprimée", color: "success" });
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
      <h2 class="font-semibold text-brand-900">Spécialités</h2>
      <UButton icon="i-lucide-plus" class="cursor-pointer" @click="openCreate"
        >Ajouter</UButton
      >
    </div>

    <UTable
      :data="specialites"
      :columns="columns"
      :loading="loading"
      class="rounded-lg bg-white ring ring-default"
      :ui="{ tbody: 'isolation-auto', th: 'text-center', td: 'text-center' }"
    >
      <template #loading>
        <div class="flex flex-col gap-4 p-4">
          <div v-for="i in 4" :key="i" class="flex items-center gap-6">
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

    <UModal
      v-model:open="modalOpen"
      :title="editing ? 'Modifier la spécialité' : 'Ajouter une spécialité'"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <UFormField label="Nom">
            <UInput v-model="nom" class="w-full" />
          </UFormField>
          <UButton block :loading="saving" class="cursor-pointer" @click="save"
            >Enregistrer</UButton
          >
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmOpen" title="Supprimer cette spécialité ?">
      <template #body>
        <div class="flex flex-col gap-4">
          <p class="text-sm text-muted">
            "{{ toDelete?.nom }}" sera définitivement supprimée. Cette action
            est irréversible.
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
