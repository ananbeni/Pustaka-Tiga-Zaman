
async function muatBerita() {
  const daftar = document.getElementById("daftar-berita");
  if (!daftar) return;

  daftar.textContent = "Memuat berita terbaru...";

  const API_BERITA =
    "https://api.github.com/repos/ananbeni/pustaka-tiga-zaman/contents/berita?ref=main";

  // Membuat desain kartu berita jika belum tersedia.
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

  // Membaca nilai dari front matter Markdown.
  function ambilField(teks, nama) {
    const pola = new RegExp(
      "^" + nama + ":\\s*(.*?)\\s*$",
      "m"
    );

    const cocok = teks.match(pola);

    return cocok
      ? cocok[1].trim().replace(/^['"]|['"]$/g, "")
      : "";
  }

  // Membuat alamat gambar tetap dapat dibaca.
  function alamatGambar(gambar) {
    if (!gambar) return "";

    if (/^https?:\/\//i.test(gambar)) {
      return gambar;
    }

    if (gambar.startsWith("/")) {
      return gambar;
    }

    return "/" + gambar;
  }

  // Membuat URL halaman preview artikel.
  function alamatArtikel(namaFile) {
    const slug = namaFile.replace(/\.md$/i, "");

    return (
      "/pratinjau/" +
      encodeURIComponent(slug) +
      "/"
    );
  }

  try {
    // Mengambil daftar seluruh file dari folder berita GitHub.
    const responsDaftar = await fetch(API_BERITA, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      cache: "no-store"
    });

    if (!responsDaftar.ok) {
      throw new Error(
        "GitHub API gagal: HTTP " + responsDaftar.status
      );
    }

    const daftarFile = await responsDaftar.json();

    if (!Array.isArray(daftarFile)) {
      throw new Error("Format daftar berita dari GitHub tidak valid.");
    }

    // Memilih semua file Markdown, tanpa daftar nama manual.
    const fileMarkdown = daftarFile.filter(file =>
      file.type === "file" &&
      file.name.toLowerCase().endsWith(".md")
    );

    if (fileMarkdown.length === 0) {
      daftar.textContent = "Belum ada berita yang diterbitkan.";
      return;
    }

    // Mengambil isi seluruh berita.
    const hasilBerita = await Promise.all(
      fileMarkdown.map(async file => {
        try {
          const respons = await fetch(file.download_url, {
            cache: "no-store"
          });

          if (!respons.ok) {
            console.warn(
              "Berita gagal dimuat:",
              file.name,
              respons.status
            );
            return null;
          }

          const mentah = await respons.text();

          // Membaca front matter Markdown.
          const cocok = mentah.replace(/^\uFEFF/, "").match(
            /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/
          );

          if (!cocok) {
            console.warn(
              "Format front matter tidak ditemukan:",
              file.name
            );
            return null;
          }

          const data = cocok[1];
          const namaFile = file.name;

          return {
            fileName: namaFile,
            judul: ambilField(data, "title") || namaFile,
            tanggal: ambilField(data, "date"),
            kategori: ambilField(data, "category"),
            ringkasan: ambilField(data, "description"),
            gambar: alamatGambar(
              ambilField(data, "image")
            )
          };

        } catch (error) {
          console.warn(
            "Kesalahan membaca berita:",
            file.name,
            error
          );
          return null;
        }
      })
    );

    // Menghapus berita yang gagal dibaca dan mengurutkan terbaru.
    const valid = hasilBerita
      .filter(Boolean)
      .sort((a, b) => {
        return (
          (b.tanggal || "").localeCompare(a.tanggal || "") ||
          b.fileName.localeCompare(a.fileName)
        );
      });

    daftar.replaceChildren();

    if (valid.length === 0) {
      daftar.textContent =
        "Berita belum dapat dimuat. Periksa format file Markdown.";
      return;
    }

    // Menampilkan kartu berita.
    valid.forEach(berita => {
      const kartu = document.createElement("article");
      kartu.className = "kartu-berita";

      // Foto berita.
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

      // Judul berita.
      const judul = document.createElement("h3");
      const tautanJudul = document.createElement("a");

      tautanJudul.href = alamatArtikel(berita.fileName);
      tautanJudul.textContent = berita.judul;
      tautanJudul.style.cssText =
        "color:#171717;text-decoration:none;font-size:1.2rem;";

      judul.appendChild(tautanJudul);
      isiKartu.appendChild(judul);

      // Tanggal dan kategori.
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

      // Ringkasan berita.
      if (berita.ringkasan) {
        const ringkasan = document.createElement("p");
        ringkasan.textContent = berita.ringkasan;
        isiKartu.appendChild(ringkasan);
      }

      // Tombol baca selengkapnya.
      const baca = document.createElement("a");

      baca.href = alamatArtikel(berita.fileName);
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
      "Berita belum dapat dimuat. Silakan coba kembali beberapa saat lagi.";
  }
}

// Menjalankan pemuatan berita.
muatBerita();
