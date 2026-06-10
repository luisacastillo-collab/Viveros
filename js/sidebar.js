import { auth, onAuthStateChanged, signOut } from '../firebase-config.js';

export function initSidebar() {
    // Inyectar HTML del sidebar
    document.body.insertAdjacentHTML('beforeend', `
        <!-- Overlay -->
        <div id="sidebar-overlay" onclick="closeSidebar()" style="
            display:none; position:fixed; inset:0;
            background:rgba(0,0,0,0.4); z-index:1040;"></div>

        <!-- Sidebar -->
        <div id="sidebar" style="
            position:fixed; top:0; right:-300px; width:280px; height:100%;
            background:white; z-index:1050; transition:right 0.3s ease;
            box-shadow:-4px 0 20px rgba(0,0,0,0.15); display:flex; flex-direction:column;">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#5cb85c,#2e7d32); padding:24px 20px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div id="sb-avatar" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
                            <i class="fa fa-user" style="color:white;font-size:22px;"></i>
                        </div>
                        <div id="sb-nombre" style="color:white;font-weight:700;font-size:16px;">—</div>
                        <div id="sb-email" style="color:rgba(255,255,255,0.75);font-size:13px;"></div>
                    </div>
                    <button onclick="closeSidebar()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;padding:0;">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Opciones -->
            <div style="flex:1; padding:12px 0;">
                <a href="perfil.html" style="display:flex;align-items:center;padding:14px 20px;color:#333;text-decoration:none;font-weight:600;border-bottom:1px solid #f5f5f5;">
                    <i class="fa fa-user-circle" style="width:28px;color:#5cb85c;"></i> Mi Perfil
                </a>
                <a href="registro-vivero.html" id="sb-btn-registro" style="display:flex;align-items:center;padding:14px 20px;color:#333;text-decoration:none;font-weight:600;border-bottom:1px solid #f5f5f5;">
                    <i class="fa fa-plus-circle" style="width:28px;color:#5cb85c;"></i> Registrar Vivero
                </a>
                <a href="index.html" style="display:flex;align-items:center;padding:14px 20px;color:#333;text-decoration:none;font-weight:600;border-bottom:1px solid #f5f5f5;">
                    <i class="fa fa-home" style="width:28px;color:#5cb85c;"></i> Inicio
                </a>
                <a href="plants.html" style="display:flex;align-items:center;padding:14px 20px;color:#333;text-decoration:none;font-weight:600;border-bottom:1px solid #f5f5f5;">
                    <i class="fa fa-leaf" style="width:28px;color:#5cb85c;"></i> Plantas
                </a>
                <a href="mapa_viveros.html" style="display:flex;align-items:center;padding:14px 20px;color:#333;text-decoration:none;font-weight:600;border-bottom:1px solid #f5f5f5;">
                    <i class="fa fa-map-marker-alt" style="width:28px;color:#5cb85c;"></i> Mapa
                </a>
            </div>

            <!-- Cerrar sesión -->
            <div style="padding:16px 20px; border-top:1px solid #f0f0f0;">
                <button id="sb-btn-logout" onclick="sidebarLogout()" style="
                    width:100%; padding:12px; border:none; border-radius:8px;
                    background:#fff0f0; color:#dc3545; font-weight:700;
                    font-size:15px; cursor:pointer;">
                    <i class="fa fa-sign-out-alt mr-2"></i>Cerrar Sesión
                </button>
            </div>
        </div>
    `);

    // Funciones globales
    window.openSidebar = function() {
        document.getElementById('sidebar').style.right = '0';
        document.getElementById('sidebar-overlay').style.display = 'block';
    }

    window.closeSidebar = function() {
        document.getElementById('sidebar').style.right = '-300px';
        document.getElementById('sidebar-overlay').style.display = 'none';
    }

    window.sidebarLogout = async function() {
        await signOut(auth);
        window.location.href = 'login.html';
    }

    // Escuchar auth
    onAuthStateChanged(auth, (user) => {
        const btnMenu = document.getElementById('btn-menu-usuario');
        if (user) {
            // Mostrar botón hamburguesa
            if (btnMenu) btnMenu.style.display = 'flex';

            // Datos en sidebar
            document.getElementById('sb-nombre').textContent = user.displayName || 'Sin nombre';
            document.getElementById('sb-email').textContent = user.email;

            if (user.photoURL) {
                document.getElementById('sb-avatar').innerHTML =
                    `<img src="${user.photoURL}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;">`;
            }
        } else {
            if (btnMenu) btnMenu.style.display = 'none';
        }
    });
}
