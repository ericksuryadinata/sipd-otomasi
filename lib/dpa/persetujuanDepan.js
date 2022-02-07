module.exports = {
    listSKPD: async (page) => {
        return await page.$$eval('#table_unit > tbody > tr', el => el.map(e => {
            let nodes = e.childNodes;
            let SKPD = nodes[0].innerText;
            let print = nodes[1].childNodes[0];
            let link = print.getAttributeNode('onclick').value;
            return {
                'nama': SKPD,
                'link': link,
            }
        }))
    }
};