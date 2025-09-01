# Firestore Schema (proposed)

This file documents the minimal Firestore schema the app will use.

Collections

- users/{uid}
  - email: string
  - role: 'admin' | 'couple' | 'guest'
  - coupleId?: string  // optional pointer to couples/{id}
  - stripeCustomerId?: string
  - subscriptionId?: string
  - subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'inactive'

- couples/{coupleId}
  - ownerUid: string
  - displayName: string
  - names: { partnerA, partnerB }
  - date: timestamp
  - siteData: { about, schedule, maps, registryLinks }
  - gallery: [ { storagePath, caption } ]
  - createdAt

- couples/{coupleId}/invitations/{inviteId}
  - email: string
  - code: string
  - created: timestamp

- couples/{coupleId}/rsvps/{rsvpId}
  - inviteCode: string
  - guestName
  - email
  - attending: boolean
  - mealChoice
  - note
  - createdAt

Notes
- Invitations connect guest emails to a generated code. RSVP submission must include a valid code and matching email.
- Stripe webhooks will update `users/{uid}.subscriptionStatus` via server-side Firebase Admin SDK.
