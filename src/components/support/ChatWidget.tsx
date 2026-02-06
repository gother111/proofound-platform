'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Crisp type definitions
declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function ChatWidget() {
  const { user } = useAuth();

  useEffect(() => {
    // Only load if Crisp website ID is configured
    const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    
    if (!crispWebsiteId) {
      // Crisp not configured, skip loading
      console.log('Crisp chat widget not configured (NEXT_PUBLIC_CRISP_WEBSITE_ID missing)');
      return;
    }

    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispWebsiteId;

    // Load Crisp script
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    // Configure Crisp once loaded
    script.onload = () => {
      if (!window.$crisp) return;

      // Set user data if authenticated
      if (user) {
        const nickname =
          (user.user_metadata && (user.user_metadata.displayName || user.user_metadata.full_name)) ||
          user.email?.split('@')[0] ||
          'User';

        window.$crisp.push(['set', 'user:email', [user.email]]);
        window.$crisp.push(['set', 'user:nickname', [nickname]]);
        window.$crisp.push(['set', 'session:data', [[
          ['user_id', user.id],
          ['persona', (user.user_metadata && user.user_metadata.persona) || 'unknown'],
        ]]]);
      }

      // Check if within business hours (Mon-Fri 9 AM - 6 PM UTC)
      const now = new Date();
      const hour = now.getUTCHours();
      const day = now.getUTCDay();
      const isWorkingHours = day >= 1 && day <= 5 && hour >= 9 && hour < 18;

      if (!isWorkingHours) {
        // Show offline message
        window.$crisp.push(['do', 'message:show', [
          'text',
          'Thanks for reaching out! Our support team is available Mon-Fri 9 AM - 6 PM UTC. For urgent issues, email hello@proofound.io',
        ]]);
      }
    };

    // Cleanup function
    return () => {
      // Remove Crisp script
      const crispScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (crispScript) {
        crispScript.remove();
      }

      // Clear Crisp globals
      window.$crisp = [];
      delete window.CRISP_WEBSITE_ID;

      // Remove Crisp chat elements
      const crispChat = document.getElementById('crisp-chatbox');
      if (crispChat) {
        crispChat.remove();
      }
    };
  }, [user]);

  // Widget is injected by Crisp, no UI needed here
  return null;
}
