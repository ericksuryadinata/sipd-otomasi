module.exports = {
    listSKPD: async (page) => {
        return await page.$$eval('#tabel-dpa-skpd > tbody > tr', el => el.map(e => {
            let nodes = e.childNodes;
            let kodeSKPD = nodes[0].innerText;
            let SKPD = nodes[1].innerText;
            let print = nodes[2].childNodes[0];
            let link = print.getAttributeNode('onclick').value;
            return {
                'nama': `${kodeSKPD} ${SKPD}`,
                'link': link,
            }
        }))
    }
};