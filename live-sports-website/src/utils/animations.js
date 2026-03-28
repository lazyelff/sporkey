import { motion, AnimatePresence } from 'framer-motion';

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

// Card animation variants with stagger
export const cardVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: index * 0.1,
      ease: 'easeOut',
    },
  }),
};

// Fade up animation
export const fadeUpVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Fade in animation
export const fadeInVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Scale animation for modals
export const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Slide from left
export const slideLeftVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: (index = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      delay: index * 0.1,
      ease: 'easeOut',
    },
  }),
};

// Button hover/tap animations
export const buttonHoverVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// Input focus animation
export const inputVariants = {
  rest: {
    borderColor: 'rgba(107, 33, 168, 0.3)',
  },
  focus: {
    borderColor: '#6B21A8',
    boxShadow: '0 0 0 3px rgba(107, 33, 168, 0.2)',
    transition: {
      duration: 0.2,
    },
  },
};

// Loading skeleton variants
export const skeletonVariants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Toast animations
export const toastVariants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Stagger container for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// List item animation
export const listItemVariants = {
  initial: {
    opacity: 0,
    x: -10,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Pulse animation for live indicators
export const pulseVariants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Counter animation for stats
export const counterVariants = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'backOut',
    },
  },
};

// Error shake animation
export const shakeVariants = {
  initial: {
    x: 0,
  },
  animate: {
    x: [-10, 10, -10, 10, -5, 5, -2, 2, 0],
    transition: {
      duration: 0.5,
    },
  },
};

// Tab animation
export const tabVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Modal overlay
export const overlayVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// PageTransition wrapper component
export function PageTransition({ children, location }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// AnimatedList wrapper for staggered animations
export function AnimatedList({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

// Skeleton loader component
export function Skeleton({ width, height, borderRadius = '8px', className = '' }) {
  return (
    <motion.div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        background: 'linear-gradient(90deg, rgba(107,33,168,0.1) 25%, rgba(107,33,168,0.2) 50%, rgba(107,33,168,0.1) 75%)',
        backgroundSize: '200% 100%',
      }}
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
    />
  );
}

// AnimatedButton component with hover/tap effects
export function AnimatedButton({ children, onClick, disabled, className, type = 'button', style = {} }) {
  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={style}
      variants={buttonHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  );
}

// AnimatedInput with focus effects
export function AnimatedInput({ ...props }) {
  return (
    <motion.input
      {...props}
      variants={inputVariants}
      initial="rest"
      whileFocus="focus"
    />
  );
}

export default {
  pageVariants,
  cardVariants,
  fadeUpVariants,
  fadeInVariants,
  scaleVariants,
  slideLeftVariants,
  buttonHoverVariants,
  inputVariants,
  skeletonVariants,
  toastVariants,
  staggerContainer,
  listItemVariants,
  pulseVariants,
  counterVariants,
  shakeVariants,
  tabVariants,
  overlayVariants,
  PageTransition,
  AnimatedList,
  Skeleton,
  AnimatedButton,
  AnimatedInput,
};
