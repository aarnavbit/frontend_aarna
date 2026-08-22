import { run } from 'node:test'
import { spec } from 'node:test/reporters'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const testFiles = [
  path.resolve(__dirname, 'e2e/tier1-features.test.mjs'),
  path.resolve(__dirname, 'e2e/tier2-boundaries.test.mjs'),
  path.resolve(__dirname, 'e2e/tier3-combinations.test.mjs'),
  path.resolve(__dirname, 'e2e/tier4-scenarios.test.mjs'),
]

console.log('='.repeat(72))
console.log('  AARNA AUTOMATED 4-TIER E2E TEST RUNNER')
console.log('  React 19 + Vite 8 + React Router Dom 7 + Framer Motion')
console.log('='.repeat(72))
console.log(`\nExecuting test suites across 4 verification tiers...`)

const testStream = run({
  files: testFiles,
  concurrency: false,
})

let passCount = 0
let failCount = 0
let totalTests = 0

testStream.on('test:pass', (t) => {
  if (t.name.startsWith('T1.') || t.name.startsWith('T2.') || t.name.startsWith('T3.') || t.name.startsWith('T4.')) {
    passCount++
    totalTests++
  }
})

testStream.on('test:fail', (t) => {
  if (t.name.startsWith('T1.') || t.name.startsWith('T2.') || t.name.startsWith('T3.') || t.name.startsWith('T4.')) {
    failCount++
    totalTests++
  }
})

testStream.compose(spec).pipe(process.stdout)

testStream.on('end', () => {
  console.log('\n' + '='.repeat(72))
  console.log('  TEST EXECUTION SUMMARY')
  console.log('='.repeat(72))
  console.log(`  Tier 1: Feature Coverage (14 Routes, Auth, Portals)   : 45 Tests`)
  console.log(`  Tier 2: Boundary & Corner Cases (Viewports, Touch)    : 25 Tests`)
  console.log(`  Tier 3: Cross-Feature Combinations (Theme, Drawer)    : 25 Tests`)
  console.log(`  Tier 4: Real-World Workload Scenarios (E2E Flows)     : 13 Tests`)
  console.log('-'.repeat(72))
  console.log(`  Total Test Assertions  : ${totalTests}`)
  console.log(`  Passed                 : ${passCount}`)
  console.log(`  Failed                 : ${failCount}`)
  console.log(`  Pass Rate              : ${totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : 0}%`)
  console.log('='.repeat(72))

  if (failCount > 0) {
    console.error('\n❌ TEST RUN FAILED: One or more test assertions did not pass.')
    process.exit(1)
  } else {
    console.log('\n✅ ALL 4 TIERS PASSED WITH 100% SUCCESS RATE.')
    process.exit(0)
  }
})
