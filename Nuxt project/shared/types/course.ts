export interface CheckCase { args: unknown[]; expected: unknown }
export interface Exercise { id: string; prompt: string; answer: string; hint: string; starter?: string; expected?: unknown }
export interface Theory { title: string; text: string; example: string; practice: Exercise }
export interface Lesson {
  id: string; title: string; description: string; minutes: number;
  theory: Theory[];
  task: { title: string; prompt: string; functionName: string; starter: string; cases: CheckCase[]; hint: string; example?: { title: string; description: string; code: string; steps: string[]; transfer: string } }
}
export interface Answer { value: string; passed: boolean; feedback: string }
