// index.js
async function handleRequest(event, url) {
    const cache = caches.default;
    const cacheKey = `https://static.higenku.org/${encodeURIComponent(url)}1`;
    let response = await cache.match(url);
    if (!response) {
      response = await fetch(url, {
        cf: {
          cacheTtl: 86400 / 2,
          cacheEverything: true
        },
        keepalive: true,
        headers: {
          'user-agent': "Mozilla/5.0 (X11; Workers;) Gecko Firefox"
        }
      });
      console.log(response.status);
      let type = response.headers.get("Content-Type");
      let date = new Date(Date.now());
      date.setUTCDate(date.getUTCDate() + 1);
      date = date.toUTCString();
      const todayDate = new Date(Date.now()).toUTCString();
      response = new Response(response.body, {
        headers: {
          "content-type": type,
          "access-control-allow-origin": "*",
          "cache-control": "public, max-age=300"
        }
      });
      event.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  }
  addEventListener("fetch", (event) => {
    let host = event.request.headers.get(`Host`);
    let origin = event.request.headers.get(`Origin`);
    let referer = event.request.headers.get(`Referer`);
    let country = event.request.headers.get(`cf-ipcountry`);
    const url = event.request.url.replace(`https://${host}/`, ``);
    console.log(`Request from ${host} from ${country} | ${referer}`);
    let response;
    try {
      if (!url) {
        response = new Response(`
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <meta name="darkreader" content="1">
                      <title>XImg Proxy</title>
  
                      <link rel="stylesheet" href="https://theme.higenku.org/style.css">
                      <script src="https://theme.higenku.org/xthm.umd.js"><\/script>
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
              `, { headers: { "Content-Type": "text/html" } });
      } else {
        response = handleRequest(event, url);
      }
    } catch (e) {
      response = new Response("500: Server threw an error: " + e.message);
    }
    event.respondWith(response);
  });
  //# sourceMappingURL=ximgproxy.js.map
  