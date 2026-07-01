<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Period {
  name: string
  temperature: number
  temperatureUnit: string
  windSpeed: string
  windDirection: string
  shortForecast: string
  isDaytime: boolean
  startTime: string
  icon: string
  probabilityOfPrecipitation: { value: number | null }
}

interface DayPair {
  day: Period | null
  night: Period | null
  isToday: boolean
  label: string
  date: string
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

const displayedState = ref('')

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function dayLabel(day: Period | null, night: Period | null): string {
  if (day) return day.name
  if (night) return night.name.replace(/ Night$/i, '').replace(/^Tonight$/i, 'Today')
  return ''
}

const stateInput = ref('')
const periods = ref<Period[]>([])
const loading = ref(false)
const error = ref('')
const searched = ref(false)

const dayPairs = computed<DayPair[]>(() => {
  const pairs: DayPair[] = []
  let i = 0
  while (i < periods.value.length) {
    const current = periods.value[i]
    const next = periods.value[i + 1]
    if (current.isDaytime) {
      const night = next ?? null
      pairs.push({
        day: current,
        night,
        isToday: pairs.length === 0,
        label: dayLabel(current, night),
        date: formatDate(current.startTime),
      })
      i += night ? 2 : 1
    } else {
      pairs.push({
        day: null,
        night: current,
        isToday: pairs.length === 0,
        label: dayLabel(null, current),
        date: formatDate(current.startTime),
      })
      i += 1
    }
  }
  return pairs
})

onMounted(() => {
  const saved = localStorage.getItem('lastWeatherState')
  if (saved) {
    stateInput.value = saved
    fetchWeather()
  }
})

async function fetchWeather() {
  const state = stateInput.value.trim().toUpperCase()
  if (!state || state.length !== 2) {
    error.value = 'Enter a valid 2-letter state code.'
    return
  }
  loading.value = true
  error.value = ''
  searched.value = true
  periods.value = []
  try {
    const res = await fetch(`/api/weather/${state}`)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to fetch forecast')
    }
    const data = await res.json()
    periods.value = data.periods
    displayedState.value = state
    localStorage.setItem('lastWeatherState', state)
  } catch (e: any) {
    error.value = e.message ?? 'Could not load weather forecast.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1>Weather Forecast</h1>
    <p class="subtitle">Enter a US state code to get the current forecast.</p>

    <div class="search">
      <input
        v-model="stateInput"
        placeholder="State code (e.g. CA)"
        maxlength="2"
        @keyup.enter="fetchWeather"
      />
      <button @click="fetchWeather">Get Forecast</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <div v-else-if="loading" class="spinner-wrap"><div class="spinner" /></div>

    <template v-else-if="dayPairs.length > 0">
    <h2 class="state-heading">{{ STATE_NAMES[displayedState] ?? displayedState }} Forecast</h2>
    <div class="grid">
      <div
        v-for="(pair, idx) in dayPairs"
        :key="idx"
        class="day-card"
        :class="{ today: pair.isToday }"
      >
        <div class="card-label">
          <span class="label-name">{{ pair.label }}</span>
          <span class="label-date">{{ pair.date }}</span>
        </div>

        <div v-if="pair.day" class="half">
          <div class="half-header">
            <span class="period-tag">Day</span>
            <span class="temp">{{ pair.day.temperature }}°{{ pair.day.temperatureUnit }}</span>
          </div>
          <div class="meta">
            <img :src="pair.day.icon" class="wx-icon" alt="" />
            <div>
              <p class="forecast">{{ pair.day.shortForecast }}</p>
              <p class="wind">Wind: {{ pair.day.windSpeed }} {{ pair.day.windDirection }}</p>
              <p v-if="pair.day.probabilityOfPrecipitation.value !== null" class="precip">
                Rain: {{ pair.day.probabilityOfPrecipitation.value }}%
              </p>
            </div>
          </div>
        </div>

        <div v-if="pair.day && pair.night" class="divider" />

        <div v-if="pair.night" class="half">
          <div class="half-header">
            <span class="period-tag">Night</span>
            <span class="temp night-temp">{{ pair.night.temperature }}°{{ pair.night.temperatureUnit }}</span>
          </div>
          <div class="meta">
            <img :src="pair.night.icon" class="wx-icon" alt="" />
            <div>
              <p class="forecast">{{ pair.night.shortForecast }}</p>
              <p class="wind">Wind: {{ pair.night.windSpeed }} {{ pair.night.windDirection }}</p>
              <p v-if="pair.night.probabilityOfPrecipitation.value !== null" class="precip">
                Rain: {{ pair.night.probabilityOfPrecipitation.value }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

    <p v-else-if="searched && !loading" class="muted">No forecast data available.</p>
  </div>
</template>

<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
.subtitle { color: #666; margin-bottom: 1.25rem; font-size: 0.95rem; }

.search { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.search input {
  padding: 0.45rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 180px;
  text-transform: uppercase;
}
.search button {
  padding: 0.45rem 1rem;
  background: #2c7a4b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}
.search button:hover { background: #236040; }

.state-heading { font-size: 1.4rem; font-weight: 700; margin: 0 0 1rem; color: #111827; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.day-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fafafa;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.day-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.day-card.today {
  border-color: #2c7a4b;
  box-shadow: 0 0 0 2px #2c7a4b22;
  background: #f0fdf6;
}

.card-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.6rem 1rem 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: #f4f4f5;
}

.today .card-label {
  background: #dcfce7;
  border-bottom-color: #bbf7d0;
}

.label-name { font-weight: 700; font-size: 0.9rem; color: #111827; }
.label-date { font-size: 0.8rem; color: #6b7280; }

.half { padding: 0.75rem 1rem; }

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0 1rem;
}

.today .divider { background: #bbf7d0; }

.half-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.4rem;
}

.period-tag {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.temp { font-size: 1.2rem; font-weight: 700; color: #2c7a4b; }
.night-temp { color: #6366f1; }

.meta { display: flex; align-items: flex-start; gap: 0.5rem; }
.wx-icon { width: 40px; height: 40px; flex-shrink: 0; border-radius: 6px; }

.forecast { font-size: 0.84rem; color: #4b5563; margin: 0 0 0.2rem; }
.wind { font-size: 0.78rem; color: #9ca3af; margin: 0 0 0.2rem; }
.precip { font-size: 0.78rem; color: #3b82f6; margin: 0; }

.spinner-wrap { display: flex; justify-content: center; padding: 3rem 0; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #2c7a4b;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.muted { color: #888; font-size: 0.9rem; }
.error { color: #b91c1c; }
</style>
