import type { Lesson } from '../../shared/types/course'
import { taskExamples } from './taskExamples'

// Содержимое самостоятельного курса; преподавательские тесты отдельно хранятся на сервере.
export const lessons: Lesson[] = [
  {
    id: 'variables', title: 'Переменные и значения', minutes: 15,
    description: 'Сохраняем данные, даём им имена и получаем первый результат.',
    theory: [
      { title: 'Значение получает имя', text: 'Переменная связывает имя со значением. Используйте const, если не планируете присваивать новое значение. Имена чувствительны к регистру: price и Price — разные переменные. Строки записывают в кавычках, числа — без них.', example: 'const title = "JavaScript";\nconst price = 120;\nconsole.log(title); // JavaScript', practice: { id: 'name', prompt: 'Какое ключевое слово объявляет переменную без возможности повторного присваивания? Введите одно слово.', answer: 'const', hint: 'В примере оно стоит перед title.' } },
      { title: 'Когда значение меняется', text: 'let позволяет присвоить переменной новое значение. Знак = выполняет присваивание. Выражение справа вычисляется раньше, чем результат попадёт в переменную слева. const запрещает повторное присваивание, но не делает содержимое объекта неизменяемым.', example: 'let score = 10;\nscore = score + 5;\nconsole.log(score); // 15', practice: { id: 'score', prompt: 'let score = 4; score = score + 3; Какое число хранится в score?', answer: '7', hint: 'Прибавьте 3 к исходному значению 4.' } },
    ],
    task: { title: 'Стоимость покупки', prompt: 'Реализуйте total(price, count). Верните стоимость count товаров по цене price. Аргументы — неотрицательные числа. Верните число через return, без console.log.', functionName: 'total', starter: 'function total(price, count) {\n  // Верните стоимость покупки\n  \n}', cases: [{ args: [120, 3], expected: 360 }, { args: [10, 0], expected: 0 }, { args: [2.5, 4], expected: 10 }], hint: 'Умножьте price на count и верните результат.' },
  },
  {
    id: 'types', title: 'Типы и преобразования', minutes: 20,
    description: 'Различаем числа, строки и логические значения. Преобразуем данные явно.',
    theory: [
      { title: 'Тип определяет поведение', text: 'Числа имеют тип number, строки — string, логические значения true и false — boolean. Оператор typeof возвращает название типа строкой. Для undefined результат — "undefined", а typeof null исторически возвращает "object".', example: 'typeof 42;       // "number"\ntypeof "42";     // "string"\ntypeof true;     // "boolean"', practice: { id: 'typeof', prompt: 'Что вернёт typeof "100"? Введите название типа без кавычек.', answer: 'string', hint: 'Значение в кавычках — строка, даже если содержит цифры.' } },
      { title: 'Явное преобразование', text: 'Number(value) превращает числовую строку в число, String(value) — значение в строку. Если один операнд + является строкой, происходит конкатенация. Чтобы складывать числа из полей ввода, сначала преобразуйте их.', example: '"2" + "3";                 // "23"\nNumber("2") + Number("3"); // 5\nNumber("hello");           // NaN', practice: { id: 'convert', prompt: 'Чему равно Number("8") + 2? Введите число.', answer: '10', hint: 'После преобразования происходит числовое сложение.' } },
    ],
    task: { title: 'Сумма из формы', prompt: 'Напишите sumInput(a, b): преобразуйте две числовые строки в числа и верните их сумму. На вход приходят корректные числовые строки.', functionName: 'sumInput', starter: 'function sumInput(a, b) {\n  \n}', cases: [{ args: ['2', '3'], expected: 5 }, { args: ['-4', '10'], expected: 6 }, { args: ['1.5', '2.5'], expected: 4 }], hint: 'Используйте Number для каждого аргумента.' },
  },
  {
    id: 'operators', title: 'Операторы и сравнения', minutes: 15,
    description: 'Вычисляем выражения и сравниваем значения без неявных преобразований.',
    theory: [
      { title: 'Арифметика', text: 'Операторы +, -, *, / выполняют обычные арифметические действия. % вычисляет остаток от деления, ** — степень. Умножение выполняется раньше сложения; скобки меняют порядок вычислений.', example: '2 + 3 * 4;   // 14\n(2 + 3) * 4; // 20\n7 % 2;       // 1', practice: { id: 'remainder', prompt: 'Чему равно 11 % 3? Введите число.', answer: '2', hint: 'После трёх полных троек от 11 остаётся 2.' } },
      { title: 'Строгое сравнение', text: '=== сравнивает значения без преобразования типов, !== проверяет неравенство. Операторы >, <, >=, <= сравнивают величины. && требует истинности обоих условий, || — хотя бы одного. Результат сравнения — boolean.', example: '5 === "5";          // false\n5 !== 3;            // true\n10 >= 5 && 10 < 20; // true', practice: { id: 'strict', prompt: 'Что вернёт 0 === false? Введите true или false.', answer: 'false', hint: 'Тип number отличается от boolean.' } },
    ],
    task: { title: 'Чётное число', prompt: 'Напишите isEven(n), которая возвращает true для чётного целого числа и false для нечётного. Учтите ноль и отрицательные числа.', functionName: 'isEven', starter: 'function isEven(n) {\n  \n}', cases: [{ args: [8], expected: true }, { args: [7], expected: false }, { args: [0], expected: true }, { args: [-4], expected: true }], hint: 'Проверьте, равен ли остаток от деления на 2 нулю.' },
  },
  {
    id: 'conditions', title: 'Условия', minutes: 20,
    description: 'Выбираем действие в зависимости от входных данных.',
    theory: [
      { title: 'Ветвление if / else', text: 'if выполняет блок, когда условие истинно. else выполняется в противоположном случае. Для нескольких вариантов добавляют else if. Блоки заключают в фигурные скобки.', example: 'const age = 19;\nif (age >= 18) {\n  console.log("Можно");\n} else {\n  console.log("Пока нельзя");\n}', practice: { id: 'boundary', prompt: 'Условие age >= 18 при age = 18 истинно? Введите true или false.', answer: 'true', hint: 'Оператор >= включает граничное значение.' } },
      { title: 'Возвращаем результат', text: 'return завершает функцию и отдаёт значение вызывающему коду. Это удобно для раннего выхода из ветки. Значение после return доступно снаружи, в отличие от сообщения console.log.', example: 'function access(age) {\n  if (age < 18) return "Нет";\n  return "Да";\n}\naccess(20); // "Да"', practice: { id: 'return', prompt: 'Что вернёт access(16) из примера? Введите текст без кавычек.', answer: 'Нет', hint: '16 меньше 18, поэтому выполнится первый return.' } },
    ],
    task: { title: 'Знак числа', prompt: 'Напишите sign(n). Верните строку "positive", если число больше нуля, "negative", если меньше, и "zero", если равно нулю. Регистр важен.', functionName: 'sign', starter: 'function sign(n) {\n  \n}', cases: [{ args: [10], expected: 'positive' }, { args: [-3], expected: 'negative' }, { args: [0], expected: 'zero' }], hint: 'Проверьте n > 0, затем n < 0. Оставшийся вариант — ноль.' },
  },
  {
    id: 'loops', title: 'Циклы', minutes: 25,
    description: 'Повторяем действия и накапливаем результат.',
    theory: [
      { title: 'Цикл for', text: 'Цикл for содержит начальное значение, условие продолжения и шаг. Условие проверяется перед каждой итерацией. Когда оно становится ложным, цикл заканчивается. i++ увеличивает счётчик на единицу.', example: 'for (let i = 0; i < 3; i++) {\n  console.log(i);\n}\n// 0, затем 1, затем 2', practice: { id: 'iterations', prompt: 'Сколько итераций выполнит for (let i = 1; i <= 4; i++)? Введите число.', answer: '4', hint: 'Счётчик принимает значения 1, 2, 3 и 4.' } },
      { title: 'Накопитель', text: 'Чтобы получить сумму, создайте переменную перед циклом и увеличивайте её на каждом шаге. Не объявляйте накопитель внутри тела: иначе значение будет сбрасываться. sum += i — сокращение для sum = sum + i.', example: 'let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}\nconsole.log(sum); // 6', practice: { id: 'sum', prompt: 'Каким станет sum, если в примере заменить i <= 3 на i <= 4?', answer: '10', hint: 'Сложите 1 + 2 + 3 + 4.' } },
    ],
    task: { title: 'Сумма от 1 до n', prompt: 'Напишите sumTo(n), возвращающую сумму целых чисел от 1 до n включительно. n — целое число от 0 до 1000. При n = 0 верните 0.', functionName: 'sumTo', starter: 'function sumTo(n) {\n  \n}', cases: [{ args: [3], expected: 6 }, { args: [0], expected: 0 }, { args: [1], expected: 1 }, { args: [100], expected: 5050 }], hint: 'Начните с суммы 0 и прибавляйте числа от 1 до n.' },
  },
  {
    id: 'functions', title: 'Функции', minutes: 20,
    description: 'Описываем переиспользуемые действия с параметрами и результатом.',
    theory: [
      { title: 'Параметры и аргументы', text: 'Параметры — имена входных значений в объявлении функции. Аргументы — конкретные значения при вызове. Переменные внутри функции имеют локальную область видимости. Функция без выполненного return возвращает undefined.', example: 'function double(value) {\n  return value * 2;\n}\nconst result = double(6); // 12', practice: { id: 'call', prompt: 'Что вернёт double(7) из примера?', answer: '14', hint: 'Аргумент 7 попадёт в параметр value.' } },
      { title: 'Значения по умолчанию', text: 'Параметр может иметь значение по умолчанию: оно применяется, когда аргумент не передан или равен undefined. Краткая стрелочная функция без фигурных скобок возвращает выражение автоматически.', example: 'function greet(name = "гость") {\n  return "Привет, " + name;\n}\nconst square = n => n * n;\nsquare(4); // 16', practice: { id: 'default', prompt: 'Какое значение вернёт greet() из примера? Введите текст без кавычек.', answer: 'Привет, гость', hint: 'При отсутствии аргумента name равен "гость".' } },
    ],
    task: { title: 'Большее из двух', prompt: 'Напишите maxOf(a, b), возвращающую большее из двух чисел. Если числа равны, верните любое из них. Результат должен быть числом.', functionName: 'maxOf', starter: 'function maxOf(a, b) {\n  \n}', cases: [{ args: [2, 9], expected: 9 }, { args: [8, 3], expected: 8 }, { args: [-8, -2], expected: -2 }, { args: [4, 4], expected: 4 }], hint: 'Сравните a и b и верните подходящее значение.' },
  },
  {
    id: 'arrays', title: 'Массивы', minutes: 25,
    description: 'Работаем с последовательностями и обрабатываем каждый элемент.',
    theory: [
      { title: 'Элементы и индексы', text: 'Массив хранит упорядоченную последовательность. Индексы начинаются с нуля. length — количество элементов, индекс последнего элемента равен length - 1. push добавляет элемент в конец и изменяет исходный массив.', example: 'const values = [10, 20, 30];\nvalues[0];     // 10\nvalues.length; // 3\nvalues.push(40);', practice: { id: 'index', prompt: 'Что вернёт [10, 20, 30][1]? Введите число.', answer: '20', hint: 'Индекс 1 указывает на второй элемент.' } },
      { title: 'Перебор значений', text: 'for...of перебирает значения массива. filter создаёт новый массив из элементов, для которых условие истинно. map создаёт массив преобразованных значений. Эти методы не меняют исходный массив сами по себе.', example: 'const numbers = [1, 2, 3, 4];\nnumbers.filter(n => n > 2); // [3, 4]\nnumbers.map(n => n * 2);    // [2, 4, 6, 8]', practice: { id: 'filter', prompt: 'Сколько элементов в [1, 2, 3, 4].filter(n => n > 2)?', answer: '2', hint: 'Условию соответствуют 3 и 4.' } },
    ],
    task: { title: 'Только положительные', prompt: 'Напишите positiveNumbers(numbers), возвращающую новый массив только с числами больше нуля. Сохраните порядок. Ноль не включайте. Пустой вход должен дать пустой массив.', functionName: 'positiveNumbers', starter: 'function positiveNumbers(numbers) {\n  \n}', cases: [{ args: [[-2, 0, 3, 1]], expected: [3, 1] }, { args: [[]], expected: [] }, { args: [[-1, -5]], expected: [] }, { args: [[2, 2]], expected: [2, 2] }], hint: 'Используйте filter с условием n > 0.' },
  },
  {
    id: 'objects', title: 'Объекты и строки', minutes: 25,
    description: 'Описываем сущности через свойства и обрабатываем текст.',
    theory: [
      { title: 'Свойства объекта', text: 'Объект объединяет значения под именованными ключами. К свойству обращаются через точку или квадратные скобки. const не запрещает менять свойства объекта. Отсутствующее свойство возвращает undefined.', example: 'const user = { name: "Анна", age: 20 };\nuser.name;    // "Анна"\nuser["age"]; // 20\nuser.age = 21;', practice: { id: 'property', prompt: 'Что вернёт ({ name: "Анна", age: 20 }).age?', answer: '20', hint: 'Возьмите значение свойства age.' } },
      { title: 'Методы строк', text: 'trim убирает пробелы с краёв, toLowerCase приводит текст к нижнему регистру. Методы строк возвращают новые строки. Исходная строка не изменяется. length возвращает длину; шаблонные строки в обратных кавычках позволяют подставлять выражения через ${...}.', example: 'const name = "  ANNA  ";\nname.trim().toLowerCase(); // "anna"\nconst age = 20;\n`Возраст: ${age}`; // "Возраст: 20"', practice: { id: 'trim', prompt: 'Что вернёт "  JS  ".trim().toLowerCase()? Введите текст без кавычек.', answer: 'js', hint: 'Удалите внешние пробелы и приведите буквы к нижнему регистру.' } },
    ],
    task: { title: 'Имя пользователя', prompt: 'Напишите userLabel(user). У объекта есть строковое поле name и числовое age. Удалите пробелы с краёв имени и верните строку вида "Анна, 20". После запятой — один пробел.', functionName: 'userLabel', starter: 'function userLabel(user) {\n  \n}', cases: [{ args: [{ name: ' Анна ', age: 20 }], expected: 'Анна, 20' }, { args: [{ name: 'Иван', age: 0 }], expected: 'Иван, 0' }, { args: [{ name: '  Ли', age: 31 }], expected: 'Ли, 31' }], hint: 'Используйте user.name.trim() и подставьте возраст через шаблонную строку.' },
  },
  {
    id: 'final', title: 'Итоговая задача', minutes: 30,
    description: 'Собираем всё вместе: данные, условия, массивы и функции.',
    theory: [
      { title: 'Разбиваем задачу на шаги', text: 'Сначала определите вход и ожидаемый выход. Затем выпишите правила обработки. В задаче с массивом объектов можно отобрать нужные объекты через filter, а затем извлечь одно поле через map. Порядок элементов сохранится.', example: 'const users = [{ name: "Анна", active: true },\n               { name: "Иван", active: false }];\nusers.filter(u => u.active).map(u => u.name);\n// ["Анна"]', practice: { id: 'pipeline', prompt: 'Какой метод создаёт массив только из элементов, соответствующих условию? Введите имя метода.', answer: 'filter', hint: 'Он используется перед map в примере.' } },
      { title: 'Проверяем границы', text: 'Решение должно работать не только на одном примере. Проверяйте пустые коллекции, ноль и граничные значения условий. Для требования «не менее 60» подходит >= 60. Возвращаемое значение должно иметь правильный тип.', example: 'const passed = score => score >= 60;\npassed(59); // false\npassed(60); // true\n[].filter(passed); // []', practice: { id: 'edge', prompt: 'Пройдёт ли студент с 60 баллами условие score >= 60? Введите true или false.', answer: 'true', hint: 'Граница включена оператором >=.' } },
    ],
    task: { title: 'Список сдавших', prompt: 'Напишите passedStudents(students). На входе массив объектов с полями name (строка) и score (число). Верните массив имён студентов с score >= 60 в исходном порядке. Пустой массив должен вернуть [].', functionName: 'passedStudents', starter: 'function passedStudents(students) {\n  \n}', cases: [{ args: [[{ name: 'Анна', score: 85 }, { name: 'Иван', score: 42 }, { name: 'Ли', score: 60 }]], expected: ['Анна', 'Ли'] }, { args: [[]], expected: [] }, { args: [[{ name: 'Марк', score: 59 }]], expected: [] }, { args: [[{ name: 'Оля', score: 100 }, { name: 'Ян', score: 60 }]], expected: ['Оля', 'Ян'] }], hint: 'Сначала filter по score >= 60, затем map по name.' },
  },
]

