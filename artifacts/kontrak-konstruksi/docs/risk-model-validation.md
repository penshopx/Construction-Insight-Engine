# Dossier validasi model risiko

## Status

**Tertunda — tidak boleh dipakai sebagai skor operasional.** Versi `KG-RISK-0.1-DRAFT` belum dikalibrasi pada hasil proyek nyata dan belum mendapat persetujuan reviewer independen yang kompeten di bidang kontrak dan risiko konstruksi.

## Tujuan dan metode draft

Model adalah indikator prioritas tinjauan internal, bukan probabilitas sengketa, prediksi kegagalan, estimasi kerugian, atau penilaian hukum. Setiap faktor diberi nilai 0–100 berdasarkan input yang dapat ditelusuri. Nilai draft dihitung sebagai jumlah tertimbang:

| Faktor | Bobot | Contoh input yang wajib dirujuk |
| --- | ---: | --- |
| Administrasi kontrak | 30% | register VO, kelengkapan instruksi, status persetujuan |
| Jadwal & notice | 25% | baseline, deviasi, notice, permohonan EOT |
| Mutu & NCR | 25% | register NCR, inspeksi, pengujian, status tindakan koreksi |
| Klaim & sengketa | 20% | register klaim, somasi, notulen negosiasi/mediasi |

Rumus: `round(Σ(nilai faktor × bobot / 100))`. Input dibatasi ke rentang 0–100. Batas kategori draft: 0–39 rendah, 40–69 perlu tinjauan, dan 70–100 prioritas tinggi.

## Ketertelusuran

Setiap snapshot harus menyimpan versi model, daftar sumber input, dan waktu perhitungan. UI wajib menampilkan sumber dan waktu tersebut. Perubahan input harus menghasilkan snapshot baru; nilai lama tidak boleh ditimpa tanpa jejak.

## Revisi metodologi dan riwayat keputusan

`riskModel` adalah metodologi aktif. `riskReviewHistory` adalah daftar kronologis rekaman perubahan dan keputusan; setiap entri memuat versi, salinan faktor/bobot/batas kategori yang ditinjau, fingerprint kanonik dari isi salinan itu, waktu, pencatat, alasan, dan keputusan. Fingerprint adalah representasi JSON deterministik dari seluruh faktor (termasuk kunci, label, bobot, dan urutannya) dan batas kategori (termasuk label, min, max, dan urutannya). Persetujuan hanya berlaku bila **entri terbaru** menyatakan `approved`, versinya sama dengan versi aktif, dan fingerprint entri, salinan metodologi yang direview, serta metodologi aktif cocok persis. Entitas yang sudah disetujui sebelumnya tetap terlihat sebagai riwayat, bukan izin untuk versi yang berbeda atau versi yang kembali memakai konfigurasi lama.

Saat faktor, bobot, batas kategori, atau versi berubah, skor operasional otomatis terkunci sampai ada keputusan review baru. Jika perubahan belum dicatat, UI menandainya sebagai perubahan metodologi yang perlu review; jangan mengganti entri lama atau menyalin status persetujuannya. Buat versi baru dan tambahkan entri `pending_expert_review` dengan snapshot independen dan alasan perubahan. Setelah hasil uji dan review selesai, tambahkan keputusan `approved` atau `rejected` baru beserta identitas reviewer, kompetensi terverifikasi, independensi, ruang lingkup, batasan, waktu, dan catatan. Pertahankan entri terdahulu untuk audit; tinjau perubahan daftar ini dalam version control. UI menampilkan versi aktif, versi terakhir yang disetujui, dan riwayat keputusan. Rekaman kode ini bukan pengganti sistem persetujuan elektronik atau validasi hukum.

## Kasus representatif dan kriteria penerimaan

Sebelum status dapat menjadi `approved`, pengujian harus mencakup sekurangnya:

1. Proyek stabil dengan dokumen lengkap dan tidak ada klaim aktif.
2. Keterlambatan dengan notice dan EOT lengkap.
3. Beberapa NCR terbuka tanpa sengketa kontraktual.
4. VO ditolak dan sengketa aktif.
5. Input hilang, kedaluwarsa, kontradiktif, dan nilai di luar rentang.

Reviewer harus menilai relevansi faktor, bobot, batas kategori, ketahanan terhadap input hilang, konsistensi antarkasus, dan risiko bias. Hasil uji harus direkam dengan expected result, actual result, penyimpangan, dan keputusan reviewer.

## Persetujuan reviewer

Persetujuan belum tersedia. Untuk membuka skor operasional, rekaman persetujuan harus memuat nama reviewer, kompetensi yang diverifikasi, independensi/konflik kepentingan, tanggal, versi model, ruang lingkup review, keputusan, dan catatan pembatasan. Pengembang aplikasi tidak boleh dianggap sebagai reviewer domain.

## Keterbatasan

- Data demo bukan bukti kalibrasi atau validasi.
- Skor tidak menggantikan pemeriksaan kontrak, fakta proyek, atau pendapat ahli.
- Kualitas hasil bergantung pada kelengkapan, kebaruan, dan ketepatan sumber input.
- Bobot dan batas kategori belum didukung analisis statistik terhadap outcome proyek.
- Model tidak menilai sebab-akibat, tanggung jawab, kepatuhan, atau hak hukum.