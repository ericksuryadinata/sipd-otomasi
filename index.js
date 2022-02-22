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
    USER_TAPD,
    PASSWORD_TAPD,
    TAHUN_ANGGARAN,
    ID_DAERAH,
    KODE_DAERAH,
    NAMA_DAERAH,
    NAMA_JADWAL,
} = require('./lib/config')
const{
    LINKS,
    PATH,
} = require('./lib/api')

async function login(page){
    console.log("Mengunjungi halaman login")
    try {
        await page.goto(LINKS.DEPAN.LOGIN, {waitUntil: ['networkidle0', 'domcontentloaded']});   
    } catch (error) {
        await page.goto(LINKS.DEPAN.LOGIN, {waitUntil: ['networkidle0', 'domcontentloaded']});   
    }

    await page.type("#email", USER_TAPD);
    await page.type("#password", PASSWORD_TAPD);
    await page.select("select#tahunanggaran", TAHUN_ANGGARAN);
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
    const browser = await puppeteer.launch({headless:true}); //, defaultViewport:null, args:['--start-maximized']
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

    if(!fs.existsSync(PATH.DPA.UTAMA)){
        console.log(`Membuat Folder ${PATH.DPA.UTAMA}`)
        fs.mkdirSync(PATH.DPA.UTAMA)
        console.log(`Membuat Folder ${PATH.DPA.JSON}`)
        fs.mkdirSync(PATH.DPA.JSON)
    } else {
        console.log(`Folder ${PATH.DPA.UTAMA} Sudah Ada`)
        console.log(`Folder ${PATH.DPA.JSON} Sudah Ada`)
    }

    let dpa = await page.$("aside > div > div > nav > ul > li:nth-child(3) > ul > li:nth-child(2) > ul")
    let dpaLink = await dpa.$$eval("a", el => el.map(e => {
        return {
            'halaman':e.innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/^[ ]+/g, "").replace(/[ ]+$/g, ""),
            'link':e.href
        }
    }))

    let file = ''

    for (const p of dpaLink) {
        switch (p.halaman) {
            case 'DPA SKPD':
                file = `${PATH.DPA.JSON}\\dpaSKPD.json`;
                if(!fs.existsSync(file)){
                    console.log(`mengunjungi ${p.halaman}`);
                    await page.goto(p.link, {waitUntil: 'networkidle0'});
                    await page.select('select[name="tabel-dpa-skpd_length"]','-1');
                    await page.waitForFunction(() => document.querySelectorAll('#tabel-dpa-skpd > tbody > tr').length >= 43);    
                    await dpaSKPD.getLink(page);
                } else {
                    const jsonContent = fs.readFileSync(file);
                    const listSKPD = JSON.parse(jsonContent);
                    console.log("File JSON sudah ada, melakukan download")
                    await dpaSKPD.download(listSKPD)
                }
                break;
            case 'DPA Pendapatan':
                console.log(`mengunjungi ${p.halaman}`);
                await page.goto(p.link, {waitUntil: 'networkidle0'});
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaPendapatan.print(page);
                break;
            case 'DPA Belanja':
                console.log(`mengunjungi ${p.halaman}`);
                await page.goto(p.link, {waitUntil: 'networkidle0'});
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaBelanja.print(page);
                break;
            case 'DPA Rincian Belanja':
                console.log(`mengunjungi ${p.halaman}`);
                await page.goto(p.link, {waitUntil: 'networkidle0'});
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaRincianBelanja.print(page);
                break;
            case 'DPA Pembiayaan':
                console.log(`mengunjungi ${p.halaman}`);
                await page.goto(p.link, {waitUntil: 'networkidle0'});
                await page.select('select[name="table_unit_length"]','-1');
                await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                await dpaPembiayaan.print(page);
                break;
            case 'Halaman Persetujuan DPA':
                file = `${PATH.DPA.JSON}\\halamanPersetujuan.json`;
                if(!fs.existsSync(file)){
                    console.log(`mengunjungi ${p.halaman}`);
                    await page.goto(p.link, {waitUntil: 'networkidle0'});
                    await page.select('select[name="table_unit_length"]','-1');
                    await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                    await dpaPersetujuanDepan.getLink(page);
                } else {
                    const jsonContent = fs.readFileSync(file);
                    const listSKPD = JSON.parse(jsonContent);
                    console.log("File JSON sudah ada, melakukan download")
                    await dpaPersetujuanDepan.download(listSKPD)
                }
                break;
            case 'Halaman Depan DPA':
                file = `${PATH.DPA.JSON}\\halamanDepan.json`;
                if(!fs.existsSync(file)){
                    console.log(`mengunjungi ${p.halaman}`);
                    await page.goto(p.link, {waitUntil: 'networkidle0'});
                    await page.select('select[name="table_unit_length"]','-1');
                    await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 43);
                    await dpaDepan.getLink(page);
                } else {
                    const jsonContent = fs.readFileSync(file);
                    const listSKPD = JSON.parse(jsonContent);
                    console.log("File JSON sudah ada, melakukan download")
                    await dpaDepan.download(listSKPD)
                }
                break;
            default:
                console.log('Tidak ada menu');
                break;
        }
    }
    
    // await browser.close();
})();