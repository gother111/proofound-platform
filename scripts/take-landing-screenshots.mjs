import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

(async () => {
  const artifactDir = '/Users/yuriibakurov/.gemini/antigravity/brain/7e17241e-4955-4d91-a25e-8cb017a50abb/';
  
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    recordVideo: {
      dir: artifactDir,
      size: { width: 1440, height: 1024 }
    }
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to local server...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for elements to render...');
  await page.waitForTimeout(3000); // Wait for entry animations
  
  console.log('Scrolling down slowly...');
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < scrollHeight; i += 300) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), i);
    await page.waitForTimeout(150);
  }
  
  await page.waitForTimeout(1000); // Wait a bit at the bottom
  
  await context.close();
  await browser.close();
  
  console.log('Finding video file...');
  const files = fs.readdirSync(artifactDir);
  const videoFile = files.find(f => f.endsWith('.webm'));
  if (videoFile && videoFile !== 'landing_scroll.webm') {
    fs.renameSync(
      path.join(artifactDir, videoFile), 
      path.join(artifactDir, 'landing_scroll.webm')
    );
    console.log('Video saved as landing_scroll.webm');
  } else {
    console.log('Could not find newly generated video file.');
  }
})();
