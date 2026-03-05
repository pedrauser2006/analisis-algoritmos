const canvas = document.getElementById("canvasGrafo");
const ctx = canvas.getContext("2d");

/* ------------------ VARIABLES ------------------ */

let vertices = [];
let edges = [];
let selectedVertex = null;
let vertexCounter = 0;
let draggingVertex = null;
let selectedEdge = null;

/* ------------------ CLASES ------------------ */

class Vertex {
  constructor(x, y, label) {
    this.id = vertexCounter++;
    this.label = label; // NUEVO
    this.x = x;
    this.y = y;
    this.radius = 30;
  }
}

class Edge {
  constructor(from, to, weight, directed) {
    this.from = from;
    this.to = to;
    this.weight = weight;
    this.directed = directed;
  }
}

/* ------------------ DIBUJO ------------------ */

function drawVertex(vertex) {
  ctx.beginPath();
  ctx.arc(vertex.x, vertex.y, vertex.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#1C4C7C";
  ctx.fill();
  ctx.strokeStyle = "black";
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(vertex.label, vertex.x, vertex.y);
}

function drawEdge(edge) {
  if (edge.from === edge.to) {
    const radius = edge.from.radius;
    const loopRadius = 40;

    ctx.beginPath();

    const centerX = edge.from.x;
    const centerY = edge.from.y - radius - 20;

    const startAngle = Math.PI * 0.3;
    const endAngle = Math.PI * 2.7;

    ctx.arc(centerX, centerY, loopRadius, startAngle, endAngle);
    ctx.stroke();

    // Peso
    ctx.fillStyle = "red";
    ctx.fillText(edge.weight, centerX, centerY - loopRadius - 10);

    // Flecha
    if (edge.directed) {
      const arrowX = centerX + loopRadius * Math.cos(endAngle);
      const arrowY = centerY + loopRadius * Math.sin(endAngle);

      const angle = endAngle;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - 15 * Math.cos(angle - Math.PI / 6),
        arrowY - 15 * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        arrowX - 15 * Math.cos(angle + Math.PI / 6),
        arrowY - 15 * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
    }

    return;
  }

  const dx = edge.to.x - edge.from.x;
  const dy = edge.to.y - edge.from.y;
  const angle = Math.atan2(dy, dx);

  // Detectar arista inversa (A→B y B→A)
  let twinEdge = edges.find(
    (e) => e !== edge && e.from === edge.to && e.to === edge.from,
  );

  const startOffsetX = Math.cos(angle) * edge.from.radius;
  const startOffsetY = Math.sin(angle) * edge.from.radius;

  const endOffsetX = Math.cos(angle) * edge.to.radius;
  const endOffsetY = Math.sin(angle) * edge.to.radius;

  let startX = edge.from.x + startOffsetX;
  let startY = edge.from.y + startOffsetY;

  let endX = edge.to.x - endOffsetX;
  let endY = edge.to.y - endOffsetY;

  // Si existe arista inversa → separarlas paralelamente
  if (twinEdge) {
    const separation = 15;

    const perpX = -Math.sin(angle) * separation;
    const perpY = Math.cos(angle) * separation;

    // Desplazar dependiendo de la dirección real
    if (edge.from === twinEdge.to && edge.to === twinEdge.from) {
      startX += perpX;
      startY += perpY;
      endX += perpX;
      endY += perpY;
    } else {
      startX -= perpX;
      startY -= perpY;
      endX -= perpX;
      endY -= perpY;
    }
  }

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  if (edge.directed) {
    const headLength = 20;

    // Punto exacto en el borde del nodo destino
    const tipX = endX;
    const tipY = endY;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLength * Math.cos(angle - Math.PI / 6),
      tipY - headLength * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      tipX - headLength * Math.cos(angle + Math.PI / 6),
      tipY - headLength * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
  }

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  ctx.fillStyle = "red";
  ctx.fillText(edge.weight, midX, midY);
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  edges.forEach(drawEdge);
  vertices.forEach(drawVertex);
}

/* ------------------ AJUSTAR TAMAÑO ------------------ */

function resizeCanvas() {
  const container = document.querySelector(".canvas-container");

  canvas.width = container.clientWidth - 20;
  canvas.height = container.clientHeight - 20;

  redraw();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ------------------ EVENTOS ------------------ */

// Crear vértice
canvas.addEventListener("dblclick", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let vertex of vertices) {
    let dx = x - vertex.x;
    let dy = y - vertex.y;
    if (Math.sqrt(dx * dx + dy * dy) <= vertex.radius) {
      return;
    }
  }

  let nombre = prompt("Ingrese el nombre del nodo:");

  if (nombre === null || nombre.trim() === "") {
    alert("Debe ingresar un nombre válido para el nodo.");
    return;
  }

  vertices.push(new Vertex(x, y, nombre));

  redraw();
});

