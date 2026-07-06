## Contrato de la API REST — SIGAT 

1. **Autenticación con JWT.** Todos los endpoints salvo `/api/auth/login`,
   `/api/auth/register` y `/api/diseases` exigen el header
   `Authorization: Bearer <token>`. El token se obtiene en el login y expira
   a las 10 horas.
2. **Autorización por rol.** `/api/user/**` exige rol `USER` o `ADMIN`;
   `/api/admin/**` exige rol `ADMIN` exclusivamente.
3. **Anonimización espacial.** El backend nunca persiste la dirección de un
   paciente. La geocodifica con Nominatim, la colapsa a un cuadrante de 50×50 m
   (tabla `quadrant`) y solo expone el centroide de ese cuadrante — nunca la
   dirección original.
4. **Códigos de estado usados:**
   * `200 OK` — solicitud exitosa con datos.
   * `201 Created` — recurso creado (sin cuerpo de respuesta).
   * `400 Bad Request` — datos de entrada inválidos; el cuerpo trae
     `{"message": "..."}` con el motivo específico.
   * `401 Unauthorized` — credenciales incorrectas o token ausente/inválido.
   * `403 Forbidden` — autenticado pero sin permiso (rol insuficiente, cuenta
     no aprobada/desactivada, o intento de auto-modificación bloqueado).

---

### 1. Autenticación (`/api/auth`, endpoints públicos)

* **Iniciar sesión**
  * `POST /api/auth/login`
  * Body: `{"email": string, "password": string}`
  * `200 OK` → `{"token": string, "correo": string, "rol": "ROLE_USER" | "ROLE_ADMIN"}`
  * `401 Unauthorized` → credenciales incorrectas
  * `403 Forbidden` → cuenta inactiva (pendiente de aprobación o desactivada)

* **Registrar solicitud de acceso**
  * `POST /api/auth/register`
  * Body: `{email, confirmation_email, names, surnames, password, phone_number, rut, country, region, city, institution}`
  * `201 Created` — la cuenta queda inactiva hasta que un admin la aprueba
  * `400 Bad Request` → email y confirmación no coinciden, email ya en uso, o RUT ya en uso

---

### 2. Enfermedades (`/api/diseases`, público)

* **Listar enfermedades**
  * `GET /api/diseases`
  * `200 OK` → `[{"id": number, "name": string, "yellow_minimum": number, "red_minimum": number}]`

---

### 3. Mapa y puntos (`/api/user/map`, requiere rol USER o ADMIN)

* **Listar puntos activos**
  * `GET /api/user/map/points/active/all`
  * `200 OK` → `[Point]` (cada `Point` incluye `disease`, `city`, `inTreatment`, `treatmentStart`, `nextControl`, y `quadrant` con `centerLng`/`centerLat`/`label`)

* **Listar puntos activos por enfermedad**
  * `GET /api/user/map/points/active?disease={id}`
  * `200 OK` → `[Point]`

* **Crear punto**
  * `POST /api/user/map/points/new`
  * Body: `{rut, disease_id, city, address, in_treatment, treatment_start, next_control}`
  * `201 Created`
  * `400 Bad Request` → RUT ausente/inválido (dígito verificador), ciudad o domicilio vacíos, tratamiento activo sin fechas, enfermedad inexistente, o dirección no geocodificable

* **Obtener un punto**
  * `GET /api/user/map/points/{id}`
  * `200 OK` → `Point` · `400 Bad Request` → el punto no existe

* **Cambiar la enfermedad de un punto**
  * `PATCH /api/user/map/points/{id}/disease`
  * Body: `{disease_id}`
  * `200 OK` · `400 Bad Request`

* **Reubicar un punto (recalcula su cuadrante)**
  * `PATCH /api/user/map/points/{id}/coordinates`
  * Body: `{x_coordinate, y_coordinate}` (longitud, latitud)
  * `200 OK` · `400 Bad Request`

* **Desactivar un punto**
  * `PUT /api/user/map/points/{id}/deactivate`
  * `200 OK` · `400 Bad Request` → el punto ya estaba desactivado

---

### 4. Carga masiva (`/api/data`, requiere rol USER o ADMIN)

* **Subir archivo Excel**
  * `POST /api/data/upload`
  * Body: `multipart/form-data`, campo `file`
  * `200 OK` → `{"importados": number, "fallidos": number, "errores": ["Fila N no válida por: ...", ...]}`
    (importación parcial: las filas válidas se guardan aunque otras fallen)
  * `400 Bad Request` → extensión inválida, archivo no es un Excel real, o faltan columnas requeridas (`rut`, `enfermedad`, `ciudad`, `domicilio`, `enTratamiento`, `fechaInicio`, `fechaProximoControl`)

---

### 5. Administración (`/api/admin`, requiere rol ADMIN)

* **Listar usuarios / solicitudes pendientes**
  * `GET /api/admin/users` · `GET /api/admin/users/approval-pending`
  * `200 OK` → `[User]`

* **Aprobar / activar / desactivar usuario**
  * `PUT /api/admin/users/{id}/approve` · `.../activate` · `.../deactivate`
  * `200 OK` → `{"message": "exitoso"}`
  * `400 Bad Request` → estado inconsistente (ya activo/inactivo), o intento de desactivar la propia cuenta

* **Cambiar rol (dar/quitar admin)**
  * `PUT /api/admin/users/{id}/role`
  * Body: `{"admin": boolean}`
  * `200 OK` · `400 Bad Request` → intento de auto-remoción del rol admin

* **Eliminar usuario**
  * `DELETE /api/admin/users/{id}`
  * `200 OK` · `400 Bad Request` → intento de auto-eliminación, o el usuario tiene historial de acciones asociado

* **Historial de acciones**
  * `GET /api/admin/users/{id}/history?entries={n}` (máx. 64) · `GET /api/admin/history` (últimas 100, global)
  * `200 OK` → `[PointAction]` (incluye `user`, `point` con su `disease`/`quadrant`, tipo de acción, y `pointModificationValues` si fue una modificación)

* **Notificaciones del admin autenticado**
  * `GET /api/admin/notifications`
  * `200 OK` → `[Notification]`
