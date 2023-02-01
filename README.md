# Understanding Range headers in Nodejs Express

## Testing Origin

Origin is a Linux App Service with a custom Nodejs container, containing source code from this repo.

### Accept ranges enabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges enabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1024" -H "Accept-Encoding: gzip" https://nodejsexpress-aue.azurewebsites.net/ranged/docs/100kb.txt
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

## Testing Front Door

Front Door endpoint in front of Origin, with caching and compression enabled on the route.

### Accept ranges enabled

Use `curl` on Linux bash to make a ranged request to an endpoint with accept-ranges enabled and compression enabled.

```bash
curl -v -o ./100kb.txt --http2 --range "0-1024" -H "Accept-Encoding: gzip" https://helloafd-huc8gza6dpcrdxgn.z01.azurefd.net/ranged/docs/100kb.txt
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

## Links

