# TaskFlow — Daily Task Tracker

A full-featured Daily Task Management application built with TypeScript, React, Tailwind CSS, and Firebase (Authentication, Cloud Firestore with offline persistence, Security Rules, Composite Indexes, and Cloud Functions).

## Implemented Features
- **Authentication & Onboarding**: Splash screen, 2-step onboarding, Google Sign-In (`signInWithPopup`), Email/Password Sign-Up & Login, Forgot Password, Email Verification, and Profile Setup.
- **Main Dashboard**: Real-time Firestore-backed greeting header, unread notification indicator, Today's Progress card with completion percentage ring and weekly mini bar chart, Quick Actions, active Projects progress, and Today's Tasks list.
- **Task Management (CRUD)**: Create, edit, delete (with confirmation), duplicate, archive/restore, subtasks checklist, tags, file/image attachments, live focus timer, recurring tasks (`none`, `daily`, `weekly`, `monthly`), search, filter, and sort.
- **Calendar**: Monthly grid, Weekly strip, and Daily Agenda views with category indicators, upcoming/overdue sections, and date-targeted task creation.
- **Insights & Analytics**: Date range filters (`This Week`, `This Month`, `Last 30 Days`, `Custom`), completion KPIs, daily/weekly bar chart, category donut chart, and productivity trend chart.
- **Categories & Projects**: 7 default categories plus custom category/project creation, colors, icons, safe deletion guards, and project completion tracking.
- **Notifications & Reminders**: Browser notification permission, quiet hours, reminder preferences persisted to Firestore, and notification history.
- **Localization & Themes**: Full English and Bangla (`বাংলা`) translation with localized numerals and dates, plus Light & Dark themes.

## Firebase Configuration & Deliverables
- `firebase-applet-config.json`: Provisioned web Firebase configuration.
- `firebase-blueprint.json`: Firestore data schema Intermediate Representation.
- `firestore.rules` & `firebase/firestore.rules`: Hardened security rules enforcing verified user ownership, immutable `ownerId`/`createdAt`, server timestamps, bounded arrays, and action-based updates.
- `firebase/firestore.indexes.json`: Composite indexes for `tasks` and `notifications` queries.
- `firebase/storage.rules`: File size and MIME-type restricted Storage rules.
- `firebase/functions/`: Cloud Functions for scheduled reminder dispatch and server-side recurring task generation.

## Local Development & Verification
- Type check: `npm run lint`
- Production build: `npm run build`
- Unit tests: `node --test src/utils/analytics.test.ts`
- Security rules lint: `npx eslint firestore.rules`
