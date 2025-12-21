#!/bin/bash

# Script for automatic sitemap generation via cron
# Add to crontab: 0 */3 * * * /path/to/project/scripts/cron-sitemap.sh

# Navigate to project directory
cd "$(dirname "$0")/.."

# Log start
echo "[$(date)] Starting sitemap generation via cron" >> logs/sitemap-cron.log

# Generate sitemaps
npm run sitemap:generate >> logs/sitemap-cron.log 2>&1

# Log result
if [ $? -eq 0 ]; then
    echo "[$(date)] Sitemap generation completed successfully" >> logs/sitemap-cron.log
else
    echo "[$(date)] Sitemap generation failed with exit code $?" >> logs/sitemap-cron.log
fi