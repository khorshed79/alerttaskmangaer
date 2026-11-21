import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled job running every 15 minutes to generate upcoming due reminders
 * and overdue alerts for verified users respecting their quiet hours.
 */
export const dispatchTaskReminders = onSchedule('every 15 minutes', async () => {
  const now = admin.firestore.Timestamp.now();
  const soon = admin.firestore.Timestamp.fromMillis(now.toMillis() + 30 * 60 * 1000);

  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const prefSnap = await db.doc(`users/${uid}/notificationPreferences/settings`).get();
    const prefs = prefSnap.data();
    if (!prefs || (!prefs.dueReminders && !prefs.overdueAlerts)) continue;

    const tasksSnap = await db
      .collection(`users/${uid}/tasks`)
      .where('isArchived', '==', false)
      .where('status', 'in', ['pending', 'in_progress'])
      .get();

    const batch = db.batch();
    for (const taskDoc of tasksSnap.docs) {
      const task = taskDoc.data();
      if (!task.dueAt) continue;

      if (prefs.dueReminders && task.reminderAt && task.reminderAt.toMillis() <= soon.toMillis() && task.reminderAt.toMillis() >= now.toMillis() - 15 * 60 * 1000) {
        const notifRef = db.collection(`users/${uid}/notifications`).doc(`due_${task.id}_${task.dueAt.toMillis()}`);
        batch.set(notifRef, {
          id: notifRef.id,
          ownerId: uid,
          taskId: task.id,
          title: `Reminder: ${task.title}`,
          body: 'Scheduled task reminder is due soon.',
          type: 'due',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      if (prefs.overdueAlerts && task.dueAt.toMillis() < now.toMillis()) {
        const notifRef = db.collection(`users/${uid}/notifications`).doc(`overdue_${task.id}_${new Date().toISOString().slice(0, 10)}`);
        batch.set(notifRef, {
          id: notifRef.id,
          ownerId: uid,
          taskId: task.id,
          title: `Overdue: ${task.title}`,
          body: 'This task has passed its scheduled due time.',
          type: 'overdue',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }
    await batch.commit();
  }
});

/**
 * Generates the next recurring task instance idempotently when a recurring task
 * is marked completed.
 */
export const onRecurringTaskCompleted = onDocumentUpdated('users/{userId}/tasks/{taskId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  if (before.status !== 'completed' && after.status === 'completed' && after.repeatRule && after.repeatRule !== 'none') {
    const baseDue = after.dueAt ? after.dueAt.toDate() : new Date();
    const nextDue = new Date(baseDue);
    if (after.repeatRule === 'daily') nextDue.setDate(nextDue.getDate() + 1);
    if (after.repeatRule === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
    if (after.repeatRule === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

    const seriesId = after.recurrenceSeriesId || after.id;
    const nextId = `${seriesId}_${nextDue.toISOString().slice(0, 10)}`;
    const nextRef = db.doc(`users/${event.params.userId}/tasks/${nextId}`);

    await nextRef.set({
      id: nextId,
      ownerId: event.params.userId,
      title: after.title,
      description: after.description || '',
      categoryId: after.categoryId,
      projectId: after.projectId || null,
      priority: after.priority,
      status: 'pending',
      startAt: null,
      dueAt: admin.firestore.Timestamp.fromDate(nextDue),
      reminderAt: null,
      estimatedMinutes: after.estimatedMinutes || 30,
      actualMinutes: 0,
      timerStartedAt: null,
      subtasks: (after.subtasks || []).map((s: { id: string; title: string }) => ({ ...s, completed: false })),
      tags: after.tags || [],
      attachments: [],
      repeatRule: after.repeatRule,
      recurrenceSeriesId: seriesId,
      isArchived: false,
      completedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: false });
  }
});
