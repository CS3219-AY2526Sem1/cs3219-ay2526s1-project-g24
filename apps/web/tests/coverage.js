#!/usr/bin/env node

/**
 * Test Coverage Summary Generator
 * Analyzes Playwright test results and generates a coverage report
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'playwright-report', 'results.json');

if (!fs.existsSync(reportPath)) {
    console.log('❌ No test results found. Run tests first with: pnpm test:e2e');
    process.exit(1);
}

const results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Calculate statistics
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
};

const suites = {};

results.suites?.forEach(suite => {
    suite.specs?.forEach(spec => {
        stats.total++;

        const suiteName = suite.title || 'Unknown';
        if (!suites[suiteName]) {
            suites[suiteName] = { total: 0, passed: 0, failed: 0 };
        }
        suites[suiteName].total++;

        const status = spec.tests?.[0]?.results?.[0]?.status;

        if (status === 'passed') {
            stats.passed++;
            suites[suiteName].passed++;
        } else if (status === 'failed') {
            stats.failed++;
            suites[suiteName].failed++;
        } else if (status === 'skipped') {
            stats.skipped++;
        } else if (status === 'flaky') {
            stats.flaky++;
        }

        const duration = spec.tests?.[0]?.results?.[0]?.duration || 0;
        stats.duration += duration;
    });
});

// Generate report
console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║        Playwright E2E Test Coverage Report        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📊 Overall Statistics');
console.log('─────────────────────────────────────────────────────────');
console.log(`Total Tests:    ${stats.total}`);
console.log(`✅ Passed:      ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
console.log(`❌ Failed:      ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
console.log(`⏭️  Skipped:     ${stats.skipped}`);
console.log(`⚠️  Flaky:       ${stats.flaky}`);
console.log(`⏱️  Duration:    ${(stats.duration / 1000).toFixed(2)}s`);
console.log('');

console.log('📁 Test Suites Breakdown');
console.log('─────────────────────────────────────────────────────────');
Object.entries(suites).forEach(([name, suite]) => {
    const passRate = ((suite.passed / suite.total) * 100).toFixed(1);
    const icon = suite.failed === 0 ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    console.log(`   Tests: ${suite.passed}/${suite.total} passed (${passRate}%)`);
});
console.log('');

console.log('🎯 Coverage Areas');
console.log('─────────────────────────────────────────────────────────');
const coverageAreas = [
    { name: 'Landing Page', suite: 'Landing Page' },
    { name: 'Sign In Flow', suite: 'Sign In Page' },
    { name: 'Navigation', suite: 'Navigation Flow' },
    { name: 'Performance', suite: 'Performance Tests' },
    { name: 'Responsive Design', suite: 'Responsive Design Tests' },
    { name: 'SEO & Accessibility', suite: 'SEO and Meta Tags' },
    { name: 'Visual Regression', suite: 'Visual Regression Tests' },
];

coverageAreas.forEach(area => {
    const suite = suites[area.suite];
    if (suite) {
        const icon = suite.failed === 0 ? '✅' : suite.passed > 0 ? '⚠️' : '❌';
        console.log(`${icon} ${area.name}: ${suite.passed}/${suite.total} tests passed`);
    } else {
        console.log(`❌ ${area.name}: No tests found`);
    }
});
console.log('');

// Summary
const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
console.log('📈 Summary');
console.log('─────────────────────────────────────────────────────────');
if (stats.failed === 0) {
    console.log(`🎉 All tests passed! Coverage: ${passRate}%`);
} else {
    console.log(`⚠️  ${stats.failed} test(s) failed. Pass rate: ${passRate}%`);
}
console.log('');

console.log('💡 Next Steps');
console.log('─────────────────────────────────────────────────────────');
console.log('• View detailed report: pnpm test:e2e:report');
console.log('• Run tests in UI mode: pnpm test:e2e:ui');
console.log('• Debug failures: pnpm test:e2e:debug');
console.log('');

// Exit with error if tests failed
process.exit(stats.failed > 0 ? 1 : 0);
