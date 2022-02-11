module.exports = {
    print: async (page) => {
        await page.$$eval('#table_unit > tbody > tr', el => el.map(e => {
            let nodes = e.childNodes;
            let SKPD = nodes[0].innerText;
            let paguSesudah = nodes[2].innerText;
            if(parseInt(paguSesudah) !== 0) {
                let print = nodes[3].childNodes[0];
                let link = print.getAttributeNode('onclick').value;
                return {
                    'nama': SKPD,
                    'link': link,
                }
            }
        }));
    }
};