async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw data.error; // ← viene del backend nuevo
  }

  return data;
}

function handleError(error) {
  console.error("🔥 Front Error:", error);

  switch (error.code) {
    case "BOOK_NOT_FOUND":
      alert("El libro no existe");
      break;

    case "VALIDATION_ERROR":
      alert("Datos inválidos");
      break;

    case "EXTERNAL_API_ERROR":
      alert("Error consultando Google Books");
      break;

    default:
      alert("Error inesperado");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const addBook = document.getElementById("addBook");
  const btnBuscarIsbn = document.getElementById("btnBuscarISBN");
  const btnCancel = document.getElementById("btnCancel");
  const btnDel = document.getElementById("btnDel");
  const btnEditDetail = document.getElementById("btnEditDetail");
  const tbody = document.getElementById("libros");
  const exitDetail = document.getElementById("bookDetail");
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleSidebar");
  const btnDelDetail = document.getElementById("btnDelDetail");
  const btnCancelDetail = document.getElementById("btnCancelDetail");

  btnCancelDetail.addEventListener("click", () => {
    document.getElementById("detailForm").classList.remove("active");
  });
  btnDelDetail.addEventListener("click", () => {
    if (!currentDetail) return;
    deleteDetail(currentDetail.isbn).then(() => {
      document.getElementById("detailForm").classList.remove("active");
    });
  });

  toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
  });

  document.querySelectorAll(".sidebar-item").forEach(btn => {
      btn.addEventListener("click", () => {
          document.querySelector(".sidebar-item.active")?.classList.remove  ("active");
          btn.classList.add("active");
      });
  });
  document.getElementById("bookDetail").addEventListener("click", (e) => {
    if (e.target.id === "bookDetail") {
        e.currentTarget.classList.remove("active");
    }
  });

  document.getElementById("buscador").addEventListener("input", filtrarLibros);

  addBook.addEventListener("click", (e) => {
    deshabilitarFormulario();
    document.getElementById("form-grid").style.display = 'none'
    document.getElementById("tituloForm").textContent = "Agregar libro"
    document.getElementById("manualForm").classList.add("active");
  })

  btnBuscarIsbn.addEventListener("click", (e) =>{
    searchIsbn()
  })

  btnDel.addEventListener("click", (e) =>{
    deleteBook()
  })

  btnCancel.addEventListener("click", (e) =>{
    document.getElementById("manualForm").classList.remove("active");
    deshabilitarFormulario()
  })

  btnEditDetail.addEventListener("click", async (e) =>{
    const libro = await getDetalleLibro(document.getElementById("isbnBuscador").value);
    currentDetail = libro;
    console.log(currentDetail)
    openManualForm(currentDetail);
    document.getElementById("manualForm").classList.remove("active");
  })
  let selectedId = null;

  tbody.addEventListener("click", (e) => {
    const fila = e.target.closest("tr");

    if (!fila) return;

    // limpiar selección previa
    tbody.querySelectorAll("tr").forEach(f => {
      f.classList.remove("selected");
    });

    // marcar nueva
    fila.classList.add("selected");

    // guardar ID
    selectedIsbn = fila.dataset.isbn;

    console.log("Libro seleccionado:", selectedIsbn);
  });

cargarSidebar();

});

async function deleteBook() {
  try {
    const isbn = document.getElementById("isbnBuscador").value;

    await apiFetch(`https://biblioteca-back-315x.onrender.com/api/libro?isbn=${isbn}`, {
      method: "DELETE"
    });

    document.getElementById("manualForm").classList.remove("active");
    cargarLibros();

  } catch (err) {
    handleError(err);
  }
}

async function searchIsbn(){
  const form = document.getElementById('añadirLibro')
  const tituloForm = document.getElementById('tituloForm')
  const codigo = document.getElementById("isbnBuscador")
  const titulo =  document.getElementById("formTitulo")
  const autor =  document.getElementById("formAutor")
  const estado =  document.getElementById("formEstado")
  const editorial = document.getElementById("formEditorial") 
  const url = document.getElementById("formUrl") 

  const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn: codigo.value })
      });

  const resultado = await res.json();
  if(resultado){
    var type = resultado['type']
    libro = resultado['libro']
    
    habilitarFormulario(type)

    if (type == 'API' || type == "edit"){

      titulo.value = libro['titulo']
      autor.value = libro['autor']
      editorial.value = libro['editorial']
      url.value = libro['portada_url']
      estado.value = libro['estado']

      if(resultado['type'] == 'edit'){
        tituloForm.textContent = "Editar libro"
      }
    }

    form.onsubmit = async (e) => {
      e.preventDefault();

      const libroDevolver = {
        isbn: codigo.value,
        titulo: titulo.value,
        autor: autor.value,
        editorial: editorial.value,
        portada_url: url.value,
        estado: estado.value
      };

      const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libro/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(libroDevolver)
      })

      if (res.ok){
        document.getElementById("manualForm").classList.remove("active");
        deshabilitarFormulario()
        cargarLibros()
      }else{alert(`Error al guardar el libro: ${titulo.value}`);}
      }
  }else{alert('Error con el servidor')}
}

