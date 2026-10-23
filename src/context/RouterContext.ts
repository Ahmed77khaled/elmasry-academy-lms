import { createContext } from 'react';

export type Page =
  | 'dashboard'
  | 'students'
  | 'student-details'
  | 'courses'
  | 'course-details'
  | 'enrollments'
  | 'payments'
  | 'expenses'
  | 'cashboxes'
  | 'settings';

export interface RouteState {
  page: Page;
  params: Record<string, string>;
}

export interface RouterContextType {
  route: RouteState;
  navigate: (page: Page, params?: Record<string, string>) => void;
}

export const RouterContext = createContext<RouterContextType | null>(null);
