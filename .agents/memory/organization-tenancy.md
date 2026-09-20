---
name: Organization tenancy
description: Why organization membership, roles, and active workspace selection are owned by the application database.
---

Use Clerk only for user authentication. Keep organizations, memberships, roles, invitations, and active-workspace selection in the application database, and derive tenant scope on the server.

**Why:** Replit-managed Clerk does not provide organization tenants. Server-owned tenant context also prevents browser-supplied organization IDs from bypassing isolation.

**How to apply:** Every organization-owned query and mutation must obtain its organization from the authenticated server-side workspace context. Never accept ownership or organization identifiers from the browser as authority.