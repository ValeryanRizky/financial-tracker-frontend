import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';  // ← TAMBAHKAN IMPORT INI

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // ✅ PAKAI authService, BUKAN fetch langsung!
            const response = await authService.login(email, password);

            if (response.success) {
                // Redirect ke Dashboard
                navigate('/Dashboard');
            } else {
                setError(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#e2e8f0]">
            {/* Background blur elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/40 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[120px]" />

            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-purple-200/50 blur-[60px]"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[440px] px-6 py-12 m-4 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            >
                <div className="flex flex-col items-center">
                    {/* Logo */}
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50 mb-4">
                        <Wallet className="text-white w-8 h-8" />
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Financial Tracker</h1>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
                        >
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="w-full space-y-6 mt-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full bg-white/50 border border-slate-200/50 py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-white/50 border border-slate-200/50 py-4 pl-12 pr-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 shadow-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={!loading ? { scale: 1.02, translateY: -2 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            className={`w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 group transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Masuk ke Dashboard
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <p className="text-slate-600 lg:text-slate-500 text-sm font-medium">
                            Don't have an account?
                            <button
                                onClick={() => navigate("/Register")}
                                className="ml-1.5 text-blue-700 lg:text-[#3F72AF] font-bold hover:underline underline-offset-4 decoration-2 transition-all"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}