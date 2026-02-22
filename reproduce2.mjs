import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const logs = [];
    page.on('console', msg => {
        console.log('PAGE LOG:', msg.text());
        logs.push(msg.text());
    });
    page.on('pageerror', exception => {
        console.log(`Uncaught exception: "${exception}"`);
        logs.push(`EXCEPTION: ${exception}`);
    });

    try {
        console.log('Navigating to login page');
        await page.goto('http://localhost:3000/login');

        // According to auth.spec.ts
        // test@example.com / TestPassword123!
        await page.getByTestId('login-email').fill('test@example.com');
        await page.getByTestId('login-password').fill('TestPassword123!');
        await page.getByTestId('login-submit').click();

        console.log('waiting for navigation after login');
        await page.waitForURL(/\/app\//, { timeout: 15000 });
        console.log('Arrived at dashboard');

        // Wait a moment for layout to settle
        await page.waitForTimeout(2000);

        // Now click the profile page link to trigger client-side navigation
        console.log('Clicking profile link in sidebar');
        await page.click('a[href="/app/i/profile"]');

        console.log('waiting for URL /app/i/profile');
        await page.waitForURL('**/app/i/profile**', { timeout: 10000 });

        console.log('Wait a few seconds to let errors surface');
        await page.waitForTimeout(3000);

        const bodyText = await page.evaluate(() => document.body.innerText.trim());
        console.log('Body text length:', bodyText.length);
        console.log('Body starts with:', bodyText.substring(0, 100));

        await page.screenshot({ path: 'investigation_profile.png' });

        const fs = await import('fs');
        fs.writeFileSync('investigation_logs.txt', logs.join('\n'));
        console.log('Saved logs to investigation_logs.txt');
    } catch (err) {
        console.error('Test crashed:', err);
        await page.screenshot({ path: 'investigation_crash.png' });
        const fs = await import('fs');
        fs.writeFileSync('investigation_logs.txt', logs.join('\n'));
    }

    await browser.close();
})();
