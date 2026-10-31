<script setup lang="ts">
import { lessons } from '~/data/course'
const { user } = useAuth()
const { completed, solved } = useLearning()
useHead({ title: 'Практика — учитесь писать код', htmlAttrs: { lang: 'ru' } })
</script>
<template>
 <div class="min-h-dvh">

  <main class="mx-auto max-w-6xl px-6 py-14">
   <p class="mb-5 text-xs uppercase tracking-widest text-accent">Теория становится навыком</p>
   <h1 class="page-title max-w-2xl">Подготовка</h1>
   <p class="mt-6 max-w-xl text-lg leading-8 text-muted">Изучайте JavaScript по шагам: разберите пример, попробуйте сами и решите задачу. Проверка покажет, что получилось и что нужно исправить.</p>
   <NuxtLink to="/learn" class="button-primary mt-8">{{ solved ? 'Продолжить обучение' : 'Начать учиться' }} →</NuxtLink>
   <StudentMaterials v-if="user?.role === 'student'" />
   <section class="mt-10 border-t border-line pt-7"><div class="mb-6 flex justify-between"><h2 class="text-xl">Самостоятельная практика</h2><span class="text-sm text-muted">С самого начала</span></div><NuxtLink to="/learn" class="grid gap-7 rounded-[11px] border border-line bg-white p-7 transition-colors hover:bg-soft sm:grid-cols-[80px_1fr_auto]"><img src="/images/javascript.svg" alt="Логотип JavaScript" class="size-20 rounded-lg"><div><h3 class="text-2xl">JavaScript с нуля</h3><p class="mt-3 max-w-xl text-sm leading-7 text-muted">Переменные, условия, циклы, функции и работа с данными. Теория с примерами, практика в редакторе и итоговая задача.</p><p class="mt-5 text-xs text-muted">{{ lessons.length }} уроков · 27 заданий · Начальный уровень</p></div><div class="flex flex-col justify-between gap-4 text-sm"><span class="text-muted">{{ completed }} / {{ lessons.length }} пройдено</span><span class="text-accent">{{ solved ? 'Продолжить' : 'Открыть программу' }} →</span></div></NuxtLink></section>
   <div class="mt-12 grid gap-8 sm:grid-cols-3"><div><h2 class="text-sm font-medium">Разберите пример</h2><p class="mt-2 text-sm leading-7 text-muted">Короткие объяснения и работающий код к каждой теме.</p></div><div><h2 class="text-sm font-medium">Напишите решение</h2><p class="mt-2 text-sm leading-7 text-muted">Редактор с подсветкой, отступами и автодополнением.</p></div><div><h2 class="text-sm font-medium">Проверьте себя</h2><p class="mt-2 text-sm leading-7 text-muted">Тесты проверяют результат и тип возвращаемого значения.</p></div></div>
   <p class="mt-14 text-xs text-muted">Ваши ответы и прогресс сохраняются в этом браузере.</p>
  </main>
 </div>
</template>
