const {
    LINKS
} = require('../api')

module.exports = {
    print: async (page) => {
        page.on('console', (log) => console[log._type](log._text));
        const listCetak = await page.evaluate(async ()=>{
            let date = new Date().getTime()
            let response = await fetch(`${LINKS.DPA.PERSETUJUANDEPAN}0?_=${date}`)
            let { data:listSKPD } = await response.json()
            let csrf = document.querySelector("head > meta[name='csrf-token']").content
            for (const skpd of listSKPD) {
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
                let listCetakSKPD = [];
                for (const jadwal of listJadwal) {
                    if(jadwal.nama_sub_tahap_siap === '') {
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
                                    'tgl_cetak':'2022-02-08'
                                }
                            })
                            let link = await postTanggal.text();
                            let skpdCetak = 1;
                        } else {

                        }
                    } 
                }
                break;
            }
        })
        
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