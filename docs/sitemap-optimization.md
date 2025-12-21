# Sitemap Optimization

## Problem
The sitemap was generated dynamically and could become huge, causing Google indexing issues.

## Solution
Implemented a static sitemap system with automatic updates:

### Architecture
1. **Static files** in `public/sitemaps/`
2. **Split by files** - maximum 1000 URLs per file
3. **Index file** `/sitemap.xml` with links to parts
4. **3-hour cache** with automatic updates
5. **Fallback** to old files on errors

### Files
- `scripts/generate-sitemap.ts` - sitemap generator
- `app/sitemap.xml/route.ts` - `/sitemap.xml` handler
- `app/api/sitemaps/[filename]/route.ts` - sitemap parts handler
- `middleware.ts` - proxy `/sitemaps/*` to API

### Usage

#### Generate sitemaps
```bash
npm run sitemap:generate
```

#### File structure
```
public/sitemaps/
├── sitemap-index.xml    # Index file
├── sitemap-0.xml        # First part (up to 1000 URLs)
├── sitemap-1.xml        # Second part
├── ...
└── metadata.json        # Generation metadata
```

#### URL structure
- `/sitemap.xml` - main index file
- `/sitemaps/sitemap-0.xml` - sitemap parts
- `/sitemaps/sitemap-1.xml` - etc.

### Logic

#### `/sitemap.xml` request
1. Checks existing sitemaps
2. If files are stale (>3 hours):
   - Serves old file
   - Starts background update
3. If no files exist - generates synchronously
4. On errors serves fallback

#### Caching
- **Browser**: 1 hour for fresh files, 5 minutes on errors
- **Server**: 3 hours between regenerations
- **CDN**: can be configured additionally

### Monitoring
Logs contain information about:
- Generation time
- Number of URLs
- Number of files
- Errors and fallbacks

### Automation

#### Built-in Cron Scheduler (Recommended for self-hosted)
The application includes a built-in cron scheduler using node-cron:

```bash
# Production (cron enabled by default)
npm run build && npm start

# Development with cron enabled
npm run dev:cron

# Development without cron (default)
npm run dev
```

**Environment Variables:**
- `ENABLE_CRON=true` - Enable cron in development mode
- Production mode enables cron automatically

**Features:**
- ✅ Generates sitemaps every 3 hours
- ✅ Generates on startup if missing or >6 hours old  
- ✅ No external cron setup required
- ✅ Works with PM2, Docker, etc.

#### Manual Management
```bash
# Generate sitemaps manually
npm run sitemap:generate

# Trigger via API
npm run sitemap:trigger

# Check status
npm run sitemap:status

# Admin interface
# Visit: /admin/sitemap
```

#### External Cron (Alternative)
For external cron setup:
```bash
# Every 3 hours
0 */3 * * * cd /path/to/project && npm run sitemap:generate
```

### Benefits
- ✅ Fast sitemap delivery
- ✅ Google limits compliance (1000 URLs/file)
- ✅ Graceful degradation on errors
- ✅ Automatic background updates
- ✅ Built-in cron scheduler for self-hosted
- ✅ Admin interface for monitoring
- ✅ Minimal server load