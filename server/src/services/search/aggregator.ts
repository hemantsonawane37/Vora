import { AssetProvider, Asset, UnsplashProvider, PexelsProvider, YouTubeMock, FreepikMock, SearchOptions } from './providers';

// Initialize providers
const providers: AssetProvider[] = [
    new UnsplashProvider(),
    new PexelsProvider(),
    new YouTubeMock(),
    new FreepikMock()
];

import { verifyImageRelevance } from '../ai/aiService';
import ReviewItem from '../../models/ReviewItem';

export const searchAggregator = async (query: string, page: number, options?: SearchOptions): Promise<Asset[]> => {
    console.log(`Aggregating search for: ${query} (Page ${page}) | Options: ${JSON.stringify(options)}`);

    // Launch all searches in parallel
    const promises = providers.map(async (provider) => {
        try {
            return await provider.search(query, page, options);
        } catch (error) {
            console.error(`Error in ${provider.name}:`, error);
            return [];
        }
    });

    const results = await Promise.all(promises);
    const allAssets = results.flat();

    // AI Verification Step (Optional: Only if results exist)
    if (allAssets.length > 0) {
        console.log(`Verifying ${allAssets.length} assets with AI Engine...`);

        // We can verify in parallel
        const verificationPromises = allAssets.map(async (asset) => {
            if (asset.type !== 'image') return asset; // Skip video/icons for now

            const verification = await verifyImageRelevance(query, asset.thumbnail, options?.color, asset.location);

            // Log for debugging
            const details = verification.details || { semantic_score: 0, visual_penalty: 0 };
            const logDetail = `(Score: ${verification.score} | Sem: ${details.semantic_score} | VisPen: ${details.visual_penalty})`;

            if (verification.verified) {
                console.log(`[AI PASS] ${asset.title} ${logDetail}`);
                return asset;
            } else {
                console.log(`[AI REJECT] ${asset.title} ${logDetail}`);
                // Save to Review Queue
                try {
                    await ReviewItem.create({
                        term: query,
                        image: asset.thumbnail,
                        source: asset.source,
                        confidence: verification.score,
                        status: 'pending'
                    });
                } catch (e) {
                    console.error('Failed to save review item', e);
                }
                return null; // Mark for removal
            }
        });

        const verifiedResults = await Promise.all(verificationPromises);
        return verifiedResults.filter(Boolean) as Asset[];
    }

    return allAssets;
};
