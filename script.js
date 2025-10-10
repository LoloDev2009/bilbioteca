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
      const libro = await enviarISBN(codigo);

      if (libro.manual) {
        mostrarFormularioManual(codigo); // Si Google Books no devuelve info
      } else {
        alert(`Libro agregado: ${libro.titulo}`);
        cargarLibros(); // Actualiza la lista de libros en pantalla
      }
    } catch (e) {
      alert("No se pudo conectar al backend");
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

// ===== Cargar lista de libros =====
async function cargarLibros() {
  const libros = await fetch("https://biblioteca-back-315x.onrender.com/api/libros")
    .then(r => r.json());

  const tbody = document.querySelector("#libros tbody");
  tbody.innerHTML = "";

  libros.forEach(b => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.portada_url ? `<img src="${b.portada_url}" alt="Portada">` : ""}</td>
      <td>${b.titulo}</td>
      <td>${b.autor}</td>
      <td>${b.editorial}</td>
      <td>${b.año}</td>
    `;

    tbody.appendChild(tr);
  });
}



async function enviarISBN(codigo) {
  try {
    const response = await fetch("https://biblioteca-back-315x.onrender.com/api/libro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isbn: codigo })
    });

    const json = await response.json();
    console.log(json);
    return json; // devuelve la info del libro
  } catch (err) {
    console.error("Error al conectar con el backend:", err);
    throw err; // propaga el error para manejarlo donde se llama
  }
}


cargarLibros();
