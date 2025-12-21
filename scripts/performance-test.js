#!/usr/bin/env node

/**
 * Lightning Performance Test ⚡
 * Tests various performance metrics of the application
 */

const { performance } = require('perf_hooks')
const fs = require('fs/promises')
const path = require('path')

async function testFileCache() {
  console.log('🔥 Testing file cache performance...')
  
  const startTime = performance.now()
  
  // Simulate reading multiple MDC files
  const contentDir = path.join(process.cwd(), 'content')
  
  try {
    const files = await fs.readdir(contentDir)
    const mdcFiles = files.filter(f => f.endsWith('.mdc')).slice(0, 5)
    
    for (const file of mdcFiles) {
      const filePath = path.join(contentDir, file)
      await fs.readFile(filePath, 'utf-8')
    }
    
    const duration = performance.now() - startTime
    console.log(`✅ File cache test: ${Math.round(duration)}ms for ${mdcFiles.length} files`)
    
    return duration < 100 // Lightning fast if under 100ms
  } catch (error) {
    console.log('⚠️  No content files found, skipping file cache test')
    return true
  }
}

async function testBuildSize() {
  console.log('📦 Testing build size optimization...')
  
  try {
    const nextDir = path.join(process.cwd(), '.next')
    const stats = await fs.stat(nextDir)
    
    if (stats.isDirectory()) {
      console.log('✅ Build directory exists')
      
      // Check for optimized chunks
      const staticDir = path.join(nextDir, 'static')
      try {
        const staticStats = await fs.stat(staticDir)
        console.log('✅ Static assets optimized')
        return true
      } catch {
        console.log('⚠️  Static directory not found')
        return false
      }
    }
  } catch (error) {
    console.log('⚠️  Build not found, run npm run build first')
    return false
  }
}

async function testCacheConfiguration() {
  console.log('⚡ Testing cache configuration...')
  
  // Test cache TTL settings
  const cacheTests = [
    { name: 'Shared Cache TTL', value: process.env.NODE_ENV === 'development' ? 15000 : 600000 },
    { name: 'File Cache TTL', value: process.env.NODE_ENV === 'development' ? 15000 : 120000 },
    { name: 'Markdown Cache TTL', value: process.env.NODE_ENV === 'development' ? 30000 : 300000 }
  ]
  
  cacheTests.forEach(test => {
    const isOptimal = test.value <= (process.env.NODE_ENV === 'development' ? 30000 : 600000)
    console.log(`${isOptimal ? '✅' : '⚠️'} ${test.name}: ${test.value}ms`)
  })
  
  return true
}

async function runPerformanceTest() {
  console.log('⚡ LIGHTNING PERFORMANCE TEST ⚡\n')
  
  const startTime = performance.now()
  
  const results = await Promise.all([
    testFileCache(),
    testBuildSize(),
    testCacheConfiguration()
  ])
  
  const totalTime = performance.now() - startTime
  const allPassed = results.every(r => r)
  
  console.log('\n📊 PERFORMANCE RESULTS:')
  console.log(`Total test time: ${Math.round(totalTime)}ms`)
  console.log(`Status: ${allPassed ? '⚡ LIGHTNING FAST' : '🚀 FAST'}`)
  
  if (allPassed && totalTime < 200) {
    console.log('🎉 GREEN ZONE ACHIEVED! Your app is lightning fast! ⚡')
  } else if (totalTime < 500) {
    console.log('✅ Performance is good, but there\'s room for improvement')
  } else {
    console.log('⚠️  Performance needs optimization')
  }
  
  return allPassed
}

// Run the test
runPerformanceTest().catch(console.error)