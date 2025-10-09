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
    alert(codigo);

    try {
      const res = await enviarISBN(codigo); // ✅ Usar  await
      console.log("Respuesta del servidor:", res.data);

      if (res.data.manual) {
        mostrarFormularioManual(codigo);
      } else {
        alert(`Libro agregado: ${res.data.titulo}`);
      }
    } catch (e) {
      alert("Error al enviar ISBN:", e);
      alert("No se pudo conectar al backend.");
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

    const res = await fetch("/api/libro/manual", {
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
  const libros = await fetch("/api/libros").then(r => r.json());
  const lista = document.getElementById("libros");
  lista.innerHTML = "";
  libros.forEach(b => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${b.titulo}</strong><br/>
      ${b.autor} (${b.año})<br/>
      <em>${b.editorial}</em>
      ${b.portada_url ? `<br/><img src="${b.portada_url}" style="width:80px; margin-top:5px;">` : ""}
    `;
    lista.appendChild(li);
  });
}

async function enviarISBN(codigo) {
  const res = await axios.post(
    "http://wine-corporations.gl.at.ply.gg:25116/api/libro",
    { isbn: codigo },
    { headers: { "Content-Type": "application/json" } }
  );
  return res;    
}

