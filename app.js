const btnInstalar = document.getElementById("btn-instalar");
const instruccionesIOS = document.getElementById("instrucciones-ios");
const estadoInstalacion = document.getElementById("estado-instalacion");

const btnAdjuntar = document.getElementById("btn-adjuntar");
const prePermiso = document.getElementById("pre-permiso");
const btnConfirmarUbicacion = document.getElementById("btn-confirmar-ubicacion");
const estadoUbicacion = document.getElementById("estado-ubicacion");
const resultadoUbicacion = document.getElementById("resultado-ubicacion");
const precisionUbicacion = document.getElementById("precision-ubicacion");
const valorLatitud = document.getElementById("valor-latitud");
const valorLongitud = document.getElementById("valor-longitud");
const valorPrecision = document.getElementById("valor-precision");
const valorHora = document.getElementById("valor-hora");
const planB = document.getElementById("plan-b");
const selectorZona = document.getElementById("selector-zona");
const btnUsarZona = document.getElementById("btn-usar-zona");
const estadoZona = document.getElementById("estado-zona");

const UMBRAL_PRECISION_METROS = 30;
const ZONAS = [
  { nombre: "Zona Centro", latitud: 19.432608, longitud: -99.133209 },
  { nombre: "Zona Norte", latitud: 19.5044, longitud: -99.1467 },
  { nombre: "Zona Sur", latitud: 19.35, longitud: -99.16 }
];

let eventoInstalacion = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}

const esIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const esStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (esStandalone) {
  estadoInstalacion.textContent = "Ya estás usando la app instalada.";
  btnInstalar.classList.add("oculto");
} else if (esIOS) {
  instruccionesIOS.classList.remove("oculto");
  estadoInstalacion.textContent =
    "En iOS la instalación se hace manualmente desde Safari.";
} else {
  estadoInstalacion.textContent =
    "Si tu navegador lo permite, aparecerá el botón de instalación.";
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  eventoInstalacion = event;
  btnInstalar.classList.remove("oculto");
  estadoInstalacion.textContent = "La app está lista para instalarse.";
});

btnInstalar.addEventListener("click", () => {
  if (!eventoInstalacion) {
    return;
  }

  btnInstalar.disabled = true;
  eventoInstalacion.prompt();

  eventoInstalacion.userChoice
    .then((eleccion) => {
      estadoInstalacion.textContent =
        eleccion.outcome === "accepted"
          ? "Instalación aceptada."
          : "Instalación cancelada.";
    })
    .catch((error) => {
      console.error("Error al instalar la app:", error);
      estadoInstalacion.textContent = "No se pudo completar la instalación.";
    })
    .then(() => {
      eventoInstalacion = null;
      btnInstalar.classList.add("oculto");
      btnInstalar.disabled = false;
    });
});

window.addEventListener("appinstalled", () => {
  estadoInstalacion.textContent = "App instalada correctamente.";
  instruccionesIOS.classList.add("oculto");
  btnInstalar.classList.add("oculto");
  eventoInstalacion = null;
});

function mostrarEstado(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "estado" + (tipo ? " " + tipo : "");
}

function ocultarPaneles() {
  prePermiso.classList.add("oculto");
  resultadoUbicacion.classList.add("oculto");
  planB.classList.add("oculto");
}

function mostrarPrePermiso() {
  ocultarPaneles();
  prePermiso.classList.remove("oculto");
  mostrarEstado(
    estadoUbicacion,
    "Revisa la información y confirma para compartir tu ubicación."
  );
  btnConfirmarUbicacion.focus();
}

function poblarZonas() {
  if (selectorZona.options.length > 0) {
    return;
  }

  ZONAS.forEach((zona, indice) => {
    const opcion = document.createElement("option");
    opcion.value = String(indice);
    opcion.textContent = zona.nombre;
    selectorZona.appendChild(opcion);
  });
}

function habilitarPlanB() {
  ocultarPaneles();
  poblarZonas();
  planB.classList.remove("oculto");
  mostrarEstado(
    estadoZona,
    "Plan B activo: selecciona una zona y confirma.",
    "aviso"
  );
  selectorZona.focus();
}

function mostrarResultado(ubicacion) {
  ocultarPaneles();
  resultadoUbicacion.classList.remove("oculto");

  valorLatitud.textContent = ubicacion.latitud.toFixed(6);
  valorLongitud.textContent = ubicacion.longitud.toFixed(6);
  valorHora.textContent = new Date(ubicacion.timestamp).toLocaleTimeString("es-MX");

  if (ubicacion.manual) {
    precisionUbicacion.textContent = "Selección manual (plan B)";
    precisionUbicacion.className = "precision manual";
    valorPrecision.textContent = "No disponible";
    return;
  }

  if (ubicacion.precisionMetros < UMBRAL_PRECISION_METROS) {
    precisionUbicacion.textContent = "Precisión GPS Alta";
    precisionUbicacion.className = "precision alta";
  } else {
    precisionUbicacion.textContent = "Ubicación Aproximada (Wi-Fi / IP)";
    precisionUbicacion.className = "precision aproximada";
  }

  valorPrecision.textContent = ubicacion.precisionMetros + " m";
}

function solicitarUbicacionActual() {
  btnConfirmarUbicacion.disabled = true;
  mostrarEstado(estadoUbicacion, "Solicitando coordenadas...");

  obtenerUbicacionActual()
    .then((ubicacion) => {
      mostrarResultado(ubicacion);
      mostrarEstado(estadoUbicacion, "Ubicación adjuntada correctamente.", "exito");
    })
    .catch((error) => {
      mostrarEstado(estadoUbicacion, error.message, "error");
      habilitarPlanB();
    })
    .then(() => {
      btnConfirmarUbicacion.disabled = false;
    });
}

function iniciarFlujoUbicacion() {
  if (!window.isSecureContext) {
    const mensaje =
      "La ubicación necesita HTTPS o localhost. Abre la app desde GitHub Pages o http://localhost.";
    mostrarEstado(estadoUbicacion, mensaje, "error");
    habilitarPlanB();
    return;
  }

  btnAdjuntar.disabled = true;
  mostrarEstado(estadoUbicacion, "Consultando el estado del permiso...");

  consultarEstadoPermisoGeo()
    .then((estado) => {
      if (estado === "granted") {
        solicitarUbicacionActual();
        return;
      }

      if (estado === "denied") {
        const mensaje =
          "El permiso de ubicación está bloqueado. Reactívalo en los ajustes del navegador.";
        mostrarEstado(estadoUbicacion, mensaje, "error");
        habilitarPlanB();
        return;
      }

      mostrarPrePermiso();
    })
    .catch(() => {
      mostrarPrePermiso();
    })
    .then(() => {
      btnAdjuntar.disabled = false;
    });
}

btnAdjuntar.addEventListener("click", iniciarFlujoUbicacion);
btnConfirmarUbicacion.addEventListener("click", solicitarUbicacionActual);

btnUsarZona.addEventListener("click", () => {
  const indice = Number(selectorZona.value);
  const zona = ZONAS[indice];

  if (!zona) {
    mostrarEstado(estadoZona, "Selecciona una zona válida.", "error");
    return;
  }

  mostrarResultado({
    latitud: zona.latitud,
    longitud: zona.longitud,
    precisionMetros: null,
    timestamp: Date.now(),
    manual: true
  });

  mostrarEstado(
    estadoUbicacion,
    "Zona asignada manualmente: " + zona.nombre + ".",
    "exito"
  );
  mostrarEstado(estadoZona, "");
});
