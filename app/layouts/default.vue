<template>
  <div>
    <AccountBar />
    <div v-if="$route.path === '/' || $route.path === '/profile'" class="reference-shell"><ReferenceSidebar side="left" /><div class="min-w-0"><slot /></div><ReferenceSidebar side="right" /></div>
    <slot v-else />
    <footer v-if="$route.path !== '/learn'" class="reference-footer"><span>практика</span><span>Учиться. Вспоминать. Понимать.</span></footer>
  </div>
</template>
