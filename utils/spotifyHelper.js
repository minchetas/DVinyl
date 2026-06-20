const axios = require('axios');

const TIMEOUT = 8000;
const _cache = {}; // keyed by clientId

async function getAccessToken(clientId, clientSecret) {
    const now = Date.now();
    if (_cache[clientId] && now < _cache[clientId].expiry) return _cache[clientId].token;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const resp = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
            timeout: TIMEOUT,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${credentials}` }
        }
    );

    _cache[clientId] = {
        token: resp.data.access_token,
        expiry: now + (resp.data.expires_in - 60) * 1000
    };
    return _cache[clientId].token;
}

async function searchAlbumId(clientId, clientSecret, artist, title) {
    const token = await getAccessToken(clientId, clientSecret);
    const q = encodeURIComponent(`${artist} ${title}`);
    const resp = await axios.get(
        `https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`,
        { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } }
    );
    const items = resp.data.albums?.items;
    return items && items.length > 0 ? items[0].id : null;
}

module.exports = { searchAlbumId };
