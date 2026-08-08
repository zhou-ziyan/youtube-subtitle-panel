import http from 'http';
import { execFile } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const PORT = 9876;

// Only accept well-formed YouTube video IDs and language codes so nothing
// unexpected reaches yt-dlp or the temp-file paths.
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const LANG_RE = /^[A-Za-z0-9._-]{1,20}$/;

// Reflect the Origin header only for YouTube pages (where the extension runs),
// so arbitrary websites can't use the visitor's browser to hit this server.
function corsHeaders(req) {
    const origin = req.headers.origin || '';
    if (/^https:\/\/([a-z0-9-]+\.)*youtube\.com$/.test(origin)) {
        return { 'Access-Control-Allow-Origin': origin };
    }
    return {};
}

function sendJson(res, status, cors, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify(payload));
}

function handleCaptions(videoId, lang, cors, res) {
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
            sendJson(res, 500, cors, { error: err.message });
            return;
        }

        // yt-dlp writes to <output>.lang.srv3
        const filePath = `${tmpPath}.${lang}.srv3`;
        try {
            const data = await readFile(filePath, 'utf-8');
            console.log(`[server] Got captions: ${lang}, ${data.length} bytes`);
            res.writeHead(200, { 'Content-Type': 'text/xml', ...cors });
            res.end(data);
            await unlink(filePath).catch(() => {});
        } catch (readErr) {
            console.error('[server] File read error:', readErr.message);
            console.error('[server] stderr:', stderr);
            sendJson(res, 404, cors, { error: `No subtitles found for lang=${lang}` });
        }
    });
}

function handleListLangs(videoId, cors, res) {
    execFile('yt-dlp', [
        '--list-subs',
        '--skip-download',
        `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 15000 }, (err, stdout, stderr) => {
        if (err) {
            sendJson(res, 500, cors, { error: err.message });
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
        sendJson(res, 200, cors, { tracks });
    });
}

const server = http.createServer((req, res) => {
    const cors = corsHeaders(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            ...cors,
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
        if (!videoId || !VIDEO_ID_RE.test(videoId)) {
            sendJson(res, 400, cors, { error: 'Missing or invalid ?v= parameter' });
            return;
        }
        if (!LANG_RE.test(lang)) {
            sendJson(res, 400, cors, { error: 'Invalid ?lang= parameter' });
            return;
        }
        handleCaptions(videoId, lang, cors, res);
        return;
    }

    if (url.pathname === '/langs') {
        const videoId = url.searchParams.get('v');
        if (!videoId || !VIDEO_ID_RE.test(videoId)) {
            sendJson(res, 400, cors, { error: 'Missing or invalid ?v= parameter' });
            return;
        }
        handleListLangs(videoId, cors, res);
        return;
    }

    if (url.pathname === '/health') {
        sendJson(res, 200, cors, { status: 'ok' });
        return;
    }

    sendJson(res, 404, cors, { error: 'Not found' });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`[subtitle-server] Port ${PORT} in use, checking process...`);
        execFile('lsof', ['-ti', `:${PORT}`], (_, stdout) => {
            // lsof can print multiple PIDs (one per line); the first is the listener
            const pid = stdout?.trim().split('\n')[0];
            if (!pid) return;
            // Only kill if it's a node process (i.e. a previous subtitle-server)
            execFile('ps', ['-p', pid, '-o', 'comm='], (_, psOut) => {
                const comm = psOut?.trim();
                if (comm === 'node') {
                    process.kill(Number(pid));
                    console.log(`[subtitle-server] Killed old node process (PID ${pid}), restarting...`);
                    setTimeout(() => server.listen(PORT, '127.0.0.1'), 500);
                } else {
                    console.error(`[subtitle-server] Port ${PORT} is used by "${comm}" (PID ${pid}), not a node process. Aborting.`);
                    process.exit(1);
                }
            });
        });
    } else {
        console.error('[subtitle-server] Server error:', err);
        process.exit(1);
    }
});

// Bind to loopback only — this server shells out to yt-dlp and must never be
// reachable from other machines on the network.
server.listen(PORT, '127.0.0.1', () => {
    console.log(`[subtitle-server] Running on http://localhost:${PORT}`);
    console.log(`[subtitle-server] Endpoints:`);
    console.log(`  GET /langs?v=VIDEO_ID         — list available subtitle languages`);
    console.log(`  GET /captions?v=VIDEO_ID&lang=en — download captions as srv3 XML`);
    console.log(`  GET /health                    — health check`);
});
