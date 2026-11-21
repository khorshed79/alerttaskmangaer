# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}` and its subcollections (`tasks`, `categories`, `projects`, `notificationPreferences`, `notifications`) is readable and writable exclusively by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **Identity Integrity**: `ownerId` (or `uid` on `/users/{userId}`) in any created document MUST equal `request.auth.uid`, and MUST remain immutable across all updates.
3. **Path Variable Hardening**: Every document ID (`userId`, `taskId`, `categoryId`, `projectId`, `prefId`, `notificationId`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
4. **Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must strictly equal `request.time` (server timestamps only). `createdAt` is immutable on update.
5. **Bounded Arrays & Payloads**: `subtasks` <= 25 items, `tags` <= 10 strings, `attachments` <= 10 items, `title` <= 140 chars, `description` <= 2000 chars.
6. **Zero Shadow Fields**: `data.keys().hasAll(...)` and `data.keys().hasOnly(...)` on create, plus `incoming().diff(existing()).affectedKeys().hasOnly(...)` on every action-based update branch.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-User Task Read/Write**: Authenticated User B attempts `get` or `create` on `/users/userA/tasks/task1`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a task at `/users/{uid}/tasks/task1`.
3. **Owner Spoofing on Create**: User A creates `/users/userA/tasks/task1` with `ownerId: "userB"`.
4. **Owner Mutation on Update**: User A updates `/users/userA/tasks/task1` attempting to reassign `ownerId: "userB"`.
5. **Shadow Field Injection ("Ghost Field")**: User A creates or updates a task including an undeclared field `isAdmin: true` or `shadowBypass: 1`.
6. **Client-Forged Timestamp**: User A creates a task with `createdAt: Timestamp(2020-01-01)` instead of `serverTimestamp()` (`request.time`).
7. **Immutable `createdAt` Tampering**: User A updates an existing task and modifies `createdAt`.
8. **ID Poisoning / Denial of Wallet**: User A attempts to write to `/users/userA/tasks/invalid$id..2000chars` or inject a 50KB `title`.
9. **Unbounded Array Exhaustion**: User A submits a task with 50 `tags` (limit is 10) or 100 `subtasks` (limit is 25).
10. **Invalid Enum Injection**: User A creates a task with `priority: "critical_override"` or `status: "hacked"`.
11. **Blanket Collection List**: User B runs a `list` query against `/users/userA/tasks`.
12. **Profile Role Escalation**: User A creates `/users/userA` attempting to inject `role: "admin"` or `isAdmin: true`.
