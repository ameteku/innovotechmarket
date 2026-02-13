import { useState, useEffect, useCallback } from 'react';

interface CountdownTimerProps {
  endDate: string;
  variant?: 'flash' | 'monthly';
}

const CountdownTimer = ({ endDate, variant = 'flash' }: CountdownTimerProps) => {
  const calcTime = useCallback(() => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [endDate]);

  const [timeLeft, setTimeLeft] = useState(calcTime);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTime()), 1000);
    return () => clearInterval(timer);
  }, [calcTime]);

  const bgClass = variant === 'flash' ? 'bg-deal-flash' : 'bg-deal-monthly';

  return (
    <div className="flex gap-1.5 sm:gap-2">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="flex flex-col items-center">
          <span className={`${bgClass} text-primary-foreground font-bold text-sm sm:text-lg px-2 py-1 rounded-md min-w-[36px] text-center`}>
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-xs mt-1 text-muted-foreground capitalize">{key}</span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
