import { useState, useEffect } from 'react';
import { checkAuth, login, logout } from '../services/authService';
import { fetchInventory } from '../services/inventoryService';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    checkAuth()
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          fetchInventory().then(setInventory).catch(console.error);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogin = async (credentials) => {
    const data = await login(credentials);
    if (data.success) {
      setIsAuthenticated(true);
      setCurrentUser(data.user);
      fetchInventory().then(setInventory).catch(console.error);
    }
    return data;
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setInventory([]);
  };

  const refreshInventory = () =>
    fetchInventory().then(setInventory).catch(console.error);

  return {
    isAuthenticated,
    currentUser,
    inventory,
    setInventory,
    handleLogin,
    handleLogout,
    refreshInventory,
  };
}
