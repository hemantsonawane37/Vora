import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Users, Settings, LogOut, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Scrapers & APIs', icon: Database, path: '/admin/scrapers' },
        { name: 'Review Queue', icon: CheckCircle, path: '/admin/reviews' },
        { name: 'Users', icon: Users, path: '/admin/users' },
        { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card flex flex-col">
                <div className="p-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Designer<span className="text-primary">Hub</span>
                        <span className="text-xs ml-2 text-muted-foreground font-normal">Admin</span>
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b flex items-center px-6 justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                    <h1 className="font-semibold text-lg">Control Center</h1>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            AD
                        </div>
                    </div>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
