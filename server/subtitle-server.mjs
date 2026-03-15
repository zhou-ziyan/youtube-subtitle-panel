import http from 'http';
import { execFile } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const PORT = 9876;

function handleCaptions(videoId, lang, res) {
    const tmpPath = join(tmpdir(), `yt-sub-${videoId}-${lang}`);

    execFile('yt-dlp', [
        '--write-sub', '--write-auto-sub',
        '--sub-lang', lang,
        '--sub-format', 'srv3',
        '--skip-download',
        '-o', tmpPath,
        `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 15000 }, async (err, stdout, stderr) => {
        if (err) {
            console.error('[server] yt-dlp error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }

        // yt-dlp writes to <output>.lang.srv3
        const filePath = `${tmpPath}.${lang}.srv3`;
        try {
            const data = await readFile(filePath, 'utf-8');
            console.log(`[server] Got captions: ${lang}, ${data.length} bytes`);
            res.writeHead(200, {
                'Content-Type': 'text/xml',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(data);
            await unlink(filePath).catch(() => {});
        } catch (readErr) {
            console.error('[server] File read error:', readErr.message);
            console.error('[server] stderr:', stderr);
            res.writeHead(404, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ error: `No subtitles found for lang=${lang}` }));
        }
    });
}

function handleListLangs(videoId, res) {
    execFile('yt-dlp', [
        '--list-subs',
        '--skip-download',
        `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 15000 }, (err, stdout, stderr) => {
        if (err) {
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }

        // Parse yt-dlp --list-subs output
        const tracks = [];
        const lines = stdout.split('\n');
        let inSection = false;
        let isAuto = false;

        for (const line of lines) {
            if (line.includes('Available subtitles')) {
                inSection = true;
                isAuto = false;
                continue;
            }
            if (line.includes('Available automatic captions')) {
                inSection = true;
                isAuto = true;
                continue;
            }
            if (!inSection) continue;
            if (line.startsWith('Language')) continue; // header row
            if (line.trim() === '') { inSection = false; continue; }

            // Format: "en       English      vtt, ..."
            const match = line.match(/^(\S+)\s+(.+?)\s{2,}/);
            if (match) {
                const code = match[1];
                // For auto captions, only keep the original ASR track (e.g. "en-orig")
                // and skip all auto-translations
                if (isAuto && !code.endsWith('-orig')) continue;

                tracks.push({
                    languageCode: code,
                    languageName: match[2].trim(),
                    kind: isAuto ? 'asr' : undefined,
                });
            }
        }

        console.log(`[server] Listed ${tracks.length} subtitle tracks for ${videoId}`);
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ tracks }));
    });
}

const server = http.createServer((req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/captions') {
        const videoId = url.searchParams.get('v');
        const lang = url.searchParams.get('lang') || 'en';
        if (!videoId) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Missing ?v= parameter' }));
            return;
        }
        handleCaptions(videoId, lang, res);
        return;
    }

    if (url.pathname === '/langs') {
        const videoId = url.searchParams.get('v');
        if (!videoId) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Missing ?v= parameter' }));
            return;
        }
        handleListLangs(videoId, res);
        return;
    }

    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`[subtitle-server] Running on http://localhost:${PORT}`);
    console.log(`[subtitle-server] Endpoints:`);
    console.log(`  GET /langs?v=VIDEO_ID         — list available subtitle languages`);
    console.log(`  GET /captions?v=VIDEO_ID&lang=en — download captions as srv3 XML`);
    console.log(`  GET /health                    — health check`);
});
