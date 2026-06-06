import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await authService.register({
                name: name,
                email: email,
                password: password
            });

            if (response.success) {
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Register error:', error);
            setError(error.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#e2e8f0]">
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
                className="relative z-10 w-full max-w-[90%] sm:max-w-[440px] px-4 sm:px-6 py-8 sm:py-12 m-4 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl sm:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            >
                <div className="flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50 mb-3 sm:mb-4">
                        <Wallet className="text-white w-7 h-7 sm:w-8 sm:h-8" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Create Account</h1>

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full mt-3 sm:mt-4 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600"
                        >
                            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="text-xs sm:text-sm font-medium">{success}</span>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600"
                        >
                            <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="text-xs sm:text-sm font-medium">{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleRegister} className="w-full space-y-4 sm:space-y-5 mt-4 sm:mt-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full Name"
                                className="w-full bg-white/50 border border-slate-200/50 py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 text-sm sm:text-base shadow-sm"
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none">
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full bg-white/50 border border-slate-200/50 py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 text-sm sm:text-base shadow-sm"
                                required
                                disabled={loading || success}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none">
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password (min. 6 characters)"
                                className="w-full bg-white/50 border border-slate-200/50 py-3 sm:py-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 text-sm sm:text-base shadow-sm"
                                required
                                minLength={6}
                                disabled={loading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                disabled={loading || success}
                            >
                                {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                            </button>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading || success}
                            whileHover={!loading && !success ? { scale: 1.02, translateY: -2 } : {}}
                            whileTap={!loading && !success ? { scale: 0.98 } : {}}
                            className={`w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 group transition-all text-sm sm:text-base ${(loading || success) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    <span>Redirecting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2">
                        <p className="text-slate-600 text-xs sm:text-sm font-medium">
                            Already have an account?
                            <button
                                onClick={() => navigate("/")}
                                className="ml-1.5 text-blue-700 font-bold hover:underline underline-offset-4 decoration-2 transition-all"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}