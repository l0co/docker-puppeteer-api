/**
 * Puppeteer scraper API. Direct call examples are located at the file bottom.
 *
 * @author Lukasz Frankowski
 */

const packageInfo = require('./package.json');

const puppeteer = require('puppeteer-core');
const program = require('commander');

/**
 * Starts the browser and returns the content when element appears.
 *
 * @param {string} url URL to fetch
 * @param {string} selector CSS selector to check if element appeared, if empty is returns immediately after page is loaded
 * @return {Promise<string>} HTML content after element appeared
 */
async function scrape({url, selector}, sessionId = "local", returnFullPage = false) {

    return new Promise(async (resolve, reject) => {

        if (sessionId) console.log(`[${sessionId}]`, 'starting chrome browser');
        // see https://github.com/puppeteer/puppeteer/issues/1793#issuecomment-438971272
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-gpu']
        });

        let j = 0;
        const page = await browser.newPage();
        if (process.env.USER_AGENT) {
            page.setUserAgent(process.env.USER_AGENT);
        }

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
            try {
                let elements = await page.$$(selector);
                if (elements.length) {
                    if (sessionId) console.log(`[${sessionId}]`, `element with selector: '${selector}' appeared, resolving content`);
                    if (returnFullPage) {
                        resolve(await page.content());
                    } else {
                        // received a lot of fatal errors trying to access closed pages:
                        // Error: Protocol error (Runtime.callFunctionOn): Target closed.
                        // see https://stackoverflow.com/a/73334739
                        // the method below seems to circumvent this problem
                        const elementContentsList = [];
                        await elements.reduce(
                            async (item, element) => {
                                await item;
                                elementContentsList.push(await page.evaluate(el => el.outerHTML, element));
                            },
                            Promise.resolve()
                        );
                        resolve(elementContentsList.join("\n"));
                    }
                    await stop();
                } else if (++j === 60) { // 60 secs timeout
                    if (sessionId) console.log(`[${sessionId}]`, `element with selector: '${selector}' didn't appear, timeout`);
                    reject('element timeout');
                    await stop();
                }
            } catch(e) {
                if (sessionId) console.error(`[${sessionId}]`, `puppeteer error: ${e.message}`);
                reject(`puppeteer error: ${e.message}`);
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
                if (sessionId) console.log(`[${sessionId}]`, `page loaded; looking for selector: '${selector}'. setting 1000 ms refresh interval`);
                i = setInterval(check, 1000);
            } else {
                if (sessionId) console.log(`[${sessionId}]`, `page loaded; resolving content immediately`);
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

exports.scrape = scrape;

// CLI

program.version(packageInfo.version);

program
    .command('fetch <url>')
    .description('fetches URL')
    .action(async function (url, cmd) {
        let req = {url};
        console.log(await scrape(req, null, true));
    });

program
    .command('scrape <url>')
    .description('scrapes URL')
    .option('-s, --selector <selector>', 'returns content after appearance of element pointed by css selector')
    .action(async function (url, cmd) {
        let req = {url};
        req.selector = cmd.selector;
        console.log(await scrape(req, null, false));
    });


program.parse(process.argv);


// direct call examples

// scrape({
//     url: 'http://example.com/',
//     selector: 'h1'
// }).then((content) => {
//     console.log(content);
// });

// securedScrape({
//     url: 'http://example.com/',
//     selector: 'h1',
//     hash: 'c020eed4c5703931fb45596bf32fd709'
// }).then((content) => {
//     console.log(content);
// });
