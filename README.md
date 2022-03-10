# Workers Image Proxy

this project aims to bring security to applications that need to use extenal image content, like what https://external-content.duckduckgo.com/. 
It achieves this by using the Cache and Fetch Apis from cloudflare workers_dev


## License
This project is distributed under the [MIT](./LICENSE_MIT) and Apache v2 License


## How to use it
1. You must deploy this project to Cloudflare Workers
2. in your website, just use `https://YOUWORKERS.dev/URL` where `YOUWORKERS` would look something like `ximgproxy.username.workers.dev` and `URL` would be `https://burmesecatclub.com/app/uploads/2017/08/IMG_8217a-1.jpg`.
