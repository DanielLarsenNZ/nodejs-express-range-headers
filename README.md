# Understanding Range headers in Nodejs Express

This project contains `Nodejs/express` code to create a server that simulates ranged and non-ranged responses. It also includes Mocha tests to perform basic RFC checks on an origin URL.

## Build and run the server

> Latest Nodejs and NPM is required.

```bash
npm install
npm run start
```

## Run Mocha tests

Modify the `originUrl` variable in `tests.js` to specify the origin URL should would like to test.

```bash
npm install
npm run test
```

## Manually testing origin

Origin is a Linux App Service with a custom Nodejs container, containing source code from this repo.

### Accept ranges enabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges enabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1024" -H "Accept-Encoding: gzip" https://nodejsexpress-aue.azurewebsites.net/ranged/docs/ranged100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 206 Partial Content            # Response is ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
Content-Range: bytes 0-1024/102399      # Partial response, only the first 1025 bytes are returned.
```

The actual body data size will be less than 1025 bytes; strictly this is a malformed response that may cause issues with some reverse-proxies and clients.

### Accept ranges disabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges disabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1024" -H "Accept-Encoding: gzip" https://nodejsexpress-aue.azurewebsites.net/docs/100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 200 OK                         # Response is not ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
```

## Manually testing Front Door

Front Door endpoint in front of Origin, with caching and compression enabled on the route.

### Accept ranges enabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges enabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1024" -H "Accept-Encoding: gzip" https://helloafd-huc8gza6dpcrdxgn.z01.azurefd.net/ranged/docs/ranged100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 200 OK                         # Response is not ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
X-Cache: TCP_HIT                        # Front Door is serving from cache
```

Front Door appears to be "de-ranging" the request somehow. 

### Accept ranges disabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges disabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1024" -H "Accept-Encoding: gzip" https://helloafd-huc8gza6dpcrdxgn.z01.azurefd.net/docs/100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 200 OK                         # Response is not ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
X-Cache: TCP_HIT                        # Front Door is serving from cache
```

## Links & references

* [Stricter protocol implementation policies in Azure Front Door for both HTTP/HTTPS](https://app.azure.com/h/YS1Q-B88/e67fe2) (Azure Service Health Advisory)
* [RFC 7233: Hypertext Transfer Protocol (HTTP/1.1): Range Requests](https://www.rfc-editor.org/rfc/rfc7233) (IETF)
* [Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) (MDN)
* [Nodejs/Express/Compression: Can't buffer entire file to calculate compressed content length](https://github.com/expressjs/compression/issues/52#issuecomment-138698947) (GitHub issue)
* [100kb in text](https://gist.githubusercontent.com/aal89/0e8d16a81a72d420aae9806ee87e3399/raw/3b0422de873be9b93f1cb85ec481d94f1bb238b0/100kb.txt) (GitHub Gist)
* [Express serve-static middleware docs](https://expressjs.com/en/resources/middleware/serve-static.html)
