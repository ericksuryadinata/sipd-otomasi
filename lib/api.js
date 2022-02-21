const {
    TAHUN_ANGGARAN,
    ID_DAERAH,
} = require('./config')

module.exports = {
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
    }
}