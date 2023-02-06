const https = require('https');
const chai = require('chai');
const should = chai.should();

// Paste the URL of the origin you would like to test here
const originUrl = 'https://nodejsexpress-aue.azurewebsites.net/ranged/docs/ranged100kb.txt';

describe('RFC 7233', function () {
    describe('Partial request that accepts gzip encoding', async function () {
        
        let output = {};
        let url = new URL(originUrl);

        const options = {
            host: url.host,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'range': 'bytes=0-1023',
                'accept': '*/*',
                'accept-encoding': 'gzip'
            }
        };

        it('should return 206 or 200 or 416', async function () {
            output = await test(options);
            console.log(`Response status code = ${output.statusCode}`);
            output.statusCode.should.satisfy((statusCode) => statusCode === 200 || statusCode === 206 || statusCode === 416);
        });

        it('A server MUST NOT generate a multipart response to a request for a single range', function () {
            output.responseHeaders.should.have.property('content-type');
            output.responseHeaders['content-type'].should.not.contain('multipart');
        });    

        it('A server generating the 206 response MUST generate a Content-Range header field', function () {
            if (output.statusCode != 206) {
                console.log(`Not a partial response. Status code = ${output.statusCode}`);
                this.skip();
            }

            output.responseHeaders.should.have.property('content-range');
            output.responseHeaders['content-range'].should.match(/bytes (\d+)-(\d+)\/(\d+|\*)/);
        });

        it('content-range bytes value should match body data size', async function () {
            if (output.statusCode != 206) {
                console.log(`Not a partial response. Status code = ${output.statusCode}`);
                this.skip();
            }

            output.responseHeaders.should.have.property('content-range');

            // bytes 0-1023/102406
            let contentRange = output.responseHeaders['content-range'];
            let bytes = contentRange.replace('bytes ', '').split('/')[0];
            let ranges = bytes.split('-');
            let total = parseInt(ranges[1]) - parseInt(ranges[0]) + 1;
            console.log(`content-range header value (${contentRange}) content length = ${total} bytes. Actual body data size = ${output.dataLength} bytes.`);
            output.dataLength.should.equal(total);
        });

    });
});


async function test(options) {
    let p = new Promise((resolve, reject) => {
        const request = https.request(options, (res) => {
            let output = {
                dataLength: 0,
                statusCode: 0,
                responseHeaders: {},
                options: {}
            }

            if (res.statusCode === undefined || res.statusCode < 200 || res.statusCode >= 300) {
                reject(`Did not get an OK status from the server. Code: ${res.statusCode}`);
            }

            res.on('data', (chunk) => {
                output.dataLength += chunk.length;
            });

            res.on('end', () => {
                output.options = options;
                output.responseHeaders = res.headers;
                output.statusCode = res.statusCode ?? 0;
                console.log(output);
                resolve(output);
            });
        });

        request.end();

        request.on('error', (err) => {
            console.error(err);
            reject(err);
        });
    });

    return await p;
}