// Conectar
canvas.addEventListener("click", function (e) {
  if (draggingVertex) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let vertex of vertices) {
    let dx = x - vertex.x;
    let dy = y - vertex.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= vertex.radius) {
      if (!selectedVertex) {
        selectedVertex = vertex;
        selectedEdge = null;
      } else {
        let respuesta = prompt("¿Es dirigido? (si/no)");

        if (
          !respuesta ||
          (respuesta.toLowerCase() !== "si" && respuesta.toLowerCase() !== "no")
        ) {
          alert("Debe indicar correctamente si es dirigido (si o no).");
          selectedVertex = null;
          return; // ⛔ NO CREA ARISTA
        }

        let directed = respuesta.toLowerCase() === "si";

        let weightInput = prompt("Ingrese el peso (solo números):");

        if (weightInput === null || weightInput.trim() === "") {
          alert("Debe ingresar un peso.");
          selectedVertex = null;
          return; // ⛔ NO CREA ARISTA
        }

        let weight = Number(weightInput);

        if (isNaN(weight)) {
          alert("El peso debe ser un número válido.");
          selectedVertex = null;
          return; // ⛔ NO CREA ARISTA
        }

        edges.push(new Edge(selectedVertex, vertex, weight, directed));
        selectedVertex = null;
        redraw();

        selectedVertex = null;
        redraw();
      }

      break;
    }
  }

  // 🔴 Detectar arista seleccionada
  for (let edge of edges) {
    let midX = (edge.from.x + edge.to.x) / 2;
    let midY = (edge.from.y + edge.to.y) / 2;

    let dx = x - midX;
    let dy = y - midY;

    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      selectedEdge = edge;
      selectedVertex = null;
      return;
    }
  }
});

// Arrastrar
canvas.addEventListener("mousedown", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let vertex of vertices) {
    let dx = x - vertex.x;
    let dy = y - vertex.y;

    if (Math.sqrt(dx * dx + dy * dy) <= vertex.radius) {
      draggingVertex = vertex;
      break;
    }
  }
});

canvas.addEventListener("mousemove", function (e) {
  if (draggingVertex) {
    const rect = canvas.getBoundingClientRect();
    draggingVertex.x = e.clientX - rect.left;
    draggingVertex.y = e.clientY - rect.top;
    redraw();
  }
});

canvas.addEventListener("mouseup", function () {
  draggingVertex = null;
});

canvas.addEventListener("contextmenu", function (e) {
  e.preventDefault(); // Evita menú del navegador

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 🔵 Verificar si es nodo
  for (let vertex of vertices) {
    let dx = x - vertex.x;
    let dy = y - vertex.y;

    if (Math.sqrt(dx * dx + dy * dy) <= vertex.radius) {
      let nuevoNombre = prompt("Editar nombre del nodo:", vertex.label);

      if (nuevoNombre && nuevoNombre.trim() !== "") {
        vertex.label = nuevoNombre;
        redraw();
      }

      return;
    }
  }

  // 🔴 Verificar si es arista
  for (let edge of edges) {
    let midX = (edge.from.x + edge.to.x) / 2;
    let midY = (edge.from.y + edge.to.y) / 2;

    let dx = x - midX;
    let dy = y - midY;

    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      let nuevoPeso = prompt("Editar peso:", edge.weight);

      if (nuevoPeso !== null && !isNaN(Number(nuevoPeso))) {
        edge.weight = Number(nuevoPeso);
        redraw();
      }

      return;
    }
  }
});

function limpiarGrafo() {
  vertices = [];
  edges = [];
  selectedVertex = null;
  vertexCounter = 0;
  redraw();
}

