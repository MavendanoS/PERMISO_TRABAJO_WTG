/**
 * Returns the CSS styles for the PT Worker web app.
 *
 * Note: This module currently contains a placeholder. Move the original
 * styles from worker.js into this function to maintain existing behavior.
 */

export function getStyles() {
  return `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    :root {
        --primary-color: #1a1f2e;
        --secondary-color: #2c3e50;
        --accent-color: #3498db;
        --success-color: #27ae60;
        --warning-color: #f39c12;
        --danger-color: #e74c3c;
        --text-primary: #2c3e50;
        --text-secondary: #7f8c8d;
        --text-light: #95a5a6;
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --bg-tertiary: #ecf0f1;
        --border-color: #dfe6e9;
        --shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
        --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
        --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
        --radius-sm: 4px;
        --radius-md: 6px;
        --radius-lg: 8px;
    }
    
    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        line-height: 1.6;
    }
    
    .container {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .login-container {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 48px;
        max-width: 420px;
        margin: 0 auto;
        border-top: 4px solid var(--primary-color);
    }
    
    .app-container {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: 0;
        display: none;
        overflow: hidden;
    }
    
    .logo {
        text-align: center;
        margin-bottom: 36px;
    }
    
    .logo h1 {
        color: var(--primary-color);
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
    }
    
    .logo p {
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 400;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .form-group input, 
    .form-group select, 
    .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 14px;
        transition: all 0.2s ease;
        background: var(--bg-primary);
        color: var(--text-primary);
    }
    
    .form-group input:focus, 
    .form-group select:focus, 
    .form-group textarea:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
    }
    
    .btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .btn:hover:not(:disabled) {
        background: var(--secondary-color);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }
    
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-secondary {
        background: var(--secondary-color);
    }
    
    .btn-secondary:hover:not(:disabled) {
        background: var(--primary-color);
    }
    
    .btn-danger {
        background: var(--danger-color);
    }
    
    .btn-danger:hover:not(:disabled) {
        background: #c0392b;
    }
    
    .btn-warning {
        background: var(--warning-color);
        color: white;
    }
    
    .btn-warning:hover:not(:disabled) {
        background: #d68910;
    }
    
    .btn-small {
        padding: 8px 16px;
        font-size: 12px;
        width: auto;
    }
    
    .header {
        background: var(--primary-color);
        color: white;
        padding: 24px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header h1 {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 4px;
    }
    
    .header p {
        font-size: 13px;
        opacity: 0.9;
    }
    
    .tabs {
        background: var(--bg-secondary);
        padding: 0;
        display: flex;
        border-bottom: 1px solid var(--border-color);
    }
    
    .tab {
        padding: 16px 24px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        font-size: 14px;
        color: var(--text-secondary);
    }
    
    .tab:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    
    .tab.active {
        background: var(--bg-primary);
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        font-weight: 600;
    }
    
    .tab-content {
        display: none;
        padding: 32px;
        background: var(--bg-primary);
    }
    
    .tab-content.active {
        display: block;
    }
    
    .card {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
    }
    
    .card h3 {
        color: var(--primary-color);
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--bg-secondary);
    }
    
    .grid-three {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
    }
    
    .error {
        background: rgba(231, 76, 60, 0.1);
        color: var(--danger-color);
        padding: 16px 20px;
        border-radius: var(--radius-md);
        margin-bottom: 20px;
        border: 1px solid rgba(231, 76, 60, 0.2);
        font-size: 14px;
    }
    
    .success {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        padding: 16px 20px;
        border-radius: var(--radius-md);
        margin-bottom: 20px;
        border: 1px solid rgba(39, 174, 96, 0.2);
        font-size: 14px;
    }
    
    .loading {
        text-align: center;
        padding: 48px 24px;
        color: var(--text-secondary);
        font-style: italic;
        font-size: 14px;
    }
    
    .status-indicator {
        padding: 8px 16px;
        border-radius: var(--radius-md);
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-online {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(39, 174, 96, 0.2);
    }
    
    .status-offline {
        background: rgba(231, 76, 60, 0.1);
        color: var(--danger-color);
        border: 1px solid rgba(231, 76, 60, 0.2);
    }
    
    .checkbox-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px;
        background: var(--bg-secondary);
    }
    
    .checkbox-item {
        display: flex;
        align-items: center;
        padding: 8px;
        margin-bottom: 4px;
        border-radius: var(--radius-sm);
        transition: background 0.2s ease;
    }
    
    .checkbox-item:hover {
        background: var(--bg-tertiary);
    }
    
    .checkbox-item input[type="checkbox"] {
        margin-right: 12px;
        width: 16px;
        height: 16px;
        cursor: pointer;
    }
    
    .checkbox-item label {
        cursor: pointer;
        font-size: 14px;
        color: var(--text-primary);
        flex: 1;
    }
    
    .selector-dual {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 20px;
        align-items: center;
    }
    
    .selector-list {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        height: 300px;
        overflow-y: auto;
        background: var(--bg-secondary);
    }
    
    .selector-item {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
    }
    
    .selector-item:hover {
        background: var(--bg-tertiary);
    }
    
    .selector-item.selected {
        background: rgba(52, 152, 219, 0.1);
        border-left: 3px solid var(--accent-color);
    }
    
    .selector-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .search-box {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
    }
    
    .search-input {
        flex: 1;
        padding: 10px 16px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 14px;
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .search-box {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr auto;
        gap: 12px;
        align-items: center;
    }
    
    .search-box input[type="date"] {
        color: var(--text-primary);
    }
    
    .data-table {
        width: 100%;
        overflow-x: auto;
    }
    
    .data-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .data-table th {
        background: var(--bg-secondary);
        padding: 12px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
    }
    
    .data-table td {
        padding: 12px;
        border-bottom: 1px solid var(--border-color);
        font-size: 14px;
    }
    
    .data-table tr:hover {
        background: var(--bg-secondary);
    }
    
    .permiso-card-container {
        perspective: 1000px;
        margin-bottom: 24px;
        position: relative;
        width: 100%;
    }
    
    .permiso-card {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 300px;
        transition: all 0.6s ease;
        transform-style: preserve-3d;
        z-index: 1;
    }
    
    .permiso-card.flipped {
        transform: rotateY(180deg);
        z-index: 10;
        margin-bottom: 40px;
    }
    
    .permiso-card-container.flipped-container {
        z-index: 10;
        margin-bottom: 60px;
    }
    
    .permiso-card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
    }
    
    .permiso-card-front,
    .permiso-card-back {
        position: absolute;
        width: 100%;
        min-height: 300px;
        backface-visibility: hidden;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 20px;
        box-shadow: var(--shadow-sm);
    }
    
    .permiso-card-back {
        transform: rotateY(180deg);
        overflow-y: auto;
        max-height: 600px;
        box-shadow: var(--shadow-lg);
        border: 2px solid var(--accent-color);
    }
    
    .btn-flip {
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
    }
    
    .btn-flip:hover {
        background: var(--primary-color);
        transform: translateX(-2px);
    }
    
    .btn-info {
        background: var(--accent-color);
        color: white;
    }
    
    .btn-info:hover {
        background: var(--primary-color);
    }
    
    /* Menú desplegable de exportación */
    .export-dropdown {
        display: inline-block;
        position: relative;
    }
    
    .dropdown-toggle:after {
        content: '';
        display: none;
    }
    
    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        min-width: 160px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        margin-top: 2px;
    }
    
    .dropdown-menu a {
        display: block;
        padding: 8px 12px;
        text-decoration: none;
        color: var(--text-primary);
        font-size: 12px;
        transition: all 0.2s ease;
        border-bottom: 1px solid var(--border-color);
    }
    
    .dropdown-menu a:last-child {
        border-bottom: none;
        border-radius: 0 0 var(--radius-md) var(--radius-md);
    }
    
    .dropdown-menu a:first-child {
        border-radius: var(--radius-md) var(--radius-md) 0 0;
    }
    
    .dropdown-menu a:hover {
        background: var(--bg-secondary);
        color: var(--primary-color);
        transform: translateX(2px);
    }
    
    /* Pestañas dentro de las cards */
    .card-tabs {
        display: flex;
        border-bottom: 2px solid var(--border-color);
        margin: 16px 0;
        gap: 2px;
    }
    
    .card-tab {
        flex: 1;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border: none;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.2s ease;
    }
    
    .card-tab:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    
    .card-tab.active {
        background: var(--accent-color);
        color: white;
        border-bottom: 2px solid var(--accent-color);
    }
    
    .card-tab-content {
        min-height: 200px;
        max-height: 350px;
        overflow-y: auto;
        padding-bottom: 20px;
    }
    
    .tab-pane {
        animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes pulseRed {
        0% { 
            box-shadow: 0 3px 10px rgba(211, 47, 47, 0.15), 0 0 0 0 rgba(211, 47, 47, 0.4); 
        }
        100% { 
            box-shadow: 0 3px 10px rgba(211, 47, 47, 0.25), 0 0 0 6px rgba(211, 47, 47, 0); 
        }
    }
    
    /* Layout para tiempos - 2 columnas */
    .tiempos-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .tiempos-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .tiempo-item, .tiempo-item-empty {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: var(--radius-md);
        transition: all 0.2s ease;
    }
    
    .tiempo-item.trabajo {
        background: #e8f5e8;
        border-left: 4px solid var(--success-color);
    }
    
    .tiempo-item.turbina {
        background: #e3f2fd;
        border-left: 4px solid var(--accent-color);
    }
    
    .tiempo-item-empty {
        background: var(--bg-tertiary);
        border-left: 4px solid var(--border-color);
        opacity: 0.7;
    }
    
    .tiempo-icon, .tiempo-icon-empty {
        font-size: 16px;
        margin-right: 12px;
        width: 24px;
        text-align: center;
    }
    
    .tiempo-icon-empty {
        opacity: 0.5;
    }
    
    .tiempo-content {
        flex: 1;
    }
    
    .tiempo-label {
        font-size: 10px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
        font-weight: 600;
    }
    
    .tiempo-value {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 12px;
    }
    
    .tiempo-value-empty {
        font-weight: 400;
        color: var(--text-secondary);
        font-size: 11px;
        font-style: italic;
    }
    
    /* Tabla de materiales */
    .materials-table-container {
        max-height: 300px !important;
        overflow-y: scroll !important;
        overflow-x: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: white;
        scrollbar-width: thin;
        scrollbar-color: var(--accent-color) var(--bg-secondary);
    }
    
    .materials-table-container::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    
    .materials-table-container::-webkit-scrollbar-track {
        background: var(--bg-secondary);
        border-radius: 4px;
    }
    
    .materials-table-container::-webkit-scrollbar-thumb {
        background: var(--accent-color);
        border-radius: 4px;
    }
    
    .materials-table-container::-webkit-scrollbar-thumb:hover {
        background: var(--primary-color);
    }
    
    .materials-table {
        width: 100%;
        min-width: 500px;
        border-collapse: collapse;
        font-size: 12px;
        table-layout: fixed;
    }
    
    .materials-table thead {
        background: var(--primary-color);
        color: white;
        position: sticky;
        top: 0;
        z-index: 2;
    }
    
    .materials-table th {
        padding: 10px 6px;
        text-align: center;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        border-right: 1px solid rgba(255,255,255,0.2);
        white-space: nowrap;
        overflow: hidden;
    }
    
    .materials-table th:last-child {
        border-right: none;
    }
    
    .materials-table td {
        padding: 8px 6px;
        border-bottom: 1px solid var(--border-color);
        border-right: 1px solid var(--border-color);
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .materials-table td:first-child {
        text-align: center;
        font-weight: 600;
    }
    
    .materials-table td:nth-child(2) {
        text-align: left;
        white-space: normal;
        word-wrap: break-word;
        max-width: 150px;
    }
    
    .materials-table td:last-child {
        border-right: none;
    }
    
    .materials-table tbody tr:hover {
        background: var(--bg-secondary) !important;
    }
    
    .materials-table tbody tr:nth-child(even) {
        background: var(--bg-tertiary);
    }
    
    /* Layout para cierre - 2 columnas */
    .cierre-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        height: 100%;
    }
    
    .cierre-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .cierre-item {
        display: flex;
        align-items: flex-start;
        padding: 12px;
        border-radius: var(--radius-md);
        background: var(--bg-secondary);
    }
    
    .cierre-item.responsable {
        border-left: 4px solid var(--accent-color);
    }
    
    .cierre-item.fecha {
        border-left: 4px solid var(--success-color);
    }
    
    .cierre-item.observaciones {
        border-left: 4px solid var(--warning-color);
        height: fit-content;
        min-height: 120px;
    }
    
    .cierre-icon {
        font-size: 16px;
        margin-right: 12px;
        width: 24px;
        text-align: center;
        margin-top: 2px;
    }
    
    .cierre-content {
        flex: 1;
    }
    
    .cierre-content-full {
        width: 100%;
    }
    
    .cierre-label {
        font-size: 10px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
        font-weight: 600;
    }
    
    .cierre-value {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 12px;
    }
    
    .cierre-observaciones {
        background: white;
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        font-size: 11px;
        line-height: 1.4;
        color: var(--text-primary);
        min-height: 80px;
        max-height: 150px;
        overflow-y: auto;
    }
    
    /* Estilos para aprobación de cierre */
    .cierre-item.aprobacion {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 1px solid #dee2e6;
    }
    
    .cierre-value.aprobado {
        color: var(--success-color);
        font-weight: 600;
    }
    
    .cierre-value.pendiente {
        color: var(--warning-color);
        font-weight: 600;
    }
    
    .cierre-sub-info {
        font-size: 10px;
        color: var(--text-secondary);
        margin-top: 2px;
    }
    
    .cierre-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }
    
    .permiso-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 16px;
    }
    
    .permiso-numero {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-color);
    }
    
    .permiso-estado {
        padding: 4px 12px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .estado-creado {
        background: rgba(241, 196, 15, 0.1);
        color: var(--warning-color);
        border: 1px solid rgba(241, 196, 15, 0.2);
    }
    
    .estado-activo {
        background: rgba(39, 174, 96, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(39, 174, 96, 0.2);
    }
    
    .estado-cerrado_pendiente_aprobacion {
        background: rgba(230, 126, 34, 0.1);
        color: #e67e22;
        border: 1px solid rgba(230, 126, 34, 0.3);
        font-weight: 500;
    }
    
    .estado-cerrado {
        background: rgba(149, 165, 166, 0.1);
        color: var(--text-secondary);
        border: 1px solid rgba(149, 165, 166, 0.2);
    }
    
    .estado-cierre_rechazado {
        background: rgba(231, 76, 60, 0.1);
        color: var(--danger-color);
        border: 1px solid rgba(231, 76, 60, 0.2);
        font-weight: 600;
    }
    
    .permiso-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
        font-size: 14px;
    }
    
    .permiso-info-item {
        display: flex;
        flex-direction: column;
    }
    
    .permiso-info-label {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .permiso-info-value {
        color: var(--text-primary);
        font-weight: 500;
    }
    
    .permiso-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
    }
    
    .permiso-info-value ul {
        list-style: none;
        padding: 0;
        margin: 4px 0;
    }
    
    .permiso-info-value li {
        margin: 4px 0;
        padding-left: 16px;
        position: relative;
    }
    
    .permiso-info-value li:before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--accent-color);
    }
    
    .estado-pendiente {
        background: rgba(243, 156, 18, 0.1);
        color: var(--warning-color);
        border: 1px solid rgba(243, 156, 18, 0.2);
    }
    
    .input-others {
        display: none;
        margin-top: 12px;
    }
    
    @media (max-width: 768px) {
        .container {
            padding: 8px;
            max-width: 100%;
        }
        
        .login-container {
            padding: 24px 16px;
            margin: 10px;
            max-width: calc(100% - 20px);
        }
        
        .app-container {
            margin: 0;
            border-radius: 0;
            min-height: 100vh;
        }
        
        .header {
            padding: 16px 20px;
            flex-direction: column;
            gap: 12px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 18px;
        }
        
        .header p {
            font-size: 12px;
        }
        
        .tabs {
            overflow-x: auto;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
        }
        
        .tab {
            white-space: nowrap;
            min-width: 120px;
            padding: 12px 16px;
            font-size: 13px;
        }
        
        .tab-content {
            padding: 16px 12px;
        }
        
        .grid-three {
            grid-template-columns: 1fr;
            gap: 16px;
        }
        
        .selector-dual {
            grid-template-columns: 1fr;
            gap: 16px;
        }
        
        .selector-controls {
            flex-direction: row;
            justify-content: center;
            gap: 12px;
        }
        
        .card {
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .card h3 {
            font-size: 14px;
            margin-bottom: 16px;
        }
        
        /* Cards de permisos - mejorar separación y responsive */
        .permiso-card-container {
            margin-bottom: 32px;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 16px;
        }
        
        .permiso-card-container:last-child {
            border-bottom: none;
        }
        
        .permiso-card {
            min-height: auto;
            height: auto;
            transform: none !important;
            transform-style: flat;
        }
        
        .permiso-card-front,
        .permiso-card-back {
            min-height: 280px;
            height: auto;
            padding: 16px;
            position: relative;
            transform: none !important;
        }
        
        .permiso-card-back {
            position: relative;
            transform: none !important;
            backface-visibility: visible;
        }
        
        .permiso-card.flipped .permiso-card-front {
            display: none;
        }
        
        .permiso-card:not(.flipped) .permiso-card-back {
            display: none;
        }
        
        .permiso-card.flipped {
            margin-bottom: 32px;
        }
        
        .permiso-card-container.flipped-container {
            margin-bottom: 48px;
        }
        
        .permiso-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }
        
        .permiso-numero {
            font-size: 16px;
        }
        
        .permiso-info {
            grid-template-columns: 1fr;
            gap: 8px;
            font-size: 13px;
        }
        
        .permiso-actions {
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 12px;
        }
        
        .btn-small {
            padding: 6px 12px;
            font-size: 11px;
        }
        
        /* Formularios en móvil */
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            font-size: 16px; /* Previene zoom en iOS */
            padding: 12px;
        }
        
        .form-group label {
            font-size: 12px;
            margin-bottom: 6px;
        }
        
        /* Tablas responsivas */
        .data-table {
            font-size: 12px;
        }
        
        .data-table th,
        .data-table td {
            padding: 8px 6px;
        }
        
        .materials-table-container {
            max-height: 250px;
        }
        
        .materials-table {
            font-size: 11px;
        }
        
        .materials-table th,
        .materials-table td {
            padding: 6px 4px;
        }
        
        /* Search box responsive */
        .search-box {
            grid-template-columns: 1fr;
            gap: 12px;
        }
        
        .search-box input[type=\"date\"] {
            font-size: 16px; /* Previene zoom en iOS */
        }
        
        .search-input {
            font-size: 16px; /* Previene zoom en iOS */
        }
        
        /* Tiempos y cierre grids */
        .tiempos-grid,
        .cierre-grid {
            grid-template-columns: 1fr;
            gap: 12px;
        }
        
        /* Modal responsivo */
        .modal {
            margin: 10px;
            max-width: calc(100% - 20px);
            max-height: calc(100vh - 20px);
            overflow-y: auto;
        }
        
        /* Export modal responsive */
        #exportModal > div {
            max-width: calc(100% - 20px);
            margin: 10px;
            padding: 20px 16px;
        }
        
        #exportModal h3 {
            font-size: 20px;
        }
        
        #exportModal .btn {
            padding: 12px;
            font-size: 14px;
        }
    }
    
    /* Pantallas muy pequeñas (teléfonos en vertical) */
    @media (max-width: 480px) {
        .container {
            padding: 4px;
        }
        
        .login-container {
            padding: 20px 12px;
            margin: 5px;
            max-width: calc(100% - 10px);
        }
        
        .header {
            padding: 12px 16px;
        }
        
        .header h1 {
            font-size: 16px;
        }
        
        .tab {
            min-width: 100px;
            padding: 10px 12px;
            font-size: 12px;
        }
        
        .tab-content {
            padding: 12px 8px;
        }
        
        .card {
            padding: 12px;
            margin-bottom: 12px;
        }
        
        .permiso-card-container {
            margin-bottom: 28px;
            padding-bottom: 12px;
        }
        
        .permiso-card-front,
        .permiso-card-back {
            padding: 12px;
            min-height: 250px;
            height: auto;
            position: relative;
            transform: none !important;
        }
        
        .permiso-card-back {
            position: relative;
            transform: none !important;
        }
        
        .permiso-numero {
            font-size: 14px;
        }
        
        .permiso-info {
            font-size: 12px;
        }
        
        .btn {
            padding: 10px 16px;
            font-size: 12px;
        }
        
        .btn-small {
            padding: 5px 10px;
            font-size: 10px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            padding: 10px;
        }
        
        .data-table {
            font-size: 11px;
        }
        
        .materials-table {
            font-size: 10px;
        }
        
        #exportModal > div {
            padding: 16px 12px;
        }
        
        #exportModal h3 {
            font-size: 18px;
        }
    }
    
    /* Estilos para administración de usuarios */
    .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
    }
    
    .badge-primary {
        background: var(--primary-color);
        color: white;
    }
    
    .badge-secondary {
        background: var(--text-secondary);
        color: white;
    }
    
    .badge-success {
        background: var(--success-color);
        color: white;
    }
    
    .badge-warning {
        background: var(--warning-color);
        color: white;
    }
    
    .badge-danger {
        background: var(--danger-color);
        color: white;
    }
    
    .badge-info {
        background: var(--accent-color);
        color: white;
    }
    
    .table-responsive {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .btn-small {
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
        min-width: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        cursor: pointer;
        border: none;
    }
    
    .btn-danger {
        background: var(--danger-color);
        color: white;
    }
    
    .btn-danger:hover {
        background: #c0392b;
        transform: translateY(-1px);
    }
    
    .grid-two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .no-data {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
        font-style: italic;
    }
    
    .error {
        background: #fef5e7;
        color: var(--danger-color);
        padding: 12px 16px;
        border-radius: 6px;
        border: 1px solid #f5c6cb;
        margin-bottom: 16px;
        font-size: 14px;
    }
    
    .success {
        background: #d4edda;
        color: var(--success-color);
        padding: 12px 16px;
        border-radius: 6px;
        border: 1px solid #c3e6cb;
        margin-bottom: 16px;
        font-size: 14px;
    }

    @media print {
        body {
            background: white;
        }
        
        .header, .tabs, .btn, .permiso-actions {
            display: none !important;
        }
        
        .container {
            max-width: 100%;
        }
    }
  `;
}

export default getStyles;
