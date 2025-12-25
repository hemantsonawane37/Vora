import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

export default function ReviewQueue() {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetch('http://localhost:5001/api/admin/review-queue')
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error(err));
    }, []);

    const handleReview = async (id: string, approved: boolean) => {
        // Optimistic update
        setItems(items.filter(i => i._id !== id));

        try {
            await fetch(`http://localhost:5001/api/admin/review-queue/${id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved })
            });
        } catch (err) {
            console.error('Review failed', err);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <Check className="w-12 h-12 mb-4 text-green-500" />
                <h3 className="text-xl font-bold">All caught up!</h3>
                <p>No items pending review.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Accuracy Review Queue</h2>
                <p className="text-muted-foreground">Validate search results with low confidence scores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <Card key={item._id} className="overflow-hidden">
                        <div className="aspect-video relative bg-muted">
                            <img src={item.image} alt={item.term} className="w-full h-full object-cover" />
                            <Badge className="absolute top-2 right-2 bg-black/50 text-white backdrop-blur-md">
                                {item.source}
                            </Badge>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Search Term</p>
                                    <h3 className="font-semibold">"{item.term}"</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Confidence</p>
                                    <span className={`font-mono font-bold ${item.confidence > 0.8 ? 'text-green-500' :
                                        item.confidence > 0.5 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                        {(item.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                    onClick={() => handleReview(item._id, false)}
                                >
                                    <X className="w-4 h-4 mr-2" /> Reject
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleReview(item._id, true)}
                                >
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
