import { useState } from 'react';
import { Loader } from 'lucide-react';

export default function LoginScreen({ onLogin, showNotification }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-linear-to-br from-white-600 to-white-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full mb-5">
            <img src="logo.png" className="h-35 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Comercial TB</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su usuario"
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#008cc8] text-white hover:bg-[#016996]'
            }`}
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Iniciando sesión...
              </>
            ) : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
