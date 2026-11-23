const CODIGOS_ERROR_GEO = {
  1: "PERMISSION_DENIED",
  2: "POSITION_UNAVAILABLE",
  3: "TIMEOUT"
};

const OPCIONES_GEO_DEFAULT = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 30000
};

function traducirErrorGeolocalizacion(error) {
  switch (error.code) {
    case 1:
      return "Permiso de ubicación denegado. Puedes ingresar tu zona manualmente.";
    case 2:
      return "No fue posible determinar tu ubicación (señal GPS o Wi-Fi no disponible).";
    case 3:
      return "Se agotó el tiempo de espera intentando obtener las coordenadas.";
    default:
      return "Ocurrió un error inesperado al consultar la ubicación.";
  }
}

function obtenerUbicacionActual(opcionesPersonalizadas) {
  const opciones = Object.assign({}, OPCIONES_GEO_DEFAULT, opcionesPersonalizadas);

  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      const errorSinSoporte = new Error(
        "Este navegador no soporta la API de Geolocalización."
      );
      errorSinSoporte.codigo = "POSITION_UNAVAILABLE";
      reject(errorSinSoporte);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precisionMetros: Math.round(posicion.coords.accuracy),
          timestamp: posicion.timestamp
        });
      },
      (error) => {
        const errorNormalizado = new Error(traducirErrorGeolocalizacion(error));
        errorNormalizado.codigo =
          CODIGOS_ERROR_GEO[error.code] || "POSITION_UNAVAILABLE";
        reject(errorNormalizado);
      },
      opciones
    );
  });
}

function consultarEstadoPermisoGeo() {
  if (!("permissions" in navigator) || !navigator.permissions.query) {
    return Promise.resolve("prompt");
  }

  try {
    return navigator.permissions
      .query({ name: "geolocation" })
      .then((resultado) => resultado.state)
      .catch(() => "prompt");
  } catch (error) {
    return Promise.resolve("prompt");
  }
}
