// Datos de referencia: regiones oficiales de Chile y sus comunas principales.
// Usado por el formulario de registro (selects en cascada) y por el panel
// admin (agrupación de usuarios por región).
export const REGIONES = [
    {
        region: 'Arica y Parinacota',
        ciudades: ['Arica', 'Putre'],
    },
    {
        region: 'Tarapacá',
        ciudades: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
    },
    {
        region: 'Antofagasta',
        ciudades: ['Antofagasta', 'Calama', 'Tocopilla'],
    },
    {
        region: 'Atacama',
        ciudades: ['Copiapó', 'Vallenar', 'Chañaral'],
    },
    {
        region: 'Coquimbo',
        ciudades: ['La Serena', 'Coquimbo', 'Ovalle'],
    },
    {
        region: 'Valparaíso',
        ciudades: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'San Antonio'],
    },
    {
        region: 'Metropolitana de Santiago',
        ciudades: ['Santiago', 'Puente Alto', 'Maipú', 'Las Condes', 'La Florida'],
    },
    {
        region: "Libertador General Bernardo O'Higgins",
        ciudades: ['Rancagua', 'San Fernando', 'Rengo'],
    },
    {
        region: 'Maule',
        ciudades: ['Talca', 'Curicó', 'Linares'],
    },
    {
        region: 'Ñuble',
        ciudades: ['Chillán', 'San Carlos', 'Bulnes'],
    },
    {
        region: 'Biobío',
        ciudades: ['Concepción', 'Talcahuano', 'Los Ángeles', 'Chiguayante'],
    },
    {
        region: 'La Araucanía',
        ciudades: ['Temuco', 'Padre Las Casas', 'Traiguén', 'Villarrica', 'Angol'],
    },
    {
        region: 'Los Ríos',
        ciudades: ['Valdivia', 'La Unión', 'Río Bueno'],
    },
    {
        region: 'Los Lagos',
        ciudades: ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas'],
    },
    {
        region: 'Aysén',
        ciudades: ['Coyhaique', 'Puerto Aysén'],
    },
    {
        region: 'Magallanes y de la Antártica Chilena',
        ciudades: ['Punta Arenas', 'Puerto Natales'],
    },
];

export const NOMBRES_REGIONES = REGIONES.map((r) => r.region);

export const ciudadesDeRegion = (nombreRegion) => {
    const r = REGIONES.find((r) => r.region === nombreRegion);
    return r ? r.ciudades : [];
};

// Normaliza texto para comparar sin importar tildes/mayúsculas (útil para
// agrupar usuarios cuyo "region" se guardó como texto libre en registros
// antiguos, antes de que este selector existiera).
export const normalizarTexto = (s) =>
    (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

// Variantes de texto libre que la gente escribió ANTES de que existiera el
// selector (sin tilde, sin "La"/"de", abreviadas, etc.), mapeadas a la clave
// normalizada del nombre oficial. Permite que usuarios registrados con el
// formulario viejo sigan agrupándose correctamente por región.
const SINONIMOS_REGION = {
    'arica y parinacota': 'Arica y Parinacota',
    'arica': 'Arica y Parinacota',
    'tarapaca': 'Tarapacá',
    'antofagasta': 'Antofagasta',
    'atacama': 'Atacama',
    'coquimbo': 'Coquimbo',
    'valparaiso': 'Valparaíso',
    'metropolitana': 'Metropolitana de Santiago',
    'metropolitana de santiago': 'Metropolitana de Santiago',
    'region metropolitana': 'Metropolitana de Santiago',
    'rm': 'Metropolitana de Santiago',
    'santiago': 'Metropolitana de Santiago',
    "o'higgins": "Libertador General Bernardo O'Higgins",
    'ohiggins': "Libertador General Bernardo O'Higgins",
    'libertador bernardo ohiggins': "Libertador General Bernardo O'Higgins",
    'maule': 'Maule',
    'nuble': 'Ñuble',
    'biobio': 'Biobío',
    'bio bio': 'Biobío',
    'araucania': 'La Araucanía',
    'la araucania': 'La Araucanía',
    'los rios': 'Los Ríos',
    'los lagos': 'Los Lagos',
    'aysen': 'Aysén',
    'aisen': 'Aysén',
    'magallanes': 'Magallanes y de la Antártica Chilena',
    'magallanes y la antartica': 'Magallanes y de la Antártica Chilena',
};

// Devuelve el nombre OFICIAL de una región a partir de cualquier variante
// conocida de texto libre (o el texto normalizado tal cual si no hay
// coincidencia, para no perder información de registros muy antiguos/atípicos).
export const nombreOficialRegion = (texto) => {
    const clave = normalizarTexto(texto);
    return SINONIMOS_REGION[clave] || texto || '';
};