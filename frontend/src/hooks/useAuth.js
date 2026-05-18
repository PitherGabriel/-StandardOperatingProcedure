import { useState, useEffect } from 'react';
import { checkAuth, login, logout } from '../services/authService';
import { fetchInventory } from '../services/inventoryService';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const loadInventory = () => {
    setInventoryLoading(true);
    return fetchInventory()
      .then(setInventory)
      .catch(console.error)
      .finally(() => setInventoryLoading(false));
  };

  useEffect(() => {
    checkAuth()
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          loadInventory();
        }
      })
      .catch(console.error);
  }, []);

  const handleLogin = async (credentials) => {
    const data = await login(credentials);
    if (data.success) {
      setIsAuthenticated(true);
      setCurrentUser(data.user);
      loadInventory();
    }
    return data;
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setInventory([]);
  };

  const refreshInventory = () => loadInventory();

  return {
    isAuthenticated,
    currentUser,
    inventory,
    setInventory,
    inventoryLoading,
    handleLogin,
    handleLogout,
    refreshInventory,
  };
}
