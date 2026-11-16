<script setup lang="ts">
import type { CurriculumPlacement } from '#shared/types/platform'
const placement = defineModel<CurriculumPlacement>()
const fields = [
  { key: 'subject', label: 'Дисциплина', example: 'Физика' },
  { key: 'course', label: 'Курс', example: 'Общая физика' },
  { key: 'module', label: 'Модуль', example: 'Механика' },
] as const
function update(key: keyof CurriculumPlacement, event: Event) {
  placement.value = {
    subject: '', course: '', module: '',
    ...placement.value,
    [key]: (event.target as HTMLInputElement).value,
  }
}
</script>

<template>
  <fieldset class="curriculum-fields">
    <legend>Место в учебной программе <span class="text-xs font-normal text-muted">необязательно</span></legend>
    <div class="grid gap-3 sm:grid-cols-3">
      <label v-for="field in fields" :key="field.key" class="text-sm">
        {{ field.label }}
        <input class="field mt-1" maxlength="100" :value="placement?.[field.key] || ''" :placeholder="field.example" @input="update(field.key, $event)">
      </label>
    </div>
  </fieldset>
</template>
