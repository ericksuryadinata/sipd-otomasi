const {
    LINKS,
    PATH,
    cookieList,
    httpsAgent,
    ax
} = require('../api')
const d = require('download')
const config =  require('../config')
const fs = require('fs')

const dOptions = {
    headers:{
        Cookie:cookieList
    },
    agent:{
        https: httpsAgent
    }
}

const getLink = async (page) => {
    console.log('Request data SKPD')
    let pageEvaluate = await page.evaluate(async ({LINKS})=>{
        let date = new Date().getTime()
        let csrf = document.querySelector("head > meta[name='csrf-token']").content
        let response = await fetch(`${LINKS.DPA.RINCIANBELANJA}0?_=${date}`)
        let { data:listSKPD } = await response.json()
        return {
            csrfToken:csrf,
            listSKPD:listSKPD
        }
    }, {LINKS})
    let csrf = pageEvaluate.csrfToken
    const listSKPD = pageEvaluate.listSKPD
    console.log(`Mendapatkan data ${listSKPD.length} SKPD`)
    let listCetakSKPD = []
    let urut = 1;
    for (const [index, skpd] of listSKPD.entries()) {
        // skip dinas yang tidak punya rincian belanja
        if(skpd.rincian === 0){
            continue;
        }
        let namaSKPD = skpd.nama_skpd
        let kodeSKPD = skpd.kode_skpd
        let idSKPD = skpd.id_skpd
        namaSKPD = namaSKPD.split(`${kodeSKPD} `)[1]
        namaSKPD = `${index+1}. ${namaSKPD}`;
        console.log(`Memulai SKPD ${namaSKPD} ....`)

        console.log(`Mengunjungi halaman rincian belanja SKPD ${namaSKPD} ....`)
        let linkRincianBelanja = skpd.action
        linkRincianBelanja = linkRincianBelanja.match(/href='([^']*)/g)
        linkRincianBelanja = linkRincianBelanja[linkRincianBelanja.length-1]
        linkRincianBelanja = linkRincianBelanja.replace("href='",'')
        await page.goto(linkRincianBelanja, {waitUntil: 'networkidle0'});

        console.log('Request Rincian Belanja SKPD')
        pageEvaluate = await page.evaluate(async ({LINKS, idSKPD})=>{
            let date = new Date().getTime()
            let csrf = document.querySelector("head > meta[name='csrf-token']").content
            let response = await fetch(`${LINKS.DPA.RINCIANBELANJASKPD}${idSKPD}?_=${date}`)
            let { data:listRincianBelanjaSKPD } = await response.json()
            return {
                csrfToken:csrf,
                listRincianBelanjaSKPD:listRincianBelanjaSKPD
            }
        }, {LINKS, idSKPD})
        csrf = pageEvaluate.csrfToken
        let listRincianBelanjaSKPD = pageEvaluate.listRincianBelanjaSKPD
        // kita cek dulu rincian belanja sekarang dan rincian belanja sebelum
        // jika rincian sekarang ada nilai, dan sebelumnya tidak ada, kita ambil,
        // jika rincian sekarang tidak ada nilai dan sebelumnya ada, kita ambil
        let rincianBelanjaSKPD = []
        for (let index = 0; index < listRincianBelanjaSKPD.length; index++) {
            let rincianBelanja = listRincianBelanjaSKPD[index]
            if(parseInt(rincianBelanja.rincian) !== 0 || parseInt(rincianBelanja.rincian_hist) !== 0){
                rincianBelanjaSKPD.push(rincianBelanja)
            }
        }
        console.log('Rincian Belanja SKPD didapatkan ....')

        console.log('Ambil Kegiatan SKPD')
        // ambil kegiatan saja
        let duplicateKeys = ['kode_bl'];
        let listKegiatanSKPD = rincianBelanjaSKPD.filter(
            (s =>
                o => (k => !s.has(k) && s.add(k))
                (duplicateKeys.map(k => o[k]).join('|'))
            )(new Set)
        )

        console.log('Kegiatan didapatkan ....')

        let listCetak = [];
        for(const kegiatanSKPD of listKegiatanSKPD){
            let kodeBl = kegiatanSKPD.kode_bl
            let namaKegiatan = kegiatanSKPD.nama_giat
            let namaUnitSKPD = kegiatanSKPD.nama_sub_skpd
            let idSubSKPD = kegiatanSKPD.id_sub_skpd
            let idSKPD = kegiatanSKPD.id_skpd

            console.log(`Mendapatkan Link Cetak Kegiatan ${kegiatanSKPD.nama_giat}`)

            let detailCetak = {
                'id_sub_skpd': `${idSubSKPD}`, 
                'nama_skpd':`${namaUnitSKPD}`, 
                'nama_kegiatan': `${namaKegiatan}`, 
            }

            let postParameter = {
                '_token':csrf,
                'id_skpd': idSKPD,
                'kode_bl': kodeBl,
                'model':'bl_rinci',
            };

            let pv = {
                postParameter,
                linkRincianBelanja, 
                LINKS, 
                cookieList, 
                config,
                detailCetak
            }

            pageEvaluate = await page.evaluate(async (pv)=>{
                let postData = new URLSearchParams(pv.postParameter)
                let jadwalSettings = {
                    'method':'POST',
                    headers:{
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Cookie':pv.cookieList,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Connection':'keep-alive',
                        'Referer': pv.linkRincianBelanja,
                    },
                    body: postData.toString()
                }
                let response = await fetch(`${pv.LINKS.DPA.HISTJADWAL}`, jadwalSettings)
                let jsonResponse = await response.json();
                let listJadwal = jsonResponse.data;
                for (const jadwal of listJadwal) {
                    if(jadwal.nama_sub_tahap_siap === pv.config.NAMA_JADWAL) {
                        if(jadwal.set_tgl_cetak == null){
                            postData.append('id_jadwal', jadwal.id_jadwal)
                            postData.append('tgl_cetak', pv.config.TANGGAL_DPA)
                            let settingTanggal = {
                                'method':'POST',
                                headers:{
                                    'Cookie': pv.cookieList,
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Connection':'keep-alive',
                                    'Referer': pv.linkRincianBelanja,
                                },
                                body: postData.toString()
                            }
                            let postTanggal = await fetch(`${pv.LINKS.DPA.SETTINGTANGGAL}`, settingTanggal)
                            let link = await postTanggal.text()
                            console.log(`Set Tanggal, Simpan data ${pv.detailCetak.nama_skpd} Kegiatan ${pv.detailCetak.nama_kegiatan}`)
                            return {
                                ...pv.detailCetak,
                                'link':link
                            }
                        } else {
                            let link = jadwal.action
                            console.log(`Tanggal Sudah Diset, Simpan data ${pv.detailCetak.nama_skpd} Kegiatan ${pv.detailCetak.nama_kegiatan}`)
                            link = link.match(/href='([^']*)/g)
                            link = link[link.length-1]
                            link = link.replace("href='",'')
                            return {
                                ...pv.detailCetak,
                                'link':link
                            }
                        }
                    }
                }
            }, pv)

            console.log('Link Cetak Didapatkan ....')
            listCetak.push(pageEvaluate)
        }

        let cetakKegiatanSKPD = {}
        for(var i of listCetak) {
            if(cetakKegiatanSKPD[i.nama_skpd]) {
                cetakKegiatanSKPD[i.nama_skpd].push(i)
            } else {
                cetakKegiatanSKPD[i.nama_skpd] = [i]
            }
        }

        for (const key in cetakKegiatanSKPD) {
            if (Object.hasOwnProperty.call(cetakKegiatanSKPD, key)) {
                let daftarLink = cetakKegiatanSKPD[key];
                listCetakSKPD.push({
                    'nama_skpd':`${urut}. ${key}`,
                    'link':daftarLink
                })
                urut++
            }
        }
        
    }
    console.log("Menyimpan List SKPD DPA Rincian Belanja .....")
    fs.writeFile(`${PATH.DPA.JSON}\\dpaRincianBelanja.json`, JSON.stringify(listCetakSKPD), function(err) { 
        if (err) {
            console.log('File JSON tidak bisa disimpan', err)
        }
        console.log('List SKPD DPA Rincian Belanja Berhasil Disimpan')
    });

    download(listCetakSKPD);
}

