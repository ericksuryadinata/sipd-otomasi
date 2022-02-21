const {
    LINKS,
    ax
} = require('../api')
const {
    NAMA_JADWAL,
    TANGGAL_DPA
} =  require('../config')

module.exports = {
    print: async (page) => {
        console.log('Request data SKPD')
        const pageEvaluate = await page.evaluate(async ({LINKS})=>{
            let date = new Date().getTime()
            let csrf = document.querySelector("head > meta[name='csrf-token']").content
            let response = await fetch(`${LINKS.DPA.PERSETUJUANDEPAN}0?_=${date}`)
            let { data:listSKPD } = await response.json()
            return {
                csrfToken:csrf,
                listSKPD:listSKPD
            }
        }, {LINKS})
        const csrf = pageEvaluate.csrfToken
        const listSKPD = pageEvaluate.listSKPD
        console.log(`Mendapatkan data ${listSKPD.length} SKPD`)
        for (const [index, skpd] of listSKPD.entries()) {
            let namaSKPD = skpd.nama_skpd
            let kodeSKPD = skpd.kode_skpd
            namaSKPD = namaSKPD.split(`${kodeSKPD} `)[1]
            namaSKPD = `${index+1} ${namaSKPD}`;
            console.log(`Memulai SKPD ${namaSKPD} ....`)
            console.log(`Mendapatkan Jadwal ....`)
            let postJadwal = await ax.post(`${LINKS.DPA.HISTJADWAL}`,{
                '_token':csrf,
                'model':'halaman-persetujuan',
                'id_skpd':skpd.id_skpd
            })
            console.log(`Jadwal didapatkan ....`)
            let listJadwal = postJadwal.data.data
            for (const jadwal of listJadwal) {
                if(jadwal.nama_sub_tahap_siap === NAMA_JADWAL) {
                    if(jadwal.set_tgl_cetak == null){
                        let postTanggal = await ax.post(`${LINKS.DPA.SETTINGTANGGAL}`,{
                            '_token':csrf,
                            'model':'halaman-persetujuan',
                            'id_skpd':skpd.id_skpd,
                            'id_jadwal':jadwal.id_jadwal,
                            'tgl_cetak':TANGGAL_DPA
                        })
                        console.log(postTanggal.data)
                        console.log(`Simpan data ${namaSKPD}`)
                        // listCetakSKPD.push({'nama_skpd':`${index+1} ${namaSKPD}`, 'link':link})
                    } else {
                        let link = jadwal.action
                        console.log(link)
                        console.log(`Simpan data ${namaSKPD}`)
                        // link = link.match(/href='([^']*)/g)
                        // link = link[link.length-1]
                        // link = link.replace("href='",'')
                        // listCetakSKPD.push({'nama_skpd':`${index+1} ${namaSKPD}`, 'link':link})
                    }
                }
            }
            // break;
        }
    },
    
    // let listCetakSKPD = []
    // for (const [index, skpd] of listSKPD.entries()) {
    //     let namaSKPD = skpd.nama_skpd
    //     let kodeSKPD = skpd.kode_skpd
    //     namaSKPD = namaSKPD.split(`${kodeSKPD} `)[1]
    //     let postJadwal = await fetch(`${LINKS.DPA.HISTJADWAL}`,{
    //         'method':'POST',
    //         'headers':{
    //             'Content-Type':'application/x-www-form-urlencoded'
    //         },
    //         'body':{
    //             '_token':csrf,
    //             'model':'halaman-persetujuan',
    //             'id_skpd':skpd.id_skpd
    //         }
    //     })
    //     let {data:listJadwal} = await postJadwal.json()
    //     console.log(listJadwal)
    //     for (const jadwal of listJadwal) {
    //         if(jadwal.nama_sub_tahap_siap === NAMA_JADWAL) {
    //             if(jadwal.set_tgl_cetak == null){
    //                 console.log("Tidak ada tanggal cetak")
    //                 let body = {
    //                     '_token':csrf,
    //                     'model':'halaman-persetujuan',
    //                     'id_skpd':skpd.id_skpd,
    //                     'id_jadwal':jadwal.id_jadwal,
    //                     'tgl_cetak':TANGGAL_DPA
    //                 }
    //                 console.log(body)
    //                 let postTanggal = await fetch(`${LINKS.DPA.SETTINGTANGGAL}`,{
    //                     'method':'POST',
    //                     'headers':{
    //                         'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
    //                     },
    //                     'body': body
    //                 })
    //                 let link = await postTanggal.text();
    //                 listCetakSKPD.push({'nama_skpd':`${index+1} ${namaSKPD}`, 'link':link})
    //             } else {
    //                 console.log("ada jadwal cetak")
    //                 let link = jadwal.action
    //                 console.log(link)
    //                 link = link.match(/href='([^']*)/g)
    //                 link = link[link.length-1]
    //                 link = link.replace("href='",'')
    //                 listCetakSKPD.push({'nama_skpd':`${index+1} ${namaSKPD}`, 'link':link})
    //             }
    //         } 
    //     }
    //     break;
    // }
    // console.log(listCetakSKPD)
    // pilihJadwal: async (page) => {
    //     await page.waitForFunction(() => document.querySelectorAll('#table_unit > tbody > tr').length >= 5);
    //     await page.$$eval('#table_hist_jadwal > tbody > tr', el => el.map( async (e) => {
    //         let nodes = e.childNodes;
    //         let jadwal = nodes[3].innerText;
    //         let tanggal = nodes[4].childNodes[0];
    //         let print = nodes[5].childNodes[0];
    //         console.log(jadwal);
    //         if(jadwal === 'Penetapan APBD Pergeseran IV'){
    //             console.log(`${jadwal} click`);
    //             await print.click(); 
    //         }
    //     }));
    // }
};