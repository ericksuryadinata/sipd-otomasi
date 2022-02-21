const puppeteer = require('puppeteer');
const $ = require('cheerio');
const fs = require('fs');
const cookiesFilePath = 'cookies.json';
const {
    dpaPersetujuanDepan,
    dpaDepan,
    dpaSKPD,
    dpaPendapatan,
    dpaBelanja,
    dpaRincianBelanja,
    dpaPembiayaan
} = require('./lib/dpa/index')
const {
    USERNAME,
    PASSWORD,
    TAHUN_ANGGARAN,
    ID_DAERAH,
    KODE_DAERAH,
    NAMA_DAERAH,
} = require('./lib/config')
const{
    LINKS
} = require('./lib/api')

async function login(page){
    try {
        await page.goto(LINKS.DEPAN.LOGIN, {waitUntil: ['networkidle0', 'domcontentloaded']});   
    } catch (error) {
        await page.goto(LINKS.DEPAN.LOGIN, {waitUntil: ['networkidle0', 'domcontentloaded']});   
    }

    await page.type("#email", USERNAME);
    await page.type("#password", PASSWORD);
    await page.select("select#tahunanggaran", TAHUN_ANGGARAN);
    page.on('console', (log) => console[log._type](log._text))
    await page.evaluate( ({ID_DAERAH, KODE_DAERAH, NAMA_DAERAH}) => {

        onDaerahListItemClick({ "idDaerah": ID_DAERAH, "kodeDaerah": KODE_DAERAH, "namaDaerah": NAMA_DAERAH })
    }, {ID_DAERAH, KODE_DAERAH, NAMA_DAERAH})
    await page.click("button[type='submit']")

    await page.waitForNavigation();

    // Save Session Cookies
    const cookiesObject = await page.cookies();
    // Write cookies to temp file to be used in other profile pages
    fs.writeFile(cookiesFilePath, JSON.stringify(cookiesObject), function(err) { 
        if (err) {
            console.log('The file could not be written.', err)
        }
        console.log('Session has been successfully saved')
    });
}

async function goHome(page){

    try {
        await page.goto(LINKS.DEPAN.HOME, {waitUntil: ['networkidle0', 'domcontentloaded']});   
    } catch (error) {
        await page.goto(LINKS.DEPAN.HOME, {waitUntil: ['networkidle0', 'domcontentloaded']});
    }
}

(async () => {
    const browser = await puppeteer.launch({headless:false, defaultViewport:null, args:['--start-maximized']});
    const page = await browser.newPage();
    const previousSession = fs.existsSync(cookiesFilePath);
    if (previousSession) {
        // If file exist load the cookies
        const cookiesString = fs.readFileSync(cookiesFilePath);
        const parsedCookies = JSON.parse(cookiesString);
        if (parsedCookies.length !== 0) {
            let exp = true;
            for (let cookie of parsedCookies) {
                if(cookie.name === 'siap_session'){
                    let now = new Date();
                    let cookieDay = new Date(cookie.expires * 1000);
                    if(now <= cookieDay){
                        exp = !exp;
                    } else {
                        exp = exp;
                    }
                }
            }

            if(exp){
                console.log('session expired');
                await login(page);
            } else {
                for (let cookie of parsedCookies) {
                    await page.setCookie(cookie);
                }
                console.log('Session has been loaded in the browser');
                try {
                    await goHome(page);
                } catch (error) {
                    await goHome(page);
                }
            }
        } else {
            await login(page);
        }
    } else {
        await login(page);
    }

    let dpa = await page.$("aside > div > div > nav > ul > li:nth-child(3) > ul > li:nth-child(2) > ul")
    let dpaLink = await dpa.$$eval("a", el => el.map(e => {
        return {
            'halaman':e.innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/^[ ]+/g, "").replace(/[ ]+$/g, ""),
            'link':e.href
        }
    }))
    for (const p of dpaLink) {
        console.log(`mengunjungi ${p.halaman}`);
        await page.goto(p.link, {waitUntil: 'networkidle0'});
        switch (p.halaman) {
            case 'DPA SKPD':
                await page.select('select[name="tabel-dpa-skpd_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#tabel-dpa-skpd > tbody > tr').length >= 43);    
                await dpaSKPD.print(page);
                break;
            case 'DPA Pendapatan':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaPendapatan.print(page);
                break;
            case 'DPA Belanja':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaBelanja.print(page);
                break;
            case 'DPA Rincian Belanja':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaRincianBelanja.print(page);
                break;
            case 'DPA Pembiayaan':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaPembiayaan.print(page);
                break;
            case 'Halaman Persetujuan DPA':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaPersetujuanDepan.print(page);
                break;
            case 'Halaman Depan DPA':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaDepan.print(page);
                break;
            default:
                console.log('Tidak ada menu');
                break;
        }
        break;
    }
    
    // await browser.close();
})();