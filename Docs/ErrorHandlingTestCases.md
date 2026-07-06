# Casos de prueba: manejo de errores — SIGAT

Casos diseñados para validar el manejo de errores en cuatro flujos: registro,
inicio de sesión, creación individual de un punto, y carga masiva. Cada caso
indica la petición a Postman, el resultado esperado, y qué parte del backend
lo produce (para trazabilidad al depurar).



---

## 1. Registro (`POST /api/auth/register`)

| # | Escenario | Cuerpo (resumen) | Esperado | Origen del error |
|---|---|---|---|---|
| R1 | Email y confirmación no coinciden | `email: "a@x.cl"`, `confirmation_email: "b@x.cl"` | `400` — "El e-mail no coincide con el e-mail de confirmación" | `AuthService.register` |
| R2 | Email ya registrado | Email de una cuenta existente | `400` — "El e-mail ingresado ya está en uso" | `AuthService.register` |
| R3 | RUT ya registrado | RUT de una cuenta existente, email nuevo | `400` — "El RUT ingresado ya está en uso" | `AuthService.register` |
| R4 | Registro válido | Todos los campos correctos, RUT con DV válido | `201 Created`, cuenta queda `active=false` | — |
| R5 | Registro exitoso pero Resend rechaza el correo | Email distinto al verificado en Resend (modo sandbox) | `201 Created` igual (el fallo de correo no debe bloquear el registro) | `AuthService.register` (try/catch alrededor del envío) |

---

## 2. Inicio de sesión (`POST /api/auth/login`)

| # | Escenario | Cuerpo (resumen) | Esperado | Origen del error |
|---|---|---|---|---|
| L1 | Contraseña incorrecta | Email válido, password errónea | `401` — "Credenciales incorrectas." | `AuthController.login` (`BadCredentialsException`) |
| L2 | Email inexistente | Email que no existe en la base | `401` — "Credenciales incorrectas." (mismo mensaje que L1, a propósito, para no filtrar qué correos existen) | `AuthController.login` (`UsernameNotFoundException`) |
| L3 | Cuenta pendiente de aprobación | Cuenta recién registrada, aún `active=false` | `403` — "Tu cuenta aún no ha sido aprobada o se encuentra desactivada." | `CustomUserDetailsService` (`enabled=false`) → `DisabledException` |
| L4 | Cuenta desactivada por un admin | Cuenta con `active=false` tras una desactivación | `403` — mismo mensaje que L3 | Idéntico a L3 |
| L5 | Login válido | Email y password correctos, cuenta activa | `200 OK` → `{token, correo, rol}` | — |

---

## 3. Creación de un punto (`POST /api/user/map/points/new`)

Requiere `Authorization: Bearer <token>` de un usuario con rol `USER` o `ADMIN`.

| # | Escenario | Cuerpo (resumen) | Esperado | Origen del error |
|---|---|---|---|---|
| P1 | Sin token | (cualquiera) | `401/403` — según filtro de seguridad | `SecurityConfig` / `JwtAuthFilter` |
| P2 | RUT ausente | `rut` omitido o `""` | `400` — "el RUT está vacío" | `DataValidationService.validateRut` (vía `MapService.validarDatosPunto`) |
| P3 | RUT con dígito verificador incorrecto | `rut: "12.345.678-9"` (DV correcto es 5) | `400` — "el RUT '...' tiene un dígito verificador incorrecto" | Idéntico a P2 |
| P4 | Enfermedad inexistente | `disease_id: 9999` | `400` — "la enfermedad asociada al punto no existe" | `MapService.createPoint` |
| P5 | Ciudad vacía | `city: ""` | `400` — "la ciudad está vacía" | `MapService.validarDatosPunto` |
| P6 | Domicilio vacío | `address: ""` | `400` — "el domicilio está vacío" | `MapService.validarDatosPunto` |
| P7 | En tratamiento sin fechas | `in_treatment: true`, `treatment_start: null` | `400` — "está en tratamiento pero falta la fecha de inicio o de próximo control" | `MapService.validarDatosPunto` |
| P8 | Dirección no geocodificable | Domicilio inexistente o mal escrito | `400` — "no se encontró la dirección ingresada" | `GeocodingService.geocode` |
| P9 | Nominatim no responde | Simulado cortando red/timeout | `400` — "no se pudo contactar el servicio de geolocalización (intente más tarde)" | `GeocodingService.geocode` |
| P10 | Petición válida | RUT válido, enfermedad existente, dirección real | `201 Created`, aparece en el mapa y en el historial | — |

