import { useState } from 'react';
import { Spinner as Loader, User, Lock, Eye, EyeSlash as EyeOff } from '@phosphor-icons/react';

export default function LoginScreen({ onLogin, showNotification }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await onLogin(form);
      if (data.success) {
        showNotification(`¡Bienvenido ${data.user.nombre || data.user.username}!`, 'success');
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () =>
    showNotification('Contacta al administrador para restablecer tu contraseña', 'info');

  const inputClass =
    'w-full pl-11 py-3 bg-gray-50 border border-gray-200 rounded-full transition ' +
    'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-forest-500 ' +
    'focus:border-forest-500 focus:bg-white';

  return (
    <div className="min-h-screen grid md:grid-cols-2">

      {/* ── Form panel (full height) ───────────────────────────── */}
      <div className="relative flex flex-col items-center justify-start bg-white p-8 sm:p-12 md:h-screen md:overflow-y-auto">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <img src="/logo_shadowed.png" alt="Comercial TB" className="h-52 w-auto mx-auto mb-0" />
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido de nuevo</h1>
            <p className="text-gray-600 mt-2">
              Ingresa tu usuario y contraseña para continuar
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-2xl mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={`${inputClass} pr-4`}
                  placeholder="Ingrese su usuario"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputClass} pr-12`}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-11 w-11 rounded-full text-gray-700 hover:text-gray-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Placed after the input in the DOM so tab order is Usuario → Contraseña → … */}
              <button
                type="button"
                onClick={handleForgot}
                className="absolute top-0 right-0 -my-2 py-2 text-sm font-medium text-forest-600 hover:text-forest-800 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-full font-semibold transition flex items-center justify-center gap-2 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-forest-500 text-white hover:bg-forest-600 shadow-md shadow-forest-500/20'
              }`}
            >
              {loading ? (
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

      {/* ── Brand panel (full height, green) ───────────────────── */}
      <div className="hidden md:flex relative flex-col items-center justify-center p-12 bg-linear-to-br from-forest-600 to-forest-900 overflow-hidden">
        {/* decorative soft shapes */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-10 w-28 h-28 rounded-full bg-white/5" />

        {/* message */}
        <div className="relative text-center animate-fade-in-scale">
          <h2 className="text-white text-4xl font-bold leading-snug">
            Tu punto de venta,<br />simple y rápido
          </h2>
          <p className="text-white/80 mt-4 max-w-sm mx-auto">
            Gestiona ventas, inventario y reportes desde un solo lugar.
          </p>
        </div>
      </div>

    </div>
  );
}
