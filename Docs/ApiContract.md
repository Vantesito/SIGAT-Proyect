##  Contrato de la API REST (Especificación y Estándares)

Para garantizar la interoperabilidad entre el backend (Spring Boot) y el frontend (React + OpenLayers), la API se ha diseñado siguiendo los principios **RESTful**. 

###  Justificación del Formato y Estandarización
1. **Arquitectura Resource-Oriented:** Se utilizan sustantivos en plural para definir los endpoints (`/pacientes`), evitando verbos en la URI. La acción la determina el método HTTP.
2. **Versionamiento:** Se incluye `/v1/` en la ruta base para asegurar que cambios futuros en la estructura de la API no rompan la compatibilidad con el frontend actual.
3. **Anonimización Espacial:** El endpoint de mapas no expone direcciones reales. Transforma las ubicaciones en identificadores de cuadrantes y coordenadas de centroide con un índice de concentración, formato ideal para alimentar la capa `ol/layer/Heatmap` de OpenLayers sin procesar datos sensibles en el cliente.
4. **Códigos de Estado HTTP:** Se implementa un manejo estandarizado de respuestas:
   * `200 OK`: Solicitud exitosa con retorno de datos.
   * `201 Created`: Recurso creado exitosamente.
   * `204 No Content`: Eliminación exitosa sin cuerpo de respuesta.
   * `400 Bad Request`: Datos de entrada inválidos (ej. RUT mal formateado).
   * `404 Not Found`: Recurso no encontrado.

---

###  Endpoints Establecidos

#### 1. Gestión de Pacientes

* **Crear Paciente**
  * **URI:** `POST /api/v1/pacientes`
  * **Descripción:** Registra un nuevo paciente en el sistema de salud.
  * **Cuerpo de la Petición (JSON):**
    ```json
    {
      "rut": "12345678-9",
      "enfermedad": "Hepatitis A",
      "tiempoTratamientoDias": 15,
      "ciudad": "Temuco",
      "cuadranteId": "Q-A3"
    }
    ```
  * **Respuestas:**
    * `201 Created`

* **Eliminar Paciente**
  * **URI:** `DELETE /api/v1/pacientes/{rut}`
  * **Descripción:** Elimina el registro de un paciente mediante su identificador único.
  * **Respuestas:**
    * `204 No Content`
    * `404 Not Found`

* **Listar y Filtrar Pacientes**
  * **URI:** `GET /api/v1/pacientes`
  * **Descripción:** Obtiene la lista de pacientes. Permite filtrado opcional por criterios epidemiológicos.
  * **Parámetros de Consulta (Query Params):**
    * `enfermedad` (opcional): Filtra por diagnóstico.
    * `ciudad` (opcional): Filtra por localidad.
  * **Ejemplo de URI con filtro:** `GET /api/v1/pacientes?enfermedad=Hepatitis+A&ciudad=Temuco`
  * **Cuerpo de la Respuesta (JSON):**
    ```json
    [
      {
        "rut": "12345678-9",
        "enfermedad": "Hepatitis A",
        "tiempoTratamientoDias": 15,
        "ciudad": "Temuco",
        "cuadranteId": "Q-A3"
      }
    ]
    ```

#### 2. Análisis Geográfico (Optimizado para OpenLayers)

* **Obtener Densidad por Cuadrantes (Mapa de Calor)**
  * **URI:** `GET /api/v1/mapa/densidad`
  * **Descripción:** Retorna los cuadrantes con su respectivo peso (concentración de pacientes activos) y coordenadas geográficas centralizadas. Este JSON es consumido directamente por OpenLayers para renderizar los puntos calientes.
  * **Parámetros de Consulta (Query Params):**
    * `enfermedad` (opcional): Para visualizar el mapa de calor de una patología específica.
    * `ciudad` (opcional): Para centrar el mapa en una comuna o localidad particular.
  * **Cuerpo de la Respuesta (JSON):**
    ```json
    [
      {
        "cuadranteId": "Q-A3",
        "ciudad": "Temuco",
        "coordenadas": {
          "lat": -38.7396,
          "lon": -72.5984
        },
        "cantidadPacientes": 24,
        "pesoIntensidad": 0.85
      },
      {
        "cuadranteId": "Q-B1",
        "ciudad": "Temuco",
        "coordenadas": {
          "lat": -38.7450,
          "lon": -72.6100
        },
        "cantidadPacientes": 5,
        "pesoIntensidad": 0.18
      }
    ]
    ```
  * **Respuestas:**
    * `200 OK`