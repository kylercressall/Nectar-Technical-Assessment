<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav>
    <img alt="Vue logo" class="logo" src="@/assets/nectarhr.png" width="128" height="31" />
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <header>
  </header>

  <RouterView />
</template>

<style scoped>

</style>
