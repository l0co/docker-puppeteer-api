/**
 * REST API entry point.
 *
 * @author Lukasz Frankowski
 */

const packageInfo = require('./package.json');

const uuid4 = require('uuid4');
const express = require('express');
const { scrape } = require('./puppeteer');
const md5 = require('md5');
const fs = require('fs');

var SALT;
if (process.env.SALT || process.env.SALT_FILE) {
    SALT = process.env.SALT || fs.readFileSync(process.env.SALT_FILE, 'utf8');
    console.log(`Using '${SALT}' as salt`);
} else {
    SALT = "NO-SALT";
    console.warn(`Warning: using default '${SALT}' salt, you should provide some randomly generated string as SALT environment variable`);
}
const PORT = 8000;

const app = express();
app.use(express.json());

/**
 * Does the same as `scrape()` but requires `url` to be signed
 *
 * @param {string} hash md5(`${url}:${SALT}`)
 * @param {string} url See `scrape()`
 * @param {string} selector See `scrape()`
 * @return {Promise<string>}
 */
async function securedScrape({url, selector, hash}, sessionId = "local", returnFullPage = false) {
    let myStr = `${url}:${SALT}`;
    let myHash = md5(myStr);

    if (hash !== myHash) {
        console.debug(`[${sessionId}]`, `invalid provided hash: ${hash}, while a proper one is: ${myHash} build from: "${myStr}"`);
        throw 'invalid hash';
    }

    return await scrape({url, selector}, sessionId, returnFullPage);
}

async function handleRequest(req, res, returnFullPage = false) {
    let sesionId = uuid4().replace(/-.*/, '');
    console.log(`[${sesionId}]`, `requesting from: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress} to fetch: ${req.body.url}`);

    if (!req.body.selector && !returnFullPage) {
        console.log(`[${sesionId}]`, `must provide a selector for scraping`);
        res.status(400).send('must provide a selector for scraping');
        return;
    }
    
    securedScrape(req.body, sesionId, returnFullPage).then((data) => {
        console.log(`[${sesionId}]`, `sending data with: ${data.length} bytes`);
        res.send(data);
    }).catch((data) => {
        console.log(`[${sesionId}]`, `sending error: ${data}`);
        res.status(400).send(data);
    })
}

app.post('/scrape', (req, res) => {
    handleRequest(req, res, false);
});

app.post('/fetch', (req, res) => {
    handleRequest(req, res, true);
});

app.get('/status', (req, res) => {
    let response = {
        "status": "OK",
        "version": packageInfo.version
    };
    res.send(response);
});

app.listen(PORT, () => console.log(`Scraper API version ${packageInfo.version} is listening on port: ${PORT}`));

