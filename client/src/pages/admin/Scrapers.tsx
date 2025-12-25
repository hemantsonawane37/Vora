import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddSourceModal } from '@/components/admin/AddSourceModal';

export default function Scrapers() {
    const [scrapers, setScrapers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:5001/api/admin/scrapers')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                return res.json();
            })
            .then(data => setScrapers(data))
            .catch(err => setError(err.message));
    }, []);

    if (error) return <div className="p-6 text-red-500">Error loading scrapers: {error}</div>;

    const getStatusColor = (status: string) => {
        if (status === 'healthy') return 'bg-green-500 hover:bg-green-600';
        if (status === 'warning') return 'bg-yellow-500 hover:bg-yellow-600';
        return 'bg-destructive hover:bg-destructive';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Scraper Health Monitor</h2>
                <AddSourceModal />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scrapers.map((s) => (
                    <Card key={s.name} className="p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg">{s.name}</h3>
                            <Badge className={getStatusColor(s.status)}>{s.status.toUpperCase()}</Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Latency:</span>
                                <span className="font-mono">{s.latency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Errors (24h):</span>
                                <span className="font-mono">{s.errors}</span>
                            </div>
                        </div>

                        {/* Status Light Effect */}
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-20 -mr-10 -mt-10 pointer-events-none ${getStatusColor(s.status)}`} />
                    </Card>
                ))}
            </div>
        </div>
    );
}