---

## 4. Carga masiva (`POST /api/data/upload`)

Requiere `Authorization: Bearer <token>`. Body `multipart/form-data`, campo `file`.

| # | Escenario | Archivo | Esperado | Origen del error |
|---|---|---|---|---|
| U1 | Extensión no permitida | `datos.csv` o `datos.txt` | `400` — "El archivo debe tener extensión .xls o .xlsx" | `DataValidationService.validateExtension` |
| U2 | Archivo no es un Excel real | `.pdf` renombrado a `.xlsx` | `400` — "El archivo no es un archivo de Excel válido" | `DataValidationService.parseWorkbook` |
| U3 | Faltan columnas requeridas | Excel sin la columna `enfermedad` | `400` — "El archivo no tiene las columnas correctas. Faltan: enfermedad" (aborta el archivo completo, no es error por fila) | `DataImportService.validarColumnas` |
| U4 | Fila con RUT inválido | Una fila con RUT que no pasa el DV | `200 OK`, esa fila aparece en `errores`, las demás se importan | `DataImportService.procesarFila` → `errores` |
| U5 | Fila con enfermedad no reconocida | `enfermedad: "Gripe"` (no existe en la tabla) | `200 OK`, fila en `errores`: "la enfermedad 'Gripe' no existe en el sistema" | `DataImportService.procesarFila` |
| U6 | Fila en tratamiento sin fechas | `enTratamiento: Sí`, `fechaInicio` vacía | `200 OK`, fila en `errores`: "está en tratamiento pero falta fechaInicio o fechaProximoControl" | `DataImportService.procesarFila` |
| U7 | Fila con dirección no geocodificable | Domicilio inexistente | `200 OK`, fila en `errores`: "no se encontró la dirección ingresada" | `GeocodingService.geocode` (propagado desde `MapService.createPoint`) |
| U8 | Todas las filas fallan | Archivo con puros RUTs inválidos | `200 OK`, `importados: 0`, `fallidos: N` | `DataImportService.importWorkbookData` |
| U9 | Archivo sin ningún archivo adjunto | Petición sin el campo `file` | `400` — error de Spring por parámetro requerido ausente | Spring (`MissingServletRequestPartException`, no capturado explícitamente — ver nota) |
| U10 | Carga totalmente válida | 5 filas correctas | `200 OK`, `importados: 5, fallidos: 0`, los 5 aparecen en el mapa y en el historial | — |

**Nota sobre U9:** este caso no tiene un mensaje personalizado hoy — Spring devuelve su error genérico de parámetro faltante. Si se quiere un mensaje más amigable ("Debes adjuntar un archivo"), habría que añadir un `@ExceptionHandler` para `MissingServletRequestPartException` en el controller o en un `@RestControllerAdvice` global.

---

## Cobertura no incluida (fuera de alcance de estos 4 flujos)

Por completitud, quedan sin casos aquí (pueden documentarse aparte si se necesita):
gestión de usuarios en el panel admin (aprobar/activar/desactivar/eliminar/cambiar rol,
incluyendo las protecciones de auto-modificación), y los endpoints de solo lectura
(`GET /api/diseases`, `GET /api/user/map/points/...`, `GET /api/admin/history`).
