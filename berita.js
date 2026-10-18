
async function muatBerita() {
  const daftar = document.getElementById("daftar-berita");
  if (!daftar) return;

  daftar.textContent = "Memuat berita...";

  const API =
    "https://api.github.com/repos/ananbeni/pustaka-tiga-zaman/contents/berita";

  // Gaya tampilan berita
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
      .isi-artikel {
        line-height: 1.8;
        overflow-wrap: anywhere;
      }
      .isi-artikel img {
        max-width: 100%;
        height: auto;
      }
      .isi-artikel a {
        color: #765700;
        overflow-wrap: anywhere;
      }
    `;
    document.head.appendChild(style);
  }

  function aman(teks) {
    return String(teks || "").replace(/[&<>"']/g, karakter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[karakter]);
  }

  function ambilField(teks, nama) {
    const pola = new RegExp(
      "^" + nama + ":\\s*(.*?)\\s*$",
      "m"
    );
    const cocok = teks.match(pola);
    return cocok ? cocok[1].replace(/^['"]|['"]$/g, "") : "";
  }

  function ubahMarkdown(teks) {
    let html = aman(teks);

    // Gambar Markdown
    html = html.replace(
      /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      (semua, alt, url) => {
        const sumber = url.startsWith("/")
          ? url
          : url.startsWith("https://") || url.startsWith("http://")
            ? url
            : "";
        return sumber
          ? `<img src="${aman(sumber)}" alt="${alt}" loading="lazy">`
          : "";
      }
    );

    // Tautan Markdown
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html
      .replace(/^### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^## (.+)$/gm, "<h3>$1</h3>")
      .replace(/^# (.+)$/gm, "<h2>$1</h2>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

    return html
      .split(/\n\s*\n/)
      .map(paragraf => {
        const isi = paragraf.trim();
        if (!isi) return "";
        if (/^<(h[2-4]|img|ul|ol|li|blockquote)\b/i.test(isi)) {
          return isi;
        }
        return "<p>" + isi.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  try {
    const respons = await fetch(API);

    if (!respons.ok) {
      throw new Error("Daftar berita tidak bisa diakses.");
    }

    const files = await respons.json();
const daftarFile = files
  .filter(file => file.name.endsWith(".md"))
  .sort((a, b) => {
    const tanggalA = a.name.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
    const tanggalB = b.name.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";

    if (tanggalA !== tanggalB) {
      return tanggalB.localeCompare(tanggalA);
    }

    return b.name.localeCompare(a.name);
  });


    const artikel = await Promise.all(
      daftarFile.map(async file => {
        const hasil = await fetch(file.download_url);
        if (!hasil.ok) return null;

        const mentah = await hasil.text();
        const cocok = mentah.match(
          /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/
        );

        if (!cocok) return null;

        


        const data = cocok[1];
        const isi = cocok[2].trim();

        return {
          fileName: file.name,
          judul: ambilField(data, "title") || file.name,
          tanggal: ambilField(data, "date"),
          kategori: ambilField(data, "category"),
          ringkasan: ambilField(data, "description"),
          gambar: ambilField(data, "image"),
          isi
        };
      })
    );

    daftar.replaceChildren();

    const valid = artikel.filter(Boolean);

    valid.sort((a, b) => {
      const tanggalA = a.tanggal || "";
      const tanggalB = b.tanggal || "";

      if (tanggalA !== tanggalB) {
        return tanggalB.localeCompare(tanggalA);
      }

      return b.fileName.localeCompare(a.fileName);
    });



    if (valid.length === 0) {
      daftar.textContent =
        "Belum ada artikel yang bisa ditampilkan. Periksa format file berita.";
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
  "pratinjau/" +
  encodeURIComponent(berita.fileName.replace(/\.md$/i, "")) +
  "/";

tautanJudul.textContent = berita.judul;
tautanJudul.style.cssText =
  "color:#171717;text-decoration:none;font-size:1.2rem;";

judul.appendChild(tautanJudul);
isiKartu.appendChild(judul);


      const meta = document.createElement("div");
      meta.className = "meta-berita";

      let tanggalTampil = berita.tanggal;
      if (berita.tanggal) {
        const tanggal = new Date(berita.tanggal + "T00:00:00");
        if (!Number.isNaN(tanggal.getTime())) {
          tanggalTampil = tanggal.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          });
        }
      }

      meta.textContent = [tanggalTampil, berita.kategori]
        .filter(Boolean)
        .join(" • ");
      isiKartu.appendChild(meta);

      if (berita.ringkasan) {
        const ringkasan = document.createElement("p");
        ringkasan.textContent = berita.ringkasan;
        isiKartu.appendChild(ringkasan);
      }

      
const baca = document.createElement("a");

baca.href =
  "pratinjau/" +
  encodeURIComponent(berita.fileName.replace(/\.md$/i, "")) +
  "/";

baca.textContent = "Baca Selengkapnya →";

baca.style.cssText =
  "display:inline-block;margin-top:10px;color:#9A6B00;font-weight:bold;text-decoration:none;";

isiKartu.appendChild(baca);

      const isiArtikel = document.createElement("div");
      isiArtikel.className = "isi-artikel";
      
      isiKartu.appendChild(isiArtikel);

      kartu.appendChild(isiKartu);
      daftar.appendChild(kartu);
    });
  } catch (error) {
    console.error("Kesalahan memuat berita:", error);
    daftar.textContent =
      "Berita belum dapat dimuat. Silakan periksa koneksi dan file berita.";
  }
}

muatBerita();


