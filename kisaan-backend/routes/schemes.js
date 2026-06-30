const express = require('express');

const router = express.Router();

let cachedSchemes = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 1000 * 60 * 60;

const FALLBACK_SCHEMES = [
    {
        id: 1,
        title: 'PM-Kisan Samman Nidhi',
        description: 'Income support of Rs 6,000 per year in three equal installments to farmer families.',
        tags: ['All Crops', 'Financial Aid'],
        link: 'https://pmkisan.gov.in'
    },
    {
        id: 2,
        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        description: 'Crop insurance scheme providing financial support in case of crop failure due to natural calamities.',
        tags: ['Insurance', 'All Crops'],
        link: 'https://pmfby.gov.in/'
    }
];

async function fetchFromMyScheme(crop) {
    try {
        const query = crop ? `agriculture ${crop} farmer` : 'agriculture farmer';
        const url = `https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=${encodeURIComponent(query)}&keyword=${encodeURIComponent(query)}&beneficiary=farmer&limit=20`;

        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'KisaanMitra/1.0'
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) throw new Error(`MyScheme API error: ${response.status}`);

        const data = await response.json();
        if (!data?.data?.schemes?.length) return null;

        return data.data.schemes.map((scheme, index) => ({
            id: scheme.schemeId || index + 1,
            title: scheme.schemeName || scheme.title || 'Government Scheme',
            description: scheme.briefDescription || scheme.description || 'Agricultural support scheme.',
            tags: [...(scheme.tags || []), ...(scheme.beneficiaries || []), 'Government'].filter(Boolean).slice(0, 5),
            link: scheme.schemeUrl || `https://myscheme.gov.in/schemes/${scheme.schemeSlug || ''}`,
            ministry: scheme.nodeName || '',
            state: scheme.state || 'Central'
        }));
    } catch (error) {
        if (!error.message.includes('401')) {
            console.warn('[Schemes]', error.message);
        }
        return null;
    }
}

async function fetchFromDataGov() {
    try {
        const apiKey = process.env.DATA_GOV_API_KEY;
        if (!apiKey) return null;

        const url = `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=${apiKey}&format=json&limit=15`;
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

        if (!response.ok) throw new Error(`Data.gov.in API error: ${response.status}`);

        const data = await response.json();
        if (!data?.records?.length) return null;

        return data.records.map((record, index) => ({
            id: index + 1,
            title: record.scheme_name || record.title || 'Agricultural Scheme',
            description: record.description || record.details || 'Government agricultural support scheme.',
            tags: ['Agriculture', 'Government'],
            link: record.url || 'https://agricoop.nic.in/',
            ministry: record.ministry || 'Ministry of Agriculture',
            state: record.state || 'Central'
        }));
    } catch (error) {
        console.error('[Schemes]', error.message);
        return null;
    }
}

router.get('/', async (req, res) => {
    const { crop } = req.query;

    try {
        let schemes = null;

        if (!crop && cachedSchemes && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            schemes = cachedSchemes;
        }

        if (!schemes) {
            const hasDataGovKey = Boolean(process.env.DATA_GOV_API_KEY);
            if (hasDataGovKey) {
                schemes = await fetchFromDataGov();
            }
            if (!schemes) {
                schemes = await fetchFromMyScheme(crop);
            }
            if (!schemes && !hasDataGovKey) {
                schemes = await fetchFromDataGov();
            }
            if (schemes && !crop) {
                cachedSchemes = schemes;
                cacheTimestamp = Date.now();
            }
        }

        if (!schemes?.length) {
            schemes = FALLBACK_SCHEMES;
        }

        if (crop) {
            const cropLower = String(crop).toLowerCase();
            schemes.sort((a, b) => {
                const aMatch = a.tags.some((tag) => tag.toLowerCase().includes(cropLower));
                const bMatch = b.tags.some((tag) => tag.toLowerCase().includes(cropLower));
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            });
        }

        return res.json(schemes);
    } catch (error) {
        console.error('[Schemes]', error);
        return res.json(FALLBACK_SCHEMES);
    }
});

module.exports = router;
