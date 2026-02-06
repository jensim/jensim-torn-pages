import { useState, useEffect } from 'react';

const formatTimeRemaining = (currentTime: number, until: number): string => {
    const remainingSeconds = until - currentTime;
    
    if (remainingSeconds <= 0) {
      return '-';
    }
    
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
  };
interface TimeRemainingProps {
  until: number;
}
const TimeRemaining: React.FC<TimeRemainingProps> = ({ until }) => {
    const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

  return (
    <span>{formatTimeRemaining(currentTime, until)}</span>
  );
};

export default TimeRemaining;