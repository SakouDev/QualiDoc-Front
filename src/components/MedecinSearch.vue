<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CalendarDate, DateFormatter, getLocalTimeZone, today as calendarToday } from '@internationalized/date'
import { useToast } from '@nuxt/ui/composables'
import api from '@/api/ApiService'
import type { Medecin, Creneau } from '@/types'

const df = new DateFormatter('fr-FR', { dateStyle: 'long' })
const minDate = calendarToday(getLocalTimeZone())

const emit = defineEmits<{ booked: [] }>()

const toast = useToast()

const query = ref('')
const results = ref<Medecin[]>([])
const searching = ref(false)
const hasSearchedOnce = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(query, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => search(value), 300)
})

async function search(value: string) {
  searching.value = true

  try {
    const { data } = await api.get<Medecin[]>('/medecins', { params: { q: value || undefined } })
    results.value = data
  } finally {
    searching.value = false
    hasSearchedOnce.value = true
  }
}

search('')

const items = computed(() =>
  results.value.map((m) => ({
    label: `${m.prenom} ${m.nom}`,
    description: m.specialite_nom,
    value: m.id,
  })),
)

// --- Réservation ---
const selectedId = ref<number | null>(null)
const selectedMedecin = computed(() => results.value.find((m) => m.id === selectedId.value) ?? null)
const dateValue = ref<CalendarDate | null>(null)
const creneaux = ref<Creneau[]>([])
const loadingCreneaux = ref(false)
const booking = ref(false)

// CalendarDate -> "YYYY-MM-DD" sans passer par un objet Date (donc sans
// risque de décalage de fuseau, même piège que sur le calendrier RDV).
function calendarDateToStr(d: CalendarDate): string {
  const m = String(d.month).padStart(2, '0')
  const day = String(d.day).padStart(2, '0')
  return `${d.year}-${m}-${day}`
}

const dateStr = computed(() => (dateValue.value ? calendarDateToStr(dateValue.value) : ''))

watch(selectedId, () => {
  dateValue.value = selectedId.value ? minDate : null
  creneaux.value = []
})

watch(dateStr, async (value) => {
  if (!value || !selectedMedecin.value) {
    creneaux.value = []
    return
  }

  loadingCreneaux.value = true

  try {
    const { data } = await api.get<Creneau[]>(`/medecins/${selectedMedecin.value.id}/creneaux`, {
      params: { date: value },
    })
    creneaux.value = data
  } finally {
    loadingCreneaux.value = false
  }
})

async function book(creneau: Creneau) {
  if (!selectedMedecin.value) return

  booking.value = true

  try {
    await api.post('/rendez-vous', {
      medecin_id: selectedMedecin.value.id,
      date_heure: creneau.date_heure,
    })

    toast.add({ title: 'Rendez-vous confirmé', color: 'success' })
    selectedId.value = null
    dateValue.value = null
    creneaux.value = []
    emit('booked')
  } catch (e: any) {
    toast.add({
      title: e.response?.data?.messages?.error ?? 'Une erreur est survenue.',
      color: 'error',
    })
  } finally {
    booking.value = false
  }
}

function heure(dateHeure: string): string {
  return dateHeure.slice(11, 16)
}

// Le back ne sait dire que "pris/pas pris" (par un autre RDV), pas "déjà
// passé aujourd'hui" — on le calcule côté front pour désactiver les
// créneaux d'aujourd'hui déjà écoulés, plutôt que de laisser l'utilisateur
// cliquer et se faire rejeter après coup.

function estPasse(dateHeure: string): boolean {
  return new Date(dateHeure.replace(' ', 'T')) <= new Date()
}

</script>

<template>
  <UCard variant="subtle" class="flex h-full flex-col bg-white" :ui="{ body: 'flex min-h-0 flex-1 flex-col gap-4' }">
    <UInput
      v-model="query"
      :loading="searching"
      placeholder="Nom, prénom, spécialité..."
      icon="i-lucide-search"
      size="lg"
      class="w-full shrink-0"
    />

    <div v-if="!hasSearchedOnce" class="flex flex-col gap-3">
      <div v-for="i in 3" :key="i" class="flex flex-col gap-2 rounded-md border p-3">
        <USkeleton class="h-4 w-40" />
        <USkeleton class="h-3 w-24" />
      </div>
    </div>

    <p v-else-if="!searching && results.length === 0" class="text-center text-sm text-muted">
      Aucun médecin trouvé.
    </p>

    <div v-if="results.length" class="flex min-h-0 flex-1 flex-col gap-4">
      <UListbox v-model="selectedId" :items="items" value-key="value" class="w-full shrink-0" />

      <div v-if="selectedMedecin" class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t pt-4">
        <div>
          <p class="font-semibold text-brand-900">
            {{ selectedMedecin.prenom }} {{ selectedMedecin.nom }}
          </p>
          <p class="text-sm text-muted">{{ selectedMedecin.specialite_nom }}</p>
        </div>

        <UFormField label="Date">
          <UPopover>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-calendar"
              class="w-full cursor-pointer justify-start"
            >
              {{ dateValue ? df.format(dateValue.toDate(getLocalTimeZone())) : 'Choisir une date' }}
            </UButton>

            <template #content>
              <UCalendar
                v-model="dateValue"
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

        <div v-if="dateStr" class="border-t pt-4">
          <p v-if="!loadingCreneaux && creneaux.length === 0" class="text-sm text-muted">
            Aucune disponibilité ce jour-là.
          </p>

          <div v-if="creneaux.length" class="flex flex-wrap gap-2">
            <UButton
              v-for="c in creneaux"
              :key="c.date_heure"
              :label="heure(c.date_heure)"
              :disabled="!c.disponible || estPasse(c.date_heure) || booking"
              variant="outline"
              :color="c.disponible && !estPasse(c.date_heure) ? 'primary' : 'error'"
              class="cursor-pointer"
              @click="book(c)"
            />
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
