/**
 * Puppeteer scrapper API. Direct call examples are located at the file bottom.
 *
 * @author Lukasz Frankowski
 */

const puppeteer = require('puppeteer-core');

/**
 * Starts the browser and returns the content when element appears.
 *
 * @param {string} url URL to fetch
 * @param {string} selector CSS selector to check if element appeared, if empty is returns immediately after page is loaded
 * @return {Promise<string>} HTML content after element appeared
 */
async function scrap({url, selector}, sessionId = "local") {

    return new Promise(async (resolve, reject) => {

        console.log(`[${sessionId}]`, 'starting chrome browser');
        const browser = await puppeteer.launch({
            executablePath: '/opt/google/chrome/chrome',
            args: ['--no-sandbox']
        });

        let j = 0;
        const page = await browser.newPage();

        async function stop() {
            if (i) {
                console.log(`[${sessionId}]`, 'clearing refresh interval');
                clearInterval(i);
            }
            console.log(`[${sessionId}]`, 'closing chrome browser');
            await page.close();
            await browser.close();
        }

        async function check() {
            let elements = await page.$$(selector);
            if (elements.length) {
                console.log(`[${sessionId}]`, `element with selector: '${selector}' appeared, resolving content`);
                resolve(await page.content());
                await stop();
            } else if (++j === 25) { // 25 secs timeout
                console.log(`[${sessionId}]`, `element with selector: '${selector}' didn't appear within 25 secs, timeout`);
                reject('timeout');
                await stop();
            }

        }

        let i = null;
        page.once('load', async () => {
            if (selector) {
                console.log(`[${sessionId}]`, `page loaded, setting 1000 ms refresh interval`);
                i = setInterval(check, 1000);
            } else {
                console.log(`[${sessionId}]`, `page loaded, resolving content immediately`);
                resolve(await page.content());
                await stop();
            }
        });

        console.log(`[${sessionId}]`, `going to: ${url}`);
        await page.goto(url);

    });

}

exports.scrap = scrap;

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
