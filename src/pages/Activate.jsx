import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HardDrive, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../api/client';

export default function Activate() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api(`/auth/activate/${token}`)
      .then(() => {
        setStatus('success');
        toast.success('Account activated! You can now sign in.');
      })
      .catch(() => {
        setStatus('error');
        toast.error('Invalid or expired activation link.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 perspective-3d">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-drive-accent/12 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDuration: '8s' }} />
      </div>
      <div className="card-3d glass w-full max-w-md border border-drive-border rounded-2xl shadow-3d p-8 text-center animate-slide-up relative z-10 pointer-events-auto">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-drive-accent/20 shadow-glow">
            <HardDrive className="w-10 h-10 text-drive-accent" aria-hidden />
          </div>
        </div>
        {status === 'loading' && (
          <>
            <p className="text-drive-muted">Activating your account...</p>
            <div className="mt-4 h-8 w-8 border-2 border-drive-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-bold text-white mb-2">Account activated</h1>
            <p className="text-drive-muted mb-6">You can now sign in with your email and password.</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium shadow-glow hover:shadow-glow-lg transition-all duration-250"
            >
              Sign in
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-bold text-white mb-2">Activation failed</h1>
            <p className="text-drive-muted mb-6">The link is invalid or has expired. You can request a new one by signing up again.</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl bg-drive-accent hover:bg-drive-accentHover text-white font-medium shadow-glow hover:shadow-glow-lg transition-all duration-250"
            >
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
