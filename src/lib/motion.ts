import motionTokens from '@/design/motion-tokens.json';
import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: motionTokens.durations.medium / 1000,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: Number(motionTokens.transforms.translateY.moderate.replace('px', '')),
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.durations.comfortable / 1000,
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    y: Number(motionTokens.transforms.translateY.moderate.replace('px', '')),
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.components.card.entrance.duration / 1000,
      ease: [0.33, 1, 0.68, 1],
      delay: i * (motionTokens.scroll.fadeInViewport.stagger / 1000),
    },
  }),
};

export const modalEntry: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: Number(motionTokens.transforms.translateY.moderate.replace('px', '')),
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: motionTokens.components.modal.entry.content.duration / 1000,
      ease: [0.33, 1, 0.68, 1],
      delay: (motionTokens.components.modal.entry.content.delay || 0) / 1000,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: motionTokens.components.modal.exit.duration / 1000,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionTokens.scroll.fadeInViewport.stagger / 1000,
    },
  },
};

// Reduced motion variants
export const reducedMotionFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.1,
    },
  },
};

export function getMotionProps(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      transition: { duration: 0.1 },
    };
  }
  return {};
}
