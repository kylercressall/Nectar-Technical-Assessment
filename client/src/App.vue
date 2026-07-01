<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <nav>
    <div class="brand">
      <img
        alt="Nectar HR"
        class="logo"
        src="@/assets/nectarhr.png"
        width="128"
        height="31"
        style="background: white; border-radius: 6px; padding: 4px 8px"
      />
      <span class="brand-name">Weather App</span>
    </div>
    <div class="links">
      <RouterLink to="/weather">Weather</RouterLink>
      <RouterLink to="/users">Users</RouterLink>
    </div>
  </nav>
  <RouterView />
</template>

<style scoped>
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #1a1a2e;
  border-bottom: 1px solid #2e2e4a;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.brand-name {
  color: #ffffff;
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.links {
  display: flex;
  gap: 1.5rem;
}
.links a {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
}
.links a:hover {
  color: #ffffff;
}
.links a.router-link-active {
  color: #ffffff;
  border-bottom: 2px solid #4ade80;
  padding-bottom: 2px;
}
</style>
