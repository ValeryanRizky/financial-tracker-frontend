import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ArrowLeftRight,
    Wallet,
    Target,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Transactions', icon: <ArrowLeftRight size={20} />, path: '/transactions' },
        { name: 'Wallet', icon: <Wallet size={20} />, path: '/Wallet' },
        { name: 'Goals', icon: <Target size={20} />, path: '/Goals' },
        { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/Analytics' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
        window.dispatchEvent(new Event('user-logout'));
        setIsOpen(false);
    };

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Button - Posisi lebih baik */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-5 left-5 z-50 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all md:hidden border border-slate-100"
            >
                <Menu size={22} className="text-slate-700" />
            </button>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50"
                    >
                        <div className="flex flex-col h-full p-5">
                            {/* Header with Close Button */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">F</span>
                                    </div>
                                    <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        FinSet
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <nav className="flex-1 space-y-2">
                                {menuItems.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        onClick={handleLinkClick}
                                        className={({ isActive }) =>
                                            `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span className={isActive ? 'text-white' : 'text-slate-500'}>
                                                    {item.icon}
                                                </span>
                                                <span className="font-semibold text-[15px]">{item.name}</span>
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </nav>

                            {/* Logout Button */}
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
                                >
                                    <LogOut size={20} />
                                    <span className="font-semibold text-[15px]">Logout</span>
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="sticky top-0 h-screen w-72 p-4 shrink-0 hidden md:block">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col p-6 h-full">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">F</span>
                        </div>
                        <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            FinSet
                        </span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={isActive ? 'text-white' : 'text-slate-500'}>
                                            {item.icon}
                                        </span>
                                        <span className="font-semibold text-[15px]">{item.name}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
                        >
                            <LogOut size={20} />
                            <span className="font-semibold text-[15px]">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}