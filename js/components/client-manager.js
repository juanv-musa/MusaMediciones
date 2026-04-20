/**
 * MusaMediciones Client Manager Component
 */

class ClientManagerView {
    constructor(container) {
        this.container = container;
        this.editingClientId = null;
    }

    render(data, projects, clients) {
        this.container.innerHTML = `
            <div class="client-manager-view view-container" style="animation: fadeIn 0.4s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                    <div>
                        <h2 style="font-weight: 800; font-size: 2.2rem; color: var(--text-primary);">Gestión de Clientes</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Administra la base de datos de clientes para tus presupuestos.</p>
                    </div>
                    <button id="btn-show-add-client" class="btn-musa" style="padding: 1rem 2rem; font-size: 1rem;">
                        <i data-lucide="user-plus" style="width: 20px;"></i> + Nuevo Cliente
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: ${this.editingClientId ? '1fr 400px' : '1fr'}; gap: 2rem; align-items: start;">
                    <!-- Clients Table -->
                    <div class="glass" style="padding: 2.5rem; border-radius: var(--radius-xl); background: white;">
                        <table class="musa-table">
                            <thead>
                                <tr>
                                    <th>Nombre / Empresa</th>
                                    <th>CIF / NIF</th>
                                    <th>Población</th>
                                    <th>Proyectos</th>
                                    <th style="text-align: right;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${clients.length === 0 ? `
                                    <tr>
                                        <td colspan="5" style="text-align: center; padding: 4rem; color: var(--text-muted);">No hay clientes registrados.</td>
                                    </tr>
                                ` : clients.map(client => `
                                    <tr>
                                        <td style="font-weight: 700;">${client.name}</td>
                                        <td>${client.cif || '---'}</td>
                                        <td>${client.city || '---'}</td>
                                        <td>
                                            <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">
                                                ${projects.filter(p => p.clientId === client.id).length}
                                            </span>
                                        </td>
                                        <td style="text-align: right;">
                                            <button class="btn-edit-client" data-id="${client.id}" style="background: transparent; border: none; cursor: pointer; color: var(--primary);"><i data-lucide="edit-2" style="width: 18px;"></i></button>
                                            <button class="btn-delete-client" data-id="${client.id}" style="background: transparent; border: none; cursor: pointer; color: #ef4444; margin-left: 10px;"><i data-lucide="trash-2" style="width: 18px;"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Add/Edit Form -->
                    ${this.editingClientId ? this.renderClientForm(clients.find(c => c.id === this.editingClientId)) : ''}
                </div>
            </div>
        `;

        this.addEventListeners();
        if (window.lucide) lucide.createIcons();
    }

    renderClientForm(client) {
        const isNew = this.editingClientId === 'new';
        return `
            <div class="glass" style="padding: 2.5rem; border-radius: var(--radius-xl); background: white; border: 1px solid var(--primary); position: sticky; top: 2rem; animation: slideInRight 0.3s ease-out;">
                <h3 style="margin-bottom: 2rem; font-weight: 800;">${isNew ? 'Nuevo Cliente' : 'Editar Cliente'}</h3>
                <form id="client-form" style="display: flex; flex-direction: column; gap: 1.2rem;">
                    <div class="form-group">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">NOMBRE / EMPRESA</label>
                        <input type="text" name="name" value="${client?.name || ''}" required style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);">
                    </div>
                    <div class="form-group">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">CIF / NIF</label>
                        <input type="text" name="cif" value="${client?.cif || ''}" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);">
                    </div>
                    <div class="form-group">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">DIRECCIÓN</label>
                        <input type="text" name="address" value="${client?.address || ''}" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">POBLACIÓN</label>
                            <input type="text" name="city" value="${client?.city || ''}" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);">
                        </div>
                        <div class="form-group">
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">CÓDIGO POSTAL</label>
                            <input type="text" name="postcode" value="${client?.postcode || ''}" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);">
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">EMAIL</label>
                        <input type="email" name="email" value="${client?.email || ''}" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);">
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="submit" class="btn-musa" style="flex: 1;">Guardar</button>
                        <button type="button" id="btn-cancel-client" class="btn-musa" style="background: white; border: 1px solid var(--border); color: var(--text-secondary);">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    }

    addEventListeners() {
        // Show Add Form
        const btnAdd = this.container.querySelector('#btn-show-add-client');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                this.editingClientId = 'new';
                this.render(window.state.data, window.state.projects, window.state.clients);
            });
        }

        // Cancel Form
        const btnCancel = this.container.querySelector('#btn-cancel-client');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                this.editingClientId = null;
                this.render(window.state.data, window.state.projects, window.state.clients);
            });
        }

        // Edit Client
        this.container.querySelectorAll('.btn-edit-client').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editingClientId = btn.getAttribute('data-id');
                this.render(window.state.data, window.state.projects, window.state.clients);
            });
        });

        // Delete Client
        this.container.querySelectorAll('.btn-delete-client').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
                    window.state.deleteClient(btn.getAttribute('data-id'));
                }
            });
        });

        // Submit Form
        const form = this.container.querySelector('#client-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const clientData = Object.fromEntries(formData.entries());
                
                if (this.editingClientId === 'new') {
                    window.state.addClient(clientData);
                } else {
                    window.state.updateClient(this.editingClientId, clientData);
                }
                
                this.editingClientId = null;
            });
        }
    }
}

window.ClientManagerView = ClientManagerView;
