import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
};

function NotFound() {
    return (
        <motion.div 
            className="not-found-page"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <motion.div 
                className="not-found-content"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <motion.h1 
                    className="not-found-code"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                >
                    404
                </motion.h1>
                
                <motion.h2 
                    className="not-found-title"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    Page Not Found
                </motion.h2>
                
                <motion.p 
                    className="not-found-text"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                >
                    Oops! The page you're looking for doesn't exist or has been moved.
                </motion.p>
                
                <motion.div 
                    className="not-found-actions"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45 }}
                >
                    <Link to="/" className="not-found-btn primary">
                        Go Home
                    </Link>
                    <button onClick={() => window.history.back()} className="not-found-btn secondary">
                        Go Back
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default NotFound;
