const express = require('express');

const router = express.Router();

const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30;

const FALLBACK_PRICES = [
    { id: 1, crop: 'Wheat', mandi: 'Delhi APMC', price: 'Rs 2300/q', trend: 'up', change: '+Rs45' },
    { id: 2, crop: 'Rice', mandi: 'Pune APMC', price: 'Rs 3000/q', trend: 'down', change: '-Rs30' },
    { id: 3, crop: 'Cotton', mandi: 'Nagpur APMC', price: 'Rs 7100/q', trend: 'up', change: '+Rs120' },
    { id: 4, crop: 'Soybean', mandi: 'Indore APMC', price: 'Rs 4300/q', trend: 'up', change: '+Rs80' }
];

async function fetchAgmarknet(crop, state) {
    try {
        const apiKey = process.env.DATA_GOV_API_KEY;
        if (!apiKey) return null;

        let filters = '';
        if (crop) filters += `&filters[commodity]=${encodeURIComponent(crop)}`;
        if (state) filters += `&filters[state]=${encodeURIComponent(state)}`;

        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=20${filters}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

        if (!response.ok) {
            throw new Error(`Agmarknet API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data?.records?.length) return null;

        return data.records.map((record, index) => {
            const modalPrice = parseFloat(record.modal_price || record.max_price || 0);
            const minPrice = parseFloat(record.min_price || modalPrice);
            const diff = Math.round(modalPrice - minPrice);

            return {
                id: index + 1,
                crop: record.commodity || crop || 'Unknown',
                mandi: `${record.market || 'Local'} APMC, ${record.district || record.state || ''}`.trim(),
                price: `Rs ${Math.round(modalPrice)}/q`,
                trend: diff >= 0 ? 'up' : 'down',
                change: diff >= 0 ? `+Rs${diff}` : `-Rs${Math.abs(diff)}`,
                state: record.state || '',
                date: record.arrival_date || ''
            };
        });
    } catch (error) {
        console.error('[Market]', error.message);
        return null;
    }
}

router.get('/', async (req, res) => {
    const { crop, location } = req.query;
    const state = location?.includes(',') ? location.split(',').pop().trim() : (location || '');
    const cacheKey = `${crop || 'all'}-${state || 'all'}`;

    try {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return res.json(cached.data);
        }

        let marketRates = await fetchAgmarknet(crop, state);
        if (!marketRates && crop) {
            marketRates = await fetchAgmarknet(crop, '');
        }
        if (!marketRates) {
            marketRates = await fetchAgmarknet('', '');
        }
        if (!marketRates?.length) {
            marketRates = FALLBACK_PRICES;
        }

        if (crop) {
            const cropLower = String(crop).toLowerCase();
            const index = marketRates.findIndex((item) => item.crop.toLowerCase() === cropLower);
            if (index > 0) {
                const [userCrop] = marketRates.splice(index, 1);
                marketRates.unshift(userCrop);
            }
        }

        cache.set(cacheKey, { data: marketRates, timestamp: Date.now() });
        return res.json(marketRates);
    } catch (error) {
        console.error('[Market]', error);
        return res.json(FALLBACK_PRICES);
    }
});

module.exports = router;
