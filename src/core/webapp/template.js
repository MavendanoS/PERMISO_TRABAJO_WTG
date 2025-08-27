import getStyles from './styles.js';
import getWebAppScript from './script.js';

export function getWebApp() {
  return '<!DOCTYPE html>' +
'<html lang=\"es\">' +
'<head>' +
    '<meta charset=\"UTF-8\">' +
    '<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">' +
    '<title>PT Wind - Sistema de Gestión de Permisos</title>' +
    '<link rel=\"manifest\" href=\"data:application/json;base64,eyJuYW1lIjoiUFQgV2luZCAtIFBlcm1pc29zIGRlIFRyYWJham8iLCJzaG9ydF9uYW1lIjoiUFQgV2luZCIsInN0YXJ0X3VybCI6Ii8iLCJkaXNwbGF5Ijoic3RhbmRhbG9uZSIsImJhY2tncm91bmRfY29sb3IiOiIjZmZmZmZmIiwidGhlbWVfY29sb3IiOiIjMWExZjJlIiwiaWNvbnMiOlt7InNyYyI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1USTRJaUJvWldsbmFIUTlJakV5T0NJZ2RtbGxkMEp2ZUQwaU1DQXdJREV5T0NBeE1qZ2lJSGh0Ykc1elBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SStQSEpsWTNRZ2VEMGlOQ0lnZVQwaU5DSWdkMmxrZEdnOUlqRXlNQ0lnYUdWcFoyaDBQU0l4TWpBaUlHWnBiR3c5SWlNeFlURm1NbVVpTHo0OEwzTjJaejQ9IiwidHlwZSI6ImltYWdlL3N2Zyt4bWwiLCJzaXplcyI6IjEyOHgxMjgifV19\">' +
    '<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">' +
    '<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>' +
    '<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">' +
    '<style>' + getStyles() + '</style>' +
'</head>' +
'<body>' +
    '<div class=\"container\">' +
        '<!-- Pantalla de Login -->' +
        '<div id=\"loginScreen\" class=\"login-container\">' +
            '<div class=\"logo\">' +
                '<h1>PT WIND</h1>' +
                '<p>Sistema de Gestión de Permisos de Trabajo</p>' +
            '</div>' +
            
            '<form id=\"loginForm\">' +
                '<div class=\"form-group\">' +
                    '<label for=\"usuario\">Usuario / Email</label>' +
                    '<input type=\"text\" id=\"usuario\" required placeholder=\"Ingrese su usuario o email\" autocomplete=\"username\">' +
                '</div>' +
                
                '<div class=\"form-group\">' +
                    '<label for=\"password\">Contraseña</label>' +
                    '<input type=\"password\" id=\"password\" required placeholder=\"Ingrese su contraseña\" autocomplete=\"current-password\">' +
                '</div>' +
                
                '<button type=\"submit\" class=\"btn\" id=\"loginBtn\">Iniciar Sesión</button>' +
                
                '<div id=\"loginError\" class=\"error\" style=\"display: none; margin-top: 16px;\"></div>' +
            '</form>' +
            
            '<div id=\"connectionStatus\" class=\"status-indicator status-offline\" style=\"margin-top: 24px; text-align: center;\">' +
                'Verificando conexión...' +
            '</div>' +
        '</div>' +
        
        '<!-- Aplicación Principal -->' +
        '<div id=\"appScreen\" class=\"app-container\">' +
            '<div class=\"header\">' +
                '<div>' +
                    '<h1>PT WIND</h1>' +
                    '<p>Sistema de Gestión de Permisos de Trabajo</p>' +
                '</div>' +
                
                '<div style=\"display: flex; align-items: center; gap: 16px;\">' +
                    '<span id=\"userDisplay\"></span>' +
                    '<button id=\"logoutBtn\" class=\"btn btn-secondary btn-small\">CERRAR SESIÓN</button>' +
                '</div>' +
            '</div>' +
            
            '<div class=\"tabs\">' +
                '<button class=\"tab active\" data-tab=\"nuevo\">Nuevo Permiso</button>' +
                '<button class=\"tab\" data-tab=\"consultar\">Consultar Permisos</button>' +
                '<button class=\"tab\" data-tab=\"matriz\">Matriz de Riesgos</button>' +
                '<button class=\"tab\" data-tab=\"datos\" id=\"tabDatos\" style=\"display: none;\">Datos del Sistema</button>' +
                '<button class=\"tab\" data-tab=\"admin-usuarios\" id=\"tabAdminUsuarios\" style=\"display: none;\">Administración de Usuarios</button>' +
            '</div>' +
            
            '<!-- Tab: Nuevo Permiso -->' +
            '<div id=\"tab-nuevo\" class=\"tab-content active\">' +
                '<form id=\"permisoForm\">' +
                    '<div class=\"grid-three\">' +
                        '<!-- Columna 1: Antecedentes Generales -->' +
                        '<div class=\"card\">' +
                            '<h3>Antecedentes Generales</h3>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"planta\">Planta *</label>' +
                                '<select id=\"planta\" required>' +
                                    '<option value=\"\">Seleccionar planta...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"aerogenerador\">Aerogenerador *</label>' +
                                '<select id=\"aerogenerador\" required>' +
                                    '<option value=\"\">Seleccionar aerogenerador...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"descripcion\">Descripción de Actividades *</label>' +
                                '<textarea id=\"descripcion\" rows=\"4\" required placeholder=\"Describa las actividades a realizar...\"></textarea>' +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- Columna 2: Responsables -->' +
                        '<div class=\"card\">' +
                            '<h3>Responsables</h3>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"jefeFaena\">Jefe de Faena *</label>' +
                                '<select id=\"jefeFaena\" required>' +
                                    '<option value=\"\">Seleccionar jefe de faena...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"supervisorParque\">Supervisor de Parque</label>' +
                                '<select id=\"supervisorParque\">' +
                                    '<option value=\"\">Seleccionar supervisor de parque...</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group\">' +
                                '<label for=\"tipoMantenimiento\">Tipo de Mantenimiento *</label>' +
                                '<select id=\"tipoMantenimiento\" required>' +
                                    '<option value=\"\">Seleccionar tipo...</option>' +
                                    '<option value=\"PREVENTIVO\">Mantenimiento Preventivo</option>' +
                                    '<option value=\"CORRECTIVO\">Pequeño Correctivo</option>' +
                                    '<option value=\"GRAN_CORRECTIVO\">Gran Correctivo</option>' +
                                    '<option value=\"PREDICTIVO\">Mantenimiento Predictivo</option>' +
                                    '<option value=\"INSPECCION\">Inspección Técnica</option>' +
                                    '<option value=\"OTROS\">Otros</option>' +
                                '</select>' +
                            '</div>' +
                            
                            '<div class=\"form-group input-others\" id=\"tipoOtrosContainer\">' +
                                '<label for=\"tipoOtros\">Especificar Tipo *</label>' +
                                '<input type=\"text\" id=\"tipoOtros\" placeholder=\"Especifique el tipo de mantenimiento...\">' +
                            '</div>' +
                        '</div>' +
                        
                        '<!-- Columna 3: Actividades -->' +
                        '<div class=\"card\">' +
                            '<h3>Actividades Rutinarias</h3>' +
                            
                            '<div class=\"form-group\">' +
                                '<label>Seleccione las Actividades</label>' +
                                '<div id=\"actividadesChecklist\" class=\"checkbox-list\">' +
                                    '<div class=\"loading\">Cargando actividades...</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<!-- Personal Asignado - Fila completa -->' +
                    '<div class=\"card\" style=\"margin-top: 24px;\">' +
                        '<h3>Personal Asignado</h3>' +
                        
                        '<div class=\"selector-dual\">' +
                            '<div>' +
                                '<label style=\"display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;\">Personal Disponible</label>' +
                                '<div id=\"personalDisponible\" class=\"selector-list\">' +
                                    '<div class=\"loading\">Seleccione una planta primero</div>' +
                                '</div>' +
                            '</div>' +
                            
                            '<div class=\"selector-controls\">' +
                                '<button type=\"button\" class=\"btn btn-secondary btn-small\" id=\"addPersonalBtn\">→</button>' +
                                '<button type=\"button\" class=\"btn btn-secondary btn-small\" id=\"removePersonalBtn\">←</button>' +
                            '</div>' +
                            
                            '<div>' +
                                '<label style=\"display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;\">Personal Seleccionado</label>' +
                                '<div id=\"personalSeleccionado\" class=\"selector-list\">' +
                                    '<div style=\"padding: 20px; text-align: center; color: var(--text-secondary);\">No hay personal seleccionado</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<div style=\"margin-top: 32px; display: flex; gap: 16px; flex-wrap: wrap;\">' +
                        '<button type=\"submit\" class=\"btn\" style=\"flex: 1; min-width: 200px;\">CREAR PERMISO DE TRABAJO</button>' +
                        '<button type=\"button\" id=\"generateRegisterBtn\" class=\"btn btn-secondary\" style=\"flex: 1; min-width: 200px;\">GENERAR REGISTRO PDF</button>' +
                    '</div>' +
                '</form>' +
            '</div>' +
            
            '<!-- Tab: Consultar -->' +
            '<div id=\"tab-consultar\" class=\"tab-content\">' +
                '<div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;\">' +
                    '<h3 style=\"color: var(--primary-color); font-size: 18px; font-weight: 600;\">Consultar Permisos de Trabajo</h3>' +
                    '<button id=\"refreshPermisosBtn\" class=\"btn btn-secondary btn-small\">ACTUALIZAR</button>' +
                '</div>' +
                '<div class=\"search-box\">' +
                    '<input type=\"text\" id=\"searchPermiso\" class=\"search-input\" placeholder=\"Buscar por número de permiso, planta, descripción...\">' +
                    '<select id=\"filterEstado\" class=\"search-input\" style=\"max-width: 200px;\">' +
                        '<option value=\"\">Todos los estados</option>' +
                        '<option value=\"CREADO\">Creados</option>' +
                        '<option value=\"ACTIVO\">Activos</option>' +
                        '<option value=\"CERRADO_PENDIENTE_APROBACION\">Cerrados - Pendiente Aprobación</option>' +
                        '<option value=\"CERRADO\">Cerrados - Aprobados</option>' +
                        '<option value=\"CIERRE_RECHAZADO\">Cierre Rechazado</option>' +
                    '</select>' +
                    '<input type=\"date\" id=\"fechaDesde\" class=\"search-input\" style=\"max-width: 150px;\" title=\"Fecha desde - Filtra permisos creados desde esta fecha\" placeholder=\"Fecha desde permiso\">' +
                    '<input type=\"date\" id=\"fechaHasta\" class=\"search-input\" style=\"max-width: 150px;\" title=\"Fecha hasta - Filtra permisos creados hasta esta fecha\" placeholder=\"Fecha hasta permiso\">' +
                    '<button id=\"clearSearchBtn\" class=\"btn btn-secondary btn-small\">LIMPIAR</button>' +
                '</div>' +
                '<div id=\"permisosContainer\" class=\"loading\">' +
                    'Cargando permisos...' +
                '</div>' +
            '</div>' +
            
            '<!-- Tab: Matriz de Riesgos -->' +
            '<div id=\"tab-matriz\" class=\"tab-content\">' +
                '<h3 style=\"color: var(--primary-color); font-size: 18px; font-weight: 600; margin-bottom: 16px;\">Matriz de Riesgos</h3>' +
                '<p style=\"margin-bottom: 24px; color: var(--text-secondary); font-size: 14px;\">Seleccione actividades en la pestaña \"Nuevo Permiso\" para ver la matriz de riesgos aplicable.</p>' +
                '<div id=\"matrizContainer\">' +
                    '<div id=\"matrizTable\" class=\"data-table\" style=\"display: none;\">' +
                        '<table>' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>Código</th>' +
                                    '<th>Actividad</th>' +
                                    '<th>Peligro</th>' +
                                    '<th>Riesgo</th>' +
                                    '<th>Medidas Preventivas</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody id=\"matrizTableBody\">' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div id=\"matrizEmptyState\" class=\"loading\">' +
                        'Seleccione actividades para ver la matriz de riesgos...' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Tab: Datos del Sistema -->' +
            '<div id=\"tab-datos\" class=\"tab-content\">' +
                '<div style=\"display: flex; flex-direction: column; gap: 24px;\">' +
                    '<div class=\"card\">' +
                        '<h3>Parques Eólicos</h3>' +
                        '<div id=\"parquesContainer\" class=\"loading\">Cargando parques...</div>' +
                    '</div>' +
                    
                    '<div class=\"card\">' +
                        '<h3>Personal</h3>' +
                        '<div id=\"personalContainer\" class=\"loading\">Cargando personal...</div>' +
                    '</div>' +
                    
                    '<div class=\"card\">' +
                        '<h3>Supervisores</h3>' +
                        '<div id=\"supervisoresContainer\" class=\"loading\">Cargando supervisores...</div>' +
                    '</div>' +
                    
                    '<div class=\"card\">' +
                        '<h3>Actividades</h3>' +
                        '<div id=\"actividadesContainer\" class=\"loading\">Cargando actividades...</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Tab: Administración de Usuarios -->' +
            '<div id="tab-admin-usuarios" class="tab-content">' +
                '<div class="card">' +
                    '<h3>Administración de Usuarios</h3>' +
                    
                    '<!-- Lista de usuarios con controles dinámicos -->' +
                    '<div id="usuariosContainer" class="loading">Cargando usuarios...</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>' +

    '<!-- MODAL PARA CERRAR PERMISO -->' +
    '<div id=\"cerrarPermisoModal\" style=\"display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;\">' +
        '<div style=\"background: white; border-radius: 8px; padding: 32px; max-width: 720px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;\">' +
            '<h3 style=\"margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;\">CERRAR PERMISO DE TRABAJO</h3>' +
            
            '<!-- Información del permiso -->' +
            '<div style=\"background: var(--bg-secondary); padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid var(--border-color);\">' +
                '<p style=\"margin-bottom: 8px;\"><strong>Permiso:</strong> <span id=\"permisoInfoNumero\"></span></p>' +
                '<p style=\"margin-bottom: 8px;\"><strong>Planta:</strong> <span id=\"permisoInfoPlanta\"></span></p>' +
                '<p style=\"margin-bottom: 0;\"><strong>Aerogenerador:</strong> <span id=\"permisoInfoAerogenerador\"></span></p>' +
            '</div>' +
            
            '<!-- Fechas y Tiempos -->' +
            '<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;\">' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaInicioTrabajos\">Fecha/Hora Inicio Trabajos</label>' +
                    '<input type=\"datetime-local\" id=\"fechaInicioTrabajos\">' +
                '</div>' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaFinTrabajos\">Fecha/Hora Fin Trabajos *</label>' +
                    '<input type=\"datetime-local\" id=\"fechaFinTrabajos\" required>' +
                '</div>' +
            '</div>' +
            
            '<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;\" id=\"turbinaContainer\">' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaParadaTurbina\">Fecha/Hora Parada Turbina</label>' +
                    '<input type=\"datetime-local\" id=\"fechaParadaTurbina\">' +
                '</div>' +
                '<div class=\"form-group\">' +
                    '<label for=\"fechaPuestaMarcha\">Fecha/Hora Puesta en Marcha</label>' +
                    '<input type=\"datetime-local\" id=\"fechaPuestaMarcha\">' +
                '</div>' +
            '</div>' +
            
            '<!-- Sección de Materiales -->' +
            '<div style=\"margin-bottom: 24px; background: var(--bg-secondary); padding: 20px; border-radius: 6px; border: 1px solid var(--border-color);\">' +
                '<h4 style=\"margin-bottom: 16px; color: var(--primary-color); font-size: 16px; font-weight: 600;\">MATERIALES/REPUESTOS UTILIZADOS</h4>' +
                
                '<div style=\"display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; margin-bottom: 12px; align-items: end;\">' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialDescripcion\">Descripción</label>' +
                        '<input type=\"text\" id=\"materialDescripcion\" placeholder=\"Descripción del material\">' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialCantidad\">Cantidad</label>' +
                        '<input type=\"number\" id=\"materialCantidad\" min=\"1\" value=\"1\">' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialPropietario\">Propietario</label>' +
                        '<select id=\"materialPropietario\">' +
                            '<option value=\"ENEL\">ENEL</option>' +
                            '<option value=\"CONTRATISTA\">Contratista</option>' +
                            '<option value=\"PROVEEDOR\">Proveedor</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialAlmacen\">Almacén</label>' +
                        '<select id=\"materialAlmacen\">' +
                            '<option value=\"Central\">Central</option>' +
                            '<option value=\"Sitio\">Sitio</option>' +
                            '<option value=\"Contratista\">Contratista</option>' +
                        '</select>' +
                    '</div>' +
                    '<button type=\"button\" id=\"addMaterialBtn\" class=\"btn btn-secondary btn-small\">+</button>' +
                '</div>' +
                
                '<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;\">' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialNumeroItem\">Número Item (Opcional)</label>' +
                        '<input type=\"text\" id=\"materialNumeroItem\" placeholder=\"N° Item\">' +
                    '</div>' +
                    '<div class=\"form-group\" style=\"margin-bottom: 0;\">' +
                        '<label for=\"materialNumeroSerie\">Número Serie (Opcional)</label>' +
                        '<input type=\"text\" id=\"materialNumeroSerie\" placeholder=\"N° Serie\">' +
                    '</div>' +
                '</div>' +
                
                '<div id=\"materialesLista\" style=\"max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; background: white;\">' +
                    '<div style=\"padding: 20px; text-align: center; color: var(--text-secondary);\">No hay materiales agregados</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Observaciones de Cierre -->' +
            '<div class=\"form-group\" style=\"margin-bottom: 24px;\">' +
                '<label for=\"observacionesCierre\">Observaciones de Cierre</label>' +
                '<textarea id=\"observacionesCierre\" rows=\"3\" placeholder=\"Observaciones sobre el cierre del permiso...\">Trabajo completado según programación</textarea>' +
            '</div>' +
            
            '<div style=\"display: flex; gap: 12px; justify-content: flex-end;\">' +
                '<button id=\"cancelarCierreBtn\" class=\"btn btn-secondary btn-small\">CANCELAR</button>' +
                '<button id=\"confirmarCierreBtn\" class=\"btn btn-danger btn-small\">CERRAR PERMISO</button>' +
            '</div>' +
        '</div>' +
    '</div>' +

    '<!-- MODAL DE EXPORTACIÓN -->' +
    '<div id="exportModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; align-items: center; justify-content: center;">' +
        '<div style="background: white; border-radius: 12px; padding: 32px; max-width: 480px; width: 90%; margin: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">' +
            '<div style="text-align: center; margin-bottom: 24px;">' +
                '<h3 style="margin-bottom: 12px; color: var(--primary-color); font-size: 24px; font-weight: 700;">📁 Exportar Permiso</h3>' +
                '<p style="color: var(--text-secondary); font-size: 14px; margin: 0;">' +
                    'Permiso: <strong id="exportPermisoInfo"></strong>' +
                '</p>' +
            '</div>' +
            
            '<div style="display: grid; gap: 16px; margin-bottom: 24px;">' +
                '<button id="exportExcelBtn" class="btn" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; font-size: 16px;">' +
                    '<span style="font-size: 24px;">📊</span>' +
                    '<div style="text-align: left;">' +
                        '<div style="font-weight: 600;">Excel</div>' +
                    '</div>' +
                '</button>' +
                
                '<button id="exportPdfBtn" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; font-size: 16px;">' +
                    '<span style="font-size: 24px;">📄</span>' +
                    '<div style="text-align: left;">' +
                        '<div style="font-weight: 600;">PDF para Imprimir</div>' +
                    '</div>' +
                '</button>' +
            '</div>' +
            
            '<div id="exportStatus" style="display: none; text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 16px;">' +
                '<div style="display: inline-block; width: 20px; height: 20px; border: 2px solid var(--primary-color); border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>' +
                '<span id="exportStatusText">Generando archivo...</span>' +
            '</div>' +
            
            '<div style="text-align: center;">' +
                '<button id="cancelExportBtn" class="btn btn-secondary btn-small">Cancelar</button>' +
            '</div>' +
        '</div>' +
    '</div>' +

    '<!-- MODAL DE CAMBIO DE CONTRAEÑA OBLIGATORIO -->' +
    '<div id="changePasswordModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; align-items: center; justify-content: center;">' +
        '<div style="background: white; border-radius: 8px; padding: 32px; max-width: 480px; width: 90%; margin: 20px;">' +
            '<h3 style="margin-bottom: 24px; color: var(--primary-color);">Cambio de Contraseña Obligatorio</h3>' +
            
            '<div id="passwordChangeReason" class="warning" style="background: rgba(243, 156, 18, 0.1); color: var(--warning-color); padding: 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid rgba(243, 156, 18, 0.2);">' +
                'Por seguridad, debes cambiar tu contraseña.' +
            '</div>' +
            
            '<div id="passwordRequirements" class="info" style="background: rgba(26, 31, 46, 0.05); padding: 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid rgba(26, 31, 46, 0.1); display: none;">' +
                '<!-- Los requisitos se insertan dinámicamente -->' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label for="mandatoryNewPassword">Nueva Contraseña</label>' +
                '<input type="password" id="mandatoryNewPassword" required placeholder="Mínimo 8 caracteres">' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label for="mandatoryConfirmPassword">Confirmar Nueva Contraseña</label>' +
                '<input type="password" id="mandatoryConfirmPassword" required placeholder="Repite la contraseña">' +
            '</div>' +
            
            '<div id="changePasswordError" class="error" style="display: none; margin-bottom: 16px;"></div>' +
            
            '<button id="submitPasswordChangeBtn" class="btn" style="width: 100%;">Cambiar Contraseña y Continuar</button>' +
            
            '<p style="margin-top: 16px; font-size: 12px; color: var(--text-secondary); text-align: center;">' +
                'No podrás acceder al sistema hasta cambiar tu contraseña' +
            '</p>' +
    '</div>' +
  '</div>' +
  
  '<!-- MODAL PARA NUEVO/EDITAR USUARIO -->' +
  '<div id="usuarioModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;">' +
      '<div style="background: white; border-radius: 8px; padding: 32px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;">' +
          '<h3 id="usuarioModalTitle" style="margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;">Nuevo Usuario</h3>' +
          
          '<form id="usuarioForm">' +
              '<div class="grid-two" style="gap: 16px; margin-bottom: 16px;">' +
                  '<div class="form-group">' +
                      '<label for="modalUsuario">Usuario *</label>' +
                      '<input type="text" id="modalUsuario" required placeholder="Nombre de usuario">' +
                  '</div>' +
                  '<div class="form-group">' +
                      '<label for="modalEmail">Email *</label>' +
                      '<input type="email" id="modalEmail" required placeholder="email@empresa.com">' +
                  '</div>' +
              '</div>' +
              
              '<div class="grid-two" style="gap: 16px; margin-bottom: 16px;">' +
                  '<div class="form-group">' +
                      '<label for="modalPassword">Contraseña</label>' +
                      '<input type="password" id="modalPassword" placeholder="Dejar vacío para mantener actual">' +
                  '</div>' +
                  '<div class="form-group">' +
                      '<label for="modalRol">Rol *</label>' +
                      '<select id="modalRol" required>' +
                          '<option value="">Seleccionar rol...</option>' +
                          '<option value="operador">Operador</option>' +
                          '<option value="supervisor">Supervisor</option>' +
                          '<option value="admin">Admin</option>' +
                      '</select>' +
                  '</div>' +
              '</div>' +
              
              '<div class="form-group" style="margin-bottom: 16px;">' +
                  '<label for="modalEmpresa">Empresa</label>' +
                  '<input type="text" id="modalEmpresa" placeholder="Nombre de la empresa">' +
              '</div>' +
              
              '<div class="form-group" style="margin-bottom: 16px;">' +
                  '<label for="modalParquesAutorizados">Parques Autorizados</label>' +
                  '<input type="text" id="modalParquesAutorizados" placeholder="Parques separados por comas">' +
              '</div>' +
              
              '<div class="grid-two" style="gap: 16px; margin-bottom: 24px;">' +
                  '<div class="form-group">' +
                      '<label for="modalEstado">Estado *</label>' +
                      '<select id="modalEstado" required>' +
                          '<option value="Activo">Activo</option>' +
                          '<option value="Inactivo">Inactivo</option>' +
                      '</select>' +
                  '</div>' +
                  '<div class="form-group">' +
                      '<label style="display: flex; align-items: center; gap: 8px;">' +
                          '<input type="checkbox" id="modalPasswordTemporal">' +
                          '<span>Contraseña temporal (debe cambiarse)</span>' +
                      '</label>' +
                  '</div>' +
              '</div>' +
              
              '<div id="usuarioError" class="error" style="display: none; margin-bottom: 16px;"></div>' +
              
              '<div style="display: flex; gap: 12px; justify-content: flex-end;">' +
                  '<button type="button" id="cancelarUsuarioBtn" class="btn btn-secondary">Cancelar</button>' +
                  '<button type="submit" id="guardarUsuarioBtn" class="btn btn-primary">Guardar Usuario</button>' +
              '</div>' +
          '</form>' +
      '</div>' +
  '</div>' +
  
  '<!-- MODAL DE CONFIRMACIÓN PARA ELIMINAR USUARIO -->' +
  '<div id="confirmarEliminarUsuarioModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">' +
      '<div style="background: white; border-radius: 8px; padding: 32px; max-width: 400px; width: 90%; margin: 20px; text-align: center;">' +
          '<h3 style="margin-bottom: 16px; color: var(--danger-color); font-size: 20px; font-weight: 600;">Confirmar Eliminación</h3>' +
          '<p style="margin-bottom: 24px; color: var(--text-secondary);">¿Estás seguro de que deseas eliminar este usuario?</p>' +
          '<p id="usuarioEliminarInfo" style="margin-bottom: 24px; font-weight: 500; color: var(--text-primary);"></p>' +
          '<div style="display: flex; gap: 12px; justify-content: center;">' +
              '<button id="cancelarEliminarUsuarioBtn" class="btn btn-secondary">Cancelar</button>' +
              '<button id="confirmarEliminarUsuarioBtn" class="btn btn-danger">Eliminar Usuario</button>' +
          '</div>' +
      '</div>' +
  '</div>' +
  
  '<script>' + getWebAppScript() + '</script>' +
'</body>' +
'</html>';
}

export default getWebApp;
