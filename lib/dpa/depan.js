module.exports = {
    print: async (page) => {
        await page.evaluate(async () => {
            let csrf = document.querySelectorAll("head > meta[name='csrf-token']")[0].content
            console.log(csrf)
            fetch("")
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