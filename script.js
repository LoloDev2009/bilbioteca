// ===== Cargar lista de libros =====
let todosLosLibros = []; // se guarda la lista completa

async function cargarLibros() {
  const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libros");
  todosLosLibros = await res.json();
  mostrarLibros(todosLosLibros);
}

// Mostrar libros (filtrados u ordenados)
function mostrarLibros(lista) {
  const tbody = document.getElementById("libros");
  const contador = document.getElementById("contador");
  tbody.innerHTML = "";
  
  // Mostrar cantidad de resultados
  contador.textContent = `${lista.length} libro${lista.length !== 1 ? "s" : ""} encontrado${lista.length !== 1 ? "s" : ""}`;

  lista.forEach(b => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td data-label="Portada">${b.portada_url ? `<img src="${b.portada_url}" class="portada">` : `<img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" class="portada">`}</td>
      <td data-label="Título">${b.titulo}</td>
      <td data-label="Autor">${b.autor}</td>
      <td data-label="Editorial">${b.editorial}</td>
      <td data-label="Año">${b.año}</td>
      <td data-label="ISBN">${b.isbn}</td>
    `;
    tbody.appendChild(fila);
  });
}


// Filtros interactivos
document.getElementById("buscador").addEventListener("input", filtrarLibros);
document.getElementById("ordenarPor").addEventListener("change", filtrarLibros);

function normalizarTexto(texto) {
  return texto
    .toString()
    .normalize("NFD") // separa las tildes de las letras
    .replace(/[\u0300-\u036f]/g, "") // elimina las tildes
    .replace(/[^\w\s]/gi, "") // elimina cualquier carácter no alfanumérico (signos, puntuación, etc.)
    .toLowerCase()
    .trim();
}


function filtrarLibros() {
  const input = normalizarTexto(document.getElementById("buscador").value);
  
  const librosFiltrados = todosLosLibros.filter(libro =>
    normalizarTexto(libro.titulo).includes(input) ||
    normalizarTexto(libro.autor).includes(input) ||
    normalizarTexto(libro.editorial).includes(input)
  );

  // ordenar los resultados filtrados con el mismo criterio actual
  const criterio = document.getElementById("ordenarPor").value;
  const librosOrdenados = [...librosFiltrados].sort((a, b) => {
    let valorA = normalizarTexto(a[criterio]?.toString() || "");
    let valorB = normalizarTexto(b[criterio]?.toString() || "");
    if (criterio === "año") return (parseInt(valorA) || 0) - (parseInt(valorB) || 0);
    return valorA.localeCompare(valorB);
  });

  mostrarLibros(librosOrdenados);
}

cargarLibros();
