import { useState } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'success') =>
    setNotification({ message, type });
  return { notification, setNotification, showNotification };
}
