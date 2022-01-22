async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("")
    return hashHex
}

async function handleRequest(event, encodedUrl) {
    const cache = caches.default
    const url = decodeURIComponent(encodedUrl)
    const cacheKey = `https://cache.img.higenku.org/${await sha256(url)}`;
    let response = await cache.match(url);
    console.log(`cacheKey ${cacheKey}`)
    console.log(`response`, response)
    if (!response) {
        // If not in cache, get it from origin
        response = await fetch(url, {
            cf: {
              // Always cache this fetch regardless of content type
              // for a max of 5 seconds before revalidating the resource
              cacheTtl: 86400/2, // half a day
              cacheEverything: true,
              //Enterprise only feature, see Cache API for other plans
              cacheKey: cacheKey,
            },
        })
        response = new Response(response.body, response)
        response.headers.append("Cache-Control", "s-maxage=86400") // aprox. 1 day of cache
        event.waitUntil(cache.put(cacheKey, response.clone()))
        console.log("Not the Cached result")
    }
    return response
}

addEventListener("fetch", event => {

    const params = {}
    const url = new URL(event.request.url)
    const queryString = url.search.slice(1).split('&')

    queryString.forEach(item => {
        const kv = item.split('=')
        if (kv[0]) params[kv[0]] = kv[1] || true
    })

    try {
        if (!params['u']) {
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
            event.respondWith(handleRequest(event, params['u']))
        }
    } catch (e) {
        event.respondWith(new Response("500: Server threw an error: " + e.message))
    }
})