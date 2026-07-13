import objetoRepo from '../repositories/objeto.js';

const toApi = (objeto) => {
    if (!objeto) return null;
    return objeto.get ? objeto.get({ plain: true }) : objeto;
};

const listar = async () => {
    const objetos = await objetoRepo.findAll();
    return (objetos ?? []).map(toApi);
};

const obtener = async (id) => toApi(await objetoRepo.findOne(id));

const crear = async ({ nombre, categoria, descripcion, icono }) => {
    if (!nombre || !categoria || !descripcion) {
        return { success: false, message: 'Proporcione nombre, categoría y descripción.' };
    }

    const objeto = await objetoRepo.create({
        nombre,
        categoria,
        descripcion,
        icono: icono || '📦',
        estado: 'disponible'
    });

    if (!objeto) {
        return { success: false, message: 'No se pudo publicar el objeto.' };
    }

    return { success: true, message: 'Objeto publicado con éxito en el catálogo.', objeto: toApi(objeto) };
};

const actualizar = async (id, { nombre, categoria, descripcion, icono }) => {
    const objeto = await objetoRepo.findOne(id);
    if (!objeto) {
        return { success: false, message: 'Objeto no encontrado.' };
    }

    if (nombre !== undefined) objeto.nombre = nombre;
    if (categoria !== undefined) objeto.categoria = categoria;
    if (descripcion !== undefined) objeto.descripcion = descripcion;
    if (icono !== undefined) objeto.icono = icono;
    await objeto.save();

    return { success: true, message: 'Objeto actualizado correctamente.', objeto: toApi(objeto) };
};

const eliminar = async (id) => {
    const objeto = await objetoRepo.findOne(id);
    if (!objeto) {
        return { success: false, message: 'Objeto no encontrado.' };
    }
    await objetoRepo.remove(id);
    return { success: true, message: 'Objeto eliminado del catálogo.' };
};

// Usado internamente por el servicio de reclamos cuando un reclamo se aprueba.
const marcarReclamado = async (id) => toApi(await objetoRepo.setEstado(id, 'reclamado'));

const objetoService = { listar, obtener, crear, actualizar, eliminar, marcarReclamado, toApi };

export default objetoService;
