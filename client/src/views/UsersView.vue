<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface User {
  id: number
  first_name: string
  last_name: string
  username: string | null
  email: string
  active: boolean
  country: string | null
}

interface Duplicate {
  first_name: string
  last_name: string
  count: number
}

const PAGE_SIZE = 10

const users = ref<User[]>([])
const userTotal = ref(0)
const userPage = ref(1)
const totalUserPages = computed(() => Math.ceil(userTotal.value / PAGE_SIZE))

const duplicates = ref<Duplicate[]>([])
const dupTotal = ref(0)
const dupPage = ref(1)
const dupMinCount = ref(1)
const dupActive = ref<'all' | 'true' | 'false'>('all')
const duplicatesLoaded = ref(false)
const totalDupPages = computed(() => Math.ceil(dupTotal.value / PAGE_SIZE))

const countryFilter = ref('')
const loading = ref(false)
const initialLoad = ref(true)
const error = ref('')

function pageWindow(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  const around = new Set([1, total, current - 1, current, current + 1].filter(n => n >= 1 && n <= total))
  let prev = 0
  for (const n of [...around].sort((a, b) => a - b)) {
    if (n - prev > 1) pages.push('...')
    pages.push(n)
    prev = n
  }
  return pages
}

const userPageWindow = computed(() => pageWindow(userPage.value, totalUserPages.value))
const dupPageWindow = computed(() => pageWindow(dupPage.value, totalDupPages.value))

async function fetchUsers(resetPage = false) {
  if (resetPage) userPage.value = 1
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String((userPage.value - 1) * PAGE_SIZE),
    })
    if (countryFilter.value) params.set('country', countryFilter.value.toUpperCase())
    const res = await fetch(`/api/users?${params}`)
    if (!res.ok) throw new Error('Failed to fetch users')
    const body = await res.json()
    users.value = body.data
    userTotal.value = body.total
    initialLoad.value = false
  } catch {
    error.value = 'Could not load users.'
  } finally {
    loading.value = false
  }
}

async function fetchDuplicates(resetPage = false) {
  if (resetPage) dupPage.value = 1
  try {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String((dupPage.value - 1) * PAGE_SIZE),
      minCount: String(dupMinCount.value),
    })
    if (dupActive.value !== 'all') params.set('active', dupActive.value)
    const res = await fetch(`/api/users/duplicates?${params}`)
    if (!res.ok) throw new Error()
    const body = await res.json()
    duplicates.value = body.data
    dupTotal.value = body.total
    duplicatesLoaded.value = true
  } catch {
    // non-blocking
  }
}

function goToUserPage(n: number) {
  userPage.value = n
  fetchUsers()
}

function goToDupPage(n: number) {
  dupPage.value = n
  fetchDuplicates()
}

onMounted(() => {
  fetchUsers()
  fetchDuplicates()
})
</script>

<template>
  <div class="page">
    <h1>Users</h1>

    <div class="filters">
      <input
        v-model="countryFilter"
        placeholder="Filter by country (e.g. US)"
        maxlength="2"
        @keyup.enter="fetchUsers(true)"
      />
      <button @click="fetchUsers(true)">Search</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <div v-else-if="loading && initialLoad" class="spinner-wrap"><div class="spinner" /></div>
    <template v-else>
      <table :style="{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Country</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.country ?? '—' }}</td>
            <td>
              <span :class="user.active ? 'badge-active' : 'badge-inactive'">
                {{ user.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="4" class="muted center">No users found.</td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalUserPages > 1" class="pagination">
        <button @click="goToUserPage(userPage - 1)" :disabled="userPage === 1">Previous</button>
        <template v-for="p in userPageWindow" :key="p">
          <span v-if="p === '...'" class="ellipsis">…</span>
          <button v-else @click="goToUserPage(p)" :class="{ active: p === userPage }">{{ p }}</button>
        </template>
        <button @click="goToUserPage(userPage + 1)" :disabled="userPage === totalUserPages">Next</button>
      </div>
    </template>

    <section v-if="duplicatesLoaded" class="duplicates">
      <h2>Duplicate Names</h2>
      <div class="dup-filters">
        <label>
          Min occurrences
          <input
            type="number"
            v-model.number="dupMinCount"
            min="1"
            @change="fetchDuplicates(true)"
          />
        </label>
        <label>
          Status
          <select v-model="dupActive" @change="fetchDuplicates(true)">
            <option value="all">All</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </label>
      </div>
      <p v-if="dupTotal === 0" class="muted">No duplicates match these filters.</p>
      <table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in duplicates" :key="`${d.first_name}-${d.last_name}`">
            <td>{{ d.first_name }} {{ d.last_name }}</td>
            <td>{{ d.count }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="totalDupPages > 1" class="pagination">
        <button @click="goToDupPage(dupPage - 1)" :disabled="dupPage === 1">Previous</button>
        <template v-for="p in dupPageWindow" :key="p">
          <span v-if="p === '...'" class="ellipsis">…</span>
          <button v-else @click="goToDupPage(p)" :class="{ active: p === dupPage }">{{ p }}</button>
        </template>
        <button @click="goToDupPage(dupPage + 1)" :disabled="dupPage === totalDupPages">Next</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
h1 { font-size: 1.6rem; margin-bottom: 1.25rem; }
h2 { font-size: 1.2rem; margin: 2rem 0 0.75rem; }

.filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.filters input {
  padding: 0.45rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 220px;
}
.filters button {
  padding: 0.45rem 1rem;
  background: #2c7a4b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}
.filters button:hover { background: #236040; }

table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th { text-align: left; padding: 0.6rem 0.75rem; background: #f4f4f4; border-bottom: 2px solid #ddd; }
td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; }
tr:last-child td { border-bottom: none; }

.badge-active, .badge-inactive {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}
.badge-active { background: #d1fae5; color: #065f46; }
.badge-inactive { background: #fee2e2; color: #991b1b; }

.pagination {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.pagination button {
  padding: 0.35rem 0.7rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.88rem;
  min-width: 2rem;
}
.pagination button:hover:not(:disabled):not(.active) { background: #f4f4f4; }
.pagination button:disabled { opacity: 0.4; cursor: default; }
.pagination button.active {
  background: #2c7a4b;
  color: white;
  border-color: #2c7a4b;
  font-weight: 600;
}
.ellipsis { color: #9ca3af; font-size: 0.88rem; padding: 0 0.15rem; }

.duplicates { margin-top: 2.5rem; }
.dup-filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  align-items: flex-end;
}
.dup-filters label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #6b7280;
  font-weight: 500;
}
.dup-filters input[type="number"] {
  width: 80px;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
}
.dup-filters select {
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  background: white;
}
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
.center { text-align: center; }
</style>
