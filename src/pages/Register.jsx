import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HardDrive, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export default function Register() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !password) {
      toast.error('Please fill all fields.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, password }),
      });
      toast.success('Account created! Check your email to activate.');
      if (data.activationLink) {
        toast.success('Dev: Open the link to activate:', { duration: 8000 });
        window.open(data.activationLink, '_blank');
      }
      navigate('/login');
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNRESET')) {
        toast.error('Cannot reach server. Is the backend running on http://localhost:5000?');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 perspective-3d">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-drive-accent/12 rounded-full blur-3xl animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>
      <div className="card-3d glass w-full max-w-md border border-drive-border rounded-2xl shadow-3d p-8 animate-slide-up relative z-10 pointer-events-auto">
        <div className="flex justify-center mb-8">
          <div className="p-3 rounded-xl bg-drive-accent/20 shadow-glow">
            <HardDrive className="w-10 h-10 text-drive-accent" aria-hidden />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Create account</h1>
        <p className="text-drive-muted text-center text-sm mb-8">We'll send an activation link to your email</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">First name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Last name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Password (min 8 characters)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-drive-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-drive-dark border border-drive-border text-white placeholder-drive-muted focus:outline-none focus:ring-2 focus:ring-drive-accent"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium flex items-center justify-center gap-2 shadow-glow hover:shadow-glow-lg transition-all duration-250 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-drive-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-drive-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