const practiceCode: [string, string, unknown][] = [
 ['Объявите const title со значением "JavaScript" и верните title.', '// Объявите title\n  return title;', 'JavaScript'],
 ['Увеличьте score на 3 и верните его.', 'let score = 4;\n  // Измените score\n  return score;', 7],
 ['Верните тип строки "100" через typeof.', 'return;', 'string'],
 ['Преобразуйте "8" в число и прибавьте 2.', 'const value = "8";\n  return;', 10],
 ['Верните остаток от деления 11 на 3.', 'return;', 2],
 ['Верните результат строгого сравнения 0 и false.', 'return;', false],
 ['Верните результат проверки age >= 18.', 'const age = 18;\n  return;', true],
 ['Если age меньше 18, верните "Нет", иначе "Да".', 'const age = 16;\n  // Добавьте условие', 'Нет'],
 ['Посчитайте циклом количество чисел от 1 до 4 включительно.', 'let count = 0;\n  // Добавьте цикл\n  return count;', 4],
 ['Найдите циклом сумму от 1 до 4 включительно.', 'let sum = 0;\n  // Добавьте цикл\n  return sum;', 10],
 ['Создайте функцию double(value), удваивающую число. Верните double(7).', '// Объявите double\n  return double(7);', 14],
 ['Объявите greet(name = "гость"), возвращающую "Привет, " + name. Верните greet().', '// Объявите greet\n  return greet();', 'Привет, гость'],
 ['Верните второй элемент массива values.', 'const values = [10, 20, 30];\n  return;', 20],
 ['Отберите числа больше 2 и верните их количество.', 'const values = [1, 2, 3, 4];\n  return;', 2],
 ['Верните свойство age объекта user.', 'const user = { name: "Анна", age: 20 };\n  return;', 20],
 ['Удалите пробелы с краёв text и приведите к нижнему регистру.', 'const text = "  JS  ";\n  return;', 'js'],
 ['Отберите активных пользователей и верните массив имён.', 'const users = [{ name: "Анна", active: true }, { name: "Иван", active: false }];\n  return;', ['Анна']],
 ['Верните результат проверки score не меньше 60.', 'const score = 60;\n  return;', true],
]
let practiceIndex = 0
for (const lesson of lessons) {
 lesson.task.example = taskExamples[lesson.id]
 for (const section of lesson.theory) {
  const [prompt, body, expected] = practiceCode[practiceIndex++]!
  section.practice = { ...section.practice, prompt, starter: `function solution() {\n  ${body}\n}`, expected, hint: 'Используйте пример выше. Верните результат из solution через return.' }
 }
}
