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

            let listCetakKegiatanSKPD = [];
            for(const kegiatanSKPD of listKegiatanSKPD){
                let kodeBl = kegiatanSKPD.kode_bl
                let namaKegiatan = kegiatanSKPD.nama_giat
                let namaUnitSKPD = kegiatanSKPD.nama_skpd
                let idSubSKPD = kegiatanSKPD.id_sub_skpd
                console.log(`Mendapatkan Jadwal ${kegiatanSKPD.nama_giat}`)
                let postJadwal = await ax.post(`${LINKS.DPA.HISTJADWAL}`, {
                    data: {
                        '_token':csrf,
                        'model':'bl_rinci',
                        'id_skpd':idSKPD,
                        'kode_bl': kodeBl
                    },
                    headers: { 
                        'X-Requested-With': 'XMLHttpRequest', 
                        'Referer': linkRincianBelanja, 
                        'Connection': 'keep-alive'
                    },
                })
                console.log(`Jadwal ${kegiatanSKPD.nama_giat} didapatkan ....`)
                let listJadwal = postJadwal.data.data
                for (const jadwal of listJadwal) {
                    if(jadwal.nama_sub_tahap_siap === NAMA_JADWAL) {
                        if(jadwal.set_tgl_cetak == null){
                            let postTanggal = await ax.post(`${LINKS.DPA.SETTINGTANGGAL}`,{
                                '_token':csrf,
                                'model':'bl',
                                'id_skpd':skpd.id_skpd,
                                'id_jadwal':jadwal.id_jadwal,
                                'kode_bl': kodeBl,
                                'tgl_cetak':TANGGAL_DPA
                            })
                            let link = postTanggal.data
                            console.log(`Set Tanggal, Simpan data ${namaUnitSKPD} Kegiatan ${namaKegiatan}`)
                            listCetakKegiatanSKPD.push({
                                'id_sub_skpd': `${idSubSKPD}`, 
                                'nama_skpd':`${namaUnitSKPD}`, 
                                'nama_kegiatan': `${namaKegiatan}`, 
                                'link':link
                            })
                        } else {
                            let link = jadwal.action
                            console.log(`Simpan data ${namaUnitSKPD} Kegiatan ${namaKegiatan}`)
                            link = link.match(/href='([^']*)/g)
                            link = link[link.length-1]
                            link = link.replace("href='",'')
                            listCetakKegiatanSKPD.push({
                                'id_sub_skpd': `${idSubSKPD}`, 
                                'nama_skpd':`${namaUnitSKPD}`, 
                                'nama_kegiatan': `${namaKegiatan}`, 
                                'link':link
                            })
                        }
                    }
                }
            }

            console.log(listCetakKegiatanSKPD)

            listCetakKegiatanSKPD = listCetakKegiatanSKPD.reduce((res, curr) =>
            {
                if (res[curr.id_sub_skpd])
                    res[curr.id_sub_skpd].push(curr);
                else
                    Object.assign(res, {[curr.nama_skpd]: [curr]});

                return res;
            }, {});

            console.log(listCetakKegiatanSKPD);

            break;
            
        }
        // console.log("Menyimpan List SKPD DPA Belanja .....")
        // fs.writeFile(`${PATH.DPA.JSON}\\dpaRincianBelanja.json`, JSON.stringify(listCetakSKPD), function(err) { 
        //     if (err) {
        //         console.log('File JSON tidak bisa disimpan', err)
        //     }
        //     console.log('List SKPD DPA Belanja Berhasil Disimpan')
        // });
    },
    download: async (listSKPD) => {

    }
};