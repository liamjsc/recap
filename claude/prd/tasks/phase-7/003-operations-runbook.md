# Task: Create Operations Runbook

## Task ID
`phase-7/003-operations-runbook`

## Description
Document all operational procedures, troubleshooting guides, and common tasks for maintaining the NBA Highlights application.

## Prerequisites
- `phase-7/002-health-monitoring` completed

## Expected Outcomes
1. Comprehensive operations documentation
2. Troubleshooting guides for common issues
3. Procedures for routine maintenance
4. Emergency response procedures

## Deliverables

### Operations Runbook Document

```markdown
# NBA Highlights - Operations Runbook

## Table of Contents
1. [Service Overview](#service-overview)
2. [Access & Credentials](#access--credentials)
3. [Routine Operations](#routine-operations)
4. [Troubleshooting](#troubleshooting)
5. [Emergency Procedures](#emergency-procedures)
6. [Maintenance Tasks](#maintenance-tasks)

---

## Service Overview

### Architecture
- **Frontend**: React SPA on Vercel
- **Backend**: Express API on Vercel/Railway
- **Database**: PostgreSQL on Neon
- **External APIs**: YouTube Data API, NBA Schedule API

### URLs
| Service | URL |
|---------|-----|
| Frontend (Prod) | https://[your-app].vercel.app |
| Backend (Prod) | https://[your-backend].vercel.app |
| Health Check | https://[backend]/health |
| Vercel Dashboard | https://vercel.com/[team]/[project] |
| Neon Dashboard | https://console.neon.tech |
| YouTube API Console | https://console.cloud.google.com |

### Scheduled Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| Schedule Sync | 6:00 AM EST daily | Fetch NBA schedule |
| Video Discovery | Every 2 hours | Find highlight videos |

---

## Access & Credentials

### Required Access
- [ ] Vercel account (deployment)
- [ ] Neon account (database)
- [ ] Google Cloud Console (YouTube API)
- [ ] UptimeRobot/monitoring service

### Environment Variables
See `.env.example` for complete list. Critical variables:
- `DATABASE_URL` - Neon connection string
- `YOUTUBE_API_KEY` - YouTube Data API key
- `ADMIN_API_KEY` - Admin endpoint authentication

**Never commit credentials to git.**

---

## Routine Operations

### Check Application Health

```bash
# Quick health check
curl https://[backend]/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "pass" },
#     "youtubeQuota": { "status": "pass" }
#   }
# }
```

### Check YouTube API Quota

```bash
curl https://[backend]/health | jq '.checks.youtubeQuota'

# Or via Google Cloud Console:
# APIs & Services > YouTube Data API > Quotas
```

### View Recent Logs

**Vercel:**
```bash
vercel logs [deployment-url]
# Or via Vercel Dashboard > Project > Logs
```

**Railway:**
```bash
railway logs
# Or via Railway Dashboard > Deployments > Logs
```

### Manual Schedule Sync

```bash
curl -X POST https://[backend]/api/admin/fetch-schedule \
  -H "X-Admin-API-Key: [admin-key]" \
  -H "Content-Type: application/json"
```

### Manual Video Discovery

```bash
# Discover videos for all pending games (limit 10)
curl -X POST https://[backend]/api/admin/fetch-videos \
  -H "X-Admin-API-Key: [admin-key]" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

# Discover video for specific game
curl -X POST https://[backend]/api/admin/fetch-video/123 \
  -H "X-Admin-API-Key: [admin-key]"
```

---

## Troubleshooting

### Issue: Application Returns 500 Errors

**Symptoms:**
- API returns 500 status
- Health check shows database fail

**Diagnosis:**
```bash
# Check health endpoint
curl https://[backend]/health

# Check database connectivity
curl https://[backend]/health/ready
```

**Resolution:**
1. Check Neon dashboard for database status
2. Verify DATABASE_URL is correct in Vercel/Railway
3. Check if Neon is experiencing outage
4. Try redeploying backend

### Issue: No New Videos Being Found

**Symptoms:**
- Recent games show "Highlights coming soon"
- Job history shows 0 videos found

**Diagnosis:**
```bash
# Check job status
curl https://[backend]/api/jobs/status

# Check quota
curl https://[backend]/health | jq '.checks.youtubeQuota'
```

**Resolution:**
1. **Quota exhausted**: Wait until next day for reset
2. **API key issue**: Verify key in Google Cloud Console
3. **Search not matching**: Manually search YouTube to verify videos exist
4. **Job not running**: Check cron configuration

### Issue: Schedule Not Updating

**Symptoms:**
- Missing recent/upcoming games
- Old games not marked as finished

**Diagnosis:**
```bash
# Check job history
curl https://[backend]/api/jobs/history/schedule-sync

