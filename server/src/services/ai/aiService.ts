import fetch from 'node-fetch';

const AI_ENGINE_URL = 'http://127.0.0.1:8002';

export interface VerificationResult {
    query: string;
    score: number;
    verified: boolean;
    error?: string;
    details?: {
        semantic_score: number;
        visual_penalty?: number;
        color_penalty?: number;
        anchor_penalty?: number;
        context_bonus?: number;
        ratio?: number;
    };
}

export const verifyImageRelevance = async (text: string, imageUrl: string, color?: string, location?: any): Promise<VerificationResult> => {
    try {
        const response = await fetch(`${AI_ENGINE_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, image_url: imageUrl, color, location })
        });

        if (!response.ok) {
            throw new Error(`AI Engine Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('AI Verification Failed:', error);
        // Fail open (return true/1.0) if AI is down, so we don't block search
        return {
            query: text,
            score: 1.0,
            verified: true,
            error: String(error),
            details: { semantic_score: 1.0, color_penalty: 0.0 }
        };
    }
};

export const expandQuery = async (query: string): Promise<{ expansions: string[], optimized_query: string }> => {
    try {
        console.log(`[aiService] Calling AI Expansion for: "${query}"`);
        const response = await fetch(`${AI_ENGINE_URL}/expand?query=${encodeURIComponent(query)}`, {
            method: 'POST'
        });

        if (!response.ok) {
            console.error(`[aiService] Error: ${response.status} ${response.statusText}`);
            return { expansions: [query], optimized_query: query };
        }

        const data: any = await response.json();
        console.log(`[aiService] AI Response:`, data);
        return {
            expansions: data.expansions || [query],
            optimized_query: data.optimized_query || query
        };
    } catch (error) {
        console.error('AI Expansion Failed:', error);
        return { expansions: [query], optimized_query: query };
    }
};