const download = async (listSKPD) => {
        
    if(!fs.existsSync(PATH.DPA.RINCIANBELANJA)){
        console.log(`Membuat Folder ${PATH.DPA.RINCIANBELANJA}`)
        fs.mkdirSync(PATH.DPA.RINCIANBELANJA)
    } else {
        console.log(`Folder ${PATH.DPA.RINCIANBELANJA} Sudah Ada`)
    }

    for (const [index, skpd] of listSKPD.entries()) {
        let namaSKPD = skpd.nama_skpd
        let listLink = skpd.link

        let skpdFolder = `${PATH.DPA.RINCIANBELANJA}\\${namaSKPD}`
        if(!fs.existsSync(skpdFolder)){
            console.log(`Membuat Folder ${skpdFolder}`)
            fs.mkdirSync(skpdFolder)
        }

        let errorList = []

        let errorJson = `${skpdFolder}\\error.json`

        if(!fs.existsSync(errorJson)){
            let listKegiatanSudahDiDownload = fs.readdirSync(skpdFolder)

            if(listKegiatanSudahDiDownload.length === listLink.length){
                console.log(`Kegiatan SKPD ${namaSKPD} sudah lengkap, melanjutkan ....`)
                continue
            }

            for (const link of listLink) {
                let namaKegiatan = link.nama_kegiatan.replace(/\//g, ' atau ')
                namaKegiatan = namaKegiatan.substring(0,100)
                
                console.log(`melakukan download SKPD ${namaSKPD} Kegiatan ${namaKegiatan}`)

                let filename = `${namaKegiatan}.pdf`
                let file = `${skpdFolder}\\${filename}`

                if(fs.existsSync(file)){
                    fs.rmSync(file)
                }

                dOptions.filename = filename
                try {
                    await d(link.link, skpdFolder, dOptions);
                    console.log(`file tersimpan di ${file}`)
                } catch (error) {
                    let message = {
                        "code": error.code,
                        'namaSKPD':namaSKPD,
                        "kegiatan":namaKegiatan,
                        "link":link.link
                    }
                    errorList.push(message)
                    console.log(error)
                }
                
                // let res = await ax.get(link.link,{
                //     responseType:"stream"
                // })
                
                // await  res.data.pipe(fs.createWriteStream(file))
                // console.log(`file tersimpan di ${file}`)
            }
            if(errorList.length !== 0){
                fs.writeFile(`${skpdFolder}\\error.json`, JSON.stringify(errorList), function(err) { 
                    if (err) {
                        console.log('File JSON tidak bisa disimpan', err)
                    }
                    console.log(`Terdapat ${errorList.length} error, log tersimpan`)
                });
            }
        } else {
            let jsonContent = fs.readFileSync(errorJson);
            errorList = JSON.parse(jsonContent);

            console.log(`Terdapat ${errorList.length} error, Mencoba lagi ....`)

            retryDownload(errorList, skpdFolder)
        }
    }
}

const retryDownload = async (errorList, destination) => {

    for (const kegiatan of errorList) {
        let filename = kegiatan.kegiatan.substring(0,100)
        filename = `${filename}.pdf`
        let file = `${destination}\\${filename}`
        dOptions.filename = filename
        let count = 0
        let success = 0
        do {
            try {
                await d(kegiatan.link, destination, dOptions);
                console.log(`file tersimpan di ${file}`)  
                success = 1
            } catch (error) {
                console.log(error)
                count++
                console.log(`${filename} Error Download, Percobaan ke - ${count}`)
            }
            
        } while (count < 3 && !success);

        console.log("Error teratasi")
    }
   
}
module.exports = {
    getLink: getLink,
    download: download
};