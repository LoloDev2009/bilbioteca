document.addEventListener("DOMContentLoaded", () => {
  const addBook = document.getElementById("addBook");
  const btnBuscarIsbn = document.getElementById("btnBuscarISBN");
  const btnCancel = document.getElementById("btnCancel");
  const btnDel = document.getElementById("btnDel");

  document.getElementById("buscador").addEventListener("input", filtrarLibros);

  addBook.addEventListener("click", (e) => {
    const form = document.getElementById("manualForm");
    form.style.display = "block";
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

});

async function deleteBook() {
  const pestaña = document.getElementById("manualForm");
  const codigo = document.getElementById("isbnBuscador")
  const isbn = codigo.value

  await fetch(`/api/libro/${isbn}`,{method: "DELETE"});

  pestaña.style.display = "none";
  deshabilitarFormulario()
  cargarLibros()
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

  const res = await fetch("/api/libro", {
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

      const res = await fetch("/api/libro/save", {
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


// ===== NO MODIFICAR CODIGO AL PEDO!! ===

// ===== Cargar lista de libros =====
let todosLosLibros = []; // se guarda la lista completa

async function cargarLibros() {
  const res = await fetch("/api/libros");
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

    fila.innerHTML = `
      <td data-label="Portada">${b.portada_url ? `<img src="${b.portada_url}" class="portada">` : `<img src="static/29302.png" class="portada">`}</td>
      <td data-label="Título">${b.titulo}</td>
      <td data-label="Autor">${b.autor}</td>
      <td data-label="Editorial">${b.editorial}</td>
      <td data-label="ISBN">${b.isbn}</td>
      `+spanEstado
    tbody.appendChild(fila);
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

cargarLibros();


