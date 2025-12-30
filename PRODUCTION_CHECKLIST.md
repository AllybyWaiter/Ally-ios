# Production Deployment Checklist

This checklist ensures Ally is ready for production deployment. Complete all items before releasing to users.

## Pre-Deployment Verification

### Security

- [x] **RLS Policies**: All tables have Row Level Security enabled with appropriate policies
- [x] **Authentication**: Email/password auth with auto-confirm enabled
- [x] **Admin Access**: Super admin and admin roles properly configured
- [x] **Secrets Management**: All API keys stored in Lovable Cloud secrets
- [x] **Input Validation**: Zod schemas validate all edge function inputs
- [x] **Rate Limiting**: Server-side rate limits on all edge functions
- [x] **Error Handling**: No sensitive data exposed in error messages

### Database

- [x] **Schema Migrations**: All migrations applied successfully
- [x] **RLS Enabled**: All public tables have RLS enabled
- [x] **User Isolation**: User data properly scoped by `user_id`
- [x] **Admin Views**: `profiles_admin_view` used for admin profile access (email masking)
- [x] **Indexes**: Key query columns indexed for performance

### Edge Functions

| Function | Rate Limited | Validated | Auth Required |
|----------|-------------|-----------|---------------|
| ally-chat | ✅ | ✅ | ✅ |
| analyze-water-test-photo | ✅ | ✅ | ✅ |
| analyze-water-trends | ✅ | ✅ | ✅ |
| analyze-water-trends-ai | ✅ | ✅ | ✅ |
| blog-ai-assistant | ✅ | ✅ | ✅ (Admin) |
| elevenlabs-tts | ✅ | ✅ | ✅ |
| get-weather | ✅ | ✅ | ✅ |
| send-announcement | ✅ | ✅ | ✅ (Admin) |
| send-bulk-email | ✅ | ✅ | ✅ (Admin) |
| send-push-notification | ✅ | ✅ | ✅ |
| submit-contact | ✅ | ✅ | ❌ (Public) |
| suggest-maintenance-tasks | ✅ | ✅ | ✅ |
| transcribe-audio | ✅ | ✅ | ✅ |

### Frontend

- [x] **Build Passes**: `npm run build` completes without errors
- [x] **Tests Pass**: `npm run test:run` passes all tests
- [x] **TypeScript**: No TypeScript errors
- [x] **Error Boundaries**: All major features wrapped in error boundaries
- [x] **SEO**: Meta tags, Open Graph, and JSON-LD configured
- [x] **PWA**: Service worker and manifest configured
- [x] **Accessibility**: Color contrast and ARIA labels verified

### Content

- [x] **Testimonials**: Real/realistic testimonials (no placeholders)
- [x] **Case Studies**: Complete case study content
- [x] **Legal Pages**: Privacy Policy, Terms of Service, Cookie Policy
- [x] **Help Content**: FAQ, Help Center populated

## Environment Configuration

### Required Secrets

Verify all secrets are configured in Lovable Cloud:

| Secret | Purpose | Status |
|--------|---------|--------|
| RESEND_API_KEY | Email sending | ✅ |
| VAPID_PUBLIC_KEY | Push notifications | ✅ |
| VAPID_PRIVATE_KEY | Push notifications | ✅ |
| VAPID_SUBJECT | Push notifications | ✅ |
| ELEVENLABS_API_KEY | Text-to-speech | ✅ |
| OPENAI_API_KEY | Audio transcription | ✅ |
| VITE_SENTRY_DSN | Error tracking | ✅ |

### Optional Configuration

- [ ] **Leaked Password Protection**: Enable in Lovable Cloud auth settings (Settings → Cloud → Authentication → Password Protection)
  - This prevents users from using passwords that have been exposed in data breaches
  - Recommended for production deployments
- [ ] **Custom Domain**: Configure in Lovable Cloud settings
- [ ] **Email Templates**: Customize auth emails in Lovable Cloud

## Post-Deployment Verification

### Smoke Tests

After deployment, verify:

1. [ ] Homepage loads correctly
2. [ ] User can sign up and log in
3. [ ] Dashboard displays for authenticated users
4. [ ] Water test can be created
5. [ ] Ally Chat responds to messages
6. [ ] Push notifications can be enabled
7. [ ] Admin panel accessible to admins

### Analytics & Conversion Tracking

| Tracking | Status | Notes |
|----------|--------|-------|
| Google Analytics 4 | ⚠️ Pending | Replace `G-XXXXXXXXXX` in index.html |
| Meta Pixel | ⚠️ Pending | Replace `YOUR_PIXEL_ID` in index.html |
| Signup Event | ✅ | Fires on successful registration |
| Checkout Initiated | ✅ | Fires when user clicks Subscribe |
| Purchase Complete | ✅ | Fires on successful subscription |

### Monitoring

- [ ] **Sentry**: Verify errors are being captured
- [ ] **Google Analytics**: Confirm page views and conversion events
- [ ] **Meta Pixel**: Verify events in Facebook Events Manager
- [ ] **Edge Function Logs**: Check for errors in Lovable Cloud

## Rollback Plan

If critical issues are found:

1. **Frontend**: Restore previous version via Lovable History
2. **Database**: Migrations are additive; contact support for rollback
3. **Edge Functions**: Redeploy previous version via git history

## Security Contacts

- **Security Issues**: security@allyapp.com
- **Bug Reports**: bugs@allyapp.com
- **General Support**: support@allyapp.com

---

**Last Updated**: December 24, 2025
**Prepared By**: Development Team
**Approved By**: [Pending]
