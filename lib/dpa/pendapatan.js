const {
    LINKS,
    PATH,
    cookieList,
    ax
} = require('../api')
const config=  require('../config')
const fs = require('fs')

const getLink = async (page, listSKPDLengkap) => {
    console.log('Request data SKPD')
    let pageEvaluate = await page.evaluate(async ({LINKS})=>{
        let date = new Date().getTime()
        let csrf = document.querySelector("head > meta[name='csrf-token']").content
        let response = await fetch(`${LINKS.DPA.PENDAPATAN}0?_=${date}`)
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
    for (const [index, skpd] of listSKPD.entries()) {
        // ambil dinas yang memiliki pagu pendapatan
        if(parseInt(skpd.nilai_pagu) !== 0 || parseInt(skpd.nilai_pagu_hist) !== 0){
            let namaSKPD = skpd.nama_skpd
            let kodeSKPD = skpd.kode_skpd
            let idSKPD = skpd.id_skpd
            namaSKPD = namaSKPD.split(`${kodeSKPD} `)[1]
            namaSKPD = `${index+1}. ${namaSKPD}`;
            console.log(`Memulai SKPD ${namaSKPD} ....`)
            
            let detailCetak = {
                'id_unit': skpd.id_unit,
                'nama_skpd':`${namaSKPD}`,
                'pagu_sekarang':skpd.nilai_pagu,
                'pagu_sebelum':skpd.nilai_pagu_hist,
            }

            let postParameter = {
                '_token':csrf,
                'id_skpd': idSKPD,
                'model':'pendapatan',
            };

            let pv = {
                postParameter,
                LINKS, 
                cookieList, 
                config,
                detailCetak
            }
            
            console.log('Mengambil Link ....')
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
                            console.log(`Set Tanggal, Simpan data ${pv.detailCetak.nama_skpd}`)
                            return {
                                ...pv.detailCetak,
                                'link':link
                            }
                        } else {
                            let link = jadwal.action
                            console.log(`Tanggal Sudah Diset, Simpan data ${pv.detailCetak.nama_skpd}`)
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

            listCetakSKPD.push(pageEvaluate)
        }
    }
    console.log("Menyimpan List SKPD DPA Pendapatan .....")
    fs.writeFile(`${PATH.DPA.JSON}\\dpaPendapatan.json`, JSON.stringify(listCetakSKPD), function(err) { 
        if (err) {
            console.log('File JSON tidak bisa disimpan', err)
        }
        console.log('List SKPD DPA Pendapatan Berhasil Disimpan')
    });
    
    download(listCetakSKPD, listSKPDLengkap);
}

const download = async (listSKPD, listSKPDLengkap) => {
        
    if(!fs.existsSync(PATH.DPA.PENDAPATAN)){
        console.log(`Membuat Folder ${PATH.DPA.PENDAPATAN}`)
        fs.mkdirSync(PATH.DPA.PENDAPATAN)
    } else {
        console.log(`Folder ${PATH.DPA.PENDAPATAN} Sudah Ada`)
    }


    for (const [index, skpd] of listSKPDLengkap.entries()) {
        let idUnit = skpd.id_unit
        let filter = listSKPD.filter((lskpd) => {
            if(lskpd.id_unit === idUnit){
                return lskpd
            }
        })

        if(filter.length === 0){
            continue
        }

        let namaSKPD = skpd.nama_skpd
        let kodeSKPD = skpd.kode_skpd
        namaSKPD = namaSKPD.split(`${kodeSKPD} `)[1]
        namaSKPD = `${index+1}. ${namaSKPD}`;

        console.log(`melakukan download SKPD ${namaSKPD}`)

        let file = `${PATH.DPA.PENDAPATAN}\\${namaSKPD}.pdf`

        if(fs.existsSync(file)){
            fs.rmSync(file)
        }

        let res = await ax.get(filter[0].link,{
            responseType:"stream"
        })
        
        await  res.data.pipe(fs.createWriteStream(file))
        console.log(`file tersimpan di ${file}`)
    }

}

module.exports = {
    getLink: getLink,
    download: download
};