import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, Map, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('type') === 'reset';

  const [mode, setMode] = useState(isResetMode ? 'reset' : 'signin'); // 'signin', 'signup', 'reset', 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    setError(null);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    if (mode !== 'forgot') {
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Full name is required.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
      if (!termsAccepted) {
        setError('You must accept the Terms and Privacy Policy.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        navigate('/analyze');
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('Check your email for a password reset link.');
      } else if (mode === 'reset') {
        // Handled via supabase specific reset API typically, keeping simple for UI demo
        setSuccess('Password has been updated. You can now sign in.');
        setTimeout(() => setMode('signin'), 3000);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* ── Left Visual Section (Desktop) ── */}
      <div className="auth-visual">
        <div className="auth-visual-content">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">
              <Sparkles size={24} />
            </div>
            <span className="auth-logo-text">Career Guide AI</span>
          </Link>

          <div className="auth-visual-text">
            <h1>Build Your Career <br /><span className="text-gradient">With AI</span></h1>
            <p>Get personalized career guidance, skill recommendations, interview preparation, and a clear roadmap toward your goals.</p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon"><Map size={20} /></div>
              <span>Personalized career roadmap</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><Target size={20} /></div>
              <span>AI-powered recommendations</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><TrendingUp size={20} /></div>
              <span>Progress tracking & analytics</span>
            </div>
          </div>
        </div>
        <div className="auth-visual-bg"></div>
      </div>

      {/* ── Right Form Section ── */}
      <div className="auth-form-section">
        <Link to="/" className="auth-back-mobile">
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>

        <div className="auth-card">
          {mode === 'signin' || mode === 'signup' ? (
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => setMode('signin')}
              >
                Sign In
              </button>
              <button 
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
              >
                Create Account
              </button>
            </div>
          ) : null}

          <div className="auth-header">
            <h2>
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset password'}
              {mode === 'reset' && 'Set new password'}
            </h2>
            <p>
              {mode === 'signin' && 'Enter your details to access your dashboard.'}
              {mode === 'signup' && 'Start your career journey with AI today.'}
              {mode === 'forgot' && 'Enter your email to receive a reset link.'}
              {mode === 'reset' && 'Enter your new password below.'}
            </p>
          </div>

          {error && <div className="auth-alert error">{error}</div>}
          {success && <div className="auth-alert success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="form-group"
                >
                  <label htmlFor="fullName">Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      id="fullName" 
                      placeholder="John Doe"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  id="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  {mode === 'signin' && (
                    <button type="button" className="text-link" onClick={() => setMode('forgot')}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="form-group"
                >
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="confirmPassword" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="form-checkbox"
                >
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="terms">
                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'signin' && (
              <div className="form-checkbox">
                <input type="checkbox" id="remember" disabled={loading} />
                <label htmlFor="remember">Remember me for 30 days</label>
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              className="auth-submit-btn" 
              disabled={loading}
            >
              {loading && <Loader2 size={18} className="spin-icon" />}
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Link'}
              {mode === 'reset' && 'Update Password'}
            </Button>

            {mode === 'forgot' && (
              <button 
                type="button" 
                className="back-to-login"
                onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            )}
          </form>

          {(mode === 'signin' || mode === 'signup') && (
            <>
              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <button 
                type="button" 
                className="google-auth-btn"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </>
          )}

          <div className="auth-footer">
            {mode === 'signin' && (
              <p>Don't have an account? <button onClick={() => setMode('signup')} className="text-link">Create one</button></p>
            )}
            {mode === 'signup' && (
              <p>Already have an account? <button onClick={() => setMode('signin')} className="text-link">Sign in</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
