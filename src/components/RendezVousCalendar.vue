<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import { useToast } from '@nuxt/ui/composables'
import api from '@/api/ApiService'
import type { RendezVous } from '@/types'
import HistoriqueTimeline from '@/components/HistoriqueTimeline.vue'

const props = defineProps<{ refreshKey: number }>()

const toast = useToast()
const rendezVous = ref<RendezVous[]>([])
const selected = ref<CalendarDate | null>(null)
const hasLoadedOnce = ref(false)

async function fetchAll() {
  try {
    const { data } = await api.get<RendezVous[]>('/rendez-vous')
    rendezVous.value = data
  } finally {
    hasLoadedOnce.value = true
  }
}

fetchAll()
watch(() => props.refreshKey, fetchAll)

function dayKeyFromRdv(dateHeure: string): string {
  return dateHeure.slice(0, 10)
}

function dayKeyFromCalendarDate(day: { year: number; month: number; day: number }): string {
  const m = String(day.month).padStart(2, '0')
  const d = String(day.day).padStart(2, '0')
  return `${day.year}-${m}-${d}`
}

const rdvByDay = computed(() => {
  const map = new Map<string, RendezVous[]>()
  for (const rdv of rendezVous.value) {
    const key = dayKeyFromRdv(rdv.date_heure)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(rdv)
  }
  return map
})

function chipColor(key: string): 'success' | 'error' | 'neutral' | undefined {
  const rdvs = rdvByDay.value.get(key)
  if (!rdvs || rdvs.length === 0) return undefined
  if (rdvs.some((r) => r.statut === 'confirme')) return 'success'
  if (rdvs.every((r) => r.statut === 'annule')) return 'error'
  return 'neutral'
}

const selectedKey = computed(() => (selected.value ? dayKeyFromCalendarDate(selected.value) : null))
const selectedDayRdv = computed(() => (selectedKey.value ? (rdvByDay.value.get(selectedKey.value) ?? []) : []))

function statutColor(statut: string) {
  if (statut === 'confirme') return 'success'
  if (statut === 'annule') return 'error'
  if (statut === 'honore') return 'info'
  return 'neutral'
}

function statutLabel(statut: string) {
  if (statut === 'confirme') return 'Confirmé'
  if (statut === 'annule') return 'Annulé'
  if (statut === 'honore') return 'Honoré'
  return statut
}

const historique = computed(() =>
  [...rendezVous.value]
    .filter((r) => new Date(r.date_heure.replace(' ', 'T')) < new Date())
    .sort((a, b) => b.date_heure.localeCompare(a.date_heure)),
)

async function annuler(rdv: RendezVous) {
  try {
    await api.delete(`/rendez-vous/${rdv.id}`)
    toast.add({ title: 'Rendez-vous annulé', color: 'success' })
    await fetchAll()
  } catch (e: any) {
    toast.add({ title: e.response?.data?.messages?.error ?? 'Une erreur est survenue.', color: 'error' })
  }
}
</script>

<template>
  <UCard variant="subtle" class="bg-white">
    <div>
      <UCalendar
        v-model="selected"
        size="sm"
        class="mx-auto w-full max-w-70"
        :ui="{ cellTrigger: 'cursor-pointer' }"
        :prev-month="{ class: 'cursor-pointer' }"
        :next-month="{ class: 'cursor-pointer' }"
        :prev-year="{ class: 'cursor-pointer' }"
        :next-year="{ class: 'cursor-pointer' }"
      >
        <template #day="{ day }">
          <UChip
            :show="!!chipColor(dayKeyFromCalendarDate(day))"
            :color="chipColor(dayKeyFromCalendarDate(day))"
            size="2xs"
          >
            {{ day.day }}
          </UChip>
        </template>
      </UCalendar>

      <div v-if="selected" class="mt-4 flex flex-col divide-y divide-default border-t pt-4">
        <p v-if="selectedDayRdv.length === 0" class="text-sm text-muted">Rien ce jour-là.</p>
        <div
          v-for="rdv in selectedDayRdv"
          :key="rdv.id"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div>
            <p class="text-sm font-medium">
              {{ rdv.date_heure.slice(11, 16) }} — {{ rdv.medecin_prenom }} {{ rdv.medecin_nom }}
            </p>
            <p class="text-xs text-muted">{{ rdv.specialite_nom }}</p>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :color="statutColor(rdv.statut)" variant="subtle">{{ statutLabel(rdv.statut) }}</UBadge>
            <UButton
              v-if="rdv.statut === 'confirme' && new Date(rdv.date_heure.replace(' ', 'T')) > new Date()"
              size="xs"
              color="error"
              variant="outline"
              class="cursor-pointer"
              @click="annuler(rdv)"
            >
              Annuler
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 border-t pt-4">
      <h2 class="mb-4 font-semibold text-brand-900">Historique</h2>
      <div class="max-h-72 overflow-y-auto pr-1">
        <HistoriqueTimeline :historique="historique" :has-loaded-once="hasLoadedOnce" />
      </div>
    </div>
  </UCard>
</template>
