module.exports = {
    getLink: async (page) => {
        await page.evaluate(async () => {
            let csrf = document.querySelectorAll("head > meta[name='csrf-token']")[0].content
            console.log(csrf)
            fetch("")
        })
    },
    download: async (listSKPD) => {

    }
};