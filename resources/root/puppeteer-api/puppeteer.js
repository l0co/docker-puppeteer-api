/**
 * Puppeteer scrapper API. Direct call examples are located at the file bottom.
 *
 * @author Lukasz Frankowski
 */

const puppeteer = require('puppeteer-core');
const program = require('commander');

/**
 * Starts the browser and returns the content when element appears.
 *
 * @param {string} url URL to fetch
 * @param {string} selector CSS selector to check if element appeared, if empty is returns immediately after page is loaded
 * @return {Promise<string>} HTML content after element appeared
 */
async function scrap({url, selector}, sessionId = "local") {

    return new Promise(async (resolve, reject) => {

        if (sessionId) console.log(`[${sessionId}]`, 'starting chrome browser');
        const browser = await puppeteer.launch({
            executablePath: '/opt/google/chrome/chrome',
            args: ['--no-sandbox']
        });

        let j = 0;
        const page = await browser.newPage();

        async function stop() {
            if (i) {
                if (sessionId) console.log(`[${sessionId}]`, 'clearing refresh interval');
                clearInterval(i);
            }
            if (sessionId) console.log(`[${sessionId}]`, 'closing chrome browser');
            await page.close();
            await browser.close();
        }

        async function check() {
            let elements = await page.$$(selector);
            if (elements.length) {
                if (sessionId) console.log(`[${sessionId}]`, `element with selector: '${selector}' appeared, resolving content`);
                resolve(await page.content());
                await stop();
            } else if (++j === 60) { // 60 secs timeout
                if (sessionId) console.log(`[${sessionId}]`, `element with selector: '${selector}' didn't appear, timeout`);
                reject('element timeout');
                await stop();
            }

        }

        let i = null, k = null;
        page.once('load', async () => {
            if (k) {
                if (sessionId) console.log(`[${sessionId}]`, 'clearing wait for page load timeout');
                clearTimeout(k);
            }

            if (selector) {
                if (sessionId) console.log(`[${sessionId}]`, `page loaded, setting 1000 ms refresh interval`);
                i = setInterval(check, 1000);
            } else {
                if (sessionId) console.log(`[${sessionId}]`, `page loaded, resolving content immediately`);
                resolve(await page.content());
                await stop();
            }
        });

        if (sessionId) console.log(`[${sessionId}]`, `going to: ${url}`);
        try {
            await page.goto(url);
        } catch (e) {
            if (sessionId) console.error(`[${sessionId}]`, `error: ${e.message}, but continue to wait for onload yet another time`);
            k = setTimeout(async () => {
                reject('pageload timeout');
                await stop();
            }, 30000);
        }

    });

}

// exports

exports.scrap = scrap;

// CLI

program.version('1.0.0');

program
    .command('fetch <url>')
    .description('fetches URL')
    .option('-s, --selector <selector>', 'returns content after appearance of element pointed by css selector')
    .action(async function (url, cmd) {
        let req = {url};
        if (cmd.selector)
            req.selector = cmd.selector;
        console.log(await scrap(req, null));
    });


program.parse(process.argv);


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
