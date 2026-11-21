import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDashboardMetrics,
  calculateInsightsMetrics,
  computeNextDueDate,
  isTaskOverdue,
} from './analytics.ts';
import { formatDigits } from './formatters.ts';
import { Category, Task } from '../types/index.ts';

const baseDate = new Date('2026-11-20T12:00:00Z');

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    ownerId: 'u1',
    title: 'Sample Task',
    description: '',
    categoryId: 'work',
    projectId: null,
    priority: 'medium',
    status: 'pending',
    startAt: null,
    dueAt: baseDate,
    reminderAt: null,
    estimatedMinutes: 30,
    actualMinutes: 0,
    timerStartedAt: null,
    subtasks: [],
    tags: [],
    attachments: [],
    repeatRule: 'none',
    recurrenceSeriesId: null,
    isArchived: false,
    completedAt: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}

const sampleCategories: Category[] = [
  {
    id: 'work',
    ownerId: 'u1',
    name: 'Work',
    color: '#6548F5',
    icon: 'Briefcase',
    isDefault: true,
    createdAt: baseDate,
    updatedAt: baseDate,
  },
];

test('calculateDashboardMetrics excludes cancelled and archived tasks', () => {
  const tasks: Task[] = [
    makeTask({ id: 't1', status: 'completed', completedAt: baseDate }),
    makeTask({ id: 't2', status: 'pending' }),
    makeTask({ id: 't3', status: 'cancelled' }),
    makeTask({ id: 't4', status: 'completed', isArchived: true, completedAt: baseDate }),
  ];

  const metrics = calculateDashboardMetrics(tasks, 'en', baseDate);
  assert.equal(metrics.todayTotal, 2);
  assert.equal(metrics.todayCompleted, 1);
  assert.equal(metrics.todayPending, 1);
  assert.equal(metrics.todayPercentage, 50);
});

test('isTaskOverdue accurately flags overdue active tasks only', () => {
  const past = new Date('2026-11-19T12:00:00Z');
  assert.equal(isTaskOverdue(makeTask({ dueAt: past, status: 'pending' }), baseDate), true);
  assert.equal(isTaskOverdue(makeTask({ dueAt: past, status: 'completed' }), baseDate), false);
  assert.equal(isTaskOverdue(makeTask({ dueAt: past, status: 'cancelled' }), baseDate), false);
  assert.equal(isTaskOverdue(makeTask({ dueAt: past, isArchived: true }), baseDate), false);
});

test('computeNextDueDate advances daily, weekly, and monthly rules correctly', () => {
  const d = new Date(2026, 10, 20, 9, 0, 0);
  assert.equal(computeNextDueDate(d, 'daily').getDate(), 21);
  assert.equal(computeNextDueDate(d, 'weekly').getDate(), 27);
  assert.equal(computeNextDueDate(d, 'monthly').getMonth(), 11);
});

test('calculateInsightsMetrics computes completion rate and category breakdown', () => {
  const tasks: Task[] = [
    makeTask({ id: 't1', status: 'completed', actualMinutes: 40, completedAt: baseDate }),
    makeTask({ id: 't2', status: 'in_progress' }),
    makeTask({ id: 't3', status: 'cancelled' }),
  ];

  const insights = calculateInsightsMetrics(tasks, sampleCategories, 'week', 'en', undefined, undefined, baseDate);
  assert.equal(insights.completionRate, 50);
  assert.equal(insights.averageCompletionMinutes, 40);
  assert.equal(insights.categoryBreakdown[0]?.count, 2);
});

test('formatDigits converts numerals for Bangla locale', () => {
  assert.equal(formatDigits(42, 'bn'), '৪২');
  assert.equal(formatDigits(42, 'en'), '42');
});
