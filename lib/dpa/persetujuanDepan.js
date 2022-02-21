const {
    LINKS
} = require('../api')
const {
    NAMA_JADWAL,
    TANGGAL_DPA
} =  require('../config')

module.exports = {
    print: async (page) => {
        page.on('console', (log) => console[log._type](log._text))
        const listCetak = await page.evaluate(async ({LINKS, NAMA_JADWAL, TANGGAL_DPA})=>{
            let date = new Date().getTime()
            let response = await fetch(`${LINKS.DPA.PERSETUJUANDEPAN}0?_=${date}`)
            let { data:listSKPD } = await response.json()
            let csrf = document.querySelector("head > meta[name='csrf-token']").content
            let listCetakSKPD = []
            for (const [index, skpd] of listSKPD.entries()) {
                let namaSKPD = skpd.nama_skpd
                let kodeSKPD = skpd.kode_skpd
                namaSKPD = namaSKPD.split(`${kodeSKPD} `)
                let postJadwal = await fetch(`${LINKS.DPA.HISTJADWAL}`,{
                    'method':'POST',
                    'headers':{
                        'Content-Type':'application/x-www-form-urlencoded'
                    },
                    'body':{
                        '_token':csrf,
                        'model':'halaman-persetujuan',
                        'id_skpd':skpd.id_skpd
                    }
                })
                let {data:listJadwal} = await postJadwal.json()
                for (const jadwal of listJadwal) {
                    if(jadwal.nama_sub_tahap_siap === NAMA_JADWAL) {
                        if(jadwal.set_tgl_cetak === null){
                            let postTanggal = await fetch(`${LINKS.DPA.SETTINGTANGGAL}`,{
                                'method':'POST',
                                'headers':{
                                    'Content-Type':'application/x-www-form-urlencoded'
                                },
                                'body':{
                                    '_token':csrf,
                                    'model':'halaman-persetujuan',
                                    'id_skpd':skpd.id_skpd,
                                    'id_jadwal':jadwal.id_jadwal,
                                    'tgl_cetak':TANGGAL_DPA
                                }
                            })
                            let link = await postTanggal.text();
                            listCetakSKPD.push({'nama_skpd':`${index+1} ${namaSKPD}`, 'link':link})
                        } else {
                            let link = jadwal.action
                            link = link.match(/href='([^']*)/g)
                            link = link[link.length-1]
                            link = link.replace("href='",'')
                            listCetakSKPD.push({'nama_skpd':`${index+1} ${namaSKPD}`, 'link':link})
                        }
                    } 
                }
            }
            console.log(listCetakSKPD)
        }, {LINKS, NAMA_JADWAL, TANGGAL_DPA})
        
    },
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