function generarMatriz() {
  if (vertices.length === 0) {
    alert("No hay nodos en el grafo.");
    return;
  }

  let size = vertices.length;
  let matriz = [];

  for (let i = 0; i < size; i++) {
    matriz[i] = [];
    for (let j = 0; j < size; j++) {
      matriz[i][j] = 0;
    }
  }

  edges.forEach((edge) => {
    let i = vertices.indexOf(edge.from);
    let j = vertices.indexOf(edge.to);

    matriz[i][j] = edge.weight;

    if (!edge.directed) {
      matriz[j][i] = edge.weight;
    }
  });

  let sumaColumnas = new Array(size).fill(0);
  let conteoColumnas = new Array(size).fill(0);

  let totalPesos = 0;
  let totalAristas = 0;

  let html = "<table><tr><th></th>";

  vertices.forEach((v) => {
    html += `<th>${v.label}</th>`;
  });

  html += "<th>Suma Fila</th><th># Aristas Fila</th></tr>";

  for (let i = 0; i < size; i++) {
    let sumaFila = 0;
    let conteoFila = 0;

    html += `<tr><th>${vertices[i].label}</th>`;

    for (let j = 0; j < size; j++) {
      let valor = matriz[i][j];
      html += `<td>${valor}</td>`;

      if (valor !== 0) {
        sumaFila += valor;
        conteoFila++;

        sumaColumnas[j] += valor;
        conteoColumnas[j]++;

        totalPesos += valor;
        totalAristas++;
      }
    }

    html += `<td><strong>${sumaFila}</strong></td>`;
    html += `<td><strong>${conteoFila}</strong></td></tr>`;
  }

  // FILA DE SUMAS
  html += "<tr><th>Suma Col</th>";

  for (let j = 0; j < size; j++) {
    html += `<td><strong>${sumaColumnas[j]}</strong></td>`;
  }

  html += `<td><strong>${totalPesos}</strong></td>`;
  html += `<td><strong>${totalAristas}</strong></td></tr>`;

  // FILA DE CONTEO DE ARISTAS
  html += "<tr><th># Aristas Col</th>";

  for (let j = 0; j < size; j++) {
    html += `<td><strong>${conteoColumnas[j]}</strong></td>`;
  }

  html += `<td>-</td><td><strong>${totalAristas}</strong></td></tr>`;

  html += "</table>";

  document.getElementById("matrizContainer").innerHTML = html;

  resizeCanvas();
}

function exportarJSON() {
  if (vertices.length === 0) {
    alert("No hay grafo para exportar.");
    return;
  }

  let nombre = prompt("Ingrese el nombre del archivo:");

  if (!nombre || nombre.trim() === "") {
    nombre = "grafo";
  }

  const data = {
    vertices: vertices.map((v) => ({
      id: v.id,
      label: v.label,
      x: v.x,
      y: v.y,
    })),
    edges: edges.map((e) => ({
      from: e.from.id,
      to: e.to.id,
      weight: e.weight,
      directed: e.directed,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nombre + ".json";
  link.click();
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);

    vertices = [];
    edges = [];
    selectedVertex = null;
    vertexCounter = 0;

    // Reconstruir vértices
    data.vertices.forEach((v) => {
      const nuevo = new Vertex(v.x, v.y, v.label);
      nuevo.id = v.id;
      vertices.push(nuevo);
      vertexCounter++;
    });

    // Reconstruir aristas
    data.edges.forEach((e) => {
      const from = vertices.find((v) => v.id === e.from);
      const to = vertices.find((v) => v.id === e.to);
      edges.push(new Edge(from, to, e.weight, e.directed));
    });

    redraw();
  };

  reader.readAsText(file);
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Delete") {
    // 🔵 Eliminar nodo
    if (selectedVertex) {
      edges = edges.filter(
        (edge) => edge.from !== selectedVertex && edge.to !== selectedVertex,
      );

      vertices = vertices.filter((v) => v !== selectedVertex);

      selectedVertex = null;
      redraw();
    }

    // 🔴 Eliminar arista
    if (selectedEdge) {
      edges = edges.filter((e) => e !== selectedEdge);
      selectedEdge = null;
      redraw();
    }
  }
});

function mostrarHelp() {
  alert(`
FUNCIONAMIENTO DEL SISTEMA:

- Doble click: Crear nodo
- Click nodo + nodo: Crear arista
- Click derecho: Editar nodo o peso
- Delete: Eliminar nodo o arista
- Arrastrar nodo: Moverlo

Notas:
- Debe ingresar nombre válido
- Debe ingresar si es dirigido (si/no)
- Debe ingresar peso numérico
`);
}
