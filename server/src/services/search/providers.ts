import fetch from 'node-fetch';

export interface Asset {
    id: string;
    title: string;
    thumbnail: string;
    source: string;
    downloadUrl?: string; // Direct link or page link
    type: 'image' | 'video' | 'icon' | 'font';
    premium: boolean;
    dimensions?: string;
    author: string;
    location?: {
        city?: string;
        country?: string;
    };
}

export interface SearchOptions {
    orientation?: string; // landscape, portrait, squarish
    color?: string; // black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, blue
}

export interface AssetProvider {
    name: string;
    search(query: string, page: number, options?: SearchOptions): Promise<Asset[]>;
}

export class UnsplashProvider implements AssetProvider {
    name = 'Unsplash';
    private apiKey = process.env.UNSPLASH_ACCESS_KEY;
    private apiUrl = 'https://api.unsplash.com/search/photos';

    async search(query: string, page: number = 1, options?: SearchOptions): Promise<Asset[]> {
        console.log(`[Unsplash] Searching for: ${query}, page: ${page}, options: ${JSON.stringify(options)}`);
        if (!this.apiKey) {
            console.error('[Unsplash] Missing API Key in process.env');
            return [];
        }

        try {
            let url = `${this.apiUrl}?query=${encodeURIComponent(query)}&per_page=12&page=${page}`;

            if (options?.orientation && options.orientation !== 'any') {
                url += `&orientation=${options.orientation}`;
            }

            if (options?.color && options.color !== 'any') {
                url += `&color=${options.color}`;
            }

            console.log(`[Unsplash] Fetching: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Client-ID ${this.apiKey}`
                }
            });

            console.log(`[Unsplash] Response Status: ${response.status}`);

            if (!response.ok) {
                console.error(`[Unsplash] API Error: ${response.statusText}`);
                const text = await response.text();
                // console.error(`[Unsplash] Error Body: ${text}`); // Reduced verbosity
                return [];
            }

            const data: any = await response.json();

            return data.results.map((item: any) => ({
                id: item.id,
                title: item.alt_description || item.description || 'Unsplash Image',
                thumbnail: item.urls.small,
                source: 'Unsplash',
                type: 'image',
                downloadUrl: item.links.download, // Direct download link
                premium: false,
                dimensions: `${item.width}x${item.height}`,
                author: item.user.name,
                location: {
                    city: item.user.location,
                    country: undefined
                }
            }));

        } catch (error) {
            console.error('Unsplash Fetch Error:', error);
            return [];
        }
    }
}

export class PexelsProvider implements AssetProvider {
    name = 'Pexels';
    private apiKey = process.env.PEXELS_API_KEY;
    private apiUrl = 'https://api.pexels.com/v1/search';

    async search(query: string, page: number = 1, options?: SearchOptions): Promise<Asset[]> {
        console.log(`[Pexels] Searching for: ${query}, page: ${page}, options: ${JSON.stringify(options)}`);

        // Skip if no API Key (Graceful Fallback)
        if (!this.apiKey) {
            console.warn('[Pexels] Missing API Key. Skipping.');
            return [];
        }

        try {
            let url = `${this.apiUrl}?query=${encodeURIComponent(query)}&per_page=12&page=${page}`;

            // Pexels Filter Mapping
            if (options?.orientation && options.orientation !== 'any') {
                // Pexels uses 'square', 'landscape', 'portrait'
                // Our frontend sends 'squarish' sometimes, map it.
                const orient = options.orientation === 'squarish' ? 'square' : options.orientation;
                url += `&orientation=${orient}`;
            }

            if (options?.color && options.color !== 'any') {
                // Pexels supports color names and hex. We send names.
                // Map 'black_and_white' -> Pexels doesn't support B&W via color param usually, 
                // but let's try passing the hex/name or ignore specific B&W param if not supported documentation-wise.
                // Pexels API: 'color' param (Supported: red, orange, yellow, green, turquoise, blue, violet, pink, brown, black, gray, white or hex #ffffff)
                // We'll pass the color name directly as it matches most standard ones.
                if (options.color !== 'black_and_white') {
                    url += `&color=${options.color}`;
                }
            }

            console.log(`[Pexels] Fetching: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Authorization': this.apiKey
                }
            });

            console.log(`[Pexels] Response Status: ${response.status}`);

            if (!response.ok) {
                console.error(`[Pexels] API Error: ${response.statusText}`);
                return [];
            }

            const data: any = await response.json();

            // Pexels response format validation
            if (!data.photos) return [];

            return data.photos.map((item: any) => ({
                id: `px_${item.id}`, // Prefix to avoid ID collisions
                title: item.alt || 'Pexels Image',
                thumbnail: item.src.medium, // 'medium' is good for grids (approx 350px height)
                source: 'Pexels',
                type: 'image',
                downloadUrl: item.src.original, // Direct download of original
                premium: false,
                dimensions: `${item.width}x${item.height}`,
                author: item.photographer
            }));

        } catch (error) {
            console.error('Pexels Fetch Error:', error);
            return [];
        }
    }
}

export class YouTubeMock implements AssetProvider {
    name = 'YouTube';
    async search(query: string, page: number = 1, options?: SearchOptions): Promise<Asset[]> {
        // ... (rest of YouTubeMock)

        await new Promise(resolve => setTimeout(resolve, 800));
        return [
            {
                id: `y_${Date.now()}_1`,
                title: `${query} Tutorial (4K)`,
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                source: 'YouTube',
                type: 'video',
                premium: false,
                author: 'Rick Astley VEVO',
                downloadUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
            }
        ];
    }
}

export class FreepikMock implements AssetProvider {
    name = 'Freepik';
    async search(query: string, page: number = 1, options?: SearchOptions): Promise<Asset[]> {
        // Only return results on page 1 for mock
        if (page > 1) return [];

        await new Promise(resolve => setTimeout(resolve, 300));
        return [
            {
                id: `f_${Date.now()}_1`,
                title: `${query} Vector Icon Set`,
                thumbnail: 'https://img.freepik.com/free-vector/modern-abstract-background_1048-10022.jpg',
                source: 'Freepik',
                type: 'icon',
                premium: true,
                author: 'Freepik Team',
                downloadUrl: 'https://freepik.com'
            }
        ];
    }
}
