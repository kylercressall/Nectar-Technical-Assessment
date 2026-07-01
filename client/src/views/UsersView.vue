<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

const PAGE_SIZE = 20

const users = ref<User[]>([])
const duplicates = ref<Duplicate[]>([])
const countryFilter = ref('')
const loading = ref(false)
const error = ref('')
const page = ref(1)
const hasMore = ref(false)

async function fetchUsers(resetPage = false) {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE + 1),
      offset: String((page.value - 1) * PAGE_SIZE),
    })
    if (countryFilter.value) params.set('country', countryFilter.value.toUpperCase())
    const res = await fetch(`/api/users?${params}`)
    if (!res.ok) throw new Error('Failed to fetch users')
    const data: User[] = await res.json()
    hasMore.value = data.length > PAGE_SIZE
    users.value = data.slice(0, PAGE_SIZE)
  } catch {
    error.value = 'Could not load users.'
  } finally {
    loading.value = false
  }
}

async function fetchDuplicates() {
  try {
    const res = await fetch('/api/users/duplicates')
    if (!res.ok) throw new Error()
    duplicates.value = await res.json()
  } catch {
    // non-blocking
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    fetchUsers()
  }
}

function nextPage() {
  if (hasMore.value) {
    page.value++
    fetchUsers()
  }
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
    <div v-else-if="loading" class="spinner-wrap"><div class="spinner" /></div>
    <template v-else>
      <table>
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

      <div v-if="page > 1 || hasMore" class="pagination">
        <button @click="prevPage" :disabled="page === 1">Previous</button>
        <span class="page-num">Page {{ page }}</span>
        <button @click="nextPage" :disabled="!hasMore">Next</button>
      </div>
    </template>

    <section v-if="duplicates.length > 0" class="duplicates">
      <h2>Duplicate Names</h2>
      <table>
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
  gap: 0.75rem;
  margin-top: 1rem;
}
.pagination button {
  padding: 0.4rem 0.9rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
}
.pagination button:hover:not(:disabled) { background: #f4f4f4; }
.pagination button:disabled { opacity: 0.4; cursor: default; }
.page-num { font-size: 0.9rem; color: #374151; }

.duplicates { margin-top: 2.5rem; }
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
