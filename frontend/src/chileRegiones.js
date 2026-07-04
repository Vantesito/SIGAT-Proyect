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
