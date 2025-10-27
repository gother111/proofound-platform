"use client";

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import * as analytics from '@/lib/analytics';

/**
 * Hook for tracking analytics events in client components
 * 
 * Usage:
 * const { trackEvent, trackPageView } = useAnalytics();
 * 
 * // Track custom event
 * trackEvent('button_clicked', { button_name: 'submit' }, 'interaction');
 * 
 * // Track page view (done automatically)
 * trackPageView();
 */
export function useAnalytics() {
  const pathname = usePathname();

  // Automatically track page views on mount and route changes
  useEffect(() => {
    const pageTitle = document.title;
    analytics.trackPageView(pathname, pageTitle);
  }, [pathname]);

  // Track custom events
  const trackEvent = useCallback(async (
    eventName: string,
    properties?: Record<string, any>,
    eventCategory?: string
  ) => {
    await analytics.trackEvent(eventName, properties, eventCategory);
  }, []);

  // Track page views manually
  const trackPageView = useCallback(async (customPath?: string, customTitle?: string) => {
    const path = customPath || pathname;
    const title = customTitle || document.title;
    await analytics.trackPageView(path, title);
  }, [pathname]);

  // Track feature usage
  const trackFeature = useCallback(async (featureName: string, context?: string) => {
    await analytics.trackFeatureUsed(featureName, context);
  }, []);

  // Track time on page
  const trackTimeOnPage = useCallback(() => {
    return analytics.trackTimeOnPage(pathname);
  }, [pathname]);

  return {
    trackEvent,
    trackPageView,
    trackFeature,
    trackTimeOnPage,
    // Export all convenience functions for easy access
    ...analytics,
  };
}

/**
 * Hook for tracking component mount/unmount
 * 
 * Usage:
 * useComponentTracking('ComponentName', { prop1: 'value' });
 */
export function useComponentTracking(componentName: string, metadata?: Record<string, any>) {
  useEffect(() => {
    analytics.trackEvent('component_mounted', {
      component_name: componentName,
      ...metadata,
    }, 'engagement');

    return () => {
      analytics.trackEvent('component_unmounted', {
        component_name: componentName,
        ...metadata,
      }, 'engagement');
    };
  }, [componentName, metadata]);
}

/**
 * Hook for tracking clicks
 * 
 * Usage:
 * const handleClick = useClickTracking('submit_button', { form: 'signup' });
 * <button onClick={handleClick}>Submit</button>
 */
export function useClickTracking(elementName: string, metadata?: Record<string, any>) {
  return useCallback((event?: React.MouseEvent) => {
    analytics.trackEvent('element_clicked', {
      element_name: elementName,
      ...metadata,
    }, 'interaction');
    
    // Don't prevent default or stop propagation
  }, [elementName, metadata]);
}

/**
 * Hook for tracking form interactions
 * 
 * Usage:
 * const { trackFormStart, trackFormComplete, trackFormError } = useFormTracking('signup_form');
 */
export function useFormTracking(formName: string) {
  const trackFormStart = useCallback(() => {
    analytics.trackEvent('form_started', { form_name: formName }, 'form');
  }, [formName]);

  const trackFormComplete = useCallback((timeSpentSeconds: number) => {
    analytics.trackEvent('form_completed', {
      form_name: formName,
      time_spent_seconds: timeSpentSeconds,
    }, 'form');
  }, [formName]);

  const trackFormError = useCallback((fieldName: string, errorMessage: string) => {
    analytics.trackEvent('form_error', {
      form_name: formName,
      field_name: fieldName,
      error_message: errorMessage,
    }, 'form');
  }, [formName]);

  const trackFieldFocus = useCallback((fieldName: string) => {
    analytics.trackEvent('form_field_focused', {
      form_name: formName,
      field_name: fieldName,
    }, 'form');
  }, [formName]);

  return {
    trackFormStart,
    trackFormComplete,
    trackFormError,
    trackFieldFocus,
  };
}

/**
 * Hook for tracking video/audio playback
 * 
 * Usage:
 * const { trackPlay, trackPause, trackComplete } = useMediaTracking('intro_video');
 */
export function useMediaTracking(mediaName: string) {
  const trackPlay = useCallback((currentTime: number) => {
    analytics.trackEvent('media_played', {
      media_name: mediaName,
      current_time: currentTime,
    }, 'media');
  }, [mediaName]);

  const trackPause = useCallback((currentTime: number) => {
    analytics.trackEvent('media_paused', {
      media_name: mediaName,
      current_time: currentTime,
    }, 'media');
  }, [mediaName]);

  const trackComplete = useCallback((totalTime: number) => {
    analytics.trackEvent('media_completed', {
      media_name: mediaName,
      total_time: totalTime,
    }, 'media');
  }, [mediaName]);

  return {
    trackPlay,
    trackPause,
    trackComplete,
  };
}

/**
 * Hook for tracking scroll depth
 * 
 * Usage:
 * useScrollTracking('article_page');
 */
export function useScrollTracking(pageName: string) {
  useEffect(() => {
    const milestones = new Set<number>();
    const thresholds = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const scrollPercentage = Math.round((scrollPosition / scrollHeight) * 100);

      thresholds.forEach(threshold => {
        if (scrollPercentage >= threshold && !milestones.has(threshold)) {
          milestones.add(threshold);
          analytics.trackEvent('scroll_depth', {
            page_name: pageName,
            depth_percentage: threshold,
          }, 'engagement');
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageName]);
}

