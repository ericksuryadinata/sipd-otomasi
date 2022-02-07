const puppeteer = require('puppeteer');
const fs = require('fs');
const cookiesFilePath = 'cookies.json';
const {
    dpaPersetujuanDepan,
    dpaSKPD,
    dpaPendapatan,
    dpaBelanja,
    dpaRincianBelanja,
    dpaPembiayaan
} = require('./lib/dpa/index')

async function login(page){
    await page.type("#email", "keuangan");
    await page.type("#password", "bpk4d");
    await page.select("select#tahunanggaran","2021");
    await page.evaluate( () => {
        onDaerahListItemClick({"idDaerah":388,"kodeDaerah":"8104","namaDaerah":"Kab. Buru"})
    })
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
    await page.goto('https://burukab.sipd.kemendagri.go.id/siap/home', {waitUntil: 'networkidle2'});
}


(async () => {
    const browser = await puppeteer.launch({headless:false, defaultViewport:null, args:['--start-maximized']});
    const page = await browser.newPage();
    await page.goto('https://burukab.sipd.kemendagri.go.id/siap', {waitUntil: 'networkidle2'});

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
        await page.goto(p.link, {waitUntil: 'networkidle2'});
        let listSkpd = [];
        switch (p.halaman) {
            case 'DPA SKPD':
                await page.select('select[name="tabel-dpa-skpd_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#tabel-dpa-skpd > tbody > tr').length >= 43);    
                listSkpd = await dpaSKPD.listSKPD(page);
                // listSKPD.push({'nama':p.halaman, 'skpd':skpd});
                break;
            case 'DPA Pendapatan':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                skpd = await dpaPendapatan.listSKPD(page);
                // listSKPD.push({'nama':p.halaman, 'skpd':skpd});
                break;
            case 'DPA Belanja':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                skpd = await dpaBelanja.listSKPD(page);
                // listSKPD.push({'nama':p.halaman, 'skpd':skpd});
                break;
            case 'DPA Rincian Belanja':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                skpd = await dpaRincianBelanja.listSKPD(page);
                // listSKPD.push({'nama':p.halaman, 'skpd':skpd});
                break;
            case 'DPA Pembiayaan':
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                skpd = await dpaPembiayaan.listSKPD(page);
                // listSKPD.push({'nama':p.halaman, 'skpd':skpd});
                break;
            default:
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                listSkpd = await dpaPersetujuanDepan.listSKPD(page);
                for (const skpd of listSkpd) {
                    console.log(skpd);
                    // console.log(`Cek Jadwal ${skpd.nama}`);
                    // skpd.link.click();
                    break;
                }
                // listSKPD.push({'nama':p.halaman, 'skpd':skpd});
                break;
        }
        break;
    }
    
    // await browser.close();
})();