/**
 * Puppeteer scrapper API. Direct call examples are located at the file bottom.
 *
 * @author Lukasz Frankowski
 */

const puppeteer = require('puppeteer-core');
const md5 = require('md5');
const express = require('express');
const uuid4 = require('uuid4');

const SALT = process.env.SALT || "NO-SALT";
const PORT = 8000;

let SESSION_ID = 'local';

/**
 * Starts the browser and returns the content when element appears.
 *
 * @param {string} url URL to fetch
 * @param {string} selector CSS selector to check if element appeared, if empty is returns immediately after page is loaded
 * @return {Promise<string>} HTML content after element appeared
 */
async function scrap({url, selector}) {

    return new Promise(async (resolve, reject) => {

        console.log(`[${SESSION_ID}]`, 'starting chrome browser');
        const browser = await puppeteer.launch({
            executablePath: '/opt/google/chrome/chrome',
            args: ['--no-sandbox']
        });

        let j = 0; 
        const page = await browser.newPage();

        async function stop() {
            if (i) {
                console.log(`[${SESSION_ID}]`, 'clearing refresh interval');
                clearInterval(i);
            }
            console.log(`[${SESSION_ID}]`, 'closing chrome browser');
            await page.close();
            await browser.close();
        }

        async function check() {
            let elements = await page.$$(selector);
            if (elements.length) {
                console.log(`[${SESSION_ID}]`, `element with selector: '${selector}' appeared, resolving content`);
                resolve(await page.content());
                await stop();
            } else if (++j === 25) { // 25 secs timeout
                console.log(`[${SESSION_ID}]`, `element with selector: '${selector}' didn't appear within 25 secs, timeout`);
                reject('timeout');
                await stop();
            }

        }

        let i = null;
        page.once('load', async () => {
            if (selector) {
                console.log(`[${SESSION_ID}]`, `page loaded, setting 1000 ms refresh interval`);
                i = setInterval(check, 1000);
            } else {
                console.log(`[${SESSION_ID}]`, `page loaded, resolving content immediately`);
                resolve(await page.content());
                await stop();
            }
        });

        console.log(`[${SESSION_ID}]`, `going to: ${url}`);
        await page.goto(url);

    });

}

/**
 * Does the same as `scrap()` but requires `url` to be signed
 *
 * @param {string} hash md5(`${url}:${SALT}`)
 * @param {string} url See `scrap()`
 * @param {string} selector See `scrap()`
 * @return {Promise<string>}
 */
async function securedScrap({url, selector, hash}) {
    let myStr = `${url}:${SALT}`;
    let myHash = md5(myStr);
    
    if (hash !== myHash) {
        console.debug(`invalid provided hash: ${hash}, while a proper one is: ${myHash} build from: "${myStr}"`);
        throw 'invalid hash';
    }
    
    return await scrap({url, selector})
}

// start http server listening

const app = express();
app.use(express.json());

app.post('/scrap', (req, res) => {
    SESSION_ID = uuid4().replace(/-.*/, '');
    console.log(`[${SESSION_ID}]`, `requesting from: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress} to fetch: ${req.body.url}`);
    securedScrap(req.body).then((data) => {
        console.log(`[${SESSION_ID}]`, `sending data with: ${data.length} bytes`);
        res.send(data);
    }).catch((data) => {
        console.log(`[${SESSION_ID}]`, `sending error: ${data}`);
        res.status(400).send(data);
    })
});

if (SALT === "NO-SALT")
    console.warn("Warning: using default 'NO_SALT' salt, you should provide some randomly generated string as SALT environment variable");
else
    console.log(`Using '${SALT}' as salt`);

app.listen(PORT, () => console.log(`[${SESSION_ID}]`, `Scrapper API is listening on port ${PORT}!`));

// direct call examples

// scrap({
//     url: 'http://example.com/',
//     selector: 'h1'
// }).then((content) => {
//     console.log(content);
// });

// securedScrap({
//     url: 'http://example.com/',
    //     selector: 'h1',
//     hash: 'c020eed4c5703931fb45596bf32fd709'
// }).then((content) => {
//     console.log(content);
// });
