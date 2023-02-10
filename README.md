# HTTP Range request protocol behaviour in Azure Front Door

Azure Front Door is upgrading its PoP node infrastructure to improve performance and resiliency. While most customers will not notice any changes to the way Front Door proxies HTTP(S) traffic, there are some differences. One of those is stricter implementation of the HTTP Range-Request protocol ([RFC 7233](https://datatracker.ietf.org/doc/html/rfc7233)). This repo includes code for simulating and testing range-request protocol behaviour, as well as advice on how to fix origins that are not responding to range requests properly.

## Background

In December Microsoft sent a [Service Health advisory][YS1Q-B88] to Azure Front Door customers via the Azure Portal. The advisory included the following information:

<div style="margin-left: 3em"><em>
<p>We recently pushed an upgrade causing more range requests to be sent to customer origins (to have additional efficiency in distributing the caching of large customer resources in Azure Front Door). Unfortunately, certain customer origins didn't properly respond to range requests when the “Accept-Encoding: gzip” header was present and returned an invalid “Content-Range” header value, resulting in failed client requests...</p>

<p>...One thing you should verify works properly on the origin/backend is the handling of HTTP range requests. If the origin doesn't have proper support for range requests, it should simply ignore the Range header and return a regular, non-range response (e.g., with status code 200). But if the origin returns a response with status code 206 it implies support for range requests. In that case, it must send a valid Content-Range header. If compression is used, the Content-Range header values must be based on the compressed (encoded) resource size.</p>

<p>For example, suppose an uncompressed resource on the origin is 100 KB; but with gzip compression, it's only 20 KB. Suppose the origin receives a range request for "bytes=0-1048575" (that is, the first 1 MB) and suppose that the header “Accept-Encoding: gzip” is also present. If the origin chooses to return a range response (status code 206) and it chooses to compress the resource (“Content-Encoding: gzip”), it should set the value of the Content-Range to “bytes 0-20479/20480”, indicating that the response contains 20 KB of data (not 100 KB of data).</p>
</em></div>

You can [read the full Service Health advisory here][YS1Q-B88] (requires Azure Portal login to a subscription with Azure Front Door deployed).

## Advice & recommendations

Accepting range requests is optional. Origin servers should be configured to either accept range requests (and respond correctly) or ignore range request headers and respond with a full (200 Ok) response. 

### Nodejs/express

It looks like compression and range requests are incompatible in the `nodejs/express/compression` module. The compression module won't stream the entire file into RAM because for large files [this could cause out of memory issues](https://github.com/expressjs/compression/issues/52#issuecomment-138698947). Therefore the `Content-Range` header `byte-content-range` value is not updated to match the actual body data size (the total amount of body data sent once the response has finished). This mismatch is values is invalid according to RFC 7233.

> You can reproduce this behaviour by building and running the Nodejs/express server and running the Mocha tests  (see instructions below).

The solution for Nodejs/express servers is to either support range requests, or compression (not both at the same time).

* **Compression**: Best performance for scripts, stylesheets, JSON and HTML files, any files that compress well. The express compression module will not compress files that don't benefit from compression (like JPEG files which are already compressed).
* **Ranges**: Good for very large media files that need to seek or be pre-fetched in shards. Most media formats (like MPEG) are already compressed.

## Getting started with the code in the repo

This project contains `Nodejs/express` code to create a server that simulates ranged and non-ranged responses. It also includes Mocha tests to perform basic RFC checks on an origin URL.

### Build and run the server

> Latest Nodejs and NPM is required.

```bash
npm install
npm run start
```

### Run Mocha tests

Modify the `originUrl` variable in `tests.js` to specify the origin URL to test.

```javascript
// change this hardcoded value in tests.js.
const originUrl = 'https://nodejsexpress-aue.azurewebsites.net/ranged/docs/ranged100kb.txt';
```

NPM install and run the tests
```bash
npm install
npm run test
```

### Manually testing origin

Origin is a Linux App Service with a custom Nodejs container, containing source code from this repo.

#### Accept ranges enabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges enabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1023" -H "Accept-Encoding: gzip" https://nodejsexpress-aue.azurewebsites.net/ranged/docs/ranged100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 206 Partial Content            # Response is ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
Content-Range: bytes 0-1023/102399      # Partial response, only the first 1024 bytes are returned.
```

The actual body data size will be less than 1024 bytes; strictly this is a malformed response that may cause issues with some reverse-proxies and clients.

#### Accept ranges disabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges disabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1023" -H "Accept-Encoding: gzip" https://nodejsexpress-aue.azurewebsites.net/docs/100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 200 OK                         # Response is not ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
```

### Manually testing Front Door

Front Door endpoint in front of Origin, with caching and compression enabled on the route.

#### Accept ranges enabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges enabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1023" -H "Accept-Encoding: gzip" https://helloafd-huc8gza6dpcrdxgn.z01.azurefd.net/ranged/docs/ranged100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 200 OK                         # Response is not ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
X-Cache: TCP_HIT                        # Front Door is serving from cache
```

Front Door appears to be "de-ranging" the request somehow. 

#### Accept ranges disabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges disabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1023" -H "Accept-Encoding: gzip" https://helloafd-huc8gza6dpcrdxgn.z01.azurefd.net/docs/100kb.txt
```

Expected response should include these headers:

```
HTTP/1.1 200 OK                         # Response is not ranged
Cache-Control: public, max-age=604800   # Cache for 7 days
Content-Encoding: gzip                  # Response is compressed
X-Cache: TCP_HIT                        # Front Door is serving from cache
```

## Links & references

* [Stricter protocol implementation policies in Azure Front Door for both HTTP/HTTPS][YS1Q-B88] (Azure Service Health Advisory)
* [RFC 7233: Hypertext Transfer Protocol (HTTP/1.1): Range Requests](https://www.rfc-editor.org/rfc/rfc7233) (IETF)
* [Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) (MDN)
* [Nodejs/Express/Compression: Can't buffer entire file to calculate compressed content length](https://github.com/expressjs/compression/issues/52#issuecomment-138698947) (GitHub issue)
* [100kb in text](https://gist.githubusercontent.com/aal89/0e8d16a81a72d420aae9806ee87e3399/raw/3b0422de873be9b93f1cb85ec481d94f1bb238b0/100kb.txt) (GitHub Gist)
* [Express serve-static middleware docs](https://expressjs.com/en/resources/middleware/serve-static.html)

[YS1Q-B88]:https://app.azure.com/h/YS1Q-B88/e67fe2
