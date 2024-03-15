/**
 * REST API entry point.
 *
 * @author Lukasz Frankowski
 */

const uuid4 = require('uuid4');
const express = require('express');
const { scrap } = require('./puppeteer');
const md5 = require('md5');
const fs = require('fs');

if (process.env.SALT || process.env.SALT_FILE) {
    const SALT = process.env.SALT || fs.readFileSync(process.env.SALT_FILE, 'utf8');
    console.log(`Using '${SALT}' as salt`);
} else {
    const SALT = "NO-SALT";
    console.warn(`Warning: using default '${SALT}' salt, you should provide some randomly generated string as SALT environment variable`);
}
const PORT = 8000;

const app = express();
app.use(express.json());

/**
 * Does the same as `scrap()` but requires `url` to be signed
 *
 * @param {string} hash md5(`${url}:${SALT}`)
 * @param {string} url See `scrap()`
 * @param {string} selector See `scrap()`
 * @return {Promise<string>}
 */
async function securedScrap({url, selector, hash}, sessionId = "local") {
    let myStr = `${url}:${SALT}`;
    let myHash = md5(myStr);

    if (hash !== myHash) {
        console.debug(`[${sessionId}]`, `invalid provided hash: ${hash}, while a proper one is: ${myHash} build from: "${myStr}"`);
        throw 'invalid hash';
    }

    return await scrap({url, selector}, sessionId);
}

app.post('/scrap', (req, res) => {
    let sesionId = uuid4().replace(/-.*/, '');
    console.log(`[${sesionId}]`, `requesting from: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress} to fetch: ${req.body.url}`);
    securedScrap(req.body, sesionId).then((data) => {
        console.log(`[${sesionId}]`, `sending data with: ${data.length} bytes`);
        res.send(data);
    }).catch((data) => {
        console.log(`[${sesionId}]`, `sending error: ${data}`);
        res.status(400).send(data);
    })
});

app.listen(PORT, () => console.log(`Scrapper API is listening on port: ${PORT}`));

