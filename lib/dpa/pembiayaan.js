module.exports = {
    listSKPD: async (page) => {
        return await page.$$eval('#table_unit > tbody > tr', el => el.map(e => {
            let nodes = e.childNodes;
            let SKPD = nodes[0].innerText;
            let paguPenerimaan = nodes[3].innerText;
            if(parseInt(paguPenerimaan) !== 0) {
                let print = nodes[5].childNodes[0];
                let link = print.getAttributeNode('onclick').value;
                return {
                    'nama': SKPD,
                    'link': link,
                }
            }
        }));
    }
};