async function handleRequest(event, url) {

    const cache = caches.default; 

    const cacheKey = `https://static.higenku.org/${url}`;
    let response = await cache.match(url);

    if (!response) {
        response = await fetch(url, {
            cf: {
                // Always cache this fetch regardless of content type
                cacheTtl: 86400/2, // half a day
                cacheEverything: true,
            },
        })

        let type = response.headers.get("Content-Type");
        let date = new Date(Date.now())
        date.setUTCDate(date.getUTCDate() + 1);
        date = date.toUTCString();
        const todayDate = new Date(Date.now()).toUTCString();
        response = new Response(response.body, {
            headers: {
                "content-type": type,
                "access-control-allow-origin": "*",

                "age": "300",
                "cache-control": "public, max-age=300",
                "date": todayDate,
                "etag": `"URL: ${url} from ${date}"`,
                "expires": date,
                "vary": "Content-Encoding", // cf sets
                "last-modified": todayDate, // cf sets
            },
        });
        
        event.waitUntil(cache.put(cacheKey, response.clone()))
    }

    return response;
}

addEventListener("fetch", event => {

    let origin = event.request.headers.get(`Host`);
    const url = event.request.url.replace(`https://${origin}/`, ``);

    try {
        if (!url) {
            event.respondWith(new Response(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>XImg Proxy</title>

                    <link rel="stylesheet" href="https://theme.higenku.org/xthm.css">
                    <script src="https://theme.higenku.org/xthm.umd.js"></script>
                </head>
                <body>
                    <div class="container container-full d-flex justify-center items-center">
                        <div class="card">
                            <h1>XImg Proxy Server</h1>
                            <h2>Open Source Image Proxy Server, to Secure applications</h2>
                            <h2>Source Code at <a href="https://github.com/lmtr0/ximgproxy">https://github.com/lmtr0/ximgproxy</a></h2>
                        </div>
                    </div>
                </body>
                </html>
            `, {headers: {'Content-Type': 'text/html'}}))
        }
        else {
            event.respondWith(handleRequest(event, url))
        }
    } catch (e) {
        event.respondWith(new Response("500: Server threw an error: " + e.message))
    }
})