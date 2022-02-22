const {
    LINKS,
    ax,
    PATH
} = require('../api')
const {
    NAMA_JADWAL,
    TANGGAL_DPA,
} =  require('../config')
const fs = require('fs')

module.exports = {
    getLink: async (page) => {
        console.log('Request data SKPD')
        const pageEvaluate = await page.evaluate(async ({LINKS})=>{
            let date = new Date().getTime()
            let csrf = document.querySelector("head > meta[name='csrf-token']").content
            let response = await fetch(`${LINKS.DPA.PENDAPATAN}0?_=${date}`)
            let { data:listSKPD } = await response.json()
            return {
                csrfToken:csrf,
                listSKPD:listSKPD
            }
        }, {LINKS})
        const csrf = pageEvaluate.csrfToken
        const listSKPD = pageEvaluate.listSKPD
        console.log(`Mendapatkan data ${listSKPD.length} SKPD`)
        let listCetakSKPD = []
        for (const [index, skpd] of listSKPD.entries()) {
            // skip dinas yang tidak punya pendapatan
            if(skpd.nilai_pagu === 0){
                continue;
            }
            let namaSKPD = skpd.nama_skpd
            let kodeSKPD = skpd.kode_skpd
            namaSKPD = namaSKPD.split(`${kodeSKPD} `)[1]
            namaSKPD = `${index+1}. ${namaSKPD}`;
            console.log(`Memulai SKPD ${namaSKPD} ....`)
            console.log(`Mendapatkan Jadwal ....`)
            let postJadwal = await ax.post(`${LINKS.DPA.HISTJADWAL}`,{
                '_token':csrf,
                'model':'pendapatan',
                'id_skpd':skpd.id_skpd
            })
            console.log(`Jadwal didapatkan ....`)
            let listJadwal = postJadwal.data.data
            for (const jadwal of listJadwal) {
                if(jadwal.nama_sub_tahap_siap === NAMA_JADWAL) {
                    if(jadwal.set_tgl_cetak == null){
                        let postTanggal = await ax.post(`${LINKS.DPA.SETTINGTANGGAL}`,{
                            '_token':csrf,
                            'model':'pendapatan',
                            'id_skpd':skpd.id_skpd,
                            'id_jadwal':jadwal.id_jadwal,
                            'tgl_cetak':TANGGAL_DPA
                        })
                        let link = postTanggal.data
                        console.log(`Simpan data ${namaSKPD}`)
                        listCetakSKPD.push({'nama_skpd':`${namaSKPD}`, 'link':link})
                    } else {
                        let link = jadwal.action
                        console.log(`Simpan data ${namaSKPD}`)
                        link = link.match(/href='([^']*)/g)
                        link = link[link.length-1]
                        link = link.replace("href='",'')
                        listCetakSKPD.push({'nama_skpd':`${namaSKPD}`, 'link':link})
                    }
                }
            }
        }
        console.log("Menyimpan List SKPD DPA Pendapatan .....")
        fs.writeFile(`${PATH.DPA.JSON}\\dpaPendapatan.json`, JSON.stringify(listCetakSKPD), function(err) { 
            if (err) {
                console.log('File JSON tidak bisa disimpan', err)
            }
            console.log('List SKPD DPA Pendapatan Berhasil Disimpan')
        });
    },
    download: async (listSKPD) => {

    }
};