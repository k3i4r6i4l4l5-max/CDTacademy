export type Role = 'student' | 'teacher' | 'admin'
export interface PublicUser { id: string; login: string; role: Role; groupId: string | null; avatarUrl?: string }
export interface StudentGroup { id: string; name: string }
export type QuestionType = 'text' | 'choice' | 'free' | 'code' | 'code_reference'
export interface NoteDefinition { id: string; title: string; body: string; published: boolean; updatedAt: string }
export interface Question { id: string; prompt: string; type: QuestionType; options: string[]; expected: string; points: number }
export interface TestDefinition { id: string; title: string; notes: string; noteId?: string | null; version?: string; passPercent: number; published: boolean; questions: Question[]; updatedAt: string }
export interface SubmittedAnswer { question: Question; value: string; points: number | null; comment: string }
export interface Submission { id: string; testId: string; testTitle: string; studentId: string; studentLogin: string; submittedAt: string; passPercent: number; answers: SubmittedAnswer[] }
