import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Users, Search, DollarSign } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log('Fetching stats from http://localhost:5001/api/admin/stats');
                const res = await fetch('http://localhost:5001/api/admin/stats');
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                console.log('Stats received:', data);
                setStats(data);
            } catch (err: any) {
                console.error('Fetch error:', err);
                setError(err.message || 'Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getIcon = (name: string) => {
        switch (name) {
            case 'Total Searches': return Search;
            case 'Active Users': return Users;
            case 'API Latency': return Activity;
            case 'Revenue': return DollarSign;
            default: return Activity;
        }
    };

    if (loading) return <div className="p-6">Loading dashboard stats...</div>;

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <h3 className="font-bold">Connection Error</h3>
                    <p>Could not fetch stats from Backend.</p>
                    <p className="text-sm mt-2 font-mono">{error}</p>
                    <div className="mt-4 text-sm text-muted-foreground">
                        <p>Troubleshooting:</p>
                        <ul className="list-disc ml-5">
                            <li>Ensure Backend is running on port 5000</li>
                            <li>Check terminal for server errors</li>
                            <li>Restart the server manually</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = getIcon(stat.name);
                    return (
                        <Card key={stat.name} className="p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-muted-foreground font-medium">{stat.name}</span>
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${stat.type === 'increase'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 h-[400px] flex items-center justify-center border-dashed">
                    <p className="text-muted-foreground">Search Volume Chart (Recharts Integration)</p>
                </Card>
                <Card className="p-6 h-[400px] flex items-center justify-center border-dashed">
                    <p className="text-muted-foreground">Source Usage Distribution</p>
                </Card>
            </div>
        </div>
    );
}
