import { useEffect } from 'react';
import { WarningCircle as AlertCircle, Check, Info, X } from '@phosphor-icons/react';

export default function NotificationToast({ notification, setNotification }) {
  useEffect(() => {
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification, setNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
        notification.type === 'success' ? 'bg-green-700 text-white'
          : notification.type === 'info' ? 'bg-[#0075a7] text-white'
          : 'bg-red-700 text-white'
      }`}>
        {notification.type === 'success'
          ? <Check size={24} className="shrink-0" />
          : notification.type === 'info'
            ? <Info size={24} className="shrink-0" />
            : <AlertCircle size={24} className="shrink-0" />
        }
        <p className="font-semibold">{notification.message}</p>
        <button
          onClick={() => setNotification(null)}
          className="ml-2 hover:bg-white/20 rounded p-1"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
