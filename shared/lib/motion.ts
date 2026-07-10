export const MOTION_TRANSITIONS = {
  micro: {
    duration: 0.16,
    ease: [0.22, 1, 0.36, 1] as const
  },
  base: {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1] as const
  },
  slow: {
    duration: 0.34,
    ease: [0.16, 1, 0.3, 1] as const
  },
  page: {
    duration: 0.42,
    ease: [0.16, 1, 0.3, 1] as const
  },
  spring: {
    type: "spring" as const,
    stiffness: 360,
    damping: 30,
    mass: 0.9
  }
};

export const MOTION_VARIANTS = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: MOTION_TRANSITIONS.base },
    exit: { opacity: 0, transition: MOTION_TRANSITIONS.micro }
  },
  modal: {
    initial: { opacity: 0, y: 20, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1, transition: MOTION_TRANSITIONS.spring },
    exit: { opacity: 0, y: 14, scale: 0.98, transition: MOTION_TRANSITIONS.micro }
  },
  sheet: {
    initial: { opacity: 0, y: 36, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1, transition: MOTION_TRANSITIONS.spring },
    exit: { opacity: 0, y: 28, scale: 0.99, transition: MOTION_TRANSITIONS.micro }
  },
  dropdown: {
    initial: { opacity: 0, y: -8, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1, transition: MOTION_TRANSITIONS.base },
    exit: { opacity: 0, y: -6, scale: 0.99, transition: MOTION_TRANSITIONS.micro }
  },
  toast: {
    initial: { opacity: 0, y: -12, x: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, x: 0, scale: 1, transition: MOTION_TRANSITIONS.spring },
    exit: { opacity: 0, y: -8, x: 12, scale: 0.98, transition: MOTION_TRANSITIONS.micro }
  }
};
