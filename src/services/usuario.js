import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import repository from '../repositories/usuario.js';
import reclamoRepo from '../repositories/reclamo.js';
import { JWT_SECRET } from '../middleware/auth.js';

const ROLES_VALIDOS = ['admin', 'student'];

const generarToken = (id, codigo, nombre, rol) => {
    return jwt.sign({ id, codigo, nombre, rol }, JWT_SECRET, { expiresIn: '7d' });
};

const sanitize = (usuario) => {
    const plain = usuario.get ? usuario.get({ plain: true }) : usuario;
    const { password, ...rest } = plain;
    return rest;
};

const registrar = async ({ codigo, nombre, password, rol }) => {
    if (!codigo || !nombre || !password) {
        return { success: false, message: 'Proporcione código, nombre y password.' };
    }

    const rolFinal = ROLES_VALIDOS.includes(rol) ? rol : 'student';

    if (await repository.findByCodigo(codigo)) {
        return { success: false, message: 'Ya existe un usuario con ese código.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = await repository.create({
        codigo,
        nombre,
        password: hashedPassword,
        rol: rolFinal,
        activo: true
    });

    if (!nuevoUsuario) {
        return { success: false, message: 'No se pudo crear el usuario.' };
    }

    const token = generarToken(nuevoUsuario.id, nuevoUsuario.codigo, nuevoUsuario.nombre, nuevoUsuario.rol);

    return {
        success: true,
        message: 'Usuario creado exitosamente',
        token,
        usuario: sanitize(nuevoUsuario)
    };
};

const login = async ({ codigo, password, rol }) => {
    if (!codigo || !password || !rol) {
        return { success: false, message: 'Código, password o rol incorrectos.' };
    }

    const usr = await repository.findByCodigo(codigo);
    if (!usr) {
        return { success: false, message: 'Código o password incorrectos.' };
    }

    const isPasswordValid = await bcrypt.compare(password, usr.password);
    if (!isPasswordValid) {
        return { success: false, message: 'Código o password incorrectos.' };
    }

    if (usr.rol !== rol) {
        return { success: false, message: 'El rol seleccionado no coincide con la cuenta.' };
    }

    if (!usr.activo) {
        return { success: false, message: 'Tu cuenta se encuentra bloqueada. Contacta al administrador.' };
    }

    const token = generarToken(usr.id, usr.codigo, usr.nombre, usr.rol);

    return {
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        usuario: sanitize(usr)
    };
};

const contarReclamos = async (usuarioId) => {
    const reclamos = await reclamoRepo.findByUsuario(usuarioId);
    const aprobados = reclamos.filter((r) => r.estado === 'aprobado').length;
    return { totalReclamos: reclamos.length, aprobados };
};

const listarUsuarios = async () => {
    const usuarios = await repository.findAll();
    return Promise.all((usuarios ?? []).map(async (u) => ({
        ...sanitize(u),
        ...(await contarReclamos(u.id))
    })));
};

const toggleAcceso = async (id) => {
    const usuario = await repository.findOne(id);
    if (!usuario) {
        return { success: false, message: 'Usuario no encontrado.' };
    }

    const actualizado = await repository.setActivo(id, !usuario.activo);

    return {
        success: true,
        message: actualizado.activo ? 'Acceso habilitado.' : 'Acceso revocado.',
        usuario: sanitize(actualizado)
    };
};

const usuarioService = { registrar, login, listarUsuarios, toggleAcceso };

export default usuarioService;
