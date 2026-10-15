# Security Specification: Frosty Trails Snow Plow

## 1. Data Invariants
1. `users/{userId}` documents are strictly private to the authenticated owner (`request.auth.uid == userId`). No user may read or modify another user's profile.
2. `leaderboard/{entryId}` records can be read publicly by all users to view high scores, but can only be created by an authenticated user where `incoming().userId == request.auth.uid`.
3. Leaderboard entries are immutable once submitted: updates and deletions are strictly denied.
4. Timestamps (`createdAt`, `updatedAt`) must strictly match `request.time`.
5. Key sets and field types are strictly guarded; unknown properties are rejected via `hasAll` and `hasOnly`.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. Unauthenticated write to `users/{userId}`.
2. Authenticated user attempting to create or overwrite someone else's `users/{targetId}`.
3. Updating `users/{userId}` without updating `updatedAt == request.time` or tampering with `createdAt`.
4. Injecting ghost properties (`isAdmin`, `role`) into `users/{userId}`.
5. Setting negative coins or invalid non-number values in `coins` or `highScore`.
6. Submitting a leaderboard entry with someone else's `userId`.
7. Submitting a leaderboard entry with a spoofed client timestamp (`createdAt != request.time`).
8. Attempting to update or delete an existing leaderboard entry.
9. Blank listing of all user profiles in `/users`.
10. Overflowing `displayName` string lengths (> 64 characters).
11. Setting oversized ID strings into `{entryId}` (> 128 chars or non-alphanumeric).
12. Attempting to update `users/{userId}` with non-allowed key modifications.
