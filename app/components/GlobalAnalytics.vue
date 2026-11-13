<script setup lang="ts">
interface Stats {
  attempts: number
  pending: number
  passed: number
  passedStudents: number
  average: number
}
interface Breakdown extends Stats { id: string; name: string }
interface Analytics extends Stats {
  students: number
  teachers: number
  tests: number
  byTest: Breakdown[]
  byGroup: Breakdown[]
}
const { data, error, status, refresh } = await useFetch<Analytics>('/api/platform/analytics')
usePlatformSync(() => refresh())
const breakdowns = computed(() => data.value ? [
  { id: 'test-breakdown', title: 'По тестам', rows: data.value.byTest, empty: 'Создайте тесты, чтобы сравнивать их результаты.' },
  { id: 'group-breakdown', title: 'По группам', rows: data.value.byGroup, empty: 'Здесь появятся результаты учебных групп.' },
] : [])
function averageLabel(stats: Stats) {
  return stats.attempts > stats.pending ? stats.average + '%' : '—'
}
</script>

<template>
  <section aria-labelledby="analytics-title">
    <header class="desk-section-heading">
      <div><h2 id="analytics-title" class="desk-title">Общая аналитика</h2><p>Результаты по тестам и текущему распределению студентов по группам.</p></div>
      <button class="button-secondary" :disabled="status === 'pending'" @click="refresh()">{{ status === 'pending' ? 'Обновляем…' : 'Обновить' }}</button>
    </header>
    <p v-if="error" role="alert" class="people-alert people-alert-error">Не удалось обновить аналитику.</p>
    <template v-if="data">
      <div class="desk-feature">
        <div>
          <h3 class="desk-title">Средний результат</h3>
          <p class="mt-2 text-sm">{{ data.attempts > data.pending ? 'Среднее по проверенным попыткам.' : 'Среднее появится после первой проверенной попытки.' }}</p>
        </div>
        <div class="desk-feature-side"><p class="font-serif text-4xl text-ink">{{ averageLabel(data) }}</p><p class="mt-1 text-xs">Проверено {{ data.attempts - data.pending }} из {{ data.attempts }}</p></div>
      </div>

      <dl class="desk-surface desk-metrics mt-4">
        <div><dt>Студентов прошли</dt><dd>{{ data.passedStudents }}</dd></div>
        <div><dt>Успешных попыток</dt><dd>{{ data.passed }}</dd></div>
        <div><dt>Ожидают проверки</dt><dd>{{ data.pending }}</dd></div>
      </dl>
      <p class="mt-3 text-sm text-muted">Студентов: {{ data.students }} · преподавателей: {{ data.teachers }} · тестов: {{ data.tests }}</p>

      <section v-for="section in breakdowns" :key="section.id" class="desk-section" :aria-labelledby="section.id">
        <h3 :id="section.id" class="desk-title mb-3">{{ section.title }}</h3>
        <div v-if="section.rows.length" class="desk-surface desk-list analytics-list">
          <article v-for="row in section.rows" :key="row.id" class="analytics-row">
            <div class="min-w-0">
              <h4 class="desk-row-title">{{ row.name }}</h4>
              <p class="desk-row-meta">Попыток: {{ row.attempts }} · прошли студентов: {{ row.passedStudents }}<span v-if="row.pending" class="desk-chip" data-tone="waiting">На проверке: {{ row.pending }}</span></p>
            </div>
            <div class="analytics-average">
              <div class="flex items-center justify-between gap-2 text-xs text-muted"><span>Средний результат</span><strong class="desk-score text-ink">{{ averageLabel(row) }}</strong></div>
              <div v-if="row.attempts > row.pending" class="progress-track mt-2" aria-hidden="true"><span :style="{ transform: 'scaleX(' + row.average / 100 + ')' }" /></div>
            </div>
          </article>
        </div>
        <div v-else class="desk-surface desk-empty"><p>{{ section.empty }}</p></div>
      </section>
    </template>
  </section>
</template>
