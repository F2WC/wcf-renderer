<template>
  <div class="about">
    <wcf-widget data-widget-name="@mf/react" data-props='{"initialCount": 7}' data-auto-mount='true' ></wcf-widget>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
<script setup lang="ts"></script>
