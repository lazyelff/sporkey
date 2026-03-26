import { useEffect, useState, useRef } from 'react';

const useWatchPoints = (isWatching = false, userId = null) => {
    const [totalPoints, setTotalPoints] = useState(() => {
        if (!userId) return 0;
        return parseInt(localStorage.getItem(`userPoints_${userId}`)) || 0;
    });
    const [windowFocused, setWindowFocused] = useState(true);
    const pointIntervalRef = useRef(null);
    const POINTS_PER_MINUTE = 1; // 1 point per minute of watching

    // Handle window focus/blur events
    useEffect(() => {
        const handleFocus = () => {
            setWindowFocused(true);
        };

        const handleBlur = () => {
            setWindowFocused(false);
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Detect page visibility changes (for tab switching)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWindowFocused(false);
            } else {
                setWindowFocused(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Award points every minute when watching and window is focused
    useEffect(() => {
        if (!isWatching || !windowFocused) {
            if (pointIntervalRef.current) {
                clearInterval(pointIntervalRef.current);
            }
            return;
        }

        // Award points immediately when starting to watch
        const awardPoints = () => {
            setTotalPoints(prev => {
                const newTotalPoints = prev + POINTS_PER_MINUTE;
                if (userId) {
                    localStorage.setItem(`userPoints_${userId}`, newTotalPoints.toString());
                }
                return newTotalPoints;
            });
        };

        awardPoints();

        // Award points every minute (60000ms)
        pointIntervalRef.current = setInterval(awardPoints, 60000);

        return () => {
            if (pointIntervalRef.current) {
                clearInterval(pointIntervalRef.current);
            }
        };
    }, [isWatching, windowFocused]);

    return {
        totalPoints,
        isActive: isWatching && windowFocused,
        windowFocused
    };
};

export default useWatchPoints;
