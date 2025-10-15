// ===== script.js =====

const btnEscanear = document.getElementById("btnEscanear");
const btnDetener = document.getElementById("btnDetener");
const resultado = document.getElementById("resultado");
const consola = document.getElementById("consola");

btnEscanear.addEventListener("click", () => {
  iniciarEscaneo();
});

btnDetener.addEventListener("click", () => {
  detenerEscaneo();
});

function iniciarEscaneo() {
  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector("#video"),
        constraints: {
          facingMode: "environment", // Usa la cámara trasera
        },
      },
      decoder: {
        readers: ["ean_reader"], // EAN-13 es el estándar de ISBN
      },
    },
    function (err) {
      if (err) {
        console.error(err);
        alert("Error al iniciar la cámara.");
        return;
      }
      Quagga.start();
      resultado.innerText = "Escaneando...";
    }
  );

    Quagga.onDetected(async (data) => {
    const codigo = data.codeResult.code;
    resultado.innerText = `📖 ISBN detectado: ${codigo}`;
    Quagga.stop();

    try {
      const libro = await procesarISBN(codigo);
    } catch (e) {
      alert(e);
    }
  });



}

function detenerEscaneo() {
  Quagga.stop();
  resultado.innerText = "Escaneo detenido.";
}


// ===== Función para mostrar formulario manual =====
function mostrarFormularioManual(isbn) {
  const form = document.getElementById("manualForm");
  form.style.display = "block";
  document.getElementById("isbn").value = isbn;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const libro = {
      isbn: document.getElementById("isbn").value,
      titulo: document.getElementById("titulo").value,
      autor: document.getElementById("autor").value,
      editorial: document.getElementById("editorial").value,
      año: document.getElementById("anio").value,
      portada_url: document.getElementById("portada").value
    };

    const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libro/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(libro)
    }).then(r => r.json());

    alert(`Libro agregado manualmente: ${res.titulo}`);
    form.reset();
    form.style.display = "none";
    cargarLibros();
  };
}

async function procesarISBN(codigo) {
  try {
    // 1️⃣ Preguntar al backend si el libro ya existe
    const res = await fetch(`https://biblioteca-back-315x.onrender.com/api/libro/${codigo}`);
    const libro = await res.json();

    if (libro && libro.id) {
      // 📖 Libro ya existe → mostrar formulario de edición
      mostrarEdicionLibro(libro);
    } else {
      // ➕ Libro nuevo → enviar al backend para agregar
      const addRes = await fetch("https://biblioteca-back-315x.onrender.com/api/libro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn: codigo })
      });

      const nuevoLibro = await addRes.json();

      if (nuevoLibro.manual) {
        // Si Google Books no encontró info, mostrar formulario manual
        mostrarFormularioManual(codigo);
      } else {
        alert(`Libro agregado: ${nuevoLibro.titulo}`);
        cargarLibros();
      }
    }

  } catch (err) {
    console.error("Error al procesar ISBN:", err);
    alert("No se pudo procesar el ISBN.");
  }
}

function mostrarEdicionLibro(libro) {
  const form = document.getElementById("editarForm");
  form.style.display = "block";

  document.getElementById("edit-isbn").value = libro.isbn;
  document.getElementById("edit-titulo").value = libro.titulo;
  document.getElementById("edit-autor").value = libro.autor;
  document.getElementById("edit-editorial").value = libro.editorial;
  document.getElementById("edit-anio").value = libro.año;
  document.getElementById("edit-portada").value = libro.portada_url;
}

document.getElementById("btnGuardarEdicion").addEventListener("click", async () => {
  alert('Boton pRESIONADO')
  const libroEditado = {
    isbn: document.getElementById("edit-isbn").value,
    titulo: document.getElementById("edit-titulo").value,
    autor: document.getElementById("edit-autor").value,
    editorial: document.getElementById("edit-editorial").value,
    año: document.getElementById("edit-anio").value,
    portada_url: document.getElementById("edit-portada").value
  };

  try {
    const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libro/editar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(libroEditado)
    });
    const json = await res.json();
    alert(`Libro actualizado: ${json.titulo}`);
    cargarLibros();
    form.style.display = "none";
  } catch (err) {
    alert(err);
  }
});
