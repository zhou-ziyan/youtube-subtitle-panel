// Captions — fetch and parse subtitle data from local server

const SUBTITLE_SERVER = 'http://localhost:9876';

function parseSrv3Captions(body) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(body, 'text/xml');

    // <p t="ms" d="ms"> format (yt-dlp output)
    let elements = Array.from(xml.querySelectorAll('p[t][d]'));
    if (elements.length > 0) {
        return elements
            .map(el => {
                const startMs = parseInt(el.getAttribute('t') || '0', 10);
                const durMs = parseInt(el.getAttribute('d') || '3000', 10);
                return {
                    startTime: startMs,
                    duration: durMs,
                    endTime: startMs + durMs,
                    text: el.textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
                };
            })
            .filter(c => c.text);
    }

    // <text start="seconds" dur="seconds"> format (classic timedtext)
    elements = Array.from(xml.querySelectorAll('text'));
    if (elements.length > 0) {
        return elements
            .map(el => {
                const startMs = Math.round(parseFloat(el.getAttribute('start') || '0') * 1000);
                const durMs = Math.round(parseFloat(el.getAttribute('dur') || '3') * 1000);
                return {
                    startTime: startMs,
                    duration: durMs,
                    endTime: startMs + durMs,
                    text: el.textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
                };
            })
            .filter(c => c.text);
    }

    throw new Error('No captions found in response');
}

async function fetchCaptions(langCode, videoId) {
    console.log('[fetchCaptions] Fetching — lang:', langCode, '| video:', videoId);
    const resp = await fetch(`${SUBTITLE_SERVER}/captions?v=${videoId}&lang=${langCode}`);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error || `Server returned ${resp.status}`);
    }
    const body = await resp.text();
    console.log('[fetchCaptions] Got caption data, length:', body.length);
    return parseSrv3Captions(body);
}
