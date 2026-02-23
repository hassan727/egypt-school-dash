import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Building2, LayoutDashboard, Package, Puzzle, Activity,
    ScrollText, LogOut, ChevronRight, Shield, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/platform', icon: LayoutDashboard, label: 'لوحة التحكم', labelEn: 'Dashboard' },
    { path: '/platform/schools', icon: Building2, label: 'إدارة المدارس', labelEn: 'Schools' },
    { path: '/platform/plans', icon: Package, label: 'إدارة الباقات', labelEn: 'Plans' },
    { path: '/platform/features', icon: Puzzle, label: 'إدارة الخصائص', labelEn: 'Features' },
    { path: '/platform/monitoring', icon: Activity, label: 'مراقبة النظام', labelEn: 'Monitoring' },
    { path: '/platform/audit', icon: ScrollText, label: 'سجل العمليات', labelEn: 'Audit Log' },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-950 text-white flex" dir="rtl">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 border-l border-gray-800 flex flex-col transition-all duration-300 fixed h-full z-40`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-lg">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-sm">منصة الإدارة</h2>
                                <p className="text-[10px] text-gray-400">Platform Owner</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-gray-800"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 space-y-1 px-2">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/platform' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm
                  ${isActive
                                        ? 'bg-gradient-to-l from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
                                {sidebarOpen && (
                                    <>
                                        <span className="flex-1">{item.label}</span>
                                        {isActive && <ChevronRight className="h-3 w-3 text-violet-400" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-800">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-sm"
                        onClick={() => navigate('/')}
                    >
                        <LogOut className="h-4 w-4" />
                        {sidebarOpen && 'العودة للمنصة'}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-64' : 'mr-16'}`}>
                <div className="p-6 min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