function habilitarFormulario(tipo){
  const formGrid = document.getElementById("form-grid")
  const campos = document.querySelectorAll('.manualForm')
  const codigo = document.getElementById("isbnBuscador")
  const btnBorrar = document.getElementById('btnDel')
  const btnCancelar = document.getElementById('btnCancel')

  codigo.readOnly = true;
  for(var i = 0; i < campos.length; i++){
    campos[i].readOnly = false;
    campos[i].disabled = false;
  }
  formGrid.style.display = 'block'
  if(tipo == "edit"){
    btnBorrar.style.display = 'block'
    btnCancelar.style.display = 'none'
  }else if(tipo == "detail"){
    btnBorrar.style.display = 'block'
    btnCancelar.style.display = 'block'
  }else{
    btnBorrar.style.display = 'none'
    btnCancelar.style.display = 'block'
  }
}

function deshabilitarFormulario(){
  const tituloForm = document.getElementById('tituloForm')
  const formGrid = document.getElementById("form-grid")
  const titulo =  document.getElementById("formTitulo")
  const autor =  document.getElementById("formAutor")
  const estado =  document.getElementById("formEstado")
  const editorial = document.getElementById("formEditorial") 
  const url = document.getElementById("formUrl") 
  const campos = document.querySelectorAll('.manualForm')
  const codigo = document.getElementById("isbnBuscador")

  codigo.readOnly = false;
  for(var i = 0; i < campos.length; i++){
    campos[i].readOnly = true;
    campos[i].disabled = true;
  }
  
  codigo.value = '';
  titulo.value = '';
  autor.value = '';
  editorial.value = '';
  url.value = '';
  estado.value = 'Disponible'

  formGrid.style.display = 'none'
  tituloForm.textContent = "Agregar libro"
}

async function getDetalleLibro(isbn) {
  const res = await fetch(`https://biblioteca-back-315x.onrender.com/api/libro/detalle?isbn=${isbn}`);
  
  if (!res.ok) {
    alert("Error al obtener detalles del libro");
    return null;
  }
  
  return await res.json();
}

async function postDetail(detalleDevolver) {
  const res = await fetch(`http://127.0.0.1:3000/api/libro/detalle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(detalleDevolver)
  });
  return res.ok;
};


async function mostrarDetalleLibro(isbn) {
  const modal = document.getElementById("bookDetail");
  var libro = await getDetalleLibro(isbn);
  if (!libro) return 

  currentDetail = libro;
  modal.querySelector(".rating").innerHTML = "";


  modal.querySelector(".rating").innerHTML += "★ ".repeat(Math.round(libro.puntuacion));
  modal.querySelector(".rating").innerHTML += "☆ ".repeat(5 - Math.round(libro.puntuacion));
  modal.querySelector(".book-cover-lg").src = libro.portada_url || "29302.png";
  modal.querySelector(".book-info h2").textContent = libro.titulo;
  modal.querySelector(".book-info .author").textContent = libro.autor;
  modal.querySelector(".book-info .description").textContent = libro.descripcion || "Sin descripción";
  modal.querySelector(".meta-grid #detailPages").innerHTML = libro.paginas;
  modal.querySelector(".meta-grid #detailGenre").innerHTML = libro.genero;
  modal.querySelector(".meta-grid #detailLang").innerHTML = libro.idioma;
  modal.querySelector(".meta-grid #detailSaga").innerHTML = libro.saga;
  modal.querySelector(".meta-grid #detailShelf").innerHTML = libro.estante;

  modal.querySelector(".review-box #detailReview").innerHTML = libro.resena;
  modal.classList.add("active");
}

let currentDetail = null;

document.getElementById("editDetailBtn").addEventListener("click", () => {
    if (!currentDetail) return;
    document.getElementById("bookDetail").classList.remove("active");
    openManualForm(currentDetail);
});

function openManualForm(detail) {
    const modal = document.getElementById("detailForm");
    const form = document.getElementById("añadirDetalle");
    const formGrid = document.getElementById("form-grid")
    const tituloForm = document.getElementById("tituloForm")
    const campos = document.querySelectorAll('.manualForm')

    // cargar datos
    document.getElementById("detailTitle").value = detail.titulo || "";
    document.getElementById("detailAuthor").value = detail.autor || "";

    // detail fields
    document.getElementById("formDescripcion").value = detail.descripcion || "";
    document.getElementById("formGenero").value = detail.genero || "";
    document.getElementById("formIdioma").value = detail.idioma || "";
    document.getElementById("formPaginas").value = detail.paginas || "";
    document.getElementById("formEstante").value = detail.estante || "";
    document.getElementById("formSaga").value = detail.saga || "";
    document.getElementById("formReseña").value = detail.resena || "";
    document.getElementById("formPuntuacion").value = detail.puntuacion || "";

    for(var i = 0; i < campos.length; i++){
      campos[i].readOnly = false;
      campos[i].disabled = false;
    }
    document.getElementById("detailTitle").readOnly = true;
    document.getElementById("detailAuthor").readOnly = true;
    modal.classList.add("active");

    form.onsubmit = async (e) => {
        e.preventDefault();
        const detalleDevolver = {
            libro_id: detail.id,
            descripcion: document.getElementById("formDescripcion").value,
            genero: document.getElementById("formGenero").value,
            idioma: document.getElementById("formIdioma").value,
            paginas: document.getElementById("formPaginas").value,
            estante: document.getElementById("formEstante").value,
            saga: document.getElementById("formSaga").value,
            resena: document.getElementById("formReseña").value,
            puntuacion: document.getElementById("formPuntuacion").value
        };
      console.log(detalleDevolver)
      postDetail(detalleDevolver).then(success => {
        if (success) {
          deshabilitarFormulario();
          formGrid.style.display = 'none'
          tituloForm.textContent = "Agregar libro"
          modal.classList.remove("active");
          
          mostrarDetalleLibro(detail.isbn); // recargar detalles
        } else {
          alert("Error al guardar detalles");
        };
    });
}};

async function deleteDetail(isbn) {
  try {
    await apiFetch(`https://biblioteca-back-315x.onrender.com/api/libro/detalle?isbn=${isbn}`, {
      method: "DELETE"
    });
    return true;
  } catch (err) {
    handleError(err);
    return false;
  }
};
// ===== NO MODIFICAR CODIGO AL PEDO!! ===

