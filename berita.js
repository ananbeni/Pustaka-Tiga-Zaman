
async function muatBerita() {
  const daftar = document.getElementById("daftar-berita");
  if (!daftar) return;

  daftar.textContent = "Memuat berita...";

  const DASAR =
    "https://raw.githubusercontent.com/ananbeni/Pustaka-Tiga-Zaman/main/berita/";

  const DAFTAR_FILE = [
    "2026-10-18-konsolidasi-pbpsh-ke-hrdh-soewarno.md",
    "2026-10-18-peran-bapak-ismadi-dalam-sejarah-pshw-tm.md",
    "2026-10-18-uji-coba.md",
    "2026-10-25-latber-pshwtm-ranting-wonokromo-syiar-persaudaraan-dan-pelestarian-ajaran.md",
    "2026-11-07-rangkaian-menjelang-haul-hr-djimat-hendro-soewarno-pshwtm-cab-ponorogo.md",
    "2026-11-09-pshwtm-ponorogo-perkuat-nilai-spiritual-dalam-rangkaian-haul-hr-djimat-hendro-soewarno.md"
  ];

  if (!document.getElementById("gaya-berita")) {
    const style = document.createElement("style");
    style.id = "gaya-berita";
    style.textContent = `
      #daftar-berita {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      .kartu-berita {
        background: #fffdf5;
        color: #222;
        border: 2px solid #d9ad22;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px #0001;
      }
      .foto-berita {
        display: block;
        width: 100%;
        height: 210px;
        object-fit: cover;
        background: #eee;
      }
      .isi-kartu-berita {
        padding: 16px;
        overflow-wrap: anywhere;
      }
      .isi-kartu-berita h3 {
        margin-top: 0;
        color: #171717;
      }
      .meta-berita {
        font-size: 13px;
        color: #725b16;
        margin-bottom: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function ambilField(teks, nama) {
    const pola = new RegExp(
      "^" + nama + ":\\s*(.*?)\\s*$",
      "m"
    );
    const cocok = teks.match(pola);
    return cocok
      ? cocok[1].replace(/^['"]|['"]$/g, "")
      : "";
  }

  try {
    const hasilBerita = await Promise.all(
      DAFTAR_FILE.map(async namaFile => {
        const respons = await fetch(
          DASAR + encodeURIComponent(namaFile)
        );

        if (!respons.ok) {
          console.warn("Berita gagal dimuat:", namaFile);
          return null;
        }

        const mentah = await respons.text();

        const cocok = mentah.match(
          /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/
        );

        if (!cocok) return null;

        const data = cocok[1];

        return {
          fileName: namaFile,
          judul: ambilField(data, "title") || namaFile,
          tanggal: ambilField(data, "date"),
          kategori: ambilField(data, "category"),
          ringkasan: ambilField(data, "description"),
          gambar: ambilField(data, "image")
        };
      })
    );

    const valid = hasilBerita
      .filter(Boolean)
      .sort((a, b) => {
        return (b.tanggal || "").localeCompare(a.tanggal || "") ||
          b.fileName.localeCompare(a.fileName);
      });

    daftar.replaceChildren();

    if (valid.length === 0) {
      daftar.textContent =
        "Berita belum dapat dimuat. Silakan coba kembali.";
      return;
    }

    valid.forEach(berita => {
      const kartu = document.createElement("article");
      kartu.className = "kartu-berita";

      if (berita.gambar) {
        const foto = document.createElement("img");
        foto.className = "foto-berita";
        foto.src = berita.gambar;
        foto.alt = berita.judul;
        foto.loading = "lazy";
        foto.onerror = () => foto.remove();
        kartu.appendChild(foto);
      }

      const isiKartu = document.createElement("div");
      isiKartu.className = "isi-kartu-berita";

      const judul = document.createElement("h3");
      const tautanJudul = document.createElement("a");

      tautanJudul.href =
        "/pratinjau/" +
        encodeURIComponent(
          berita.fileName.replace(/\.md$/i, "")
        ) + "/";

      tautanJudul.textContent = berita.judul;
      tautanJudul.style.cssText =
        "color:#171717;text-decoration:none;font-size:1.2rem;";

      judul.appendChild(tautanJudul);
      isiKartu.appendChild(judul);

      const meta = document.createElement("div");
      meta.className = "meta-berita";

      let tanggalTampil = berita.tanggal;

      if (berita.tanggal) {
        const tanggal = new Date(
          berita.tanggal + "T00:00:00"
        );

        if (!Number.isNaN(tanggal.getTime())) {
          tanggalTampil = tanggal.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          });
        }
      }

      meta.textContent = [
        tanggalTampil,
        berita.kategori
      ].filter(Boolean).join(" • ");

      isiKartu.appendChild(meta);

      if (berita.ringkasan) {
        const ringkasan = document.createElement("p");
        ringkasan.textContent = berita.ringkasan;
        isiKartu.appendChild(ringkasan);
      }

      const baca = document.createElement("a");

      baca.href =
        "/pratinjau/" +
        encodeURIComponent(
          berita.fileName.replace(/\.md$/i, "")
        ) + "/";

      baca.textContent = "Baca Selengkapnya →";
      baca.style.cssText =
        "display:inline-block;margin-top:10px;color:#9A6B00;font-weight:bold;text-decoration:none;";

      isiKartu.appendChild(baca);

      kartu.appendChild(isiKartu);
      daftar.appendChild(kartu);
    });

  } catch (error) {
    console.error("Kesalahan memuat berita:", error);
    daftar.textContent =
      "Berita belum dapat dimuat. Silakan periksa koneksi internet.";
  }
}

muatBerita();
