import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import bitLogo from '../assets/bitlogo.png';

const Login = ({ onLogin }) => {
  const [role, setRole] = useState('Student');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');

  // --- GITHUB OAUTH CALLBACK HANDLING ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const pendingRole = localStorage.getItem('pendingRole') || 'student';
      
      const authenticateGithub = async () => {
        try {
          const res = await axios.post('http://localhost:5000/api/auth/github-login', {
            code,
            role: pendingRole
          });
          
          if (res.data.success) {
            const { user, token } = res.data;
            localStorage.setItem('userToken', token);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userPic', user.picture);
            localStorage.removeItem('pendingRole');

            onLogin(user.role);

            if (user.role === 'admin') navigate('/admin-dashboard');
            else if (user.role === 'faculty') navigate('/faculty-dashboard');
            else navigate('/student-dashboard');
          }
        } catch (error) {
          if (error.response?.data?.message) {
            setErrorMsg(error.response.data.message);
          } else {
            setErrorMsg('GitHub Login failed. Please verify your credentials.');
          }
        }
      };
      
      authenticateGithub();
    }
  }, [navigate, onLogin]);

  const handleGithubLogin = () => {
    localStorage.setItem('pendingRole', role.toLowerCase());
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'dummy_client_id';
    window.location.assign(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`);
  };

  // --- LOGIN LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (res.data.success) {
        if (res.data.requireOtp) {
          setStep(2);
          setSuccessMsg(res.data.message);
        } else {
          // This block is for backwards compatibility if OTP isn't enforced
          const { user, token } = res.data;
          localStorage.setItem('userToken', token);
          localStorage.setItem('userName', user.name);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userPic', user.picture);

          onLogin(user.role);

          if (user.role === 'admin') navigate('/admin-dashboard');
          else if (user.role === 'faculty') navigate('/faculty-dashboard');
          else navigate('/student-dashboard');
        }
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('Login failed. Please verify your credentials.');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
        email,
        otp
      });

      if (res.data.success) {
        const { user, token } = res.data;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userPic', user.picture);

        onLogin(user.role);

        if (user.role === 'admin') navigate('/admin-dashboard');
        else if (user.role === 'faculty') navigate('/faculty-dashboard');
        else navigate('/student-dashboard');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('OTP Verification failed. Please ensure the code is correct.');
      }
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google Auth Success!", tokenResponse);
      try {
        const res = await axios.post('http://localhost:5000/api/auth/google-login', {
          token: tokenResponse.access_token,
          role: role.toLowerCase()
        }, {
          withCredentials: true
        });

        console.log("Successful backend response:", res.data);

        if (res.data.success) {
          const { user, token } = res.data;

          localStorage.setItem('userToken', token);
          localStorage.setItem('userName', user.name);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userPic', user.picture);

          // Ensure Maps() / onLogin / navigation occurs only after localStorage is successfully set
          onLogin(user.role);

          if (user.role === 'admin') navigate('/admin-dashboard');
          else if (user.role === 'faculty') navigate('/faculty-dashboard');
          else navigate('/student-dashboard');
        }
      } catch (error) {
        console.error('Backend Login Failed - Error Status:', error.response?.status);
        console.error('Backend Login Failed - Error Data:', error.response?.data);
        console.error('Backend Login Failed - Error Message:', error.message);
      }
    },
    onError: (error) => console.log('Google Login Failed:', error)
  });

  return (
    <div className="min-h-screen flex text-white font-sans bg-[#0d0f1a] overflow-hidden">

      {/* --- CUSTOM 3D ANIMATION STYLES --- */}
      <style>{`
        @keyframes slow-spin-3d {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .animate-3d-spin {
          animation: slow-spin-3d 10s linear infinite; /* Increased speed slightly for better effect */
        }
        /* Enhance the 3D effect */
        .perspective-container {
          perspective: 1000px;
        }
      `}</style>

      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative bg-gradient-to-br from-blue-900 via-[#0a0f25] to-[#0d0f1a] p-12">

        {/* Abstract Background Animation */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none"></div>
        <svg className="absolute top-0 right-0 w-[150%] h-[150%] text-blue-500/10 transform -translate-y-1/4 translate-x-1/4 animate-[spin_120s_linear_infinite]" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="2" strokeDasharray="10 20" />
          <circle cx="400" cy="400" r="200" stroke="currentColor" strokeWidth="1" strokeDasharray="5 15" />
          <path d="M400 100 L400 700 M100 400 L700 400" stroke="currentColor" strokeWidth="1" className="opacity-50" />
        </svg>

        {/* --- CENTER CONTENT WRAPPER --- */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl perspective-container">

          {/* LOGO BOX (Static Glass Panel) */}
          <div className="inline-block bg-white/5 p-10 rounded-[3rem] backdrop-blur-md border border-white/10 shadow-2xl mb-10 transition-transform duration-500 hover:scale-105">
            <img
              src={bitLogo}
              alt="Bannari Amman Institute of Technology"
              // ANIMATION IS NOW HERE: Only the image spins!
              className="w-[400px] object-contain opacity-95 drop-shadow-2xl animate-3d-spin"
            />
          </div>

          {/* TEXT BLOCK */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
              Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#ec4899]">Back</span>
            </h1>
            <p className="text-xl text-blue-100/80 font-medium leading-relaxed max-w-lg mx-auto">
              Bannari Amman Institute of Technology<br />
              <span className="text-sm text-blue-300/60 mt-2 block">Learning Resource Alignment System</span>
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#11131a] relative z-20">
        <div className="w-full max-w-md bg-[#161821] p-8 md:p-10 rounded-3xl border border-gray-800 shadow-2xl">

          {/* Form Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Sign In</h2>
            <p className="text-gray-400 text-sm">Enter your credentials to continue</p>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm text-center">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
              {errorMsg}
            </div>
          )}

          {/* Form Inputs */}
          {step === 1 ? (
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Login as</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3.5 bg-[#1e2029] border border-gray-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <input
                  type="email"
                  required
                  autoComplete="new-email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#1e2029] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-[#1e2029] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</Link>
            </div>

            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#3b82f6] to-[#a855f7] hover:from-[#2563eb] hover:to-[#9333ea] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]">
              Sign In
            </button>

            {/* Social Logins */}
            <div className="flex items-center space-x-4 py-3">
              <div className="flex-1 border-t border-gray-700"></div>
              <span className="text-gray-500 text-sm font-medium">or continue with</span>
              <div className="flex-1 border-t border-gray-700"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => loginWithGoogle()} className="flex items-center justify-center space-x-2 py-3 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors group">
                <svg className="w-5 h-5 text-white group-hover:text-blue-400 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                <span className="font-semibold text-white">Google</span>
              </button>
              <button type="button" onClick={handleGithubLogin} className="flex items-center justify-center space-x-2 py-3 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors group">
                <svg className="w-5 h-5 text-white group-hover:text-gray-300 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                <span className="font-semibold text-white">GitHub</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <span className="text-gray-400 text-sm">Don't have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign Up</Link></span>
            </div>

          </form>
          ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Enter 6-Digit OTP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#1e2029] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono tracking-widest text-center"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">OTP was sent to <strong>{email}</strong></p>
            </div>

            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-[#3b82f6] to-[#a855f7] hover:from-[#2563eb] hover:to-[#9333ea] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]">
              Verify & Login
            </button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => { setStep(1); setSuccessMsg(''); setErrorMsg(''); setOtp(''); }} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                ← Back to Login
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;