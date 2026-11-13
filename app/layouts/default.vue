<template>
  <div class="workspace">
    <a class="skip-link" href="#page-content">К содержимому</a>
    <AccountBar />
    <div id="page-content" class="workspace-content" tabindex="-1">
      <slot />
    </div>
  </div>
</template>
