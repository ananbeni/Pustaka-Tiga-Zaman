
async function muatBerita() {
  const daftar = document.getElementById("daftar-berita");
  if (!daftar) return;

  daftar.textContent = "Memuat berita...";

  try {
    const url =
      "https://api.github.com/repos/ananbeni/pustaka-tiga-zaman/contents/berita";

    const respons = await fetch(url);

    if (!respons.ok) {
      throw new Error("Daftar berita tidak dapat diakses.");
    }

    const files = await respons.json();
    const artikel = files
      .filter(file => file.name.endsWith(".md"))
      .sort((a, b) => b.name.localeCompare(a.name));

    daftar.replaceChildren();

    if (artikel.length === 0) {
      daftar.textContent = "Belum ada berita yang diterbitkan.";
      return;
    }

    artikel.forEach(file => {
      const kartu = document.createElement("article");
      const judul = document.createElement("h3");
      const tautan = document.createElement("a");

      tautan.href = file.html_url;
      tautan.textContent = file.name
        .replace(/^\d{4}-\d{2}-\d{2}-/, "")
        .replace(/\.md$/, "")
        .replace(/-/g, " ");

      judul.appendChild(tautan);
      kartu.appendChild(judul);
      daftar.appendChild(kartu);
    });
  } catch (error) {
    daftar.textContent = "Berita belum dapat dimuat.";
    console.error(error);
  }
}

muatBerita();

