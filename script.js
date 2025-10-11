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
let todosLosLibros = []; // se guarda la lista completa

async function cargarLibros() {
  const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libros");
  todosLosLibros = await res.json();
  mostrarLibros(todosLosLibros);
}

// Mostrar libros (filtrados u ordenados)
function mostrarLibros(lista) {
  const contenedor = document.getElementById("libros");
  contenedor.innerHTML = "";
  lista.forEach(b => {
    const li = document.createElement("li");
    li.className = "libro-item";
    li.innerHTML = `
      <strong>${b.titulo}</strong><br/>
      ${b.autor} (${b.año})<br/>
      <em>${b.editorial}</em>
      ${b.portada_url ? `<br/><img src="${b.portada_url}" style="width:80px; margin-top:5px;">` : ""}
    `;
    contenedor.appendChild(li);
  });
}

// Filtros interactivos
document.getElementById("buscador").addEventListener("input", filtrarYOrdenar);
document.getElementById("ordenarPor").addEventListener("change", filtrarYOrdenar);

function filtrarYOrdenar() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const criterio = document.getElementById("ordenarPor").value;

  let lista = todosLosLibros.filter(
    b =>
      b.titulo.toLowerCase().includes(texto) ||
      b.autor.toLowerCase().includes(texto)
  );

  lista.sort((a, b) => {
    if (a[criterio] < b[criterio]) return -1;
    if (a[criterio] > b[criterio]) return 1;
    return 0;
  });

  mostrarLibros(lista);
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
