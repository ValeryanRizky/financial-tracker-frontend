import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Tambahkan useNavigate
import {
    LayoutDashboard,
    ArrowLeftRight,
    Wallet,
    Target,
    PieChart,
    BarChart3,
    Settings,
    HelpCircle,
    LogOut,
    ChevronLeft
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate(); // Untuk redirect setelah logout

    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Transactions', icon: <ArrowLeftRight size={20} />, path: '/transactions' },
        { name: 'Wallet', icon: <Wallet size={20} />, path: '/Wallet' },
        { name: 'Goals', icon: <Target size={20} />, path: '/Goals' },
        { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/Analytics' },
    ];

    // 🔥 FUNGSI LOGOUT
    const handleLogout = () => {
        // Hapus semua data user dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect ke halaman login
        navigate('/');

        // Optional: Trigger event untuk komponen lain yang perlu tahu user logout
        window.dispatchEvent(new Event('user-logout'));
    };

    return (
        <aside className="sticky top-0 h-screen w-72 p-4 flex flex-col shrink-0">
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col p-6 relative">

                <button className="absolute -right-3 top-20 bg-white border border-slate-100 rounded-full p-1 shadow-sm text-slate-400 hover:text-blue-600 transition-colors">
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center overflow-hidden">
                        <span className="text-white font-bold text-xl tracking-tighter">F</span>
                    </div>
                    <span className="text-xl font-extrabold text-slate-800 tracking-tight">FinSet</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-bold text-[15px]">{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto space-y-2">
                    <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all font-bold text-[15px]">
                        <HelpCircle size={22} />
                        <span>Help</span>
                    </button>

                    {/* 🔥 TOMBOL LOGOUT DENGAN FUNGSI */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all font-bold text-[15px] group"
                    >
                        <LogOut size={22} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span>Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}