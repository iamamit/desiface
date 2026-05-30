# Desiface MVP Plan

**Project:** Desiface — a Facebook-like social network for Indians living in Germany (South Asian diaspora).

## Vision

Build a modern, community-first social network with familiar social features, localized for desi users in Germany.

- Indian community, culture, events, groups, and support network
- Simple mobile-first social feed
- Strong privacy and GDPR-friendly compliance
- Fast MVP launch with clear phases

---

## Phase 1 — Launch MVP ✅ Complete

### Core social experience
- ✅ User registration / login
- ✅ Profile page with photo, bio, location, interests
- ✅ News feed with posts from friends / connections
- ✅ Create post: text, image, link
- ✅ Like / reaction support (5 reaction types)
- ✅ Comment on posts
- ✅ Comment replies (nested)
- ✅ Share / repost posts
- ✅ Edit / delete own posts
- ✅ Save / bookmark posts
- ✅ Friend requests / connections
- ✅ Withdraw sent connection request (connections page + profile page)
- ✅ Notifications for likes, comments, friend requests, connection accepted
- ✅ Search users and posts
- ✅ Mentions (@username) in posts and comments

### Authentication & account
- ✅ OTP email sign-in (replaced password auth — 6-digit code via Resend)
- ✅ Auto account creation on first OTP
- ✅ Email verification
- ✅ Account settings page
- ✅ Privacy controls (profile visibility, who can send friend requests)
- ✅ Password reset (via OTP flow)
- [ ] Google OAuth — UI button exists ("coming soon"), needs backend wiring

### Messaging & interactions
- ✅ One-to-one direct messages (real-time WebSocket)
- ✅ Unread message count badge
- ✅ Notification badge for new messages
- ✅ Clickable conversation header → profile navigation

### Admin & moderation
- ✅ Admin dashboard: KPIs, error log, user role management, feedback inbox
- ✅ User feedback system: floating button, modal (feedback / bug + screenshot), stored in DB, admin-viewable with resolve/reopen

---

## Phase 2 — Engagement ✅ Mostly complete

### Profile enhancements
- ✅ Cover photo upload
- ✅ Avatar upload
- ✅ Headline, location
- ✅ Work experience (add / edit / delete entries)
- ✅ Education (add / edit / delete entries)
- ✅ Skills
- ✅ Services (visible on profile, tagged on community page)
- ✅ "People you may know" suggestions (sidebar)

### Community & content
- ✅ Community hub (`/community`): Services tab + Programs tab
- ✅ Groups (`/groups`) — create, join, post within groups
- ✅ Post tags / categories — coloured badge, tag picker in composer, tag filter on feed
- ✅ Jobs board (`/jobs`) — post and browse job listings
- ✅ Dark mode + light/dark toggle
- ✅ Email notifications: connection request, connection accepted, new message

### Discovery
- ✅ Search by users and posts
- ✅ Discover community events and services

### Better experience
- ✅ Mobile-responsive design
- ✅ Dark mode
- ✅ Improved notifications centre
- ✅ Profile edit with 4-tab modal (cover + avatar upload)
- [ ] Language switcher (English only for now)
- [ ] Onboarding flow — welcome wizard for new users with no connections/posts

---

## Phase 3 — Growth & retention (Remaining)

### Community growth
- [ ] Marketplace / local classifieds
- ✅ Job board for desi jobs in Germany
- ✅ Local vendor directory / services (community page)
- [ ] Verified community leaders / pages
- [ ] Events RSVP and reminders

### Advanced social features
- ✅ Reactions beyond Like (5 types)
- ✅ Post sharing with text
- [ ] Multimedia posts (video, audio)
- ✅ Live chat / WebSocket real-time chat
- [ ] Groups moderation tools

### Safety & trust
- [ ] Block / report user
- [ ] Content moderation workflow
- [ ] Secure account deletion
- [ ] Rate limiting for auth endpoints

---

## Phase 4 — Monetization & scale (Future)

- [ ] Ads / promotion slots
- [ ] Event ticketing
- [ ] Paid community features
- [ ] Premium member badges
- [ ] Analytics dashboard for growth

---

## Non-functional (do last)
- [ ] Feed ranking — interest/engagement-based ranking instead of chronological
- [ ] SEO — meta tags, Open Graph, sitemap improvements
- [ ] Performance — image optimisation, pagination improvements, lazy loading
- [ ] Push notifications — browser push or mobile PWA
- [ ] Fix `.env.production.example` — add `/api` suffix to `NEXT_PUBLIC_API_URL`
- [ ] German + English UI support (i18n)
- [ ] GDPR / data privacy notice page
