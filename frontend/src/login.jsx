import { useState } from "react";


import {
    Loader
} from 'lucide-react';

export default function LoginScreen({ setCurrentUser,
    setIsAuthenticated,
    showNotification, loadInventory}) {
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Inicio de sesión del usuario
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(loginForm)
            });

            const data = await response.json();

            if (data.success) {
                setIsAuthenticated(true);
                setCurrentUser(data.user);
                showNotification(`¡Bienvenido ${data.user.nombre || data.user.username}!`, 'success');
                loadInventory();
            } else {
                setLoginError(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            setLoginError('Error de conexión. Intente nuevamente.');
            console.error('Error en login:', error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-white-600 to-white-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 rounded-full mb-5">
                        <img src='logo.png' className='h-35 mx-auto'></img>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Comercial TB</h1>
                    <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
                </div>

                {loginError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                        {loginError}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuario
                        </label>
                        <input
                            type="text"
                            required
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ingrese su usuario"
                            autoComplete="username"
                            disabled={isLoggingIn}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="current-password"
                            placeholder="Ingrese su contraseña"
                            disabled={isLoggingIn}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${isLoggingIn
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#008cc8] text-white hover:bg-[#016996]'
                            }`}
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader className="animate-spin" size={20} />
                                Iniciando sesión...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}