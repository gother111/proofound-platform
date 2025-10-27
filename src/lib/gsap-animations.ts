/**
 * GSAP Animation Utilities for Landing Page
 * Implements all scroll animations from the reference implementation
 */

import { useEffect } from 'react';

// Dynamic import for client-side only
let gsap: any;
let ScrollTrigger: any;

if (typeof window !== 'undefined') {
  import('gsap').then((module) => {
    gsap = module.gsap || module.default;
  });
  import('gsap/ScrollTrigger').then((module) => {
    ScrollTrigger = module.ScrollTrigger || module.default;
    if (gsap && ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }
  });
}

export function useGSAPAnimations() {
  useEffect(() => {
    if (!gsap || !ScrollTrigger) return;

    // Small delay to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();

      // Hero Section Animation - scale and fade on scroll
      gsap.to('.gsap-hero-content', {
        scrollTrigger: {
          trigger: '.gsap-hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
        scale: 0.8,
        opacity: 0.3,
        y: -100,
      });

      // Problem Cards Stagger Animation
      gsap.fromTo(
        '.gsap-problem-card',
        { opacity: 0, y: 60 },
        {
          scrollTrigger: {
            trigger: '.gsap-problem-section',
            start: 'top 70%',
            end: 'top 20%',
            scrub: 1,
          },
          opacity: 1,
          y: 0,
          stagger: 0.2,
        }
      );

      // Principle Cards with 3D Rotation
      gsap.fromTo(
        '.gsap-principle-card',
        { opacity: 0, rotateY: -30, scale: 0.9 },
        {
          scrollTrigger: {
            trigger: '.gsap-trustworthy-section',
            start: 'top 70%',
            end: 'top 30%',
            scrub: 1,
          },
          opacity: 1,
          rotateY: 0,
          scale: 1,
          stagger: 0.15,
        }
      );

      // Final CTA Scale Effect
      gsap.fromTo(
        '.gsap-final-cta',
        { scale: 0.9, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.gsap-final-cta',
            start: 'top 80%',
            end: 'top 40%',
            scrub: 1,
          },
          scale: 1,
          opacity: 1,
        }
      );

      // Final Quote Animation - Word Merging
      const quoteSection = document.querySelector('.final-quote-section');
      if (quoteSection) {
        const quoteLine1 = quoteSection.querySelector('.quote-line-1');
        const quoteLine2 = quoteSection.querySelector('.quote-line-2');
        const quoteLine3 = quoteSection.querySelector('.quote-line-3');
        const wordProof = quoteSection.querySelector('.word-proof');
        const wordFound = quoteSection.querySelector('.word-found');
        const wordMiddle = quoteSection.querySelector('.word-middle');
        const wordMiddle2 = quoteSection.querySelector('.word-middle2');
        const quoteMerged = quoteSection.querySelector('.quote-merged');

        if (quoteLine1 && quoteLine2 && quoteLine3 && wordProof && wordFound && quoteMerged) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: '.final-quote-section',
              start: 'top 50%',
              end: 'bottom top',
              scrub: 1,
            },
          });

          // Fade out individual words
          tl.to(
            [quoteLine1, wordMiddle, wordMiddle2],
            {
              opacity: 0,
              duration: 0.3,
            },
            0
          );

          // Move "proof" and "found" together
          tl.to(
            wordProof,
            {
              x: 50,
              duration: 0.5,
            },
            0.3
          );

          tl.to(
            wordFound,
            {
              x: -50,
              duration: 0.5,
            },
            0.3
          );

          // Fade in merged "Proofound"
          tl.to(
            quoteMerged,
            {
              opacity: 1,
              scale: 1,
              duration: 0.4,
            },
            0.6
          );
        }
      }

      // Timeline Dots Animation
      const timelineDots = document.querySelectorAll('.timeline-dot');
      timelineDots.forEach((dot, index) => {
        gsap.fromTo(
          dot,
          { scale: 0, opacity: 0 },
          {
            scrollTrigger: {
              trigger: '.modules-section',
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
            scale: 1,
            opacity: 1,
            duration: 0.4,
            delay: index * 0.1,
            ease: 'back.out(1.7)',
          }
        );
      });

      // Reason Numbers Animation with Rotation
      const reasonNumbers = document.querySelectorAll('.reason-number');
      reasonNumbers.forEach((number, index) => {
        gsap.fromTo(
          number,
          { scale: 0, rotation: -180, opacity: 0 },
          {
            scrollTrigger: {
              trigger: number.closest('.reason-card'),
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'back.out(1.7)',
          }
        );
      });

      // Card Hover Animations
      const cards = document.querySelectorAll('.card');
      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -4,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });

      // Section Fade-ins
      const sections = document.querySelectorAll('section');
      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0 },
          {
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            opacity: 1,
            duration: 0.8,
          }
        );
      });

      // Footer Fade In
      gsap.fromTo(
        '.site-footer',
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: '.site-footer',
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
        }
      );
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
      }
    };
  }, []);
}
