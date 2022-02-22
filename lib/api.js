const {
    TAHUN_ANGGARAN,
    ID_DAERAH,
    NAMA_JADWAL,
    PATH_DPA
} = require('./config')
const { default: axios } = require('axios')
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

const instance = axios.create({
    headers:{
        Cookie:cookieList
    },
    timeout:60000,
    httpsAgent: new https.Agent({rejectUnauthorized:false})
})

module.exports = {
    ax:instance,
    LINKS:{
        DPA:{
            BELANJA:`https://burukab.sipd.kemendagri.go.id/siap/dpa-bl/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            DEPAN:`https://burukab.sipd.kemendagri.go.id/siap/halaman-depan-dpa/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            PEMBIAYAAN:`https://burukab.sipd.kemendagri.go.id/siap/dpa-biaya/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            PENDAPATAN:`https://burukab.sipd.kemendagri.go.id/siap/dpa-penda/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            PERSETUJUANDEPAN: `https://burukab.sipd.kemendagri.go.id/siap/halaman-persetujuan-dpa/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
            RINCIANBELANJA:`https://burukab.sipd.kemendagri.go.id/siap/dpa-bl-rinci/tampil-unit/daerah/main/budget/${TAHUN_ANGGARAN}/${ID_DAERAH}/`,
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
            BELANJA:`5. DPA Belanja`,
            DEPAN:`2. Halaman Depan`,
            PEMBIAYAAN:`7. Pembiayaan`,
            PENDAPATAN:`4. DPA Pendapatan`,
            PERSETUJUANDEPAN: `1. Halaman Persetujuan`,
            RINCIANBELANJA:`6. DPA Rincian Belanja`,
            SKPD:`3. DPA SKPD`,
        }
    }
}