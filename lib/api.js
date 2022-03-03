const {
    TAHUN_ANGGARAN,
    ID_DAERAH,
    NAMA_JADWAL,
    PATH_DPA
} = require('./config')
const { default: axios } = require('axios')
const axiosRetry = require('axios-retry')
const https =  require('https')
const fs = require('fs')
const cookiesFilePath = 'cookies.json'
const cookiesString = fs.readFileSync(cookiesFilePath)
const parsedCookies = JSON.parse(cookiesString)

let cookieList = '';

for (let cookie of parsedCookies) {
    if(cookie.name === 'siap_session'){
        let now = new Date();
        let cookieDay = new Date(cookie.expires * 1000);
        cookieList = `${cookie.name}=${cookie.value}; Path=${cookie.path}; HttpOnly; Expires=${cookieDay.toUTCString()};`
    }
}

const httpsAgent = new https.Agent({ rejectUnauthorized:false})

const instance = axios.create({
    headers:{
        Cookie:cookieList
    },
    timeout:60000,
    httpsAgent: httpsAgent
})
axiosRetry(instance, { retries: 4})



module.exports = {
    cookieList:cookieList,
    ax:instance,
    httpsAgent: httpsAgent,
    LINKS:{
        RAK:{
            BELANJA:`https://burukab.sipd.kemendagri.go.id/siap/rak-belanja/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`
        },
        DPA:{
            BELANJA:`https://burukab.sipd.kemendagri.go.id/siap/dpa-bl/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            DEPAN:`https://burukab.sipd.kemendagri.go.id/siap/halaman-depan-dpa/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            PEMBIAYAAN:`https://burukab.sipd.kemendagri.go.id/siap/dpa-biaya/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            PENDAPATAN:`https://burukab.sipd.kemendagri.go.id/siap/dpa-penda/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            PERSETUJUANDEPAN: `https://burukab.sipd.kemendagri.go.id/siap/halaman-persetujuan-dpa/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            RINCIANBELANJA:`https://burukab.sipd.kemendagri.go.id/siap/dpa-bl-rinci/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            RINCIANBELANJASKPD:`https://burukab.sipd.kemendagri.go.id/siap/dpa-bl-rinci/tampil-giat/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            SKPD:`https://burukab.sipd.kemendagri.go.id/siap/dpa-skpd/tampil-unit`,
            HISTJADWAL:`https://burukab.sipd.kemendagri.go.id/siap/jadwal/${TAHUN_ANGGARAN}/hist-jadwal-dpa/${ID_DAERAH}`,
            SETTINGTANGGAL:`https://burukab.sipd.kemendagri.go.id/siap/cetak-dpa/setting-link/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}`
        },
        DEPAN:{
            HOME:'https://burukab.sipd.kemendagri.go.id/siap/home',
            LOGIN:'https://burukab.sipd.kemendagri.go.id/siap'
        }
    },
    PATH:{
        DPA:{
            UTAMA:`${PATH_DPA}\\${NAMA_JADWAL}`,
            JSON:`${PATH_DPA}\\${NAMA_JADWAL}\\JSON`,
            BELANJA:`${PATH_DPA}\\${NAMA_JADWAL}\\5. DPA Belanja`,
            DEPAN:`${PATH_DPA}\\${NAMA_JADWAL}\\2. Halaman Depan`,
            PEMBIAYAAN:`${PATH_DPA}\\${NAMA_JADWAL}\\7. Pembiayaan`,
            PENDAPATAN:`${PATH_DPA}\\${NAMA_JADWAL}\\4. DPA Pendapatan`,
            PERSETUJUANDEPAN: `${PATH_DPA}\\${NAMA_JADWAL}\\1. Halaman Persetujuan`,
            RINCIANBELANJA:`${PATH_DPA}\\${NAMA_JADWAL}\\6. DPA Rincian Belanja`,
            SKPD:`${PATH_DPA}\\${NAMA_JADWAL}\\3. DPA SKPD`,
        }
    }
}