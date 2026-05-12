# RepoPilot Auth TODO

## Current State

Authentication backend is partially integrated with Clerk.

Working:
- ClerkProvider setup
- Middleware protection
- auth() checks in API routes
- user-scoped ownership checks
- protected API endpoints

Current issue:
- Clerk frontend JS (`clerk.browser.js`) is blocked/fails to load
- Sign-in UI cannot render reliably
- Happens locally and on production testing

Temporary fallback:
- `/sign-in` currently uses a safe fallback page
- Prevents black-screen production failures

## Routes Currently Protected

- /api/analyze
- /api/chat
- /api/history

## Important Safety Notes

Do not remove:
- auth() ownership checks
- middleware route protection
- userId validation on analysis access

## Future Investigation

Potential causes:
- Clerk JS CDN blocking
- Browser/network privacy blocking
- Clerk frontend API/domain configuration
- Publishable key mismatch
- Clerk version/runtime incompatibility

## Future Options

Option A:
- Properly fix Clerk frontend integration

Option B:
- Replace Clerk with Auth.js / NextAuth

## Before Re-enabling Clerk UI

Verify:
- sign-in works on production
- clerk.browser.js loads normally
- no black-screen auth pages
- ownership protection still works