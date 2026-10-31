import type { CheckCase } from '../../shared/types/course'

export interface TestResult { passed: boolean; label: string }

// Проверка самостоятельного курса: код выполняется вне потока UI, зависший worker завершается по тайм-ауту.
export function checkCode(code: string, functionName: string, cases: CheckCase[]): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const source = `
      const equal = (a, b) => {
        if (Object.is(a, b)) return true;
        if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
        if (a && b && typeof a === 'object' && typeof b === 'object') {
          const keys = Object.keys(a);
          return keys.length === Object.keys(b).length && keys.every(k => Object.hasOwn(b, k) && equal(a[k], b[k]));
        }
        return false;
      };
      self.onmessage = async ({ data }) => {
        try {
          const fn = new Function('"use strict";\\n' + data.code + '\\nreturn typeof ' + data.functionName + ' === "function" ? ' + data.functionName + ' : null;')();
          if (!fn) throw new Error('Объявите функцию ' + data.functionName + '.');
          const results = [];
          for (const [i, test] of data.cases.entries()) {
            try {
              const actual = await fn(...structuredClone(test.args));
              const passed = equal(actual, test.expected);
              results.push({ passed, label: 'Тест ' + (i + 1) + ': ' + (passed ? 'пройден' : 'ожидалось ' + JSON.stringify(test.expected) + ', получено ' + String(JSON.stringify(actual))) });
            } catch (error) { results.push({ passed: false, label: 'Тест ' + (i + 1) + ': ' + error.message }); }
          }
          self.postMessage(results);
        } catch (error) { self.postMessage([{ passed: false, label: error.name + ': ' + error.message }]); }
      };
    `
    let worker: Worker | undefined
    let url: string | undefined
    let timer: ReturnType<typeof setTimeout>
    const finish = (results: TestResult[]) => {
      // Освобождаем worker и временный URL при любом исходе проверки.
      clearTimeout(timer)
      worker?.terminate()
      if (url) URL.revokeObjectURL(url)
      resolve(results)
    }
    try {
      url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }))
      worker = new Worker(url)
      timer = setTimeout(() => finish([{ passed: false, label: 'Превышено время выполнения (2 секунды). Проверьте условие выхода из цикла.' }]), 2000)
      worker.onmessage = event => finish(event.data as TestResult[])
      worker.onerror = () => finish([{ passed: false, label: 'Не удалось выполнить код. Проверьте синтаксис.' }])
      worker.postMessage({ code, functionName, cases })
    } catch {
      finish([{ passed: false, label: 'Браузер не разрешил запуск проверки кода.' }])
    }
  })
}
