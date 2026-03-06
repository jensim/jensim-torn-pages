import { useState, useEffect } from 'react';

const formatTimeRemaining = (currentTime: number, until: number): string => {
    let remainingSeconds = until - currentTime;
    const isNegative = remainingSeconds < 0;
    remainingSeconds = Math.abs(remainingSeconds);

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    let result: string;

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      result = `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      result = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        result = `${minutes}m ${seconds}s`;
    } else {
        result = `${seconds}s`;
    }
    return isNegative ? `-${result}` : result;
  };
interface TimeRemainingProps {
  untilSeconds?: number;
}
const TimeRemaining: React.FC<TimeRemainingProps> = ({ untilSeconds }) => {
    const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

  return (
    <span>{untilSeconds ? formatTimeRemaining(currentTime, untilSeconds) : '-'}</span>
  );
};

export default TimeRemaining;