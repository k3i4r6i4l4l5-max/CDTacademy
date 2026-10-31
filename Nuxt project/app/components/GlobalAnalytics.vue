<script setup lang="ts">
interface Stats { attempts: number; pending: number; passed: number; passedStudents: number; average: number }
interface Analytics extends Stats { students: number; teachers: number; tests: number; byTest: (Stats & {id:string;name:string})[]; byGroup: (Stats & {id:string;name:string})[] }
const { data, error, refresh } = await useFetch<Analytics>('/api/platform/analytics')
// Агрегаты и проверку доступа выполняет сервер; здесь только отображение и обновление.
usePlatformSync(() => refresh())
</script>
<template>
  <section><div class="flex flex-wrap justify-between gap-4"><h2 class="text-xl">Общая аналитика</h2><button class="button-secondary" @click="refresh()">Обновить</button></div><p class="my-4 text-sm text-muted">Доступна только администратору. Средний процент считается по проверенным попыткам. Группы указаны по текущему распределению студентов.</p><p v-if="error" role="alert" class="text-accent">Не удалось загрузить аналитику.</p><template v-if="data"><div class="my-6 grid grid-cols-2 gap-4 lg:grid-cols-4"><div v-for="item in [[data.students, 'Студентов'], [data.teachers, 'Преподавателей'], [data.attempts, 'Всего попыток'], [data.passedStudents, 'Уникальных прошедших'], [data.passed, 'Успешных попыток'], [data.pending, 'Ожидают проверки'], [data.average + '%', 'Средний результат'], [data.tests, 'Тестов']]" :key="String(item[1])" class="panel"><p class="text-3xl">{{ item[0] }}</p><p class="mt-2 text-xs text-muted">{{ item[1] }}</p></div></div>
    <section v-for="section in [{ title: 'По тестам', rows: data.byTest }, { title: 'По группам', rows: data.byGroup }]" :key="section.title" class="mt-8"><h3 class="mb-4 text-lg">{{ section.title }}</h3><div class="overflow-x-auto rounded-xl border border-line"><table class="w-full min-w-[650px] text-left text-sm"><thead class="bg-soft text-xs text-muted"><tr><th class="p-4">Название</th><th class="p-4">Попыток</th><th class="p-4">Прошли студентов</th><th class="p-4">На проверке</th><th class="p-4">Средний %</th></tr></thead><tbody><tr v-for="row in section.rows" :key="row.id" class="border-t border-line"><td class="p-4">{{ row.name }}</td><td class="p-4">{{ row.attempts }}</td><td class="p-4">{{ row.passedStudents }}</td><td class="p-4">{{ row.pending }}</td><td class="p-4">{{ row.average }}%</td></tr></tbody></table></div></section>
  </template></section>
</template>
