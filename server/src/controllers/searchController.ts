import { Request, Response } from 'express';
import { searchAggregator } from '../services/search/aggregator';
import { getCache, setCache, trackSearch } from '../config/redis';
import { expandQuery } from '../services/ai/aiService';

export const searchAssets = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string) || 1;

        if (!query) {
            res.status(400).json({ message: 'Query parameter "q" is required' });
            return;
        }

        const suggestionsOnly = req.query.suggestionsOnly === 'true';

        // Extract Filters
        const orientation = req.query.orientation as string || 'any';
        const color = req.query.color as string || 'any';

        const filters = { orientation, color };

        const bypassCache = query.startsWith('!');
        const cleanQuery = bypassCache ? query.substring(1) : query;
        // Update Cache Key to include filters (v3)
        const finalCacheKey = `search_v3:${cleanQuery.trim().toLowerCase()}:p${page}:o${orientation}:c${color}`;

        if (!bypassCache) {
            const cachedResults = await getCache(finalCacheKey);
            if (cachedResults) {
                console.log(`[Cache Hit] Key: ${finalCacheKey}`);
                // Cache now stores the full object { results, suggestions }
                res.json(JSON.parse(cachedResults));
                return;
            }
        }

        console.log(`[Cache Miss] Searching for: ${cleanQuery} (Page ${page}) | SuggestionsOnly: ${suggestionsOnly} | Filters: ${JSON.stringify(filters)}`);

        // Step 1: Get AI Expansion & Optimized Query (Logic V6)
        // We strictly wait for this to ensure we use the "Zero-Hallucination" query terms
        const aiResult = (page === 1 || suggestionsOnly)
            ? await expandQuery(cleanQuery)
            : { expansions: [], optimized_query: cleanQuery };

        const searchToUse = aiResult.optimized_query;
        const suggestions = aiResult.expansions;

        console.log(`[SearchController] Optimized Query: "${searchToUse}"`);

        // Step 2: Perform Search with Optimized Terms
        const results = !suggestionsOnly
            ? await searchAggregator(searchToUse, page, filters)
            : [];

        console.log(`[SearchController] Query: "${searchToUse}" | Results: ${results.length} | Suggestions: ${JSON.stringify(suggestions)}`);

        const responseData = { results, suggestions };

        // Only cache if we have results
        if (results.length > 0) {
            await setCache(finalCacheKey, JSON.stringify(responseData), 3600);
        }

        // Track Analytics (Async, don't block response)
        trackSearch(cleanQuery).catch(err => console.error('Tracking Error:', err));

        res.json(responseData);
    } catch (error) {
        console.error('Search Controller Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
