import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, ExternalLink } from 'lucide-react';

export default function Home() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [orientation, setOrientation] = useState('any'); // any, landscape, portrait, squarish
    const [color, setColor] = useState('any'); // any, black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, blue

    const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
        if (e) e.preventDefault();
        const finalQuery = searchQuery || query;
        if (!finalQuery.trim()) return;

        // Update query state if we clicked a suggestion
        if (searchQuery) setQuery(searchQuery);

        setLoading(true);
        setSearched(true);
        setPage(1);
        setResults([]);
        setSuggestions([]); // Clear old suggestions
        setHasMore(true);

        try {
            const url = `http://localhost:5001/api/search?q=${encodeURIComponent(finalQuery)}&page=1&orientation=${orientation}&color=${color}`;
            const res = await fetch(url);
            const data = await res.json();

            // Handle new response format { results, suggestions } or old [results]
            const newResults = Array.isArray(data) ? data : data.results || [];
            const newSuggestions = !Array.isArray(data) ? data.suggestions || [] : [];

            setResults(newResults);
            setSuggestions(newSuggestions);

            if (newResults.length === 0) setHasMore(false);
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (loading || !hasMore) return;
        const nextPage = page + 1;
        setLoading(true);

        try {
            const url = `http://localhost:5001/api/search?q=${encodeURIComponent(query)}&page=${nextPage}&orientation=${orientation}&color=${color}`;
            const res = await fetch(url);
            const data = await res.json();

            // Load more only returns results (usually) or same envelope
            const newResults = Array.isArray(data) ? data : data.results || [];

            if (newResults.length === 0) {
                setHasMore(false);
            } else {
                setResults(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueData = newResults.filter((item: any) => !existingIds.has(item.id));
                    return [...prev, ...uniqueData];
                });
                setPage(nextPage);
            }
        } catch (err) {
            console.error('Load more failed', err);
        } finally {
            setLoading(false);
        }
    };

    // Live Suggestions (Debounced)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length > 2 && !searched) {
                try {
                    const res = await fetch(`http://localhost:5001/api/search?q=${encodeURIComponent(query)}&page=1&suggestionsOnly=true`);
                    const data = await res.json();
                    if (data.suggestions) {
                        setSuggestions(data.suggestions);
                    }
                } catch (err) {
                    console.error('Live suggestion failed', err);
                }
            } else if (query.trim().length <= 2) {
                setSuggestions([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query, searched]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const colors = [
        { name: 'any', class: 'bg-white border-dashed border-2 border-gray-300' },
        { name: 'black_and_white', class: 'bg-gradient-to-r from-gray-200 to-gray-800' },
        { name: 'black', class: 'bg-black' },
        { name: 'white', class: 'bg-white border border-gray-200' },
        { name: 'yellow', class: 'bg-yellow-400' },
        { name: 'orange', class: 'bg-orange-500' },
        { name: 'red', class: 'bg-red-500' },
        { name: 'purple', class: 'bg-purple-600' },
        { name: 'magenta', class: 'bg-pink-500' },
        { name: 'green', class: 'bg-green-500' },
        { name: 'teal', class: 'bg-teal-400' },
        { name: 'blue', class: 'bg-blue-500' },
    ];

    const orientations = [
        { id: 'any', label: 'Any' },
        { id: 'landscape', label: 'Landscape' },
        { id: 'portrait', label: 'Portrait' },
        { id: 'squarish', label: 'Square' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-4 pt-20 transition-all duration-500">
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: searched ? 0 : 100 }}
                transition={{ duration: 0.5 }}
                className={`text-center space-y-8 w-full max-w-4xl ${searched ? 'mb-8' : 'mb-0'}`}
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                        Designer<span className="text-primary">Hub</span>
                    </h1>
                    {!searched && (
                        <p className="text-muted-foreground text-xl">
                            The Zero-Tab Discovery Engine
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
                    <div className="flex gap-2 w-full">
                        <Input
                            value={query}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Search 20+ sources (Unsplash, Envato, YouTube)..."
                            className="h-12 text-lg shadow-sm"
                        />
                        <Button size="lg" onClick={(e) => handleSearch(e)} disabled={loading} className="h-12 px-8 font-semibold">
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>

                    {/* Filter Controls */}
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col md:flex-row gap-6 items-center justify-center p-4 bg-secondary/30 rounded-xl backdrop-blur-sm"
                    >
                        {/* Orientation Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orientation</span>
                            <div className="flex bg-background rounded-lg p-1 shadow-sm">
                                {orientations.map((o) => (
                                    <button
                                        key={o.id}
                                        onClick={() => setOrientation(o.id)}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${orientation === o.id
                                                ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                                                : 'text-muted-foreground hover:bg-secondary'
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color</span>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                {colors.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => setColor(c.name)}
                                        title={c.name.replace('_', ' ')}
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${c.class} ${color === c.name
                                                ? 'ring-2 ring-primary ring-offset-2 scale-110'
                                                : 'hover:ring-1 hover:ring-primary/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Suggestions Chips */}
                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 justify-center"
                            >
                                {suggestions.map((s, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSearch(undefined, s)}
                                        className="px-3 py-1 bg-secondary/80 hover:bg-secondary text-secondary-foreground text-sm rounded-full transition-colors border border-transparent hover:border-primary/20 backdrop-blur-sm"
                                    >
                                        ✨ {s}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {searched && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-7xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {results.map((item: any, i) => (
                                <motion.div
                                    key={item.id || i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="overflow-hidden group cursor-pointer border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card">
                                        <div className="aspect-video relative overflow-hidden bg-muted">
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                                                {item.source}
                                            </div>
                                            {item.premium && (
                                                <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs px-2 py-1 rounded font-bold">
                                                    PRO
                                                </div>
                                            )}

                                            {/* Smart Action Button (Visible on Hover) */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <Button
                                                    size="sm"
                                                    className={item.premium ? "bg-white text-black hover:bg-white/90" : "bg-primary hover:bg-primary/90"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(item.downloadUrl, '_blank');
                                                    }}
                                                >
                                                    {item.premium ? (
                                                        <>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            Visit Site
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold truncate">{item.title}</h3>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                                <span>{item.type}</span>
                                                <span>{item.dimensions || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                        {results.length === 0 && !loading && (
                            <div className="text-center text-muted-foreground py-20">
                                No results found. Try "nature", "code", or "mockup".
                            </div>
                        )}

                        {/* Load More Button */}
                        {results.length > 0 && hasMore && (
                            <div className="mt-12 flex justify-center">
                                <Button
                                    onClick={loadMore}
                                    disabled={loading}
                                    variant="secondary"
                                    className="w-48"
                                >
                                    {loading ? 'Loading...' : 'Load More Results'}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
