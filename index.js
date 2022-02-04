async function sha(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("")
    return hashHex
}


async function handleRequest(event, url, cachePromise) {

    const cache = caches.default; 

    const cacheKey = `https://static.higenku.org/${await sha(url)}`;
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

        // response = new Response(response.body, response);
        //         "Content-Type": type,
        //         "Cache-Control": "s-maxage=86400",
        //         "Vary": "Content-Encoding",
        //         "Expires": date.toUTCString(),
        //         // "etag": `W/${encodeURIComponent(url)}`,
        //         "age": "300",
        //         "strict-transport-security": "max-age=86400; includeSubDomains; preload",
        //         "Last-Modified": new Date(Date.now()).toUTCString(),
                
        //         "access-control-allow-origin": "*",
        //         "timing-allow-origin": "*",
        //         "x-content-type-options":"nosniff",
        //         "zzz-penis": "Hello1",
        //     },
        //     // status: 304,
        // })

        console.log("Putting")
        event.waitUntil(cache.put(cacheKey, response.clone()))
        console.log("No Cache")
    }

    console.log(`responding`)
    return response;
}

addEventListener("fetch", event => {

    let origin = event.request.headers.get(`Host`);
    const url = event.request.url.replace(`https://${origin}/`, ``);
    const cache = caches.open("Private__Cache")

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
            event.respondWith(handleRequest(event, url, cache))
        }
    } catch (e) {
        event.respondWith(new Response("500: Server threw an error: " + e.message))
    }
})