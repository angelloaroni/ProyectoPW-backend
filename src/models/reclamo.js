import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Reclamo = sequelize.define('reclamo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    objetoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    evidencia: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pendiente' 
    }
})

export default Reclamo;
