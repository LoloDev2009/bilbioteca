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

  exitDetail.addEventListener("dbclick", () => {
    document.getElementById("bookDetail").classList.add("modal-hidden");
  });

  document.getElementById("buscador").addEventListener("input", filtrarLibros);

  addBook.addEventListener("click", (e) => {
    const form = document.getElementById("manualForm");
    form.style.display = "flex";
  })

  btnBuscarIsbn.addEventListener("click", (e) =>{
    searchIsbn()
  })

  btnDel.addEventListener("click", (e) =>{
    deleteBook()
  })

  btnCancel.addEventListener("click", (e) =>{
    const pestaña = document.getElementById("manualForm");
    pestaña.style.display = "none";
    deshabilitarFormulario()
  })

  btnEditDetail.addEventListener("click", (e) =>{
    editDetail()
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

    document.getElementById("manualForm").style.display = "none";
    deshabilitarFormulario();
    cargarLibros();

  } catch (err) {
    handleError(err);
  }
}

async function searchIsbn(){
  const pestaña = document.getElementById("manualForm");

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
        pestaña.style.display = "none";
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

async function mostrarDetalleLibro(isbn) {
  const modal = document.getElementById("bookDetail");
  var libro = await getDetalleLibro(isbn);
  if (!libro) return 

  console.log("Detalle del libro:", libro);
  modal.querySelector(".rating").innerHTML = "";


  modal.querySelector(".rating").innerHTML += "★ ".repeat(Math.round(libro.puntuacion));
  modal.querySelector(".rating").innerHTML += "☆ ".repeat(5 - Math.round(libro.puntuacion));
  modal.querySelector(".book-cover-lg").src = libro.portada_url || "29302.png";
  modal.querySelector(".book-info h3").textContent = libro.titulo;
  modal.querySelector(".book-info .author").textContent = libro.autor;
  modal.querySelector(".book-info .description").textContent = libro.descripcion || "Sin descripción";
  modal.querySelector(".book-info .pages").innerHTML = `<strong>Páginas:</strong> ${libro.paginas}` || "";
  modal.querySelector(".book-info .genre").innerHTML = `<strong>Género:</strong> ${libro.genero}` || "";
  modal.querySelector(".book-info .languaje").innerHTML = `<strong>Idioma:</strong> ${libro.idioma}` || "";
  modal.querySelector(".book-info .saga").innerHTML = `<strong>Saga:</strong> ${libro.saga}` || "";
  modal.querySelector(".book-info .review").innerHTML = `<strong>Reseña:</strong> ${libro.resena}` || "";
  modal.querySelector(".book-info .shelf").innerHTML = `<strong>Estante:</strong> ${libro.estante}` || "";
  modal.classList.remove("modal-hidden");


  
}

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


const openTab = document.getElementById("openCustomTab");
const modalTab = document.getElementById("customTabModal");
const closeTab = document.getElementById("closeCustomTab");

if (openTab && modalTab && closeTab) {
    openTab.addEventListener("click", () => {
        modalTab.classList.remove("modal-hidden");
    });

    closeTab.addEventListener("click", () => {
        modalTab.classList.add("modal-hidden");
    });
}