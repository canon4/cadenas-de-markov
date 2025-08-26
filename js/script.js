function generarFormulario() {
  const n = parseInt(document.getElementById("numEstados").value);
  const contenedor = document.getElementById("formularioMatriz");
  contenedor.innerHTML = "<h5>Matriz de transición</h5>";

  const tabla = document.createElement("table");
  tabla.className = "table table-bordered";

  for (let i = 0; i < n; i++) {
    const fila = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      fila.innerHTML += `<td><input type="number" step="any" min="0" max="1" class="form-control" id="p${i}${j}" /></td>`;
    }
    tabla.appendChild(fila);
  }
  contenedor.appendChild(tabla);

  contenedor.innerHTML += "<h5>Vector de estado inicial</h5>";
  const filaVector = document.createElement("div");
  filaVector.className = "d-flex gap-2";
  for (let i = 0; i < n; i++) {
    filaVector.innerHTML += `<input type="number" step="any" min="0" max="1" class="form-control w-auto" id="v${i}" />`;
  }
  contenedor.appendChild(filaVector);
  document.getElementById("calcularBtn").classList.remove("d-none");
}

function limpiarFormulario() {
  const n = parseInt(document.getElementById("numEstados").value);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      document.getElementById(`p${i}${j}`).value = "";
    }
    document.getElementById(`v${i}`).value = "";
  }
}

function llenarAleatorio() {
  const n = parseInt(document.getElementById("numEstados").value);
  for (let i = 0; i < n; i++) {
    let fila = [];
    let suma = 0;
    for (let j = 0; j < n; j++) {
      fila[j] = Math.random();
      suma += fila[j];
    }
    for (let j = 0; j < n; j++) {
      const valor = fila[j] / suma;
      document.getElementById(`p${i}${j}`).value = valor.toFixed(4);
    }
  }

  let vector = [];
  let sumaV = 0;
  for (let i = 0; i < n; i++) {
    vector[i] = Math.random();
    sumaV += vector[i];
  }
  for (let i = 0; i < n; i++) {
    document.getElementById(`v${i}`).value = (vector[i] / sumaV).toFixed(4);
  }
}

function validarFilas(matriz) {
  for (let i = 0; i < matriz.length; i++) {
    const suma = matriz[i].reduce((acc, val) => acc + val, 0);
    if (Math.abs(suma - 1) > 0.01) {
      return `La fila ${i} no suma 1. Suma: ${suma.toFixed(4)}`;
    }
  }
  return null;
}

function multiplicarMatriz(A, B) {
  const resultado = [];
  for (let i = 0; i < A.length; i++) {
    resultado[i] = [];
    for (let j = 0; j < B[0].length; j++) {
      let suma = 0;
      for (let k = 0; k < A[0].length; k++) {
        suma += A[i][k] * B[k][j];
      }
      resultado[i][j] = suma;
    }
  }
  return resultado;
}

function obtenerEstadosAbsorbentes(matriz) {
  const absorbentes = [];
  matriz.forEach((fila, i) => {
    if (fila.every((v, j) => (i === j ? v === 1 : v === 0))) {
      absorbentes.push(i);
    }
  });
  return absorbentes;
}

function submatriz(matriz, indicesFila, indicesColumna) {
  return indicesFila.map((i) => indicesColumna.map((j) => matriz[i][j]));
}

function matrizIdentidad(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function restarMatrices(A, B) {
  return A.map((fila, i) => fila.map((val, j) => val - B[i][j]));
}

function invertirMatriz(matriz) {
  const n = matriz.length;
  let I = matrizIdentidad(n);
  let M = matriz.map((f) => f.slice());

  for (let i = 0; i < n; i++) {
    let factor = M[i][i];
    for (let j = 0; j < n; j++) {
      M[i][j] /= factor;
      I[i][j] /= factor;
    }
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        let factor2 = M[k][i];
        for (let j = 0; j < n; j++) {
          M[k][j] -= factor2 * M[i][j];
          I[k][j] -= factor2 * I[i][j];
        }
      }
    }
  }
  return I;
}

function calcularMarkov() {
  const n = parseInt(document.getElementById("numEstados").value);
  const pasos = parseInt(document.getElementById("proyeccion").value);
  const tipo = document.getElementById("tipoCadena").value;

  let matriz = [];
  for (let i = 0; i < n; i++) {
    let fila = [];
    for (let j = 0; j < n; j++) {
      fila.push(parseFloat(document.getElementById(`p${i}${j}`).value));
    }
    matriz.push(fila);
  }

  let vector = [];
  for (let i = 0; i < n; i++) {
    vector.push([parseFloat(document.getElementById(`v${i}`).value)]);
  }

  const absorbentes = obtenerEstadosAbsorbentes(matriz);
  let esAbsorbente =
    tipo === "absorvente" || (tipo === "auto" && absorbentes.length > 0);

  let historial = [[...vector.map((e) => e[0])]]; // Paso 0

  // Multiplicaciones paso a paso
  for (let paso = 0; paso < pasos; paso++) {
    vector = multiplicarMatriz(matriz, vector);
    historial.push([...vector.map((e) => e[0])]);
  }

  let tablaResultado = `<h5>Resultado (${
    esAbsorbente ? "Absorbente" : "No absorbente"
  })</h5>`;

  if (esAbsorbente && absorbentes.length > 0) {
    tablaResultado += `<p><strong>Estados absorbentes:</strong> ${absorbentes.join(
      ", "
    )}</p>`;
    const transitorios = [...Array(n).keys()].filter(
      (i) => !absorbentes.includes(i)
    );
    const Q = submatriz(matriz, transitorios, transitorios);
    const R = submatriz(matriz, transitorios, absorbentes);
    const I = matrizIdentidad(Q.length);
    const N = invertirMatriz(restarMatrices(I, Q));
    const B = multiplicarMatriz(N, R);

    const formatTable = (mat, title) => {
      let html = `<h6>${title}</h6><table class="table table-bordered"><tbody>`;
      mat.forEach((fila) => {
        html +=
          "<tr>" +
          fila.map((v) => `<td>${v.toFixed(4)}</td>`).join("") +
          "</tr>";
      });
      html += "</tbody></table>";
      return html;
    };

    tablaResultado += formatTable(N, "Matriz fundamental (N)");
    tablaResultado += formatTable(B, "Matriz de absorción (B)");
  }

  // Tabla de pasos
  tablaResultado += `<h5>Progresión paso a paso</h5><table class="table table-striped"><thead><tr><th>Paso</th>`;
  for (let i = 0; i < n; i++) {
    tablaResultado += `<th>Estado ${i}</th>`;
  }
  tablaResultado += `</tr></thead><tbody>`;
  historial.forEach((fila, idx) => {
    tablaResultado += `<tr><td>${idx}</td>`;
    fila.forEach((v, j) => {
      const clase = absorbentes.includes(j) ? "resaltado" : "";
      tablaResultado += `<td class="${clase}">${v.toFixed(4)}</td>`;
    });
    tablaResultado += "</tr>";
  });
  tablaResultado += "</tbody></table>";

  document.getElementById("resultado").innerHTML = tablaResultado;
}
