import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PanelAdmin.css';
import logosigat from './assets/logosigat.png';

function PanelAdmin() {
  const navigate = useNavigate();
  
  // Estado simulado para las solicitudes desde el registro
  const [solicitudes, setSolicitudes] = useState([
    { id: 1, rut: '12.345.678-9', nombre: 'Dra. María González', email: 'mgonzalez@institucion.cl', institucion: 'CESFAM Centro', estado: 'Pendiente' },
    { id: 2, rut: '22.345.678-9', nombre: 'Enf. Carlos Pérez', email: 'cperez@institucion.cl', institucion: 'Hospital Regional', estado: 'Pendiente' },
    { id: 3, rut: '12.345.678-k', nombre: 'TS. Laura Méndez', email: 'lmendez@institucion.cl', institucion: 'CESFAM Norte', estado: 'Pendiente' }
  ]);

  const handleAprobar = (id) => {
    setSolicitudes(solicitudes.filter(solicitud => solicitud.id !== id));
    alert('Usuario aprobado. El sistema ha enviado un correo con las credenciales.');
  };

  const handleRechazar = (id) => {
    setSolicitudes(solicitudes.filter(solicitud => solicitud.id !== id));
    alert('Solicitud rechazada y eliminada del sistema.');
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={logosigat} alt="SIGAT Logo" width={50} height={50} />
          <div>
            <h2>Panel de administración</h2>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="nav-item active">Solicitudes de acceso</button>
          <button className="nav-item">Gestión de usuarios</button>
        </nav>

        <button className="btn-logout-admin" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Gestión de solicitudes</h1>
          <p>Revisa y aprueba el acceso de los nuevos profesionales de salud al sistema.</p>
        </header>

        <section className="admin-content">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Profesional</th>
                  <th>Email institucional</th>
                  <th>Institución</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">No hay solicitudes pendientes.</td>
                  </tr>
                ) : (
                  solicitudes.map((user) => (
                    <tr key={user.id}>
                      <td>{user.rut}</td>
                      <td><strong>{user.nombre}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.institucion}</td>
                      <td><span className="badge-warning">{user.estado}</span></td>
                      <td className="action-cells">
                        <button className="btn-approve" onClick={() => handleAprobar(user.id)}>Aprobar</button>
                        <button className="btn-reject" onClick={() => handleRechazar(user.id)}>Rechazar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PanelAdmin;