# Manual sync
curl -X POST https://[backend]/api/admin/fetch-schedule \
  -H "X-Admin-API-Key: [key]"
```

**Resolution:**
1. Check NBA API availability (balldontlie.io status)
2. Verify cron job is scheduled
3. Run manual sync
4. Check logs for API errors

### Issue: Frontend Not Loading

**Symptoms:**
- White page or loading forever
- Console shows API errors

**Diagnosis:**
- Open browser DevTools > Network tab
- Check for failed requests
- Check Console for errors

**Resolution:**
1. **CORS errors**: Verify CORS_ORIGINS in backend
2. **API unreachable**: Check backend deployment
3. **Build error**: Check Vercel deployment logs

### Issue: High Response Times

**Symptoms:**
- Pages slow to load
- API responses > 1 second

**Diagnosis:**
```bash
# Check health with timing
time curl https://[backend]/health
```

**Resolution:**
1. Check Neon database performance
2. Verify indexes exist on tables
3. Check for slow queries in logs
4. Consider connection pooling settings

---

## Emergency Procedures

### Complete Outage

1. **Identify scope**: Frontend, backend, or database?
2. **Check external services**: Vercel status, Neon status
3. **Review recent changes**: Recent deployments?
4. **Rollback if needed**: Vercel/Railway support instant rollbacks
5. **Communicate**: Update status page if available

### Database Recovery

**Neon provides automatic PITR (Point-in-Time Recovery)**

1. Go to Neon Console
2. Navigate to Branches
3. Create new branch from point before issue
4. Update DATABASE_URL to new branch
5. Redeploy backend

### YouTube API Quota Exceeded

1. Video discovery will automatically skip
2. Manual discovery will return error
3. Quota resets at midnight Pacific Time
4. Consider requesting quota increase if recurring

### Rollback Deployment

**Vercel:**
```bash
# Via CLI
vercel rollback [deployment-url]

# Or via Dashboard:
# Deployments > Select previous > "..." > Promote to Production
```

**Railway:**
```bash
railway rollback
# Or via Dashboard
```

---

## Maintenance Tasks

### Weekly Tasks
- [ ] Review job execution history
- [ ] Check YouTube quota usage trends
- [ ] Verify video discovery success rate
- [ ] Review error logs

### Monthly Tasks
- [ ] Check Neon database size
- [ ] Review and rotate admin API key
- [ ] Update dependencies (security patches)
- [ ] Test disaster recovery procedure

### Database Cleanup

```bash
# Clean old job history (keeps 30 days)
curl -X POST https://[backend]/api/admin/cleanup-history \
  -H "X-Admin-API-Key: [key]"

# Or via SQL:
# DELETE FROM job_history WHERE created_at < NOW() - INTERVAL '30 days';
```

### Update Dependencies

```bash
# Check for outdated packages
cd frontend && npm outdated
cd backend && npm outdated

# Update (test locally first!)
npm update

# For major versions, update package.json manually
```

---

## Contacts & Escalation

| Role | Contact | When to Contact |
|------|---------|-----------------|
| Developer | [email] | Technical issues |
| Vercel Support | support@vercel.com | Platform issues |
| Neon Support | support@neon.tech | Database issues |

---

## Appendix: Useful Commands

```bash
# Database queries via psql
psql $DATABASE_URL

# Count games by status
SELECT status, COUNT(*) FROM games GROUP BY status;

# Check video coverage
SELECT
  DATE(game_date) as date,
  COUNT(*) as games,
  COUNT(v.id) as with_videos
FROM games g
LEFT JOIN videos v ON g.id = v.game_id
WHERE game_date >= CURRENT_DATE - 7
GROUP BY DATE(game_date)
ORDER BY date DESC;

# Recent errors in job history
SELECT * FROM job_history
WHERE status = 'failure'
ORDER BY created_at DESC
LIMIT 10;
```
```

### Save as Documentation

```bash
# Create docs directory
mkdir -p docs

# Save runbook
# File: docs/OPERATIONS_RUNBOOK.md
```

## Acceptance Criteria
- [ ] Runbook covers all operational scenarios
- [ ] Troubleshooting steps are clear and actionable
- [ ] Emergency procedures documented
- [ ] Contact information included
- [ ] Commands tested and verified
- [ ] Document accessible to team members

## Technical Notes
- Keep runbook updated as system evolves
- Test procedures periodically
- Add new issues and solutions as discovered

## Estimated Complexity
Low - Documentation task

## Dependencies
- Task `phase-7/002-health-monitoring`
