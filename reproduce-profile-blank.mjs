import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', exception => {
        console.log(`Uncaught exception: "${exception}"`);
    });

    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000');

    try {
        console.log('Going to login');
        await page.goto('http://localhost:3000/login');

        // Fill login form
        await page.fill('input[type="email"]', 'existing@test.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button:has-text("Sign in")');

        console.log('waiting for navigation after login');
        await page.waitForURL('**/app/i/home**', { timeout: 15000 });
        console.log('Arrived at dashboard');

        console.log('Clicking profile link');
        await page.click('a[href="/app/i/profile"]');

        console.log('waiting for URL /app/i/profile');
        await page.waitForURL('**/app/i/profile**', { timeout: 10000 });

        await page.waitForTimeout(3000);

        const bodyText = await page.evaluate(() => document.body.innerText.trim());
        console.log('Body text length:', bodyText.length);
        console.log('Body starts with:', bodyText.substring(0, 100));

        // Also get the outer HTML to see what's actually rendered
        const outerHtml = await page.evaluate(() => document.body.innerHTML);
        require('fs').writeFileSync('investigation_dom.html', outerHtml);

        if (bodyText === '' || bodyText.includes('Application error')) {
            console.log('SCREEN IS BLANK OR HAS ERROR. Taking screenshot to check.');
            await page.screenshot({ path: 'investigation_blank_profile.png' });
        } else {
            console.log('Screen seems to have loaded successfully.');
            await page.screenshot({ path: 'investigation_success_profile.png' });
        }
    } catch (err) {
        console.error('Test crashed:', err);
        await page.screenshot({ path: 'investigation_crash.png' });
    }

    await browser.close();
})();