// ===== Cargar lista de libros =====
let todosLosLibros = []; // se guarda la lista completa

async function cargarLibros() {
  const res = await fetch("https://biblioteca-back-315x.onrender.com/api/libro/all");
  todosLosLibros = await res.json();
  mostrarLibros(todosLosLibros);
}

// Mostrar libros (filtrados u ordenados)
function mostrarLibros(lista) {
  const tbody = document.getElementById("libros");
  const contador = document.getElementById("contador");
  tbody.innerHTML = "";
  
  // Mostrar cantidad de resultados
  //contador.textContent = `${lista.length} libro${lista.length !== 1 ? "s" : ""} encontrado${lista.length !== 1 ? "s" : ""}`;

  lista.forEach(b => {
    const fila = document.createElement("tr");
    var spanEstado = ``
    if(b.estado == "Disponible"){
      spanEstado = `<td><span class="status status-available">Disponible</span></td>`
    }else{spanEstado = `<td><span class="status status-unaviable">Prestado</span></td>`}

    contador.textContent = `${lista.length} libro${lista.length !== 1 ? "s" : ""} encontrado${lista.length !== 1 ? "s" : ""}`;
    fila.dataset.isbn = b.isbn; // guardo el isbn del libro en un atributo data-isbn para usarlo luego
    fila.innerHTML = `
      <td data-label="Portada">${b.portada_url ? `<img src="${b.portada_url}" class="portada">` : `<img src="29302.png" class="portada">`}</td>
      <td data-label="Título">${b.titulo}</td>
      <td data-label="Autor">${b.autor}</td>
      <td data-label="Editorial">${b.editorial}</td>
      <td data-label="ISBN">${b.isbn}</td>
      `+spanEstado
    tbody.appendChild(fila);

    fila.addEventListener("click", () => {
      mostrarDetalleLibro(b.isbn);
    });
  });
}


// Filtros interactivos
document.getElementById("addBook").addEventListener("input", filtrarLibros);
document.getElementById("addBook").addEventListener("change", filtrarLibros);

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
    normalizarTexto(libro.autor).includes(input)
  );

  mostrarLibros(librosFiltrados);
}

function cargarSidebar() {
  const sidebar = document.querySelector(".sidebar-nav");
  const opciones = [
    { nombre: "Biblioteca", id: "biblioteca" },
    { nombre: "Data", id: "data" },
    { nombre: "Personalizar", id: "personalizar" }
  ];

  opciones.forEach(opcion => {
    const btn = document.createElement("button");
    btn.classList.add("sidebar-item");
    btn.id = opcion.id;
    btn.textContent = opcion.nombre;
    sidebar.appendChild(btn);
  });
}

cargarLibros();
