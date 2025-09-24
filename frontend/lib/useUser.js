// lib/useUser.js
import { useState, useEffect } from 'react';
import { API_BASE } from './apiClient';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('Dados do usuário carregados:', userData); // Debug
        console.log('URL do avatar:', userData.avatar); // Debug
        setUser(userData);
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        setError(err.message);
        // Se der erro de autenticação, remove o token
        if (err.message.includes('401')) {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/signin';
  };

  return { user, loading, error, logout };
}