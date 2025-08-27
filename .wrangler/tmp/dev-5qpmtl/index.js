var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-0RUOiZ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-0RUOiZ/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/core/webapp/styles.js
function getStyles() {
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
    
    /* Men\xFA desplegable de exportaci\xF3n */
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
    
    /* Pesta\xF1as dentro de las cards */
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
    
    /* Estilos para aprobaci\xF3n de cierre */
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
        content: "\u2022";
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
        
        /* Cards de permisos - mejorar separaci\xF3n y responsive */
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
        
        /* Formularios en m\xF3vil */
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
        
        .search-box input[type="date"] {
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
    
    /* Pantallas muy peque\xF1as (tel\xE9fonos en vertical) */
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
    
    /* Estilos para administraci\xF3n de usuarios */
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
__name(getStyles, "getStyles");
var styles_default = getStyles;

// src/core/webapp/script.js
function getWebAppScript() {
  return `
    // ========================================================================
    // CONFIGURACI\xD3N Y VARIABLES GLOBALES
    // ========================================================================
    
    // PT Wind v18.0 - D1 Database Edition
    
    const API_BASE = window.location.origin + '/api';
    let currentUser = null;
    let authToken = null;
    let sessionId = null;
    
    // Datos cargados
    let parquesData = [];
    let personalData = [];
    let personalByParque = {};
    let supervisoresData = [];
    let actividadesData = [];
    let matrizRiesgosData = [];
    let aerogeneradoresData = [];
    let permisosData = [];
    
    // Estado del formulario
    let personalSeleccionado = [];
    let actividadesSeleccionadas = [];
    let matrizRiesgosSeleccionada = [];
    let materialesParaCierre = [];
    
    // ========================================================================
    // FUNCIONES DE TIEMPO - ZONA HORARIA CHILE
    // ========================================================================
    
    function getChileDateTime(offsetMinutes = 0) {
      const now = new Date();
      
      // Determinar si estamos en horario de verano chileno (DST)
      const year = now.getUTCFullYear();
      
      // Segundo domingo de septiembre (inicio DST)
      const septemberSecondSunday = getSecondSunday(year, 8);
      // Primer domingo de abril (fin DST)
      const aprilFirstSunday = getFirstSunday(year, 3);
      
      const currentTime = now.getTime();
      const isDST = currentTime >= septemberSecondSunday.getTime() || currentTime < aprilFirstSunday.getTime();
      
      // UTC-3 durante DST, UTC-4 durante horario est\xE1ndar
      const chileOffsetMinutes = isDST ? -3 * 60 : -4 * 60;
      
      return new Date(now.getTime() + (chileOffsetMinutes + offsetMinutes) * 60000);
    }
    
    function getSecondSunday(year, month) {
      const date = new Date(Date.UTC(year, month, 1));
      const firstSunday = 7 - date.getUTCDay();
      return new Date(Date.UTC(year, month, firstSunday + 7));
    }
    
    function getFirstSunday(year, month) {
      const date = new Date(Date.UTC(year, month, 1));
      const firstSunday = 7 - date.getUTCDay();
      return new Date(Date.UTC(year, month, firstSunday === 7 ? 7 : firstSunday));
    }
    
    function formatChileDateTime(date) {
      const pad = (n) => String(n).padStart(2, '0');
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
             pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }
    
    // ========================================================================
    // FUNCIONES DE SEGURIDAD
    // ========================================================================
    
    // Funci\xF3n para validar la fortaleza de contrase\xF1as
    function validatePasswordStrength(password) {
      const minLength = 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
      
      if (!password || password.length < minLength) {
        return { 
          valid: false, 
          message: 'La contrase\xF1a debe tener al menos 8 caracteres' 
        };
      }
      
      if (!hasUppercase) {
        return { 
          valid: false, 
          message: 'La contrase\xF1a debe contener al menos una letra may\xFAscula' 
        };
      }
      
      if (!hasLowercase) {
        return { 
          valid: false, 
          message: 'La contrase\xF1a debe contener al menos una letra min\xFAscula' 
        };
      }
      
      if (!hasNumbers) {
        return { 
          valid: false, 
          message: 'La contrase\xF1a debe contener al menos un n\xFAmero' 
        };
      }
      
      if (!hasSpecialChar) {
        return { 
          valid: false, 
          message: 'La contrase\xF1a debe contener al menos un car\xE1cter especial' 
        };
      }
      
      return { valid: true };
    }
    
    class ClientSecurity {
      static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/onw+s*=/gi, '')
          .trim();
      }
      
      static encodeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      }
      
      static async makeSecureRequest(endpoint, options = {}) {
        const defaultOptions = {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        };
        
        if (authToken) {
          defaultOptions.headers['Authorization'] = 'Bearer ' + authToken;
        }
        
        if (sessionId) {
          defaultOptions.headers['X-Session-Id'] = sessionId;
        }
        
        try {
          const response = await fetch(API_BASE + endpoint, {
            ...defaultOptions,
            ...options
          });
          
          if (response.status === 401) {
            handleLogout();
            throw new Error('Sesi\xF3n expirada');
          }
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Error en la solicitud');
          }
          
          return data;
        } catch (error) {
          console.error('Request error:', error);
          throw error;
        }
      }
    }
    
    // ========================================================================
    // INICIALIZACI\xD3N (sin cambios)
    // ========================================================================
    
    document.addEventListener('DOMContentLoaded', async function() {
        // Inicializando aplicaci\xF3n...
        
        const storedToken = sessionStorage.getItem('authToken');
        const storedSessionId = sessionStorage.getItem('sessionId');  // \u2190 AGREGAR
        if (storedSessionId) sessionId = storedSessionId;  // \u2190 AGREGAR
        if (storedToken) {
            authToken = storedToken;
            await verifyAndLoadApp();
        } else {
            showLoginScreen();
        }
        
        setupEventListeners();
        checkConnectionStatus();
    });
    
    // ========================================================================
    // MANEJO DE AUTENTICACI\xD3N (sin cambios)
    // ========================================================================
    
    function setupEventListeners() {
        // helper seguro para no romper si falta un elemento
        const on = (id, ev, fn, opts) => { 
            const el = document.getElementById(id); 
            if (el) el.addEventListener(ev, fn, opts); 
        };
        
        // Login
        on('loginForm', 'submit', handleLogin);
        on('logoutBtn', 'click', handleLogout);
        
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });
        
        // Formulario de permiso
        on('permisoForm', 'submit', handleCreatePermiso);
        
        // Selectores
        on('planta', 'change', handlePlantaChange);
        on('tipoMantenimiento', 'change', handleTipoMantenimientoChange);
        
        // Personal
        on('addPersonalBtn', 'click', addSelectedPersonal);
        on('removePersonalBtn', 'click', removeSelectedPersonal);
        
        // Botones
        on('generateRegisterBtn', 'click', generateRegister);
        on('refreshPermisosBtn', 'click', loadPermisos);
        on('clearSearchBtn', 'click', clearSearch);
        const search = document.getElementById('searchPermiso'); 
        if (search) search.addEventListener('input', filterPermisos);
        const filterEstado = document.getElementById('filterEstado');
        if (filterEstado) filterEstado.addEventListener('change', filterPermisos);
        const fechaDesde = document.getElementById('fechaDesde');
        if (fechaDesde) fechaDesde.addEventListener('change', filterPermisos);
        const fechaHasta = document.getElementById('fechaHasta');
        if (fechaHasta) fechaHasta.addEventListener('change', filterPermisos);
        
        // Modal de cierre
        on('cancelarCierreBtn', 'click', closeCerrarModal);
        on('confirmarCierreBtn', 'click', handleConfirmarCierre);
        on('addMaterialBtn', 'click', addMaterial);
        
        // Administraci\xF3n de usuarios
        on('btnNuevoUsuario', 'click', openNuevoUsuarioModal);
        on('btnRefreshUsuarios', 'click', loadUsuarios);
        on('usuarioForm', 'submit', handleGuardarUsuario);
        on('cancelarUsuarioBtn', 'click', closeUsuarioModal);
        on('cancelarEliminarUsuarioBtn', 'click', closeConfirmarEliminarModal);
        on('confirmarEliminarUsuarioBtn', 'click', handleEliminarUsuario);
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const usuario = ClientSecurity.sanitizeInput(document.getElementById('usuario').value);
        const password = document.getElementById('password').value;
        
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('loginError');
        
        errorDiv.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Iniciando sesi\xF3n...';
        
        try {
            const response = await fetch(API_BASE + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                authToken = result.token;
                sessionId = result.sessionId;
                currentUser = result.user;
                
                sessionStorage.setItem('authToken', authToken);
                if (sessionId) {
                    sessionStorage.setItem('sessionId', sessionId);
                }
                if (result.requirePasswordChange) {
                    showChangePasswordModal(result.changeReason);
                } else {
                    await loadAppData();
                    showApp();
                    // Iniciar timer de inactividad despu\xE9s del login exitoso
                    resetInactivityTimer();
                }
            } else {
                showLoginError(result.message || 'Error al iniciar sesi\xF3n');
            }
        } catch (error) {
            showLoginError('Error de conexi\xF3n: ' + error.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesi\xF3n';
        }
    }

    // Nueva funci\xF3n para mostrar modal de cambio obligatorio
    function showChangePasswordModal(reason) {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'flex';
        
        // Mostrar el motivo del cambio requerido
        const reasonDiv = document.getElementById('passwordChangeReason');
        if (reasonDiv) {
            reasonDiv.textContent = reason || 'Por razones de seguridad, debe cambiar su contrase\xF1a.';
            reasonDiv.style.display = 'block';
        }
        
        // Mostrar requisitos de contrase\xF1a
        const requirementsDiv = document.getElementById('passwordRequirements');
        if (requirementsDiv) {
            requirementsDiv.innerHTML = '<strong>La nueva contrase\xF1a debe cumplir con:</strong>' +
                '<ul style="text-align: left; margin: 10px 0;">' +
                    '<li>M\xEDnimo 8 caracteres</li>' +
                    '<li>Al menos una letra may\xFAscula</li>' +
                    '<li>Al menos una letra min\xFAscula</li>' +
                    '<li>Al menos un n\xFAmero</li>' +
                    '<li>Al menos un car\xE1cter especial (!@#$%^&*()_+-=[]{};\\':\\"|,.<>/?)</li>' +
                '</ul>';
            requirementsDiv.style.display = 'block';
        }
        
        document.getElementById('submitPasswordChangeBtn')
            .addEventListener('click', handleMandatoryPasswordChange, { once: true });
    }
    
    async function handleMandatoryPasswordChange() {
    const newPassword = document.getElementById('mandatoryNewPassword').value;
    const confirmPassword = document.getElementById('mandatoryConfirmPassword').value;
    const errorDiv = document.getElementById('changePasswordError');
    const submitBtn = document.getElementById('submitPasswordChangeBtn');
    
    // Validaciones
    if (!newPassword || !confirmPassword) {
        errorDiv.textContent = 'Ambos campos son requeridos';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Las contrase\xF1as no coinciden';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validaci\xF3n completa de contrase\xF1a segura
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
        errorDiv.textContent = passwordValidation.message;
        errorDiv.style.display = 'block';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cambiando contrase\xF1a...';
    
    try {
        const response = await fetch(API_BASE + '/change-password', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ newPassword })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Ocultar modal
            document.getElementById('changePasswordModal').style.display = 'none';
            
            // Cargar la aplicaci\xF3n
            await loadAppData();
            showApp();
            
            // Mostrar mensaje de \xE9xito
            alert('Contrase\xF1a actualizada exitosamente');
        } else {
            errorDiv.textContent = result.error || 'Error al cambiar la contrase\xF1a';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexi\xF3n';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cambiar Contrase\xF1a y Continuar';
    }
    }
    async function verifyAndLoadApp() {
        try {
            const response = await ClientSecurity.makeSecureRequest('/health');
            if (response.status === 'OK') {
                await loadAppData();
                showApp();
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            handleLogout();
        }
    }
    
    // Auto-logout por inactividad (30 minutos)
    let inactivityTimer = null;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos en milisegundos
    
    function resetInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        
        // Solo configurar timer si hay usuario logueado
        if (authToken) {
            inactivityTimer = setTimeout(() => {
                alert('Sesi\xF3n expirada por inactividad. Debe iniciar sesi\xF3n nuevamente.');
                handleLogout();
            }, INACTIVITY_TIMEOUT);
        }
    }
    
    function handleLogout() {
        authToken = null;
        sessionId = null;
        currentUser = null;
        sessionStorage.clear();
        
        // Limpiar timer de inactividad
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
        
        showLoginScreen();
    }
    
    function showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('appScreen').style.display = 'none';
    }
    
    function showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        
        if (currentUser) {
            document.getElementById('userDisplay').textContent = 
                ClientSecurity.encodeHTML(currentUser.usuario + ' (' + currentUser.rol + ')');
            
            if (currentUser.rol === 'ADMIN') {
                document.getElementById('tabDatos').style.display = 'block';
                document.getElementById('tabAdminUsuarios').style.display = 'block';
            }
        }
    }
    
    function showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    // ========================================================================
    // CARGA DE DATOS - ACTUALIZADO PARA D1
    // ========================================================================
    
    async function loadAppData() {
        // Cargando datos de la aplicaci\xF3n...
        
        try {
            const [parques, personal, actividades] = await Promise.all([
                ClientSecurity.makeSecureRequest('/parques'),
                ClientSecurity.makeSecureRequest('/personal'),
                ClientSecurity.makeSecureRequest('/actividades')
            ]);
            
            // Los datos ahora vienen directamente como arrays sin properties
            parquesData = parques.results || [];
            personalData = personal.results || [];
            actividadesData = actividades.results || [];
            // supervisoresData se cargar\xE1 cuando se seleccione una planta
            supervisoresData = [];
            
            populateParques();
            // populateSupervisores se llamar\xE1 cuando se seleccione una planta
            populateActividades();
            
            await loadPermisos();
            
            // Datos cargados exitosamente
        } catch (error) {
            console.error('Error cargando datos:', error);
            alert('Error al cargar los datos del sistema');
        }
    }
    
    function populateParques() {
        const select = document.getElementById('planta');
        select.innerHTML = '<option value="">Seleccionar planta...</option>';
        
        // Filtrar parques seg\xFAn los autorizados del usuario
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        parquesData.forEach(parque => {
            // Si es Enel, puede ver todos los parques
            // Si no, solo los parques autorizados
            if (esEnel || parquesAutorizados.includes(parque.nombre)) {
                const option = document.createElement('option');
                option.value = parque.nombre;
                option.textContent = parque.nombre;
                option.dataset.id = parque.id;
                option.dataset.codigo = parque.codigo || '';
                select.appendChild(option);
            }
        });
    }
    
    async function populateSupervisores(plantaNombre) {
        const supervisorParqueSelect = document.getElementById('supervisorParque');
        
        supervisorParqueSelect.innerHTML = '<option value="">Seleccionar supervisor Enel...</option>';
        
        if (!plantaNombre) {
            supervisoresData = [];
            return;
        }
        
        try {
            // Cargar supervisores filtrados por parque
            const response = await ClientSecurity.makeSecureRequest(
                '/supervisores?parque=' + encodeURIComponent(plantaNombre)
            );
            supervisoresData = response.results || [];
            
            if (supervisoresData.length === 0) {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No hay supervisores Enel asignados a este parque";
                option.disabled = true;
                supervisorParqueSelect.appendChild(option);
            } else {
                supervisoresData.forEach(supervisor => {
                    const option = document.createElement('option');
                    option.value = supervisor.nombre;
                    option.textContent = supervisor.nombre;
                    option.dataset.id = supervisor.id;
                    option.dataset.cargo = supervisor.cargo || '';
                    option.dataset.telefono = supervisor.telefono || '';
                    option.dataset.rut = supervisor.rut || '';
                    
                    supervisorParqueSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando supervisores:', error);
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Error al cargar supervisores";
            option.disabled = true;
            supervisorParqueSelect.appendChild(option);
        }
    }
    
    function populateActividades() {
        const container = document.getElementById('actividadesChecklist');
        container.innerHTML = '';
        
        actividadesData.forEach(actividad => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            item.innerHTML = \`
                <input type="checkbox" id="act_\${actividad.id}" value="\${actividad.nombre}" 
                       data-id="\${actividad.id}" data-tipo="\${actividad.tipo || 'RUTINARIA'}">
                <label for="act_\${actividad.id}">\${actividad.nombre}</label>
            \`;
            
            item.querySelector('input').addEventListener('change', handleActividadChange);
            container.appendChild(item);
        });
    }
    
    // ========================================================================
    // MANEJO DE FORMULARIO - ACTUALIZADO PARA D1
    // ========================================================================
    
    async function handlePlantaChange(e) {
        const plantaNombre = e.target.value;
        const plantaId = e.target.selectedOptions[0]?.dataset.id;
        const codigoParque = e.target.selectedOptions[0]?.dataset.codigo;
        
        const jefeFaenaSelect = document.getElementById('jefeFaena');  // \u2190 IMPORTANTE
        
        if (!plantaNombre) {
            document.getElementById('aerogenerador').innerHTML = '<option value="">Seleccionar aerogenerador...</option>';
            document.getElementById('personalDisponible').innerHTML = '<div class="loading">Seleccione una planta primero</div>';
            jefeFaenaSelect.innerHTML = '<option value="">Seleccionar jefe de faena...</option>';  // \u2190 IMPORTANTE
            document.getElementById('supervisorParque').innerHTML = '<option value="">Seleccionar supervisor Enel...</option>';
            supervisoresData = [];
            return;
        }
        
        // Cargar aerogeneradores
        await loadAerogeneradores(plantaNombre);
        
        // Cargar supervisores Enel del parque
        await populateSupervisores(plantaNombre);
        
        // Limpiar personal seleccionado al cambiar de planta
        personalSeleccionado = [];
        const personalSeleccionadoContainer = document.getElementById('personalSeleccionado');
        personalSeleccionadoContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
        
        // Cargar personal del parque
        await loadPersonalByParque(plantaNombre);
        
        // \u2B50 ESTA ES LA PARTE NUEVA QUE DEBES AGREGAR \u2B50
        // Poblar Jefe de Faena con el personal del parque
        jefeFaenaSelect.innerHTML = '<option value="">Seleccionar jefe de faena...</option>';
        
        if (personalByParque[plantaNombre] && personalByParque[plantaNombre].length > 0) {
            personalByParque[plantaNombre].forEach(persona => {
                const option = document.createElement('option');
                option.value = persona.nombre;
                option.textContent = \`\${persona.nombre} - \${persona.empresa || ''}\`;
                option.dataset.id = persona.id;
                option.dataset.empresa = persona.empresa || '';
                option.dataset.rol = persona.rol || '';
                jefeFaenaSelect.appendChild(option);
            });
        } else {
            // Si no hay personal en el parque, mostrar mensaje
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No hay personal asignado a este parque";
            option.disabled = true;
            jefeFaenaSelect.appendChild(option);
        }
    }
    
    async function loadAerogeneradores(plantaNombre) {
        try {
            const response = await ClientSecurity.makeSecureRequest(\`/aerogeneradores?parque=\${encodeURIComponent(plantaNombre)}\`);
            aerogeneradoresData = response.results || [];
            
            const select = document.getElementById('aerogenerador');
            select.innerHTML = '<option value="">Seleccionar aerogenerador...</option>';
            
            aerogeneradoresData.forEach(aero => {
                const option = document.createElement('option');
                option.value = aero.nombre || aero.WTG_Name;
                option.textContent = aero.nombre || aero.WTG_Name;
                option.dataset.codigo = aero.codigo || aero.WTG_Name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando aerogeneradores:', error);
        }
    }
    
    async function loadPersonalByParque(plantaNombre) {
        try {
            const response = await ClientSecurity.makeSecureRequest('/personal-by-parque?parque=' + encodeURIComponent(plantaNombre));
            personalByParque[plantaNombre] = response.results || [];
            
            const container = document.getElementById('personalDisponible');
            container.innerHTML = '';
            
            if (personalByParque[plantaNombre].length === 0) {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal asignado a este parque</div>';
                return;
            }
            
            personalByParque[plantaNombre].forEach(persona => {
                // Los datos vienen directamente, no en properties
                const item = document.createElement('div');
                item.className = 'selector-item';
                item.innerHTML = \`
                    <strong>\${persona.nombre}</strong><br>
                    <small>\${persona.empresa || 'Sin empresa'} - \${persona.rol || 'Sin rol'}</small>
                \`;
                item.dataset.id = persona.id;
                item.dataset.nombre = persona.nombre;
                item.dataset.empresa = persona.empresa || '';
                item.dataset.rol = persona.rol || '';
                item.dataset.rut = persona.rut || '';
                
                item.addEventListener('click', () => togglePersonalSelection(item));
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Error cargando personal del parque:', error);
        }
    }
    
    function togglePersonalSelection(item) {
        item.classList.toggle('selected');
    }
    
    function addSelectedPersonal() {
        const disponibleContainer = document.getElementById('personalDisponible');
        const seleccionadoContainer = document.getElementById('personalSeleccionado');
        
        const selectedItems = disponibleContainer.querySelectorAll('.selected');
        
        if (selectedItems.length === 0) {
            alert('Seleccione al menos una persona');
            return;
        }
        
        if (personalSeleccionado.length === 0) {
            seleccionadoContainer.innerHTML = '';
        }
        
        selectedItems.forEach(item => {
            const persona = {
                id: item.dataset.id,
                nombre: item.dataset.nombre,
                empresa: item.dataset.empresa,
                rol: item.dataset.rol,
                rut: item.dataset.rut
            };
            
            if (!personalSeleccionado.find(p => p.id === persona.id)) {
                personalSeleccionado.push(persona);
                
                const newItem = item.cloneNode(true);
                newItem.classList.remove('selected');
                newItem.addEventListener('click', () => togglePersonalSelection(newItem));
                seleccionadoContainer.appendChild(newItem);
            }
            
            item.classList.remove('selected');
            item.style.display = 'none';
        });
    }
    
    function removeSelectedPersonal() {
        const seleccionadoContainer = document.getElementById('personalSeleccionado');
        const disponibleContainer = document.getElementById('personalDisponible');
        
        const selectedItems = seleccionadoContainer.querySelectorAll('.selected');
        
        if (selectedItems.length === 0) {
            alert('Seleccione al menos una persona para remover');
            return;
        }
        
        selectedItems.forEach(item => {
            const id = item.dataset.id;
            
            personalSeleccionado = personalSeleccionado.filter(p => p.id !== id);
            
            const originalItem = disponibleContainer.querySelector(\`[data-id="\${id}"]\`);
            
            if (originalItem) {
                originalItem.style.display = 'block';
            }
            
            item.remove();
        });
        
        if (personalSeleccionado.length === 0) {
            seleccionadoContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
        }
    }
    
    function handleTipoMantenimientoChange(e) {
        const tipoOtrosContainer = document.getElementById('tipoOtrosContainer');
        if (e.target.value === 'OTROS') {
            tipoOtrosContainer.style.display = 'block';
            document.getElementById('tipoOtros').required = true;
        } else {
            tipoOtrosContainer.style.display = 'none';
            document.getElementById('tipoOtros').required = false;
            document.getElementById('tipoOtros').value = '';
        }
    }
    
    async function handleActividadChange() {
        actividadesSeleccionadas = [];
        document.querySelectorAll('#actividadesChecklist input:checked').forEach(checkbox => {
            actividadesSeleccionadas.push({
                id: checkbox.dataset.id,
                nombre: checkbox.value,
                tipo: checkbox.dataset.tipo
            });
        });
        
        if (actividadesSeleccionadas.length > 0) {
            await loadMatrizRiesgos();
        } else {
            matrizRiesgosSeleccionada = [];
            updateMatrizDisplay();
        }
    }
    
    async function loadMatrizRiesgos() {
        try {
            const actividadesNombres = actividadesSeleccionadas.map(a => a.nombre).join(',');
            const response = await ClientSecurity.makeSecureRequest('/matriz-riesgos?actividades=' + encodeURIComponent(actividadesNombres));
            
            // Los datos vienen directamente de D1, no en properties
            const results = Array.isArray(response?.results) ? response.results : [];
            matrizRiesgosSeleccionada = results.map(item => ({
                id: item.id,
                codigo: item.codigo || 0,
                actividad: item.actividad || '',
                peligro: item.peligro || '',
                riesgo: item.riesgo || '',
                medidas: item.medidas_preventivas || ''
            }));
            
            updateMatrizDisplay();
        } catch (error) {
            console.error('Error cargando matriz de riesgos:', error);
        }
    }
    
    function updateMatrizDisplay() {
        const tableBody = document.getElementById('matrizTableBody');
        const table = document.getElementById('matrizTable');
        const emptyState = document.getElementById('matrizEmptyState');
        
        if (matrizRiesgosSeleccionada.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        table.style.display = 'block';
        emptyState.style.display = 'none';
        
        tableBody.innerHTML = '';
        matrizRiesgosSeleccionada.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = \`
                <td>\${item.codigo}</td>
                <td>\${item.actividad}</td>
                <td>\${item.peligro}</td>
                <td>\${item.riesgo}</td>
                <td>\${item.medidas}</td>
            \`;
            tableBody.appendChild(row);
        });
    }
    
    // ========================================================================
    // CREAR PERMISO (sin cambios significativos)
    // ========================================================================
    
    async function handleCreatePermiso(e) {
        e.preventDefault();
        
        // Determinar si estamos editando o creando
        const isEditing = window.permisoEditando !== undefined;
        
        // Deshabilitar el bot\xF3n de submit para evitar m\xFAltiples env\xEDos
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = isEditing ? 'ACTUALIZANDO PERMISO...' : 'CREANDO PERMISO...';
        
        const plantaSelect = document.getElementById('planta');
        const aerogeneradorSelect = document.getElementById('aerogenerador');
        const jefeFaenaSelect = document.getElementById('jefeFaena');
        const supervisorParqueSelect = document.getElementById('supervisorParque');
        
        const permisoData = {
            planta: plantaSelect.value,
            plantaId: plantaSelect.selectedOptions[0]?.dataset.id,
            codigoParque: plantaSelect.selectedOptions[0]?.dataset.codigo,
            aerogenerador: aerogeneradorSelect.value,
            aerogeneradorCodigo: aerogeneradorSelect.selectedOptions[0]?.dataset.codigo,
            descripcion: ClientSecurity.sanitizeInput(document.getElementById('descripcion').value),
            jefeFaena: jefeFaenaSelect.value,
            jefeFaenaId: jefeFaenaSelect.selectedOptions[0]?.dataset.id,
            supervisorParque: supervisorParqueSelect.value,
            supervisorParqueId: supervisorParqueSelect.selectedOptions[0]?.dataset.id,
            tipoMantenimiento: document.getElementById('tipoMantenimiento').value,
            tipoMantenimientoOtros: ClientSecurity.sanitizeInput(document.getElementById('tipoOtros').value),
            personal: personalSeleccionado,
            actividades: actividadesSeleccionadas,
            matrizRiesgos: matrizRiesgosSeleccionada,
            usuarioCreador: currentUser?.email || 'unknown',
            fechaInicio: formatChileDateTime(getChileDateTime())
        };
        
        if (!permisoData.planta || !permisoData.descripcion || !permisoData.jefeFaena) {
            alert('Por favor complete los campos obligatorios');
            // Re-habilitar el bot\xF3n si hay error de validaci\xF3n
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        if (personalSeleccionado.length === 0) {
            alert('Debe seleccionar al menos una persona');
            // Re-habilitar el bot\xF3n si hay error de validaci\xF3n
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        try {
            let response;
            
            if (isEditing) {
                // Agregar ID del permiso para edici\xF3n
                permisoData.permisoId = window.permisoEditando;
                console.log('EDITANDO PERMISO - ID:', window.permisoEditando, 'Datos:', permisoData);
                
                response = await ClientSecurity.makeSecureRequest('/permisos', {
                    method: 'PUT',
                    body: JSON.stringify(permisoData)
                });
            } else {
                response = await ClientSecurity.makeSecureRequest('/permisos', {
                    method: 'POST',
                    body: JSON.stringify(permisoData)
                });
            }
            
            if (response.success) {
                const mensaje = isEditing ? 
                    'Permiso actualizado exitosamente' : 
                    'Permiso creado exitosamente\\n\\nN\xFAmero: ' + response.numeroPT;
                    
                alert(mensaje);
                
                document.getElementById('permisoForm').reset();
                personalSeleccionado = [];
                actividadesSeleccionadas = [];
                matrizRiesgosSeleccionada = [];
                document.getElementById('personalSeleccionado').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div>';
                updateMatrizDisplay();
                
                // Resetear estado de edici\xF3n
                if (isEditing) {
                    window.permisoEditando = undefined;
                    submitButton.textContent = 'CREAR PERMISO DE TRABAJO';
                }
                
                await loadPermisos();
                switchTab('consultar');
                
                // Re-habilitar el bot\xF3n despu\xE9s del \xE9xito
                submitButton.disabled = false;
                submitButton.textContent = isEditing ? 'CREAR PERMISO DE TRABAJO' : originalText;
            } else {
                const accion = isEditing ? 'actualizar' : 'crear';
                alert(\`Error al \${accion} el permiso: \` + (response.error || 'Error desconocido'));
                // Re-habilitar el bot\xF3n si hay error
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        } catch (error) {
            const accion = isEditing ? 'actualizando' : 'creando';
            console.error(\`Error \${accion} permiso:\`, error);
            alert(\`Error al \${accion} el permiso: \` + error.message);
            // Re-habilitar el bot\xF3n si hay error
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
    
    // ========================================================================
    // CONSULTAR PERMISOS (actualizado para D1)
    // ========================================================================
    
    async function loadPermisos() {
        try {
            const response = await ClientSecurity.makeSecureRequest('/permisos');
            permisosData = response.permisos || [];
            
            // Configurar l\xEDmites de fechas basados en los permisos cargados
            setupDateLimits();
            
            displayPermisos();
        } catch (error) {
            console.error('Error cargando permisos:', error);
            document.getElementById('permisosContainer').innerHTML = '<div class="error">Error al cargar los permisos</div>';
        }
    }
    
    function displayPermisos() {
        const container = document.getElementById('permisosContainer');
        
        // Filtrar permisos seg\xFAn plantas autorizadas
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        const permisosFiltrados = permisosData.filter(permiso => {
            // Si es Enel, puede ver todos los permisos
            // Si no, solo los de sus parques autorizados
            return esEnel || parquesAutorizados.includes(permiso.planta_nombre);
        });
        
        if (permisosFiltrados.length === 0) {
            container.innerHTML = '<div class="loading">No hay permisos registrados para sus plantas autorizadas</div>';
            return;
        }
        
        container.innerHTML = '';
        permisosFiltrados.forEach(permiso => {
            const card = createPermisoCard(permiso);
            container.appendChild(card);
        });
    }
    
    function createPermisoCard(permiso) {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'permiso-card-container';
        
        const card = document.createElement('div');
        card.className = 'permiso-card';
        card.dataset.permisoId = permiso.id;
        
        const estadoClass = 'estado-' + (permiso.estado || 'CREADO').toLowerCase();
        const esEnel = currentUser?.esEnel || currentUser?.rol === 'Supervisor Enel';
        
        // Verificar si el usuario es el creador del permiso
        const esCreador = currentUser?.id && permiso.usuario_creador_id && 
                         currentUser.id.toString() === permiso.usuario_creador_id.toString();
        
        // Verificar si el usuario puede cerrar el permiso
        // Ahora todos los IDs son de la misma tabla usuarios
        const userId = currentUser?.id ? currentUser.id.toString() : null;
        const jefeFaenaId = permiso.jefe_faena_id ? permiso.jefe_faena_id.toString() : null;
        const personalIds = permiso.personal_ids ? 
            permiso.personal_ids.split(',').map(id => id.trim()) : [];
        
        const esJefeFaena = userId && userId === jefeFaenaId;
        const estaEnPersonalAsignado = userId && personalIds.includes(userId);
        
        const puedeCerrarPermiso = esEnel || esJefeFaena || estaEnPersonalAsignado;
        
        // Determinar texto de estado para usuarios no aprobadores
        let estadoTexto = permiso.estado;
        if (permiso.estado === 'CREADO' && !esEnel) {
            estadoTexto = 'PENDIENTE DE APROBACI\xD3N';
        } else if (permiso.estado === 'CERRADO_PENDIENTE_APROBACION') {
            estadoTexto = 'CERRADO - PENDIENTE APROBACI\xD3N';
        } else if (permiso.estado === 'CIERRE_RECHAZADO') {
            estadoTexto = 'CIERRE RECHAZADO';
        }
        
        // Crear estructura de tarjeta con frente y reverso
        card.innerHTML = \`
            <div class="permiso-card-inner">
                <!-- Frente de la tarjeta -->
                <div class="permiso-card-front">
                    <div class="permiso-header">
                        <div class="permiso-numero">\${permiso.numero_pt}</div>
                        <div class="permiso-estado \${estadoClass}">\${estadoTexto}</div>
                    </div>
                    
                    <div class="permiso-info">
                        <div class="permiso-info-item">
                            <div class="permiso-info-label">Planta</div>
                            <div class="permiso-info-value">\${permiso.planta_nombre}</div>
                        </div>
                        <div class="permiso-info-item">
                            <div class="permiso-info-label">Aerogenerador</div>
                            <div class="permiso-info-value">\${permiso.aerogenerador_nombre || 'N/A'}</div>
                        </div>
                        <div class="permiso-info-item">
                            <div class="permiso-info-label">Jefe de Faena</div>
                            <div class="permiso-info-value">\${permiso.jefe_faena_nombre}</div>
                        </div>
                        \${permiso.supervisor_parque_nombre ? \`
                        <div class="permiso-info-item">
                            <div class="permiso-info-label">Supervisor Responsable</div>
                            <div class="permiso-info-value">\${permiso.supervisor_parque_nombre}</div>
                        </div>
                        \` : ''}
                        <div class="permiso-info-item">
                            <div class="permiso-info-label">Fecha Creaci\xF3n</div>
                            <div class="permiso-info-value">\${formatDate(permiso.fecha_creacion)}</div>
                        </div>
                    </div>
                    
                    <div class="permiso-info">
                        <div class="permiso-info-item" style="grid-column: 1 / -1;">
                            <div class="permiso-info-label">Descripci\xF3n</div>
                            <div class="permiso-info-value">\${permiso.descripcion}</div>
                        </div>
                    </div>
                    
                    \${permiso.personal_asignado ? \`
                        <div class="permiso-info">
                            <div class="permiso-info-item" style="grid-column: 1 / -1;">
                                <div class="permiso-info-label">Personal Asignado</div>
                                <div class="permiso-info-value">\${permiso.personal_asignado}</div>
                            </div>
                        </div>
                    \` : ''}
                    
                    <div class="permiso-actions">
                        \${permiso.estado === 'CREADO' && esCreador ? 
                            \`<button class="btn btn-warning btn-small" onclick="editarPermiso(\${permiso.id})" style="margin-right: 8px;">\u270F\uFE0F EDITAR</button>\` : ''}
                        
                        \${permiso.estado === 'CREADO' && esEnel ? 
                            \`<button class="btn btn-secondary btn-small" onclick="aprobarPermiso(\${permiso.id})">APROBAR</button>\` : ''}
                        
                        \${permiso.estado === 'ACTIVO' && puedeCerrarPermiso ? 
                            \`<button class="btn btn-danger btn-small" onclick="openCerrarModal(\${permiso.id}, '\${permiso.numero_pt}', '\${permiso.planta_nombre}', '\${permiso.aerogenerador_nombre || "N/A"}')">CERRAR PERMISO</button>\` : ''}
                        
                        \${permiso.estado === 'CIERRE_RECHAZADO' ? \`
                            <button class="btn btn-warning btn-small" 
                                    onclick="openReenviarCierreModal(\${permiso.id}, '\${(permiso.numero_pt || '').replace(/'/g, "\\'")}', '\${(permiso.planta_nombre || '').replace(/'/g, "\\'")}', '\${(permiso.aerogenerador_nombre || '').replace(/'/g, "\\'")}')"
                                    style="margin-right: 8px;">
                                \u{1F504} REENVIAR CIERRE
                            </button>
                        \` : ''}
                        
                        \${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO' || permiso.actividades_detalle?.length > 0 || permiso.materiales_detalle?.length > 0 || permiso.matriz_riesgos_detalle?.length > 0) ? 
                            \`<button class="btn btn-info btn-small" onclick="flipCard(\${permiso.id})">VER DETALLES</button>\` : ''}
                        
                        \${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO') ? 
                            \`<button class="btn btn-success btn-small" onclick="openExportModal(\${permiso.id}, '\${permiso.numero_pt}')"" style="margin-left: 8px;">
                                \u{1F4C1} EXPORTAR
                            </button>\` : ''}
                        
                        \${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO') ? 
                            \`<span style="color: var(--text-secondary); font-size: 12px;">Cerrado por: \${permiso.usuario_cierre || 'N/A'}</span>\` : 
                            (permiso.estado === 'CREADO' && !esEnel ? 
                                \`<span style="color: var(--warning); font-size: 12px; font-weight: 500;">\u23F3 Pendiente de aprobaci\xF3n</span>\` : '')
                        }
                    </div>
                </div>
                
                <!-- Reverso de la tarjeta -->
                <div class="permiso-card-back">
                    <div class="permiso-header">
                        <div class="permiso-numero">\${permiso.numero_pt} - Detalles</div>
                        <button class="btn-flip" onclick="flipCard(\${permiso.id})">\u2190 Volver</button>
                    </div>
                    
                    <!-- Pesta\xF1as internas -->
                    <div class="card-tabs">
                        <button class="card-tab active" onclick="showCardTab(\${permiso.id}, 'actividades')">Actividades</button>
                        <button class="card-tab" onclick="showCardTab(\${permiso.id}, 'tiempos')">Tiempos</button>
                        <button class="card-tab" onclick="showCardTab(\${permiso.id}, 'materiales')">Materiales</button>
                        <button class="card-tab" onclick="showCardTab(\${permiso.id}, 'cierre')">Cierre</button>
                    </div>
                    
                    <!-- Contenido de las pesta\xF1as -->
                    <div class="card-tab-content" data-permiso-id="\${permiso.id}">
                        
                        <!-- Tab: Actividades -->
                        <div class="tab-pane active" data-tab="actividades">
                            \${permiso.actividades_detalle && permiso.actividades_detalle.length > 0 ? \`
                                <div class="permiso-info">
                                    <div class="permiso-info-item" style="grid-column: 1 / -1;">
                                        <div class="permiso-info-label">Actividades Realizadas</div>
                                        <div class="permiso-info-value" style="font-size: 13px;">
                                            \${permiso.actividades_detalle.map(act => \`
                                                <div style="margin: 6px 0; padding: 8px; background: var(--bg-secondary); border-radius: 4px;">
                                                    <strong>\u2022 \${act.actividad_nombre}</strong>
                                                    \${act.tipo_actividad ? \`<span style="color: var(--accent-color); font-size: 11px; margin-left: 8px;">(\${act.tipo_actividad})</span>\` : ''}
                                                </div>
                                            \`).join('')}
                                        </div>
                                    </div>
                                </div>
                                \${permiso.matriz_riesgos_detalle && permiso.matriz_riesgos_detalle.length > 0 ? \`
                                    <div class="permiso-info" style="margin-top: 12px;">
                                        <div class="permiso-info-item" style="grid-column: 1 / -1;">
                                            <div class="permiso-info-label">Matriz de Riesgos</div>
                                            <div class="permiso-info-value" style="font-size: 12px;">
                                                \${permiso.matriz_riesgos_detalle.map(riesgo => \`
                                                    <div style="margin: 6px 0; padding: 8px; background: #fff3cd; border-left: 3px solid var(--warning-color); border-radius: 4px;">
                                                        <div style="color: var(--danger-color); font-weight: 500;">\u26A0 \${riesgo.riesgo_descripcion || 'Riesgo'}</div>
                                                        \${riesgo.medida_control ? \`<div style="color: var(--success-color); margin-top: 4px;">\u2713 \${riesgo.medida_control}</div>\` : ''}
                                                    </div>
                                                \`).join('')}
                                            </div>
                                        </div>
                                    </div>
                                \` : ''}
                            \` : \`
                                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                    <p>No hay actividades registradas</p>
                                </div>
                            \`}
                        </div>
                        
                        <!-- Tab: Tiempos -->
                        <div class="tab-pane" data-tab="tiempos" style="display: none;">
                            <div class="tiempos-grid">
                                <!-- Columna Izquierda: Trabajos -->
                                <div class="tiempos-column">
                                    \${permiso.fecha_inicio_trabajos ? \`
                                        <div class="tiempo-item trabajo">
                                            <div class="tiempo-icon">\u{1F6E0}\uFE0F</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Inicio de Trabajos</div>
                                                <div class="tiempo-value">\${formatDate(permiso.fecha_inicio_trabajos)}</div>
                                            </div>
                                        </div>
                                    \` : \`
                                        <div class="tiempo-item-empty">
                                            <div class="tiempo-icon-empty">\u{1F6E0}\uFE0F</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Inicio de Trabajos</div>
                                                <div class="tiempo-value-empty">No registrado</div>
                                            </div>
                                        </div>
                                    \`}
                                    
                                    \${permiso.fecha_fin_trabajos ? \`
                                        <div class="tiempo-item trabajo">
                                            <div class="tiempo-icon">\u2705</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Fin de Trabajos</div>
                                                <div class="tiempo-value">\${formatDate(permiso.fecha_fin_trabajos)}</div>
                                            </div>
                                        </div>
                                    \` : \`
                                        <div class="tiempo-item-empty">
                                            <div class="tiempo-icon-empty">\u2705</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Fin de Trabajos</div>
                                                <div class="tiempo-value-empty">No registrado</div>
                                            </div>
                                        </div>
                                    \`}
                                </div>
                                
                                <!-- Columna Derecha: Turbina -->
                                <div class="tiempos-column">
                                    \${permiso.fecha_parada_turbina ? \`
                                        <div class="tiempo-item turbina">
                                            <div class="tiempo-icon">\u23F8\uFE0F</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Parada de Turbina</div>
                                                <div class="tiempo-value">\${formatDate(permiso.fecha_parada_turbina)}</div>
                                            </div>
                                        </div>
                                    \` : \`
                                        <div class="tiempo-item-empty">
                                            <div class="tiempo-icon-empty">\u23F8\uFE0F</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Parada de Turbina</div>
                                                <div class="tiempo-value-empty">No registrado</div>
                                            </div>
                                        </div>
                                    \`}
                                    
                                    \${permiso.fecha_puesta_marcha_turbina ? \`
                                        <div class="tiempo-item turbina">
                                            <div class="tiempo-icon">\u25B6\uFE0F</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Puesta en Marcha</div>
                                                <div class="tiempo-value">\${formatDate(permiso.fecha_puesta_marcha_turbina)}</div>
                                            </div>
                                        </div>
                                    \` : \`
                                        <div class="tiempo-item-empty">
                                            <div class="tiempo-icon-empty">\u25B6\uFE0F</div>
                                            <div class="tiempo-content">
                                                <div class="tiempo-label">Puesta en Marcha</div>
                                                <div class="tiempo-value-empty">No registrado</div>
                                            </div>
                                        </div>
                                    \`}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tab: Materiales -->
                        <div class="tab-pane" data-tab="materiales" style="display: none;">
                            \${permiso.materiales_detalle && permiso.materiales_detalle.length > 0 ? \`
                                <div class="materials-table-container">
                                    <table class="materials-table">
                                        <thead>
                                            <tr>
                                                <th style="width: 40px;">#</th>
                                                <th>Material/Herramienta</th>
                                                <th style="width: 60px;">Cant.</th>
                                                <th style="width: 80px;">Propietario</th>
                                                <th style="width: 70px;">Almac\xE9n</th>
                                                <th style="width: 70px;">N\xB0 Item</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            \${permiso.materiales_detalle.map((mat, index) => \`
                                                <tr>
                                                    <td>\${index + 1}</td>
                                                    <td>\${mat.material_nombre || 'Sin descripci\xF3n'}</td>
                                                    <td>\${mat.material_cantidad || 1}</td>
                                                    <td style="font-size: 11px;">\${mat.material_propietario || 'N/A'}</td>
                                                    <td style="font-size: 11px;">\${mat.material_almacen || 'N/A'}</td>
                                                    <td style="font-size: 11px;">\${mat.numero_item || 'N/A'}</td>
                                                </tr>
                                            \`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            \` : \`
                                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                    <p>\u{1F4E6} No hay materiales registrados</p>
                                    <p style="font-size: 12px; margin-top: 8px;">Los materiales utilizados aparecer\xE1n aqu\xED cuando se registren</p>
                                </div>
                            \`}
                        </div>
                        
                        <!-- Tab: Cierre -->
                        <div class="tab-pane" data-tab="cierre" style="display: none;">
                            \${(permiso.estado === 'CERRADO' || permiso.estado === 'CERRADO_PENDIENTE_APROBACION' || permiso.estado === 'CIERRE_RECHAZADO') ? \`
                                <div class="cierre-grid">
                                    <!-- Columna Izquierda: Responsable -->
                                    <div class="cierre-column">
                                        <div class="cierre-item responsable">
                                            <div class="cierre-icon">\u{1F464}</div>
                                            <div class="cierre-content">
                                                <div class="cierre-label">Responsable del Cierre</div>
                                                <div class="cierre-value">\${permiso.usuario_cierre || 'No especificado'}</div>
                                            </div>
                                        </div>
                                        
                                        <div class="cierre-item fecha">
                                            <div class="cierre-icon">\u{1F4C5}</div>
                                            <div class="cierre-content">
                                                <div class="cierre-label">Fecha de Cierre</div>
                                                <div class="cierre-value">\${formatDate(permiso.fecha_cierre)}</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Estado de Aprobaci\xF3n del Cierre -->
                                        <div class="cierre-item aprobacion">
                                            <div class="cierre-icon">\${permiso.estado_aprobacion_cierre === 'APROBADO' ? '\u2705' : (permiso.estado_aprobacion_cierre === 'RECHAZADO' ? '\u274C' : '\u23F3')}</div>
                                            <div class="cierre-content">
                                                <div class="cierre-label">Estado Aprobaci\xF3n</div>
                                                <div class="cierre-value \${permiso.estado_aprobacion_cierre === 'APROBADO' ? 'aprobado' : (permiso.estado_aprobacion_cierre === 'RECHAZADO' ? 'rechazado' : 'pendiente')}">
                                                    \${permiso.estado_aprobacion_cierre === 'APROBADO' ? 'APROBADO' : (permiso.estado_aprobacion_cierre === 'RECHAZADO' ? 'RECHAZADO' : 'PENDIENTE')}
                                                </div>
                                                \${permiso.usuario_aprobador_cierre_nombre ? \`
                                                    <div class="cierre-sub-info">Por: \${permiso.usuario_aprobador_cierre_nombre}</div>
                                                    <div class="cierre-sub-info">\${formatDate(permiso.fecha_aprobacion_cierre)}</div>
                                                \` : ''}
                                                \${permiso.estado_aprobacion_cierre === 'RECHAZADO' && permiso.motivo_rechazo ? \`
                                                    <div class="motivo-rechazo" style="
                                                        margin-top: 12px;
                                                        padding: 15px;
                                                        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
                                                        border: 2px solid #e57373;
                                                        border-radius: 8px;
                                                        border-left: 5px solid #d32f2f;
                                                        box-shadow: 0 3px 10px rgba(211, 47, 47, 0.15);
                                                        animation: pulseRed 2s ease-in-out infinite alternate;
                                                    ">
                                                        <div style="
                                                            color: #d32f2f;
                                                            font-weight: 700;
                                                            font-size: 14px;
                                                            margin-bottom: 8px;
                                                            display: flex;
                                                            align-items: center;
                                                            gap: 8px;
                                                            text-transform: uppercase;
                                                            letter-spacing: 0.5px;
                                                        ">
                                                            \u{1F6AB} MOTIVO DEL RECHAZO
                                                        </div>
                                                        <div style="
                                                            color: #424242;
                                                            font-size: 14px;
                                                            line-height: 1.5;
                                                            font-weight: 600;
                                                            background: rgba(255, 255, 255, 0.8);
                                                            padding: 10px;
                                                            border-radius: 4px;
                                                            border-left: 3px solid #ff5722;
                                                        ">
                                                            "\${permiso.motivo_rechazo}"
                                                        </div>
                                                        <div style="
                                                            margin-top: 12px;
                                                            padding: 8px 12px;
                                                            background: rgba(255, 152, 0, 0.1);
                                                            border-radius: 4px;
                                                            border: 1px solid #ff9800;
                                                            color: #e65100;
                                                            font-size: 12px;
                                                            font-weight: 600;
                                                            text-align: center;
                                                        ">
                                                            \u{1F4A1} Use el bot\xF3n "REENVIAR CIERRE" para corregir y reenviar
                                                        </div>
                                                    </div>
                                                \` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Columna Derecha: Observaciones -->
                                    <div class="cierre-column">
                                        <div class="cierre-item observaciones">
                                            <div class="cierre-content-full">
                                                <div class="cierre-label">Observaciones</div>
                                                <div class="cierre-observaciones">\${permiso.observaciones_cierre || 'Sin observaciones registradas'}</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Bot\xF3n de Aprobaci\xF3n si es necesario -->
                                        \${permiso.estado === 'CERRADO_PENDIENTE_APROBACION' && (currentUser.rol === 'Admin' || currentUser.rol === 'Supervisor') ? \`
                                            <div class="cierre-actions" style="margin-top: 15px;">
                                                <button class="btn btn-success btn-small" onclick="openAprobarCierreModal(\${permiso.id}, '\${(permiso.numero_pt || '').replace(/'/g, "\\'")}')" >
                                                    \u2705 APROBAR CIERRE
                                                </button>
                                            </div>
                                        \` : ''}
                                    </div>
                                </div>
                            \` : \`
                                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                    <p>\u{1F513} Permiso a\xFAn activo</p>
                                    <p style="font-size: 12px; margin-top: 8px;">La informaci\xF3n de cierre estar\xE1 disponible cuando se complete el permiso</p>
                                </div>
                            \`}
                        </div>
                    </div>
                </div>
            </div>
        \`;
        
        cardContainer.appendChild(card);
        return cardContainer;
    }
    
    function filterPermisos() {
        const searchTerm = document.getElementById('searchPermiso').value.toLowerCase();
        const estadoFilter = document.getElementById('filterEstado').value;
        const fechaDesde = document.getElementById('fechaDesde').value;
        const fechaHasta = document.getElementById('fechaHasta').value;
        const txt = v => String(v ?? '').toLowerCase();
        
        // Filtrar primero por parques autorizados
        const parquesAutorizados = currentUser?.parques || [];
        const esEnel = currentUser?.esEnel || false;
        
        const permisosAutorizados = permisosData.filter(permiso => {
            return esEnel || parquesAutorizados.includes(permiso.planta_nombre);
        });
        
        // Filtrar por estado si se seleccion\xF3 uno
        let filtered = permisosAutorizados;
        if (estadoFilter) {
            filtered = filtered.filter(p => p.estado === estadoFilter);
        }
        
        // Filtrar por rango de fechas
        if (fechaDesde || fechaHasta) {
            filtered = filtered.filter(p => {
                if (!p.fecha_creacion) return false;
                
                const fechaPermiso = new Date(p.fecha_creacion);
                if (isNaN(fechaPermiso.getTime())) return false;
                
                const fechaPermisoStr = fechaPermiso.toISOString().split('T')[0];
                
                let cumpleFechaDesde = true;
                let cumpleFechaHasta = true;
                
                if (fechaDesde) {
                    cumpleFechaDesde = fechaPermisoStr >= fechaDesde;
                }
                
                if (fechaHasta) {
                    cumpleFechaHasta = fechaPermisoStr <= fechaHasta;
                }
                
                return cumpleFechaDesde && cumpleFechaHasta;
            });
        }
        
        // Filtrar por t\xE9rmino de b\xFAsqueda si hay uno
        if (searchTerm) {
            filtered = filtered.filter(p =>
                txt(p.numero_pt).includes(searchTerm) ||
                txt(p.planta_nombre).includes(searchTerm) ||
                txt(p.descripcion).includes(searchTerm) ||
                txt(p.jefe_faena_nombre).includes(searchTerm)
            );
        }
        
        // Si no hay filtros aplicados, mostrar todos
        if (!searchTerm && !estadoFilter && !fechaDesde && !fechaHasta) {
            displayPermisos();
            return;
        }
        
        const container = document.getElementById('permisosContainer');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="loading">No se encontraron permisos con ese criterio</div>';
            return;
        }
        
        container.innerHTML = '';
        filtered.forEach(permiso => {
            const card = createPermisoCard(permiso);
            container.appendChild(card);
        });
    }
    
    // Funci\xF3n para voltear las tarjetas
    window.flipCard = function(permisoId) {
        const card = document.querySelector(\`.permiso-card[data-permiso-id="\${permisoId}"]\`);
        const container = card?.closest('.permiso-card-container');
        
        if (card && container) {
            const isFlipped = card.classList.contains('flipped');
            
            // Toggle flip
            card.classList.toggle('flipped');
            container.classList.toggle('flipped-container');
            
            // Resetear a la primera pesta\xF1a cuando se voltea hacia atr\xE1s
            if (!isFlipped) {
                const tabs = card.querySelectorAll('.card-tab');
                const panes = card.querySelectorAll('.tab-pane');
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.style.display = 'none');
                if (tabs[0]) tabs[0].classList.add('active');
                if (panes[0]) {
                    panes[0].style.display = 'block';
                }
            }
        }
    }
    
    // Funci\xF3n para cambiar pesta\xF1as dentro de la card
    window.showCardTab = function(permisoId, tabName) {
        const card = document.querySelector(\`.permiso-card[data-permiso-id="\${permisoId}"]\`);
        if (!card) return;
        
        // Actualizar botones de pesta\xF1as
        const tabs = card.querySelectorAll('.card-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Mostrar/ocultar contenido
        const panes = card.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
            if (pane.dataset.tab === tabName) {
                pane.style.display = 'block';
            } else {
                pane.style.display = 'none';
            }
        });
    }
    
    // ========================================================================
    // FUNCIONES DE EXPORTACI\xD3N
    // ========================================================================
    
    // Funci\xF3n para mostrar/ocultar men\xFA de exportaci\xF3n
    window.toggleExportMenu = function(permisoId) {
        // Cerrar otros men\xFAs abiertos
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu.id !== \`exportMenu_\${permisoId}\`) {
                menu.style.display = 'none';
            }
        });
        
        const menu = document.getElementById(\`exportMenu_\${permisoId}\`);
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    // Funci\xF3n para exportar archivo (Excel o PDF)
    window.exportarArchivo = async function(permisoId, numeroPT, tipo) {
        // Cerrar men\xFA
        const menu = document.getElementById(\`exportMenu_\${permisoId}\`);
        if (menu) menu.style.display = 'none';
        
        try {
            const endpoint = tipo === 'excel' ? '/exportar-permiso-excel' : '/exportar-permiso-pdf';
            const extension = tipo === 'excel' ? 'xlsx' : 'pdf';
            const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const descripcion = '_' + fechaActual;
            
            // Realizar petici\xF3n
            const response = await fetch(\`\${API_BASE}\${endpoint}?id=\${permisoId}\`, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'X-Session-Id': sessionId
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al generar el archivo');
            }
            
            // Descargar archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`\${numeroPT}\${descripcion}.\${extension}\`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error('Error exportando archivo:', error);
            alert('Error al exportar archivo: ' + error.message);
        }
    }
    
    // Cerrar men\xFAs al hacer click fuera
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.export-dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });
    
    function setupDateLimits() {
        if (!permisosData || permisosData.length === 0) return;
        
        // Obtener todas las fechas de creaci\xF3n de los permisos
        const fechas = permisosData
            .map(p => p.fecha_creacion)
            .filter(f => f) // Filtrar fechas v\xE1lidas
            .map(f => new Date(f))
            .filter(d => !isNaN(d.getTime())); // Filtrar fechas v\xE1lidas
        
        if (fechas.length === 0) return;
        
        // Encontrar fecha m\xEDnima y m\xE1xima
        const fechaMin = new Date(Math.min(...fechas));
        const fechaMax = new Date(Math.max(...fechas));
        
        // Formatear para input type="date" (YYYY-MM-DD)
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        // Configurar l\xEDmites en los inputs
        const fechaDesde = document.getElementById('fechaDesde');
        const fechaHasta = document.getElementById('fechaHasta');
        
        if (fechaDesde) {
            fechaDesde.min = formatDate(fechaMin);
            fechaDesde.max = formatDate(fechaMax);
        }
        
        if (fechaHasta) {
            fechaHasta.min = formatDate(fechaMin);
            fechaHasta.max = formatDate(fechaMax);
        }
    }

    function clearSearch() {
        document.getElementById('searchPermiso').value = '';
        document.getElementById('filterEstado').value = '';
        document.getElementById('fechaDesde').value = '';
        document.getElementById('fechaHasta').value = '';
        displayPermisos();
    }
    
    // ========================================================================
    // APROBAR Y CERRAR PERMISOS
    // ========================================================================
    
    window.aprobarPermiso = async function(permisoId) {
        if (!confirm('\xBFEst\xE1 seguro de aprobar este permiso?')) return;
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/aprobar-permiso', {
                method: 'POST',
                body: JSON.stringify({
                    permisoId: permisoId,
                    usuarioAprobador: currentUser?.email || 'unknown'
                })
            });
            
            if (response.success) {
                alert('Permiso aprobado exitosamente');
                await loadPermisos();
            } else {
                alert('Error al aprobar el permiso: ' + (response.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error aprobando permiso:', error);
            alert('Error al aprobar el permiso');
        }
    };
    
    // Funci\xF3n para abrir modal b\xE1sico de aprobaci\xF3n de cierre
    window.openAprobarCierreModal = async function(permisoId, numeroPT) {
        const decision = confirm('Desea APROBAR el cierre de este permiso?\\n\\nPermiso: ' + numeroPT + '\\n\\nOK = Aprobar\\nCancelar = Rechazar');
        const accion = decision ? 'aprobar' : 'rechazar';
        const observaciones = prompt('Observaciones del supervisor (opcional):') || '';
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/aprobar-cierre-permiso', {
                method: 'POST',
                body: JSON.stringify({
                    permisoId: permisoId,
                    accion: accion,
                    observaciones: observaciones
                })
            });
            
            if (response.success) {
                alert('Decisi\xF3n registrada exitosamente');
                await loadPermisos();
            } else {
                alert('Error: ' + (response.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error en aprobaci\xF3n:', error);
            alert('Error de conexi\xF3n');
        }
    };
    
    window.openCerrarModal = function(permisoId, numeroPT, planta, aerogenerador) {
        document.getElementById('permisoInfoNumero').textContent = numeroPT;
        document.getElementById('permisoInfoPlanta').textContent = planta;
        document.getElementById('permisoInfoAerogenerador').textContent = aerogenerador;
        
        document.getElementById('fechaInicioTrabajos').value = '';
        document.getElementById('fechaFinTrabajos').value = '';
        document.getElementById('fechaParadaTurbina').value = '';
        document.getElementById('fechaPuestaMarcha').value = '';
        document.getElementById('observacionesCierre').value = 'Trabajo completado seg\xFAn programaci\xF3n';
        materialesParaCierre = [];
        updateMaterialesList();
        
        document.getElementById('confirmarCierreBtn').dataset.permisoId = permisoId;
        document.getElementById('cerrarPermisoModal').style.display = 'flex';
    };
    
    // Funci\xF3n auxiliar para escapar comillas en strings de JavaScript
    function escapeJsString(str) {
        return (str || '').replace(/'/g, '\\'');
    }
    
    // Funci\xF3n para reenviar cierre rechazado
    window.openReenviarCierreModal = async function(permisoId, numeroPT, planta, aerogenerador) {
        try {
            // Obtener detalles del permiso rechazado
            const response = await ClientSecurity.makeSecureRequest('/permiso-detalle?id=' + permisoId);
            if (!response.success) {
                throw new Error('Error al obtener detalles del permiso: ' + (response.error || 'Error desconocido'));
            }
            const permiso = response.permiso;
            
            // Mostrar alerta informativa con el motivo de rechazo
            if (permiso.motivo_rechazo) {
                const confirmReenvio = confirm(
                    'ATENCION: Este permiso fue RECHAZADO\\n\\n' +
                    'MOTIVO DEL RECHAZO:\\n' + permiso.motivo_rechazo + '\\n\\n' +
                    'Desea corregir los errores y reenviar el cierre?'
                );
                if (!confirmReenvio) return;
            }
            
            // Pre-cargar el modal con datos anteriores
            document.querySelector('#cerrarPermisoModal h3').textContent = '\u{1F504} REENVIAR CIERRE - ' + numeroPT;
            document.getElementById('permisoInfoNumero').textContent = numeroPT;
            document.getElementById('permisoInfoPlanta').textContent = planta;
            document.getElementById('permisoInfoAerogenerador').textContent = aerogenerador;
            
            // Funci\xF3n auxiliar para convertir fecha de forma segura
            const safeDateToISOString = (dateString) => {
                if (!dateString || dateString === null) return '';
                try {
                    const date = new Date(dateString + 'T00:00:00');
                    if (isNaN(date.getTime())) return '';
                    return date.toISOString().split('T')[0];
                } catch (e) {
                    return '';
                }
            };
            
            // Pre-poblar campos con datos existentes (verificando que existan)
            const fechaInicioEl = document.getElementById('fechaInicioTrabajos');
            if (fechaInicioEl) fechaInicioEl.value = safeDateToISOString(permiso.fecha_inicio_trabajos);
            
            const fechaFinEl = document.getElementById('fechaFinTrabajos');
            if (fechaFinEl) fechaFinEl.value = safeDateToISOString(permiso.fecha_fin_trabajos);
            
            const fechaParadaEl = document.getElementById('fechaParadaTurbina');
            if (fechaParadaEl) fechaParadaEl.value = safeDateToISOString(permiso.fecha_parada_turbina);
            
            const fechaPuestaEl = document.getElementById('fechaPuestaMarcha');
            if (fechaPuestaEl) fechaPuestaEl.value = safeDateToISOString(permiso.fecha_puesta_marcha_turbina);
            
            // Agregar contexto de reenv\xEDo a las observaciones
            const observacionesEl = document.getElementById('observacionesCierre');
            if (observacionesEl) {
                const observacionesActuales = permiso.observaciones_cierre || 'Trabajo completado seg\xFAn programaci\xF3n';
                const contextoReenvio = 'REENVIO - Correccion aplicada tras rechazo:\\n"' + (permiso.motivo_rechazo || 'Sin motivo especifico') + '"\\n\\n' + observacionesActuales;
                observacionesEl.value = contextoReenvio;
            }
            
            // Pre-cargar materiales existentes
            materialesParaCierre = [];
            if (permiso.materiales_detalle && permiso.materiales_detalle.length > 0) {
                permiso.materiales_detalle.forEach(mat => {
                    materialesParaCierre.push({
                        descripcion: mat.material_nombre || '',
                        cantidad: mat.material_cantidad || 1,
                        propietario: mat.material_propietario || 'ENEL',
                        almacen: mat.material_almacen || 'PRINCIPAL',
                        numeroItem: mat.numero_item || '',
                        numeroSerie: mat.numero_serie || ''
                    });
                });
            }
            updateMaterialesList();
            
            // Agregar banner informativo
            const modal = document.getElementById('cerrarPermisoModal');
            if (!modal) {
                throw new Error('Modal de cierre no encontrado');
            }
            let banner = modal.querySelector('.reenvio-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.className = 'reenvio-banner';
                banner.style.cssText = 
                    'background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); ' +
                    'border: 2px solid #ffc107; ' +
                    'border-radius: 8px; ' +
                    'padding: 15px; ' +
                    'margin: 0 0 20px 0; ' +
                    'color: #856404; ' +
                    'font-weight: 600; ' +
                    'box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);';
                banner.innerHTML = 
                    '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">' +
                        '<span style="font-size: 20px;">\u{1F504}</span>' +
                        '<span style="font-size: 16px;">MODO REENV\xCDO - CIERRE RECHAZADO</span>' +
                    '</div>' +
                    '<div style="font-size: 13px; font-weight: 500; line-height: 1.4;">' +
                        '\u26A0\uFE0F Este permiso fue rechazado previamente. Revise y corrija los datos antes de reenviar.' +
                    '</div>';
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent && modalContent.firstElementChild) {
                    const firstChild = modalContent.firstElementChild;
                    firstChild.parentNode.insertBefore(banner, firstChild.nextSibling);
                } else {
                    // Si no encuentra .modal-content, insertarlo al inicio del modal
                    modal.insertBefore(banner, modal.firstChild);
                }
            }
            
            const confirmarBtn = document.getElementById('confirmarCierreBtn');
            if (confirmarBtn) confirmarBtn.dataset.permisoId = permisoId;
            
            if (modal) modal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error al abrir modal de reenv\xEDo:', error);
            alert('Error al cargar los datos del permiso. Intente nuevamente.');
        }
    };
    
    function closeCerrarModal() {
        // Limpiar banner de reenv\xEDo al cerrar
        const modal = document.getElementById('cerrarPermisoModal');
        const banner = modal.querySelector('.reenvio-banner');
        if (banner) {
            banner.remove();
        }
        
        // Restaurar t\xEDtulo original
        document.querySelector('#cerrarPermisoModal h3').textContent = 'CERRAR PERMISO DE TRABAJO';
        document.getElementById('permisoInfoNumero').textContent = '';
        document.getElementById('permisoInfoPlanta').textContent = '';
        document.getElementById('permisoInfoAerogenerador').textContent = '';
        
        document.getElementById('cerrarPermisoModal').style.display = 'none';
    }
    
    function addMaterial() {
        const descripcion = ClientSecurity.sanitizeInput(document.getElementById('materialDescripcion').value);
        const cantidad = parseInt(document.getElementById('materialCantidad').value) || 1;
        const propietario = document.getElementById('materialPropietario').value;
        const almacen = document.getElementById('materialAlmacen').value;
        const numeroItem = ClientSecurity.sanitizeInput(document.getElementById('materialNumeroItem').value);
        const numeroSerie = ClientSecurity.sanitizeInput(document.getElementById('materialNumeroSerie').value);
        
        if (!descripcion) {
            alert('Ingrese la descripci\xF3n del material');
            return;
        }
        
        materialesParaCierre.push({
            descripcion,
            cantidad,
            propietario,
            almacen,
            numeroItem,
            numeroSerie
        });
        
        document.getElementById('materialDescripcion').value = '';
        document.getElementById('materialCantidad').value = '1';
        document.getElementById('materialNumeroItem').value = '';
        document.getElementById('materialNumeroSerie').value = '';
        
        updateMaterialesList();
    }
    
    function updateMaterialesList() {
        const container = document.getElementById('materialesLista');
        
        if (materialesParaCierre.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay materiales agregados</div>';
            return;
        }
        
        container.innerHTML = '';
        materialesParaCierre.forEach((material, index) => {
            const item = document.createElement('div');
            item.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--border-color);';
            item.innerHTML = \`
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>\${material.descripcion}</strong><br>
                        <small>Cantidad: \${material.cantidad} | Propietario: \${material.propietario} | Almac\xE9n: \${material.almacen}</small>
                        \${material.numeroItem ? \`<br><small>Item: \${material.numeroItem}</small>\` : ''}
                        \${material.numeroSerie ? \`<br><small>Serie: \${material.numeroSerie}</small>\` : ''}
                    </div>
                    <button onclick="removeMaterial(\${index})" class="btn btn-danger btn-small">X</button>
                </div>
            \`;
            container.appendChild(item);
        });
    }
    
    window.removeMaterial = function(index) {
        materialesParaCierre.splice(index, 1);
        updateMaterialesList();
    };
    
    async function handleConfirmarCierre() {
        const permisoId = parseInt(document.getElementById('confirmarCierreBtn').dataset.permisoId);
        const fechaFinTrabajos = document.getElementById('fechaFinTrabajos').value;
        
        if (!fechaFinTrabajos) {
            alert('La fecha de fin de trabajos es obligatoria');
            return;
        }
        
        if (!confirm('\xBFEst\xE1 seguro de cerrar este permiso?')) return;
        
        const cierreData = {
            permisoId: permisoId,
            usuarioCierre: currentUser?.email || 'unknown',
            fechaInicioTrabajos: document.getElementById('fechaInicioTrabajos').value,
            fechaFinTrabajos: fechaFinTrabajos,
            fechaParadaTurbina: document.getElementById('fechaParadaTurbina').value,
            fechaPuestaMarcha: document.getElementById('fechaPuestaMarcha').value,
            observacionesCierre: ClientSecurity.sanitizeInput(document.getElementById('observacionesCierre').value),
            materiales: materialesParaCierre
        };
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/cerrar-permiso', {
                method: 'POST',
                body: JSON.stringify(cierreData)
            });
            
            if (response.success) {
                alert('Permiso cerrado exitosamente');
                closeCerrarModal();
                await loadPermisos();
            } else {
                alert('Error al cerrar el permiso: ' + (response.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error cerrando permiso:', error);
            alert('Error al cerrar el permiso');
        }
    }
    
    // ========================================================================
    // GENERAR REGISTRO PDF (sin cambios)
    // ========================================================================
    
    async function generateRegister() {
        const plantaSelect = document.getElementById('planta');
        const aerogeneradorSelect = document.getElementById('aerogenerador');
        const jefeFaenaSelect = document.getElementById('jefeFaena');
        
        const data = {
            planta: plantaSelect.value,
            aerogenerador: aerogeneradorSelect.value,
            descripcion: document.getElementById('descripcion').value,
            jefeFaena: jefeFaenaSelect.value,
            tipoMantenimiento: document.getElementById('tipoMantenimiento').value,
            tipoMantenimientoOtros: document.getElementById('tipoOtros').value,
            personal: personalSeleccionado,
            actividadesRutinarias: actividadesSeleccionadas.filter(a => a.tipo === 'RUTINARIA').map(a => a.nombre)
        };
        
        if (!data.planta || !data.descripcion || !data.jefeFaena) {
            alert('Complete los campos obligatorios antes de generar el registro');
            return;
        }
        
        try {
            const response = await fetch(API_BASE + '/generate-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken ? 'Bearer ' + authToken : ''
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const html = await response.text();
                const newWindow = window.open('', '_blank');
                newWindow.document.write(html);
                newWindow.document.close();
            } else {
                alert('Error al generar el registro');
            }
        } catch (error) {
            console.error('Error generando registro:', error);
            alert('Error al generar el registro');
        }
    }
    
    // ========================================================================
    // FUNCIONES AUXILIARES
    // ========================================================================
    
    function switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
        document.getElementById('tab-' + tabName).classList.add('active');
        
        if (tabName === 'datos' && currentUser?.rol === 'ADMIN') {
            loadDatosTab();
        } else if (tabName === 'admin-usuarios' && currentUser?.rol === 'ADMIN') {
            loadUsuarios();
        }
    }
    
    async function loadDatosTab() {
        const parquesContainer = document.getElementById('parquesContainer');
        if (parquesContainer && parquesData) {
            parquesContainer.innerHTML = '<p>Total: ' + parquesData.length + ' parques</p>';
            parquesData.forEach(parque => {
                parquesContainer.innerHTML += '<div>\u2022 ' + parque.nombre + '</div>';
            });
        }
        
        const personalContainer = document.getElementById('personalContainer');
        if (personalContainer && personalData) {
            personalContainer.innerHTML = '<p>Total: ' + personalData.length + ' personas</p>';
        }
        
        const supervisoresContainer = document.getElementById('supervisoresContainer');
        if (supervisoresContainer && supervisoresData) {
            supervisoresContainer.innerHTML = '<p>Total: ' + supervisoresData.length + ' supervisores</p>';
        }
        
        const actividadesContainer = document.getElementById('actividadesContainer');
        if (actividadesContainer && actividadesData) {
            actividadesContainer.innerHTML = '<p>Total: ' + actividadesData.length + ' actividades</p>';
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inv\xE1lida';
        }
    }
    
    async function checkConnectionStatus() {
        const statusDiv = document.getElementById('connectionStatus');
        
        try {
            const response = await fetch(API_BASE + '/health');
            const data = await response.json();
            
            if (data.status === 'OK') {
                statusDiv.textContent = 'Sistema conectado y operativo';
                statusDiv.className = 'status-indicator status-online';
            } else {
                statusDiv.textContent = 'Sistema con problemas de conexi\xF3n';
                statusDiv.className = 'status-indicator status-offline';
            }
        } catch (error) {
            statusDiv.textContent = 'Sin conexi\xF3n al servidor';
            statusDiv.className = 'status-indicator status-offline';
        }
    }
    
    // ========================================================================
    // AUTO-LOGOUT POR INACTIVIDAD
    // ========================================================================
    
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            alert('Su sesi\xF3n ha expirado por inactividad');
            handleLogout();
        }, INACTIVITY_TIMEOUT);
    }
    
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });
    
    resetInactivityTimer();
    
    // ========================================================================
    // FUNCIONES DE EXPORTACI\xD3N CON MODAL
    // ========================================================================
    
    let currentExportPermisoId = null;
    let currentExportPermisoInfo = null;
    
    window.openExportModal = function(permisoId, permisoInfo) {
        currentExportPermisoId = permisoId;
        currentExportPermisoInfo = permisoInfo;
        
        document.getElementById('exportPermisoInfo').textContent = permisoInfo || \`ID: \${permisoId}\`;
        document.getElementById('exportModal').style.display = 'flex';
        
        // Reset status
        document.getElementById('exportStatus').style.display = 'none';
        document.getElementById('exportExcelBtn').disabled = false;
        document.getElementById('exportPdfBtn').disabled = false;
    };
    
    window.closeExportModal = function() {
        document.getElementById('exportModal').style.display = 'none';
        currentExportPermisoId = null;
        currentExportPermisoInfo = null;
    };
    
    async function executeExport(formato) {
        if (!currentExportPermisoId) return;
        
        try {
            // Mostrar estado de carga
            document.getElementById('exportStatus').style.display = 'block';
            document.getElementById('exportStatusText').textContent = \`Generando \${formato.toUpperCase()}...\`;
            document.getElementById('exportExcelBtn').disabled = true;
            document.getElementById('exportPdfBtn').disabled = true;
            
            const fechaActual = new Date().toISOString().split('T')[0].replace(/-/g, '');
            let endpoint, filename;
            if (formato === 'excel') {
                endpoint = \`\${API_BASE}/exportar-permiso-excel?id=\${currentExportPermisoId}\`;
                filename = \`\${currentExportPermisoInfo}_\${fechaActual}.csv\`;
            } else {
                endpoint = \`\${API_BASE}/exportar-permiso-pdf?id=\${currentExportPermisoId}\`;
                filename = \`\${currentExportPermisoInfo}_\${fechaActual}.html\`;
            }
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(errorData.error || \`Error HTTP: \${response.status}\`);
            }
            
            // DIFERENCIACI\xD3N: PDF vs Excel
            if (formato === 'pdf') {
                // Para PDF (HTML): Abrir en nueva ventana como generateRegister
                document.getElementById('exportStatusText').textContent = 'Abriendo vista para imprimir...';
                
                const html = await response.text();
                const newWindow = window.open('', '_blank');
                newWindow.document.write(html);
                newWindow.document.close();
                
                // Reset UI y cerrar modal inmediatamente
                document.getElementById('exportStatus').style.display = 'none';
                document.getElementById('exportExcelBtn').disabled = false;
                document.getElementById('exportPdfBtn').disabled = false;
                showMessage('PDF abierto para imprimir', 'success');
                closeExportModal();
                
            } else {
                // Para Excel: Descargar archivo como antes
                document.getElementById('exportStatusText').textContent = 'Descargando archivo...';
                
                const blob = await response.blob();
                
                // Verificar que el blob tiene contenido
                if (blob.size === 0) {
                    throw new Error('El archivo generado est\xE1 vac\xEDo');
                }
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }, 100);
                
                // Reset UI y cerrar modal despu\xE9s de la descarga
                document.getElementById('exportStatusText').textContent = 'Descarga completada';
                setTimeout(() => {
                    document.getElementById('exportStatus').style.display = 'none';
                    document.getElementById('exportExcelBtn').disabled = false;
                    document.getElementById('exportPdfBtn').disabled = false;
                    showMessage(\`Archivo \${formato.toUpperCase()} descargado exitosamente\`, 'success');
                    closeExportModal();
                }, 1500);
            }
            
        } catch (error) {
            console.error('Error exportando:', error);
            showMessage(\`Error al generar archivo \${formato.toUpperCase()}: \${error.message}\`, 'error');
            
            // Reset UI
            document.getElementById('exportStatus').style.display = 'none';
            document.getElementById('exportExcelBtn').disabled = false;
            document.getElementById('exportPdfBtn').disabled = false;
        }
    }
    
    // Funci\xF3n auxiliar para mostrar mensajes
    function showMessage(message, type = 'info') {
        // Usar alert simple por ahora
        alert(message);
    }
    
    // Event listeners para el modal de exportaci\xF3n
    document.addEventListener('DOMContentLoaded', function() {
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        const cancelExportBtn = document.getElementById('cancelExportBtn');
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => executeExport('excel'));
        }
        
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => executeExport('pdf'));
        }
        
        if (cancelExportBtn) {
            cancelExportBtn.addEventListener('click', closeExportModal);
        }
        
        // Cerrar modal al hacer clic fuera
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', function(event) {
                if (event.target === exportModal) {
                    closeExportModal();
                }
            });
        }
    });
    
    // Funci\xF3n para editar un permiso existente
    window.editarPermiso = async function(permisoId) {
        console.log('Iniciando edici\xF3n de permiso ID:', permisoId);
        try {
            // Obtener los datos completos del permiso
            const response = await ClientSecurity.makeSecureRequest(\`/permiso-detalle?id=\${permisoId}\`);
            
            if (!response.success) {
                alert('Error al cargar los datos del permiso: ' + (response.error || 'Error desconocido'));
                return;
            }
            
            const permiso = response.permiso;
            
            // Verificar que el permiso est\xE9 en estado CREADO
            if (permiso.estado !== 'CREADO') {
                alert('Solo se pueden editar permisos en estado CREADO');
                return;
            }
            
            // Cambiar a la pesta\xF1a de nuevo permiso
            const nuevoTab = document.querySelector('[data-tab="nuevo"]');
            const tabs = document.querySelectorAll('.tab');
            const contents = document.querySelectorAll('.tab-content');
            
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            
            nuevoTab.classList.add('active');
            document.getElementById('tab-nuevo').classList.add('active');
            
            // Rellenar el formulario con los datos del permiso
            await llenarFormularioEdicion(permiso);
            
            // Indicar que se est\xE1 editando
            window.permisoEditando = permisoId;
            const submitBtn = document.querySelector('#permisoForm button[type="submit"]');
            console.log('Bot\xF3n encontrado:', submitBtn);
            if (submitBtn) {
                submitBtn.textContent = 'ACTUALIZAR PERMISO DE TRABAJO';
                console.log('Texto del bot\xF3n cambiado a:', submitBtn.textContent);
            } else {
                console.error('No se encontr\xF3 el bot\xF3n de submit');
            }
            
            alert('Permiso cargado para edici\xF3n');
            
        } catch (error) {
            console.error('Error editando permiso:', error);
            alert('Error al cargar el permiso para edici\xF3n: ' + error.message);
        }
    };
    
    async function llenarFormularioEdicion(permiso) {
        console.log('Llenando formulario para edici\xF3n con permiso:', permiso);
        // Llenar campos b\xE1sicos
        document.getElementById('planta').value = permiso.planta_id || '';
        document.getElementById('descripcion').value = permiso.descripcion || '';
        document.getElementById('tipoMantenimiento').value = permiso.tipo_mantenimiento || '';
        
        if (permiso.tipo_mantenimiento === 'OTROS' && permiso.tipo_otros) {
            document.getElementById('tipoOtros').value = permiso.tipo_otros;
            document.getElementById('tipoOtrosContainer').style.display = 'block';
        }
        
        // Disparar eventos para cargar datos dependientes
        if (permiso.planta_id) {
            // Simular evento de cambio de planta para cargar aerogeneradores y personal
            const plantaSelect = document.getElementById('planta');
            const fakeEvent = { target: plantaSelect };
            await handlePlantaChange(fakeEvent);
            
            // Seleccionar aerogenerador
            if (permiso.aerogenerador_id) {
                document.getElementById('aerogenerador').value = permiso.aerogenerador_id;
            }
            
            // Seleccionar jefe de faena
            if (permiso.jefe_faena_id) {
                document.getElementById('jefeFaena').value = permiso.jefe_faena_id;
            }
            
            // Seleccionar supervisor
            if (permiso.supervisor_parque_id) {
                document.getElementById('supervisorParque').value = permiso.supervisor_parque_id;
            }
        }
        
        // Marcar actividades seleccionadas
        if (permiso.actividades_ids) {
            const actividadIds = permiso.actividades_ids.split(',').map(id => id.trim());
            actividadIds.forEach(actividadId => {
                const checkbox = document.querySelector(\`input[name="actividades"][value="\${actividadId}"]\`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // Actualizar matriz de riesgos
            updateMatrizDisplay();
        }
        
        // Cargar personal seleccionado
        if (permiso.personal_ids) {
            personalSeleccionado = [];
            const personalIds = permiso.personal_ids.split(',').map(id => id.trim());
            
            // Buscar el personal en los datos cargados
            const plantaNombre = document.querySelector('#planta option:checked')?.textContent;
            if (plantaNombre && personalByParque[plantaNombre]) {
                personalIds.forEach(personalId => {
                    const persona = personalByParque[plantaNombre].find(p => p.id.toString() === personalId);
                    if (persona) {
                        personalSeleccionado.push(persona);
                    }
                });
                
                // Actualizar la vista del personal seleccionado
                const seleccionadoContainer = document.getElementById('personalSeleccionado');
                if (seleccionadoContainer && personalSeleccionado.length > 0) {
                    seleccionadoContainer.innerHTML = '';
                    personalSeleccionado.forEach(persona => {
                        const item = document.createElement('div');
                        item.className = 'selector-item';
                        item.innerHTML = '<strong>' + persona.nombre + '</strong><br><small>' + (persona.empresa || 'Sin empresa') + ' - ' + (persona.rol || 'Sin rol') + '</small>';
                        item.dataset.id = persona.id;
                        item.dataset.nombre = persona.nombre;
                        item.dataset.empresa = persona.empresa || '';
                        item.dataset.rol = persona.rol || '';
                        item.dataset.rut = persona.rut || '';
                        item.addEventListener('click', () => togglePersonalSelection(item));
                        seleccionadoContainer.appendChild(item);
                    });
                }
            }
        }
    }
    
    // ========================================================================
    // DETECCI\xD3N DE ACTIVIDAD PARA AUTO-LOGOUT
    // ========================================================================
    
    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    function setupActivityListeners() {
        activityEvents.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });
    }
    
    // Configurar listeners cuando se cargue la aplicaci\xF3n
    if (typeof window !== 'undefined') {
        setupActivityListeners();
    }
    
    // ========================================================================
    // ADMINISTRACI\xD3N DE USUARIOS
    // ========================================================================
    
    let usuarioEditando = null;
    
    async function loadUsuarios() {
        const container = document.getElementById('usuariosContainer');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="loading">Cargando usuarios...</div>';
            
            const response = await ClientSecurity.makeSecureRequest('/admin-users');
            
            if (!response.success) {
                container.innerHTML = '<div class="error">Error al cargar usuarios: ' + (response.error || 'Error desconocido') + '</div>';
                return;
            }
            
            const usuarios = response.users || [];
            
            if (usuarios.length === 0) {
                container.innerHTML = '<div class="no-data">No hay usuarios registrados</div>';
                return;
            }
            
            // Crear tabla de usuarios
            let html = '';
            html += '<div class="table-responsive">';
            html += '<table class="data-table">';
            html += '<thead>';
            html += '<tr>';
            html += '<th>Usuario</th>';
            html += '<th>Email</th>';
            html += '<th>Rol</th>';
            html += '<th>Empresa</th>';
            html += '<th>Parques Autorizados</th>';
            html += '<th>Estado</th>';
            html += '<th>Password Temporal</th>';
            html += '<th>Acciones</th>';
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';
            
            usuarios.forEach(usuario => {
                html += '<tr>';
                html += '<td>' + ClientSecurity.encodeHTML(usuario.usuario || '') + '</td>';
                html += '<td>' + ClientSecurity.encodeHTML(usuario.email || '') + '</td>';
                html += '<td><span class="badge badge-' + getRoleBadgeClass(usuario.rol) + '">' + ClientSecurity.encodeHTML(usuario.rol || '') + '</span></td>';
                html += '<td>' + ClientSecurity.encodeHTML(usuario.empresa || '') + '</td>';
                html += '<td>' + ClientSecurity.encodeHTML(usuario.parques_autorizados || '') + '</td>';
                html += '<td><span class="badge badge-' + (usuario.estado === 'Activo' ? 'success' : 'danger') + '">' + ClientSecurity.encodeHTML(usuario.estado || '') + '</span></td>';
                html += '<td><span class="badge badge-' + (usuario.password_temporal ? 'warning' : 'success') + '">' + (usuario.password_temporal ? 'S\xED' : 'No') + '</span></td>';
                html += '<td>';
                html += '<button class="btn btn-small btn-secondary" onclick="editarUsuario(' + usuario.id + ')" title="Editar">\u270F\uFE0F</button>';
                html += '<button class="btn btn-small btn-danger" onclick="confirmarEliminarUsuario(' + usuario.id + ', &#39;' + ClientSecurity.encodeHTML(usuario.usuario) + '&#39;)" title="Eliminar" style="margin-left: 4px;">\u{1F5D1}\uFE0F</button>';
                html += '</td>';
                html += '</tr>';
            });
            
            html += '</tbody></table></div>';
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            container.innerHTML = '<div class="error">Error de conexi\xF3n al cargar usuarios</div>';
        }
    }
    
    function getRoleBadgeClass(rol) {
        switch(rol?.toLowerCase()) {
            case 'admin': return 'primary';
            case 'supervisor': return 'warning';
            case 'operador': return 'info';
            default: return 'secondary';
        }
    }
    
    function openNuevoUsuarioModal() {
        usuarioEditando = null;
        document.getElementById('usuarioModalTitle').textContent = 'Nuevo Usuario';
        document.getElementById('usuarioForm').reset();
        document.getElementById('modalPassword').placeholder = 'Contrase\xF1a requerida';
        document.getElementById('modalPassword').required = true;
        document.getElementById('usuarioError').style.display = 'none';
        document.getElementById('usuarioModal').style.display = 'flex';
    }
    
    async function editarUsuario(userId) {
        try {
            const response = await ClientSecurity.makeSecureRequest('/admin-users/' + userId);
            
            if (!response.success) {
                alert('Error al cargar datos del usuario: ' + (response.error || 'Error desconocido'));
                return;
            }
            
            const usuario = response.user;
            usuarioEditando = userId;
            
            document.getElementById('usuarioModalTitle').textContent = 'Editar Usuario';
            document.getElementById('modalUsuario').value = usuario.usuario || '';
            document.getElementById('modalEmail').value = usuario.email || '';
            document.getElementById('modalPassword').value = '';
            document.getElementById('modalPassword').placeholder = 'Dejar vac\xEDo para mantener actual';
            document.getElementById('modalPassword').required = false;
            document.getElementById('modalRol').value = usuario.rol || '';
            document.getElementById('modalEmpresa').value = usuario.empresa || '';
            document.getElementById('modalParquesAutorizados').value = usuario.parques_autorizados || '';
            document.getElementById('modalEstado').value = usuario.estado || 'Activo';
            document.getElementById('modalPasswordTemporal').checked = usuario.password_temporal || false;
            document.getElementById('usuarioError').style.display = 'none';
            document.getElementById('usuarioModal').style.display = 'flex';
            
        } catch (error) {
            console.error('Error cargando usuario:', error);
            alert('Error de conexi\xF3n al cargar usuario');
        }
    }
    
    async function handleGuardarUsuario(e) {
        e.preventDefault();
        
        const errorDiv = document.getElementById('usuarioError');
        const submitBtn = document.getElementById('guardarUsuarioBtn');
        
        errorDiv.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        try {
            const formData = {
                usuario: ClientSecurity.sanitizeInput(document.getElementById('modalUsuario').value),
                email: ClientSecurity.sanitizeInput(document.getElementById('modalEmail').value),
                rol: document.getElementById('modalRol').value,
                empresa: ClientSecurity.sanitizeInput(document.getElementById('modalEmpresa').value) || null,
                parques_autorizados: ClientSecurity.sanitizeInput(document.getElementById('modalParquesAutorizados').value) || null,
                estado: document.getElementById('modalEstado').value,
                password_temporal: document.getElementById('modalPasswordTemporal').checked
            };
            
            const password = document.getElementById('modalPassword').value;
            if (password) {
                formData.password = password;
            }
            
            // Validaciones
            if (!formData.usuario || !formData.email || !formData.rol) {
                errorDiv.textContent = 'Los campos Usuario, Email y Rol son requeridos';
                errorDiv.style.display = 'block';
                return;
            }
            
            if (!usuarioEditando && !password) {
                errorDiv.textContent = 'La contrase\xF1a es requerida para nuevos usuarios';
                errorDiv.style.display = 'block';
                return;
            }
            
            const url = usuarioEditando ? '/admin-users/' + usuarioEditando : '/admin-users';
            const method = usuarioEditando ? 'PUT' : 'POST';
            
            const response = await ClientSecurity.makeSecureRequest(url, {
                method,
                body: JSON.stringify(formData)
            });
            
            if (!response.success) {
                errorDiv.textContent = response.error || 'Error desconocido';
                errorDiv.style.display = 'block';
                return;
            }
            
            closeUsuarioModal();
            await loadUsuarios();
            showSuccessMessage(usuarioEditando ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
            
        } catch (error) {
            console.error('Error guardando usuario:', error);
            errorDiv.textContent = 'Error de conexi\xF3n';
            errorDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Usuario';
        }
    }
    
    function closeUsuarioModal() {
        document.getElementById('usuarioModal').style.display = 'none';
        usuarioEditando = null;
    }
    
    let usuarioIdEliminar = null;
    
    function confirmarEliminarUsuario(userId, userName) {
        usuarioIdEliminar = userId;
        document.getElementById('usuarioEliminarInfo').textContent = 'Usuario: ' + userName;
        document.getElementById('confirmarEliminarUsuarioModal').style.display = 'flex';
    }
    
    async function handleEliminarUsuario() {
        if (!usuarioIdEliminar) return;
        
        const confirmarBtn = document.getElementById('confirmarEliminarUsuarioBtn');
        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Eliminando...';
        
        try {
            const response = await ClientSecurity.makeSecureRequest('/admin-users/' + usuarioIdEliminar, {
                method: 'DELETE'
            });
            
            if (!response.success) {
                alert('Error al eliminar usuario: ' + (response.error || 'Error desconocido'));
                return;
            }
            
            closeConfirmarEliminarModal();
            await loadUsuarios();
            showSuccessMessage('Usuario eliminado correctamente');
            
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            alert('Error de conexi\xF3n al eliminar usuario');
        } finally {
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = 'Eliminar Usuario';
        }
    }
    
    function closeConfirmarEliminarModal() {
        document.getElementById('confirmarEliminarUsuarioModal').style.display = 'none';
        usuarioIdEliminar = null;
    }
    
    function showSuccessMessage(message) {
        // Crear y mostrar mensaje de \xE9xito temporal
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--success-color); color: white; padding: 16px 24px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 500;';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    // Hacer funciones globales para usar en onclick
    window.editarUsuario = editarUsuario;
    window.confirmarEliminarUsuario = confirmarEliminarUsuario;
    
    // Sistema de seguridad activo - D1 Database Edition
  `;
}
__name(getWebAppScript, "getWebAppScript");
var script_default = getWebAppScript;

// src/core/webapp/template.js
function getWebApp() {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>PT Wind - Sistema de Gesti\xF3n de Permisos</title><link rel="manifest" href="data:application/json;base64,eyJuYW1lIjoiUFQgV2luZCAtIFBlcm1pc29zIGRlIFRyYWJham8iLCJzaG9ydF9uYW1lIjoiUFQgV2luZCIsInN0YXJ0X3VybCI6Ii8iLCJkaXNwbGF5Ijoic3RhbmRhbG9uZSIsImJhY2tncm91bmRfY29sb3IiOiIjZmZmZmZmIiwidGhlbWVfY29sb3IiOiIjMWExZjJlIiwiaWNvbnMiOlt7InNyYyI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1USTRJaUJvWldsbmFIUTlJakV5T0NJZ2RtbGxkMEp2ZUQwaU1DQXdJREV5T0NBeE1qZ2lJSGh0Ykc1elBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SStQSEpsWTNRZ2VEMGlOQ0lnZVQwaU5DSWdkMmxrZEdnOUlqRXlNQ0lnYUdWcFoyaDBQU0l4TWpBaUlHWnBiR3c5SWlNeFlURm1NbVVpTHo0OEwzTjJaejQ9IiwidHlwZSI6ImltYWdlL3N2Zyt4bWwiLCJzaXplcyI6IjEyOHgxMjgifV19"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"><style>' + styles_default() + '</style></head><body><div class="container"><!-- Pantalla de Login --><div id="loginScreen" class="login-container"><div class="logo"><h1>PT WIND</h1><p>Sistema de Gesti\xF3n de Permisos de Trabajo</p></div><form id="loginForm"><div class="form-group"><label for="usuario">Usuario / Email</label><input type="text" id="usuario" required placeholder="Ingrese su usuario o email" autocomplete="username"></div><div class="form-group"><label for="password">Contrase\xF1a</label><input type="password" id="password" required placeholder="Ingrese su contrase\xF1a" autocomplete="current-password"></div><button type="submit" class="btn" id="loginBtn">Iniciar Sesi\xF3n</button><div id="loginError" class="error" style="display: none; margin-top: 16px;"></div></form><div id="connectionStatus" class="status-indicator status-offline" style="margin-top: 24px; text-align: center;">Verificando conexi\xF3n...</div></div><!-- Aplicaci\xF3n Principal --><div id="appScreen" class="app-container"><div class="header"><div><h1>PT WIND</h1><p>Sistema de Gesti\xF3n de Permisos de Trabajo</p></div><div style="display: flex; align-items: center; gap: 16px;"><span id="userDisplay"></span><button id="logoutBtn" class="btn btn-secondary btn-small">CERRAR SESI\xD3N</button></div></div><div class="tabs"><button class="tab active" data-tab="nuevo">Nuevo Permiso</button><button class="tab" data-tab="consultar">Consultar Permisos</button><button class="tab" data-tab="matriz">Matriz de Riesgos</button><button class="tab" data-tab="datos" id="tabDatos" style="display: none;">Datos del Sistema</button><button class="tab" data-tab="admin-usuarios" id="tabAdminUsuarios" style="display: none;">Administraci\xF3n de Usuarios</button></div><!-- Tab: Nuevo Permiso --><div id="tab-nuevo" class="tab-content active"><form id="permisoForm"><div class="grid-three"><!-- Columna 1: Antecedentes Generales --><div class="card"><h3>Antecedentes Generales</h3><div class="form-group"><label for="planta">Planta *</label><select id="planta" required><option value="">Seleccionar planta...</option></select></div><div class="form-group"><label for="aerogenerador">Aerogenerador *</label><select id="aerogenerador" required><option value="">Seleccionar aerogenerador...</option></select></div><div class="form-group"><label for="descripcion">Descripci\xF3n de Actividades *</label><textarea id="descripcion" rows="4" required placeholder="Describa las actividades a realizar..."></textarea></div></div><!-- Columna 2: Responsables --><div class="card"><h3>Responsables</h3><div class="form-group"><label for="jefeFaena">Jefe de Faena *</label><select id="jefeFaena" required><option value="">Seleccionar jefe de faena...</option></select></div><div class="form-group"><label for="supervisorParque">Supervisor de Parque</label><select id="supervisorParque"><option value="">Seleccionar supervisor de parque...</option></select></div><div class="form-group"><label for="tipoMantenimiento">Tipo de Mantenimiento *</label><select id="tipoMantenimiento" required><option value="">Seleccionar tipo...</option><option value="PREVENTIVO">Mantenimiento Preventivo</option><option value="CORRECTIVO">Peque\xF1o Correctivo</option><option value="GRAN_CORRECTIVO">Gran Correctivo</option><option value="PREDICTIVO">Mantenimiento Predictivo</option><option value="INSPECCION">Inspecci\xF3n T\xE9cnica</option><option value="OTROS">Otros</option></select></div><div class="form-group input-others" id="tipoOtrosContainer"><label for="tipoOtros">Especificar Tipo *</label><input type="text" id="tipoOtros" placeholder="Especifique el tipo de mantenimiento..."></div></div><!-- Columna 3: Actividades --><div class="card"><h3>Actividades Rutinarias</h3><div class="form-group"><label>Seleccione las Actividades</label><div id="actividadesChecklist" class="checkbox-list"><div class="loading">Cargando actividades...</div></div></div></div></div><!-- Personal Asignado - Fila completa --><div class="card" style="margin-top: 24px;"><h3>Personal Asignado</h3><div class="selector-dual"><div><label style="display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Personal Disponible</label><div id="personalDisponible" class="selector-list"><div class="loading">Seleccione una planta primero</div></div></div><div class="selector-controls"><button type="button" class="btn btn-secondary btn-small" id="addPersonalBtn">\u2192</button><button type="button" class="btn btn-secondary btn-small" id="removePersonalBtn">\u2190</button></div><div><label style="display: block; margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Personal Seleccionado</label><div id="personalSeleccionado" class="selector-list"><div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay personal seleccionado</div></div></div></div></div><div style="margin-top: 32px; display: flex; gap: 16px; flex-wrap: wrap;"><button type="submit" class="btn" style="flex: 1; min-width: 200px;">CREAR PERMISO DE TRABAJO</button><button type="button" id="generateRegisterBtn" class="btn btn-secondary" style="flex: 1; min-width: 200px;">GENERAR REGISTRO PDF</button></div></form></div><!-- Tab: Consultar --><div id="tab-consultar" class="tab-content"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;"><h3 style="color: var(--primary-color); font-size: 18px; font-weight: 600;">Consultar Permisos de Trabajo</h3><button id="refreshPermisosBtn" class="btn btn-secondary btn-small">ACTUALIZAR</button></div><div class="search-box"><input type="text" id="searchPermiso" class="search-input" placeholder="Buscar por n\xFAmero de permiso, planta, descripci\xF3n..."><select id="filterEstado" class="search-input" style="max-width: 200px;"><option value="">Todos los estados</option><option value="CREADO">Creados</option><option value="ACTIVO">Activos</option><option value="CERRADO_PENDIENTE_APROBACION">Cerrados - Pendiente Aprobaci\xF3n</option><option value="CERRADO">Cerrados - Aprobados</option><option value="CIERRE_RECHAZADO">Cierre Rechazado</option></select><input type="date" id="fechaDesde" class="search-input" style="max-width: 150px;" title="Fecha desde - Filtra permisos creados desde esta fecha" placeholder="Fecha desde permiso"><input type="date" id="fechaHasta" class="search-input" style="max-width: 150px;" title="Fecha hasta - Filtra permisos creados hasta esta fecha" placeholder="Fecha hasta permiso"><button id="clearSearchBtn" class="btn btn-secondary btn-small">LIMPIAR</button></div><div id="permisosContainer" class="loading">Cargando permisos...</div></div><!-- Tab: Matriz de Riesgos --><div id="tab-matriz" class="tab-content"><h3 style="color: var(--primary-color); font-size: 18px; font-weight: 600; margin-bottom: 16px;">Matriz de Riesgos</h3><p style="margin-bottom: 24px; color: var(--text-secondary); font-size: 14px;">Seleccione actividades en la pesta\xF1a "Nuevo Permiso" para ver la matriz de riesgos aplicable.</p><div id="matrizContainer"><div id="matrizTable" class="data-table" style="display: none;"><table><thead><tr><th>C\xF3digo</th><th>Actividad</th><th>Peligro</th><th>Riesgo</th><th>Medidas Preventivas</th></tr></thead><tbody id="matrizTableBody"></tbody></table></div><div id="matrizEmptyState" class="loading">Seleccione actividades para ver la matriz de riesgos...</div></div></div><!-- Tab: Datos del Sistema --><div id="tab-datos" class="tab-content"><div style="display: flex; flex-direction: column; gap: 24px;"><div class="card"><h3>Parques E\xF3licos</h3><div id="parquesContainer" class="loading">Cargando parques...</div></div><div class="card"><h3>Personal</h3><div id="personalContainer" class="loading">Cargando personal...</div></div><div class="card"><h3>Supervisores</h3><div id="supervisoresContainer" class="loading">Cargando supervisores...</div></div><div class="card"><h3>Actividades</h3><div id="actividadesContainer" class="loading">Cargando actividades...</div></div></div></div><!-- Tab: Administraci\xF3n de Usuarios --><div id="tab-admin-usuarios" class="tab-content"><div class="card"><h3>Administraci\xF3n de Usuarios</h3><!-- Botones de acci\xF3n --><div style="margin-bottom: 24px;"><button id="btnNuevoUsuario" class="btn btn-primary">Nuevo Usuario</button><button id="btnRefreshUsuarios" class="btn btn-secondary" style="margin-left: 12px;">Actualizar Lista</button></div><!-- Lista de usuarios --><div id="usuariosContainer" class="loading">Cargando usuarios...</div></div></div></div></div><!-- MODAL PARA CERRAR PERMISO --><div id="cerrarPermisoModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;"><div style="background: white; border-radius: 8px; padding: 32px; max-width: 720px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;"><h3 style="margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;">CERRAR PERMISO DE TRABAJO</h3><!-- Informaci\xF3n del permiso --><div style="background: var(--bg-secondary); padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid var(--border-color);"><p style="margin-bottom: 8px;"><strong>Permiso:</strong> <span id="permisoInfoNumero"></span></p><p style="margin-bottom: 8px;"><strong>Planta:</strong> <span id="permisoInfoPlanta"></span></p><p style="margin-bottom: 0;"><strong>Aerogenerador:</strong> <span id="permisoInfoAerogenerador"></span></p></div><!-- Fechas y Tiempos --><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;"><div class="form-group"><label for="fechaInicioTrabajos">Fecha/Hora Inicio Trabajos</label><input type="datetime-local" id="fechaInicioTrabajos"></div><div class="form-group"><label for="fechaFinTrabajos">Fecha/Hora Fin Trabajos *</label><input type="datetime-local" id="fechaFinTrabajos" required></div></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;" id="turbinaContainer"><div class="form-group"><label for="fechaParadaTurbina">Fecha/Hora Parada Turbina</label><input type="datetime-local" id="fechaParadaTurbina"></div><div class="form-group"><label for="fechaPuestaMarcha">Fecha/Hora Puesta en Marcha</label><input type="datetime-local" id="fechaPuestaMarcha"></div></div><!-- Secci\xF3n de Materiales --><div style="margin-bottom: 24px; background: var(--bg-secondary); padding: 20px; border-radius: 6px; border: 1px solid var(--border-color);"><h4 style="margin-bottom: 16px; color: var(--primary-color); font-size: 16px; font-weight: 600;">MATERIALES/REPUESTOS UTILIZADOS</h4><div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; margin-bottom: 12px; align-items: end;"><div class="form-group" style="margin-bottom: 0;"><label for="materialDescripcion">Descripci\xF3n</label><input type="text" id="materialDescripcion" placeholder="Descripci\xF3n del material"></div><div class="form-group" style="margin-bottom: 0;"><label for="materialCantidad">Cantidad</label><input type="number" id="materialCantidad" min="1" value="1"></div><div class="form-group" style="margin-bottom: 0;"><label for="materialPropietario">Propietario</label><select id="materialPropietario"><option value="ENEL">ENEL</option><option value="CONTRATISTA">Contratista</option><option value="PROVEEDOR">Proveedor</option></select></div><div class="form-group" style="margin-bottom: 0;"><label for="materialAlmacen">Almac\xE9n</label><select id="materialAlmacen"><option value="Central">Central</option><option value="Sitio">Sitio</option><option value="Contratista">Contratista</option></select></div><button type="button" id="addMaterialBtn" class="btn btn-secondary btn-small">+</button></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;"><div class="form-group" style="margin-bottom: 0;"><label for="materialNumeroItem">N\xFAmero Item (Opcional)</label><input type="text" id="materialNumeroItem" placeholder="N\xB0 Item"></div><div class="form-group" style="margin-bottom: 0;"><label for="materialNumeroSerie">N\xFAmero Serie (Opcional)</label><input type="text" id="materialNumeroSerie" placeholder="N\xB0 Serie"></div></div><div id="materialesLista" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; background: white;"><div style="padding: 20px; text-align: center; color: var(--text-secondary);">No hay materiales agregados</div></div></div><!-- Observaciones de Cierre --><div class="form-group" style="margin-bottom: 24px;"><label for="observacionesCierre">Observaciones de Cierre</label><textarea id="observacionesCierre" rows="3" placeholder="Observaciones sobre el cierre del permiso...">Trabajo completado seg\xFAn programaci\xF3n</textarea></div><div style="display: flex; gap: 12px; justify-content: flex-end;"><button id="cancelarCierreBtn" class="btn btn-secondary btn-small">CANCELAR</button><button id="confirmarCierreBtn" class="btn btn-danger btn-small">CERRAR PERMISO</button></div></div></div><!-- MODAL DE EXPORTACI\xD3N --><div id="exportModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; align-items: center; justify-content: center;"><div style="background: white; border-radius: 12px; padding: 32px; max-width: 480px; width: 90%; margin: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"><div style="text-align: center; margin-bottom: 24px;"><h3 style="margin-bottom: 12px; color: var(--primary-color); font-size: 24px; font-weight: 700;">\u{1F4C1} Exportar Permiso</h3><p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Permiso: <strong id="exportPermisoInfo"></strong></p></div><div style="display: grid; gap: 16px; margin-bottom: 24px;"><button id="exportExcelBtn" class="btn" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; font-size: 16px;"><span style="font-size: 24px;">\u{1F4CA}</span><div style="text-align: left;"><div style="font-weight: 600;">Excel</div></div></button><button id="exportPdfBtn" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; font-size: 16px;"><span style="font-size: 24px;">\u{1F4C4}</span><div style="text-align: left;"><div style="font-weight: 600;">PDF para Imprimir</div></div></button></div><div id="exportStatus" style="display: none; text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 16px;"><div style="display: inline-block; width: 20px; height: 20px; border: 2px solid var(--primary-color); border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div><span id="exportStatusText">Generando archivo...</span></div><div style="text-align: center;"><button id="cancelExportBtn" class="btn btn-secondary btn-small">Cancelar</button></div></div></div><!-- MODAL DE CAMBIO DE CONTRAE\xD1A OBLIGATORIO --><div id="changePasswordModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; align-items: center; justify-content: center;"><div style="background: white; border-radius: 8px; padding: 32px; max-width: 480px; width: 90%; margin: 20px;"><h3 style="margin-bottom: 24px; color: var(--primary-color);">Cambio de Contrase\xF1a Obligatorio</h3><div id="passwordChangeReason" class="warning" style="background: rgba(243, 156, 18, 0.1); color: var(--warning-color); padding: 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid rgba(243, 156, 18, 0.2);">Por seguridad, debes cambiar tu contrase\xF1a.</div><div id="passwordRequirements" class="info" style="background: rgba(26, 31, 46, 0.05); padding: 16px; border-radius: 6px; margin-bottom: 20px; border: 1px solid rgba(26, 31, 46, 0.1); display: none;"><!-- Los requisitos se insertan din\xE1micamente --></div><div class="form-group"><label for="mandatoryNewPassword">Nueva Contrase\xF1a</label><input type="password" id="mandatoryNewPassword" required placeholder="M\xEDnimo 8 caracteres"></div><div class="form-group"><label for="mandatoryConfirmPassword">Confirmar Nueva Contrase\xF1a</label><input type="password" id="mandatoryConfirmPassword" required placeholder="Repite la contrase\xF1a"></div><div id="changePasswordError" class="error" style="display: none; margin-bottom: 16px;"></div><button id="submitPasswordChangeBtn" class="btn" style="width: 100%;">Cambiar Contrase\xF1a y Continuar</button><p style="margin-top: 16px; font-size: 12px; color: var(--text-secondary); text-align: center;">No podr\xE1s acceder al sistema hasta cambiar tu contrase\xF1a</p></div></div><!-- MODAL PARA NUEVO/EDITAR USUARIO --><div id="usuarioModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto;"><div style="background: white; border-radius: 8px; padding: 32px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; margin: 20px;"><h3 id="usuarioModalTitle" style="margin-bottom: 24px; color: var(--primary-color); font-size: 20px; font-weight: 600;">Nuevo Usuario</h3><form id="usuarioForm"><div class="grid-two" style="gap: 16px; margin-bottom: 16px;"><div class="form-group"><label for="modalUsuario">Usuario *</label><input type="text" id="modalUsuario" required placeholder="Nombre de usuario"></div><div class="form-group"><label for="modalEmail">Email *</label><input type="email" id="modalEmail" required placeholder="email@empresa.com"></div></div><div class="grid-two" style="gap: 16px; margin-bottom: 16px;"><div class="form-group"><label for="modalPassword">Contrase\xF1a</label><input type="password" id="modalPassword" placeholder="Dejar vac\xEDo para mantener actual"></div><div class="form-group"><label for="modalRol">Rol *</label><select id="modalRol" required><option value="">Seleccionar rol...</option><option value="operador">Operador</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></div></div><div class="form-group" style="margin-bottom: 16px;"><label for="modalEmpresa">Empresa</label><input type="text" id="modalEmpresa" placeholder="Nombre de la empresa"></div><div class="form-group" style="margin-bottom: 16px;"><label for="modalParquesAutorizados">Parques Autorizados</label><input type="text" id="modalParquesAutorizados" placeholder="Parques separados por comas"></div><div class="grid-two" style="gap: 16px; margin-bottom: 24px;"><div class="form-group"><label for="modalEstado">Estado *</label><select id="modalEstado" required><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></div><div class="form-group"><label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" id="modalPasswordTemporal"><span>Contrase\xF1a temporal (debe cambiarse)</span></label></div></div><div id="usuarioError" class="error" style="display: none; margin-bottom: 16px;"></div><div style="display: flex; gap: 12px; justify-content: flex-end;"><button type="button" id="cancelarUsuarioBtn" class="btn btn-secondary">Cancelar</button><button type="submit" id="guardarUsuarioBtn" class="btn btn-primary">Guardar Usuario</button></div></form></div></div><!-- MODAL DE CONFIRMACI\xD3N PARA ELIMINAR USUARIO --><div id="confirmarEliminarUsuarioModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;"><div style="background: white; border-radius: 8px; padding: 32px; max-width: 400px; width: 90%; margin: 20px; text-align: center;"><h3 style="margin-bottom: 16px; color: var(--danger-color); font-size: 20px; font-weight: 600;">Confirmar Eliminaci\xF3n</h3><p style="margin-bottom: 24px; color: var(--text-secondary);">\xBFEst\xE1s seguro de que deseas eliminar este usuario?</p><p id="usuarioEliminarInfo" style="margin-bottom: 24px; font-weight: 500; color: var(--text-primary);"></p><div style="display: flex; gap: 12px; justify-content: center;"><button id="cancelarEliminarUsuarioBtn" class="btn btn-secondary">Cancelar</button><button id="confirmarEliminarUsuarioBtn" class="btn btn-danger">Eliminar Usuario</button></div></div></div><script>' + script_default() + "<\/script></body></html>";
}
__name(getWebApp, "getWebApp");
var template_default = getWebApp;

// src/core/config/security.js
var SECURITY_CONFIG = {
  rateLimits: {
    login: { windowMs: 9e5, max: 1e3, blockDuration: 3600 },
    api: { windowMs: 6e4, max: 100 },
    heavy: { windowMs: 3e5, max: 10 }
  },
  session: {
    duration: 7200,
    refreshThreshold: 1800,
    maxSessions: 5
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    maxAge: 90
  },
  crypto: {
    iterations: 1e5,
    hashLength: 32,
    saltLength: 32,
    algorithm: "SHA-256"
  }
};
var security_default = SECURITY_CONFIG;

// src/core/errors.js
var SecurityError = class extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "SecurityError";
    this.status = status;
  }
  toPublicJSON() {
    return {
      error: this.name,
      message: this.message,
      status: this.status
    };
  }
};
__name(SecurityError, "SecurityError");
var errors_default = SecurityError;

// src/core/utils/headers.js
function getSecurityHeaders() {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // ← Permite Google Fonts CSS
      "font-src 'self' https://fonts.gstatic.com",
      // ← Permite Google Fonts archivos
      "img-src 'self' data:",
      "manifest-src 'self' data:",
      "connect-src 'self'"
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "no-referrer"
  };
}
__name(getSecurityHeaders, "getSecurityHeaders");
function getCorsHeaders(env, request) {
  const reqOrigin = request.headers.get("Origin") || "";
  let raw = env.ALLOWED_ORIGINS;
  if (!raw) {
    console.warn("ALLOWED_ORIGINS not configured - defaulting to restrictive CORS");
    return {
      "Access-Control-Allow-Origin": "null",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "false"
    };
  }
  let allowed;
  try {
    if (raw === "*") {
      allowed = "*";
    } else if (typeof raw === "string" && raw.trim().startsWith("[")) {
      allowed = JSON.parse(raw);
    } else if (typeof raw === "string") {
      allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      allowed = [];
    }
  } catch {
    allowed = [];
  }
  const allowOrigin = allowed === "*" ? "*" : Array.isArray(allowed) && allowed.includes(reqOrigin) ? reqOrigin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": allowed === "*" ? "false" : "true"
  };
}
__name(getCorsHeaders, "getCorsHeaders");

// src/core/services/rateLimiter.js
var RateLimiter = class {
  constructor(env) {
    this.env = env;
  }
  async check(identifier, type = "api") {
    if (!this.env.RATE_LIMIT_KV) {
      console.log("Rate limiting not configured (KV missing)");
      return true;
    }
    const config = security_default.rateLimits[type];
    if (!config) {
      console.log("Rate limiting not configured (missing type)");
      return true;
    }
    const key = `rl:${type}:${identifier}`;
    const blockKey = `rl:block:${type}:${identifier}`;
    const blocked = await this.env.RATE_LIMIT_KV.get(blockKey);
    if (blocked) {
      throw new SecurityError("Demasiados intentos. Intente m\xE1s tarde.", 429);
    }
    const attempts = parseInt(await this.env.RATE_LIMIT_KV.get(key) || "0");
    if (attempts >= config.max) {
      await this.env.RATE_LIMIT_KV.put(blockKey, "true", {
        expirationTtl: config.blockDuration
      });
      throw new SecurityError("L\xEDmite de intentos excedido", 429);
    }
    await this.env.RATE_LIMIT_KV.put(key, (attempts + 1).toString(), {
      expirationTtl: Math.floor(config.windowMs / 1e3)
    });
    return true;
  }
  async reset(identifier, type = "api") {
    if (!this.env.RATE_LIMIT_KV)
      return;
    const key = `rl:${type}:${identifier}`;
    const blockKey = `rl:block:${type}:${identifier}`;
    await this.env.RATE_LIMIT_KV.delete(key);
    await this.env.RATE_LIMIT_KV.delete(blockKey);
  }
};
__name(RateLimiter, "RateLimiter");
var rateLimiter_default = RateLimiter;

// src/core/services/authService.js
var enc = new TextEncoder();
var toHex = /* @__PURE__ */ __name((buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""), "toHex");
var fromHex = /* @__PURE__ */ __name((hex) => new Uint8Array(hex.match(/.{1,2}/g).map((h) => parseInt(h, 16))), "fromHex");
var timingSafeEqual = /* @__PURE__ */ __name((a, b) => {
  if (a.length !== b.length)
    return false;
  let r = 0;
  for (let i = 0; i < a.length; i++)
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}, "timingSafeEqual");
var isHex = /* @__PURE__ */ __name((s) => /^[a-f0-9]+$/i.test(s), "isHex");
var isBase64 = /* @__PURE__ */ __name((s) => /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0, "isBase64");
var b64url = /* @__PURE__ */ __name((s) => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64url");
var AuthService = class {
  constructor(env) {
    this.env = env;
    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET no est\xE1 configurado. Configure en Cloudflare: wrangler secret put JWT_SECRET");
    }
    this.SECRET = env.JWT_SECRET;
  }
  async hashPassword(password) {
    const iterations = security_default.crypto.iterations;
    const hashLen = security_default.crypto.hashLength;
    const saltLen = security_default.crypto.saltLength;
    const salt = crypto.getRandomValues(new Uint8Array(saltLen));
    const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      hashLen * 8
    );
    return `pbkdf2:${iterations}:${toHex(salt)}:${toHex(bits)}`;
  }
  /**
   * Verifica password contra múltiples formatos legacy.
   * Retorna objeto con { valid: boolean, needsUpdate: boolean }
   */
  async verifyPassword(plain, stored) {
    if (plain == null || stored == null)
      return { valid: false, needsUpdate: false };
    let valid = false;
    let needsUpdate = false;
    if (stored.startsWith("pbkdf2:")) {
      const parts = stored.split(":");
      let iterations = security_default.crypto.iterations;
      let saltHex, hashHex;
      for (let i = 1; i < parts.length; i++) {
        if (/^\d+$/.test(parts[i])) {
          iterations = parseInt(parts[i], 10);
          continue;
        }
        if (!saltHex) {
          saltHex = parts[i];
          continue;
        }
        if (!hashHex) {
          hashHex = parts[i];
          break;
        }
      }
      if (!saltHex || !hashHex || !isHex(saltHex) || !isHex(hashHex)) {
        return { valid: false, needsUpdate: false };
      }
      const key = await crypto.subtle.importKey("raw", enc.encode(plain), { name: "PBKDF2" }, false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations },
        key,
        hashHex.length * 4
      );
      valid = timingSafeEqual(toHex(bits).toLowerCase(), hashHex.toLowerCase());
      needsUpdate = false;
      return { valid, needsUpdate };
    }
    if (stored.includes(":")) {
      const [saltHex, hashHex] = stored.split(":");
      if (isHex(saltHex) && isHex(hashHex)) {
        const iterations = security_default.crypto.iterations;
        const key = await crypto.subtle.importKey("raw", enc.encode(plain), { name: "PBKDF2" }, false, ["deriveBits"]);
        const bits = await crypto.subtle.deriveBits(
          { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations },
          key,
          hashHex.length * 4
        );
        valid = timingSafeEqual(toHex(bits).toLowerCase(), hashHex.toLowerCase());
        needsUpdate = valid;
        return { valid, needsUpdate };
      }
    }
    if (isHex(stored) && (stored.length === 64 || stored.length === 40)) {
      const algo = stored.length === 64 ? "SHA-256" : "SHA-1";
      const digest = await crypto.subtle.digest(algo, enc.encode(plain));
      valid = timingSafeEqual(toHex(digest).toLowerCase(), stored.toLowerCase());
      needsUpdate = valid;
      return { valid, needsUpdate };
    }
    if (isBase64(stored) && stored.length >= 32) {
      const digest = await crypto.subtle.digest("SHA-256", enc.encode(plain));
      const b64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
      valid = timingSafeEqual(b64, stored);
      needsUpdate = valid;
      return { valid, needsUpdate };
    }
    valid = plain === stored;
    needsUpdate = valid;
    return { valid, needsUpdate };
  }
  // -------------------------- JWT ----------------------------------------
  async createToken(payload) {
    const tokenPayload = {
      ...payload,
      sub: payload.id || payload.sub,
      // Usar 'id' como 'sub' si no existe
      iat: Math.floor(Date.now() / 1e3),
      exp: Math.floor(Date.now() / 1e3) + 30 * 60
      // Expira en 30 minutos por inactividad
    };
    const headerB64 = b64url(btoa(String.fromCharCode(...enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))));
    const payloadB64 = b64url(btoa(String.fromCharCode(...enc.encode(JSON.stringify(tokenPayload)))));
    const unsigned = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey("raw", enc.encode(this.SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(unsigned));
    const signature = b64url(btoa(String.fromCharCode(...new Uint8Array(sigBuf))));
    return `${unsigned}.${signature}`;
  }
  async verifyToken(token) {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s)
      throw new errors_default("Token inv\xE1lido", 401);
    const unsigned = `${h}.${p}`;
    const key = await crypto.subtle.importKey("raw", enc.encode(this.SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(unsigned));
    const expected = b64url(btoa(String.fromCharCode(...new Uint8Array(sigBuf))));
    if (s !== expected)
      throw new errors_default("Token inv\xE1lido", 401);
    const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      throw new errors_default("Token expirado", 401);
    }
    return payload;
  }
  decodeToken(token) {
    const [, p] = token.split(".");
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  }
};
__name(AuthService, "AuthService");

// src/core/services/auditLogger.js
var AuditLogger = class {
  constructor(env) {
    this.env = env;
  }
  /**
   * Log an event to the audit_log table.
   * @param {Object} event Event details including userId, userEmail, action, resource, resourceId, ipAddress, userAgent, success, errorMessage, metadata.
   */
  async log(event = {}) {
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user_id: event.userId || null,
      user_email: event.userEmail || null,
      action: event.action || null,
      resource: event.resource || null,
      resource_id: event.resourceId || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      success: event.success === true,
      error_message: event.errorMessage || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null
    };
    const DB = this.env.DB_PERMISOS;
    await DB.prepare(`CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER NOT NULL,
      error_message TEXT,
      metadata TEXT
    );`).run();
    await DB.prepare(`INSERT INTO audit_log (
      id, timestamp, user_id, user_email, action, resource, resource_id, ip_address, user_agent, success, error_message, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`).bind(
      logEntry.id,
      logEntry.timestamp,
      logEntry.user_id,
      logEntry.user_email,
      logEntry.action,
      logEntry.resource,
      logEntry.resource_id,
      logEntry.ip_address,
      logEntry.user_agent,
      logEntry.success ? 1 : 0,
      logEntry.error_message,
      logEntry.metadata
    ).run();
  }
};
__name(AuditLogger, "AuditLogger");

// src/core/utils/sanitizers.js
var InputSanitizer = class {
  static sanitizeString(value) {
    if (typeof value !== "string") {
      return value;
    }
    return value.replace(/[<>'"`;{}()]/g, "");
  }
  static sanitizeObject(obj) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = InputSanitizer.sanitizeString(obj[key]);
    }
    return sanitized;
  }
  // DEPRECATED: Use prepared statements instead
  // This method is kept for backward compatibility but should not be used
  static sanitizeForSQL(value) {
    console.warn("sanitizeForSQL is deprecated. Use prepared statements instead.");
    if (typeof value === "string") {
      return value.replace(/'/g, "''");
    }
    return value;
  }
};
__name(InputSanitizer, "InputSanitizer");
var sanitizers_default = InputSanitizer;

// src/core/utils/time.js
function getLocalDateTime(offsetMinutes = 0) {
  const now = /* @__PURE__ */ new Date();
  const year = now.getUTCFullYear();
  const septemberSecondSunday = getSecondSunday(year, 8);
  const aprilFirstSunday = getFirstSunday(year, 3);
  const currentTime = now.getTime();
  const isDST = currentTime >= septemberSecondSunday.getTime() || currentTime < aprilFirstSunday.getTime();
  const chileOffsetMinutes = isDST ? -3 * 60 : -4 * 60;
  return new Date(now.getTime() + (chileOffsetMinutes + offsetMinutes) * 6e4);
}
__name(getLocalDateTime, "getLocalDateTime");
function getSecondSunday(year, month) {
  const date = new Date(Date.UTC(year, month, 1));
  const firstSunday = 7 - date.getUTCDay();
  return new Date(Date.UTC(year, month, firstSunday + 7));
}
__name(getSecondSunday, "getSecondSunday");
function getFirstSunday(year, month) {
  const date = new Date(Date.UTC(year, month, 1));
  const firstSunday = 7 - date.getUTCDay();
  return new Date(Date.UTC(year, month, firstSunday === 7 ? 7 : firstSunday));
}
__name(getFirstSunday, "getFirstSunday");
function formatLocalDateTime(date) {
  const pad = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "pad");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
__name(formatLocalDateTime, "formatLocalDateTime");

// src/core/handlers/auth.js
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
  if (!password || password.length < minLength) {
    return {
      valid: false,
      message: "La contrase\xF1a debe tener al menos 8 caracteres"
    };
  }
  if (!hasUppercase) {
    return {
      valid: false,
      message: "La contrase\xF1a debe contener al menos una letra may\xFAscula"
    };
  }
  if (!hasLowercase) {
    return {
      valid: false,
      message: "La contrase\xF1a debe contener al menos una letra min\xFAscula"
    };
  }
  if (!hasNumbers) {
    return {
      valid: false,
      message: "La contrase\xF1a debe contener al menos un n\xFAmero"
    };
  }
  if (!hasSpecialChar) {
    return {
      valid: false,
      message: "La contrase\xF1a debe contener al menos un car\xE1cter especial"
    };
  }
  return { valid: true };
}
__name(validatePasswordStrength, "validatePasswordStrength");
var securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;"
};
async function handleLogin(request, corsHeaders, env, services) {
  const { rateLimiter, authService, auditLogger } = services;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
    });
  }
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    await rateLimiter.check(clientIp, "login");
    const rawData = await request.json();
    const { usuario, password } = InputSanitizer.sanitizeObject(rawData);
    if (!usuario || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: "Usuario y contrase\xF1a son requeridos"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
      });
    }
    const userResult = await env.DB_MASTER.prepare(`
      SELECT * FROM usuarios 
      WHERE LOWER(email) = LOWER(?) OR LOWER(usuario) = LOWER(?)
      LIMIT 1
    `).bind(usuario, usuario).first();
    const genericLoginError = "Usuario o contrase\xF1a incorrectos";
    if (!userResult) {
      await auditLogger.log({
        action: "LOGIN_FAILED",
        resource: "auth",
        ip: clientIp,
        userEmail: usuario,
        success: false,
        error: "Usuario no encontrado"
        // Log interno mantiene el detalle
      });
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
      return new Response(JSON.stringify({
        success: false,
        message: genericLoginError
        // Mensaje genérico para el usuario
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
      });
    }
    const verification = await authService.verifyPassword(password, userResult.password_hash);
    if (!verification.valid) {
      await auditLogger.log({
        action: "LOGIN_FAILED",
        resource: "auth",
        userId: userResult.id,
        userEmail: userResult.email,
        ip: clientIp,
        success: false,
        error: "Contrase\xF1a incorrecta"
        // Log interno mantiene el detalle
      });
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
      return new Response(JSON.stringify({
        success: false,
        message: genericLoginError
        // Mismo mensaje genérico
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
      });
    }
    const passwordStrengthCheck = validatePasswordStrength(password);
    const requiresPasswordUpdate = !passwordStrengthCheck.valid || userResult.password_temporal === 1;
    if (verification.needsUpdate && passwordStrengthCheck.valid) {
      try {
        const newHash = await authService.hashPassword(password);
        await env.DB_MASTER.prepare(`
          UPDATE usuarios SET password_hash = ? WHERE id = ?
        `).bind(newHash, userResult.id).run();
      } catch (error) {
      }
    }
    const fechaLogin = formatLocalDateTime(getLocalDateTime());
    await env.DB_MASTER.prepare(`
      UPDATE usuarios SET ultimo_login = ? WHERE id = ?
    `).bind(fechaLogin, userResult.id).run();
    const esEnel = userResult.rol === "Supervisor Enel" || userResult.empresa?.toLowerCase().includes("enel") || userResult.email?.toLowerCase().includes("@enel.");
    let parquesAutorizados = [];
    if (userResult.parques_autorizados) {
      try {
        parquesAutorizados = JSON.parse(userResult.parques_autorizados);
      } catch (error) {
        console.error("Error parseando parques_autorizados:", error);
        parquesAutorizados = userResult.parques_autorizados.split(",").map((p) => p.trim());
      }
    }
    const userData = {
      id: userResult.id,
      usuario: userResult.usuario,
      email: userResult.email,
      rol: userResult.rol,
      empresa: userResult.empresa,
      cargo: userResult.cargo,
      rut: userResult.rut,
      telefono: userResult.telefono,
      esEnel,
      parques: parquesAutorizados,
      puedeActualizarPersonal: userResult.puede_actualizar_personal === 1
    };
    const token = await authService.createToken(userData);
    if (requiresPasswordUpdate) {
      await auditLogger.log({
        action: "PASSWORD_CHANGE_REQUIRED",
        resource: "auth",
        userId: userData.id,
        userEmail: userData.email,
        ip: clientIp,
        reason: !passwordStrengthCheck.valid ? "weak_password" : "temporary_password",
        details: !passwordStrengthCheck.valid ? passwordStrengthCheck.message : "Password marked as temporary"
      });
      return new Response(JSON.stringify({
        success: true,
        token,
        user: userData,
        requirePasswordChange: true,
        changeReason: !passwordStrengthCheck.valid ? "Su contrase\xF1a actual no cumple con los requisitos de seguridad. Por favor, cree una nueva contrase\xF1a." : "Debe cambiar su contrase\xF1a temporal por una permanente."
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
      });
    }
    await auditLogger.log({
      action: "LOGIN_SUCCESS",
      resource: "auth",
      userId: userData.id,
      userEmail: userData.email,
      ip: clientIp,
      success: true
    });
    await rateLimiter.reset(clientIp, "login");
    return new Response(JSON.stringify({
      success: true,
      token,
      user: userData
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Error interno del servidor"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
    });
  }
}
__name(handleLogin, "handleLogin");
async function handleChangePassword(request, corsHeaders, env, services) {
  const { authService, auditLogger } = services;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
    });
  }
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        success: false,
        error: "No autorizado"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
      });
    }
    const token = authHeader.substring(7);
    const userToken = await authService.verifyToken(token);
    const { newPassword } = await request.json();
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: passwordValidation.message
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
      });
    }
    const hashedPassword = await authService.hashPassword(newPassword);
    await env.DB_MASTER.prepare(`
      UPDATE usuarios 
      SET password_hash = ?,
          password_temporal = 0
      WHERE id = ?
    `).bind(hashedPassword, userToken.sub).run();
    if (auditLogger) {
      await auditLogger.log({
        action: "PASSWORD_CHANGED",
        resource: "auth",
        userId: userToken.sub,
        userEmail: userToken.email,
        ip: request.headers.get("CF-Connecting-IP"),
        success: true
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Contrase\xF1a actualizada exitosamente"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Error al cambiar la contrase\xF1a"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...securityHeaders }
    });
  }
}
__name(handleChangePassword, "handleChangePassword");

// src/core/handlers/users.js
async function handleUsers(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario, email, rol, empresa, parques_autorizados, 
             puede_actualizar_personal, ultimo_login, created_at
      FROM usuarios
      ORDER BY usuario ASC
    `).all();
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Error loading users",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleUsers, "handleUsers");
async function handlePersonal(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, empresa, cargo as rol, 
             rut, telefono, parques_autorizados, estado
      FROM usuarios
      WHERE rol IN ('Lead Technician', 'Technician', 'Supervisor Enel')
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Error loading personal",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePersonal, "handlePersonal");
async function handlePersonalByParque(request, corsHeaders, env, currentUser) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get("parque"));
    let query = `SELECT id, usuario as nombre, email, empresa, 
                        cargo as rol, rut, telefono, parques_autorizados
                 FROM usuarios 
                 WHERE estado = 'Activo'
                 AND rol IN ('Lead Technician', 'Technician', 'Supervisor Enel', 'Enel Otro')
                 ORDER BY usuario ASC`;
    const result = await env.DB_MASTER.prepare(query).all();
    let filteredResults = result.results || [];
    if (currentUser && filteredResults.length > 0) {
      const usuarioEsEnel = currentUser.empresa && currentUser.empresa.toLowerCase().includes("enel");
      filteredResults = filteredResults.filter((user) => {
        const userEsEnel = user.rol === "Supervisor Enel" || user.rol === "Enel Otro" || user.empresa && user.empresa.toLowerCase().includes("enel");
        if (usuarioEsEnel) {
          return true;
        }
        return userEsEnel || user.empresa === currentUser.empresa;
      });
    }
    if (parqueNombre && filteredResults.length > 0) {
      filteredResults = filteredResults.filter((user) => {
        const esEnel = user.rol === "Supervisor Enel" || user.rol === "Enel Otro" || user.empresa && user.empresa.toLowerCase().includes("enel");
        if (esEnel) {
          return true;
        }
        if (!user.parques_autorizados)
          return false;
        try {
          const parques = JSON.parse(user.parques_autorizados);
          if (Array.isArray(parques)) {
            return parques.some((p) => {
              const parqueNorm = p.toLowerCase().trim();
              const busquedaNorm = parqueNombre.toLowerCase().trim();
              return parqueNorm.includes(busquedaNorm) || busquedaNorm.includes(parqueNorm);
            });
          }
        } catch (e) {
          const parques = user.parques_autorizados.split(",").map((p) => p.trim());
          return parques.some((p) => {
            const parqueNorm = p.toLowerCase().trim();
            const busquedaNorm = parqueNombre.toLowerCase().trim();
            return parqueNorm.includes(busquedaNorm) || busquedaNorm.includes(parqueNorm);
          });
        }
        return false;
      });
    }
    return new Response(JSON.stringify({
      results: filteredResults,
      has_more: false
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error loading personal by parque:", error);
    return new Response(JSON.stringify({
      error: "Error loading personal by parque",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePersonalByParque, "handlePersonalByParque");
async function handleSupervisores(request, corsHeaders, env, currentUser) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get("parque"));
    const result = await env.DB_MASTER.prepare(`
      SELECT id, usuario as nombre, email, cargo, telefono, rut, empresa,
             parques_autorizados, estado, rol
      FROM usuarios
      WHERE rol = 'Supervisor Enel'
      AND estado = 'Activo'
      ORDER BY usuario ASC
    `).all();
    let filteredResults = result.results || [];
    if (parqueNombre && filteredResults.length > 0) {
      filteredResults = filteredResults.filter((supervisor) => {
        if (!supervisor.parques_autorizados)
          return false;
        try {
          const parques = JSON.parse(supervisor.parques_autorizados);
          if (Array.isArray(parques)) {
            return parques.some((p) => {
              const parqueNorm = p.toLowerCase().trim();
              const busquedaNorm = parqueNombre.toLowerCase().trim();
              return parqueNorm === busquedaNorm || parqueNorm.includes(busquedaNorm) || busquedaNorm.includes(parqueNorm);
            });
          }
        } catch (e) {
          const parques = supervisor.parques_autorizados.split(",").map((p) => p.trim());
          return parques.some((p) => {
            const parqueNorm = p.toLowerCase().trim();
            const busquedaNorm = parqueNombre.toLowerCase().trim();
            return parqueNorm === busquedaNorm || parqueNorm.includes(busquedaNorm) || busquedaNorm.includes(parqueNorm);
          });
        }
        return false;
      });
    }
    return new Response(JSON.stringify({
      results: filteredResults,
      has_more: false
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Error loading supervisores",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleSupervisores, "handleSupervisores");

// src/core/handlers/catalog.js
async function handleParques(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT * FROM parques_eolicos
      ORDER BY nombre ASC
    `).all();
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Error loading parques",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleParques, "handleParques");
async function handleAerogeneradores(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const parqueNombre = InputSanitizer.sanitizeString(url.searchParams.get("parque"));
    let query = "SELECT Plant_Code, Plant_Name, WTG_Name FROM Aerogeneradores";
    let params = [];
    if (parqueNombre) {
      query += " WHERE Plant_Name = ?";
      params.push(parqueNombre);
    }
    query += " ORDER BY WTG_Name ASC";
    const result = await env.DB_PERMISOS.prepare(query).bind(...params).all();
    const adaptedResults = result.results?.map((row) => ({
      codigo: row.WTG_Name,
      nombre: row.WTG_Name,
      Plant_Code: row.Plant_Code,
      Plant_Name: row.Plant_Name,
      WTG_Name: row.WTG_Name
    })) || [];
    return new Response(JSON.stringify({
      results: adaptedResults,
      has_more: false,
      total: adaptedResults.length
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Error loading aerogeneradores"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleAerogeneradores, "handleAerogeneradores");
async function handleActividades(request, corsHeaders, env) {
  try {
    const result = await env.DB_MASTER.prepare(`
      SELECT * FROM actividades
    `).all();
    const ordenPrioridad = [
      "Tr\xE1nsito al lugar de trabajo",
      "Ingreso al aerogenerador",
      "Uso de elevador",
      "Trabajos en Ground o Foso",
      "Trabajos en Secciones de Torre",
      "Trabajos en Nacelle"
    ];
    const actividadesOrdenadas = (result.results || []).sort((a, b) => {
      const indexA = ordenPrioridad.indexOf(a.nombre);
      const indexB = ordenPrioridad.indexOf(b.nombre);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1 && indexB === -1) {
        return -1;
      }
      if (indexA === -1 && indexB !== -1) {
        return 1;
      }
      return a.nombre.localeCompare(b.nombre);
    });
    return new Response(JSON.stringify({
      results: actividadesOrdenadas,
      has_more: false
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Error loading actividades",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleActividades, "handleActividades");

// src/core/handlers/matrix.js
async function handleMatrizRiesgos(request, corsHeaders, env) {
  try {
    const url = new URL(request.url);
    const actividades = InputSanitizer.sanitizeString(url.searchParams.get("actividades"));
    let query = `SELECT * FROM matriz_riesgos WHERE estado = 'Activo'`;
    let params = [];
    if (actividades) {
      const actividadesList = actividades.split(",").map((act) => act.trim());
      const placeholders = actividadesList.map(() => "?").join(",");
      query += ` AND actividad IN (${placeholders})`;
      params.push(...actividadesList);
    }
    query += ` ORDER BY actividad ASC, codigo ASC`;
    const result = await env.DB_HSEQ.prepare(query).bind(...params).all();
    return new Response(JSON.stringify({
      results: result.results || [],
      has_more: false,
      debug: {
        totalResults: result.results?.length || 0,
        requestedActivities: actividades ? actividades.split(",") : []
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error loading matriz riesgos:", error);
    return new Response(JSON.stringify({
      error: "Error loading matriz riesgos",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleMatrizRiesgos, "handleMatrizRiesgos");

// src/core/handlers/pdf.js
function generateTomaConocimientoPDF(data) {
  const fecha = /* @__PURE__ */ new Date();
  const fechaFormateada = fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Santiago"
  });
  const horaFormateada = fecha.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago"
  });
  const personalRows = data.personal?.map((persona, index) => `
  <tr>
    <td style="text-align: center; padding: 8px; border: 1px solid #000;">${index + 1}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.nombre}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.rut || "Sin RUT"}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.empresa || "N/A"}</td>
    <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
  </tr>
`).join("") || `
    <tr>
      <td style="text-align: center; padding: 8px; border: 1px solid #000;">1</td>
      <td style="padding: 8px; border: 1px solid #000;">Sin personal asignado</td>
      <td style="padding: 8px; border: 1px solid #000;">-</td>
      <td style="padding: 8px; border: 1px solid #000;">-</td>
      <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
    </tr>
  `;
  const numFilasExistentes = data.personal?.length || 1;
  const filasVacias = Math.max(0, 10 - numFilasExistentes);
  const filasVaciasHTML = Array.from({ length: filasVacias }, (_, index) => `
    <tr>
      <td style="text-align: center; padding: 8px; border: 1px solid #000;">${numFilasExistentes + index + 1}</td>
      <td style="padding: 8px; border: 1px solid #000;"></td>
      <td style="padding: 8px; border: 1px solid #000;"></td>
      <td style="padding: 8px; border: 1px solid #000;"></td>
      <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
    </tr>
  `).join("");
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro Toma de Conocimiento - ${data.planta}</title>
    <style>
        @media print {
            @page {
                margin: 0.5in;
                size: A4;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .logo {
          width: 120px;
          height: 80px;
          margin-right: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      
        .logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .header-info {
            flex: 1;
        }
        
        .title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 12px;
            margin-bottom: 5px;
        }
        
        .areas {
            font-size: 10px;
            font-style: italic;
            color: #666;
        }
        
        .info-section {
            display: flex;
            margin-bottom: 15px;
            gap: 30px;
        }
        
        .info-left, .info-right {
            flex: 1;
        }
        
        .info-row {
            margin-bottom: 8px;
            display: flex;
            align-items: baseline;
        }
        
        .info-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 120px;
        }
        
        .info-value {
            border-bottom: 1px solid #000;
            flex: 1;
            padding-bottom: 2px;
        }
        
        .description-section {
            margin: 20px 0;
        }
        
        .description-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .description-content {
            border: 1px solid #000;
            padding: 10px;
            min-height: 40px;
            background: #f9f9f9;
        }
        
        .activities-section {
            margin: 20px 0;
        }
        
        .activities-row {
            display: flex;
            margin-bottom: 8px;
            align-items: baseline;
        }
        
        .activities-label {
            font-weight: bold;
            margin-right: 10px;
            min-width: 200px;
        }
        
        .activities-content {
            border-bottom: 1px solid #000;
            flex: 1;
            padding-bottom: 2px;
        }
        
        .table-section {
            margin: 20px 0;
        }
        
        .participants-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .participants-table th {
            background: #4CAF50;
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 10px;
        }
        
        .participants-table td {
            padding: 8px;
            border: 1px solid #000;
            vertical-align: top;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        @media print {
            .print-button {
                display: none;
            }
        }
        
        .print-button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">\u{1F5A8}\uFE0F Imprimir PDF</button>
    
    <div class="header">
        <div class="logo">
        <!-- \u{1F3A8} LOGO ENEL GREEN POWER - INSTRUCCIONES PARA CAMBIAR -->
        <!-- Para reemplazar el logo: -->
        <!-- 1. Convertir imagen nueva a base64: https://base64.guru/converter/encode/image -->
        <!-- 2. Reemplazar SOLO el string despu\xE9s de "base64," en la l\xEDnea de abajo -->
        <!-- 3. Mantener el formato: data:image/[tipo];base64,[string-base64] -->
        <!-- Logo actual: SVG embebido para garantizar disponibilidad -->
        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiIFsKCTwhRU5USVRZIG5zX2V4dGVuZCAiaHR0cDovL25zLmFkb2JlLmNvbS9FeHRlbnNpYmlsaXR5LzEuMC8iPgoJPCFFTlRJVFkgbnNfYWkgImh0dHA6Ly9ucy5hZG9iZS5jb20vQWRvYmVJbGx1c3RyYXRvci8xMC4wLyI+Cgk8IUVOVElUWSBuc19ncmFwaHMgImh0dHA6Ly9ucy5hZG9iZS5jb20vR3JhcGhzLzEuMC8iPgoJPCFFTlRJVFkgbnNfdmFycyAiaHR0cDovL25zLmFkb2JlLmNvbS9WYXJpYWJsZXMvMS4wLyI+Cgk8IUVOVElUWSBuc19pbXJlcCAiaHR0cDovL25zLmFkb2JlLmNvbS9JbWFnZVJlcGxhY2VtZW50LzEuMC8iPgoJPCFFTlRJVFkgbnNfc2Z3ICJodHRwOi8vbnMuYWRvYmUuY29tL1NhdmVGb3JXZWIvMS4wLyI+Cgk8IUVOVElUWSBuc19jdXN0b20gImh0dHA6Ly9ucy5hZG9iZS5jb20vR2VuZXJpY0N1c3RvbU5hbWVzcGFjZS8xLjAvIj4KCTwhRU5USVRZIG5zX2Fkb2JlX3hwYXRoICJodHRwOi8vbnMuYWRvYmUuY29tL1hQYXRoLzEuMC8iPgpdPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkVHUF9Mb2dvX1ByaW1hcnlfUkdCIiB4bWxuczp4PSImbnNfZXh0ZW5kOyIgeG1sbnM6aT0iJm5zX2FpOyIgeG1sbnM6Z3JhcGg9IiZuc19ncmFwaHM7IgoJIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjgzLjUgMTQyLjEiCgkgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjgzLjUgMTQyLjEiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8bWV0YWRhdGE+Cgk8c2Z3ICB4bWxucz0iJm5zX3NmdzsiPgoJCTxzbGljZXM+PC9zbGljZXM+CgkJPHNsaWNlU291cmNlQm91bmRzICBib3R0b21MZWZ0T3JpZ2luPSJ0cnVlIiBoZWlnaHQ9IjE0Mi4xIiB3aWR0aD0iMjgzLjUiIHg9IjI2OTQuNiIgeT0iLTQxMzkuNSI+PC9zbGljZVNvdXJjZUJvdW5kcz4KCTwvc2Z3Pgo8L21ldGFkYXRhPgo8Zz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjY2Ljg2MiIgeTE9IjQxLjI5NjkiIHgyPSIyNjYuODYyIiB5Mj0iNzYuNDU5NCI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cmVjdCB4PSIyNjEiIHk9IjQxIiBmaWxsPSJ1cmwoI1NWR0lEXzFfKSIgd2lkdGg9IjExLjciIGhlaWdodD0iMzUuNCIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8yXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyNzEuMjU5OCIgeTE9Ijg2LjgzNzUiIHgyPSIyODEuOTk0NiIgeTI9Ijk1LjY4OSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzczQjk2NCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQ7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzJfKSIgZD0iTTI3Mi43LDc2LjNjMCw4LjUsMy45LDEyLjEsMTAuNywxNi44bC02LjcsOS42Yy0xMC02LjYtMTUuOC0xNC0xNS44LTI2LjRIMjcyLjd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjEwMS41MDY1IiB5MT0iNDEuNDQ0MSIgeDI9IjEyOC40Nzc4IiB5Mj0iNDEuNDQ0MSI+CgkJPHN0b3AgIG9mZnNldD0iNC43MDIyNDFlLTAzIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA4QzVBIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45OTU3IiBzdHlsZT0ic3RvcC1jb2xvcjojMzJBOTU5Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8zXykiIGQ9Ik0xMjcuNiwyNC4yYy0xMC4yLDAtMTkuNCw0LjEtMjYuMSwxMC43djIzLjhjMS44LTkuNCwxMC4xLTIyLjgsMjYuMS0yMi44YzAuMywwLDAuNiwwLDAuOSwwVjI0LjIKCQlDMTI4LjIsMjQuMiwxMjcuOSwyNC4yLDEyNy42LDI0LjJ6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzRfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE0NC4wNjczIiB5MT0iMzguMzY2IiB4Mj0iMTQ0LjA2NzMiIHkyPSI1OS4xMTYxIj4KCQk8c3RvcCAgb2Zmc2V0PSIxLjExMDQ1NmUtMDIiIHN0eWxlPSJzdG9wLWNvbG9yOiMzMkE5NTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjE3MDEiIHN0eWxlPSJzdG9wLWNvbG9yOiM0MUIyNTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMzMyIgc3R5bGU9InN0b3AtY29sb3I6IzU1QkU1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM1NUJFNUE7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzRfKSIgZD0iTTE2MC4yLDYwLjVoLTExLjdsMC0zLjljMC0xMS42LTkuMi0yMC42LTIwLjUtMjAuN1YyNC4yYzE3LjgsMC4yLDMyLjIsMTQuNSwzMi4yLDMyLjVWNjAuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfNV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTUzLjc0MjgiIHkxPSI1NC41ODI2IiB4Mj0iMTU0LjMzOTciIHkyPSI2MC42NjM5Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojRTk0OTg2Ii8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6I0U5NDk4NjtzdG9wLW9wYWNpdHk6MCIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxsaW5lIGZpbGw9InVybCgjU1ZHSURfNV8pIiB4MT0iMTYwLjIiIHkxPSI2MC41IiB4Mj0iMTQ4LjUiIHkyPSI2MC41Ii8+Cgk8cmVjdCB4PSI4OS44IiB5PSIyNy40IiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMjYxIiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMTQ4LjUiIHk9IjYwLjUiIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSIxMS43IiBoZWlnaHQ9IjQxIi8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzZfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjcxLjUyMyIgeTE9IjUzLjMzOTIiIHgyPSI2NC4xNjY0IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzZfKSIgZD0iTTY2LjEsNTYuN2gxMmMtMS40LTguMy01LjUtMTUuNi0xMS4yLTIxLjNsLTguMiw4LjRDNjIuMiw0Ny4zLDY0LjgsNTEuNyw2Ni4xLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjYxLjIxODUiIHkxPSIzNy41MzgyIiB4Mj0iNDEuNzU0MyIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzdfKSIgZD0iTTM5LjMsMzUuOWM3LjYsMCwxNC41LDMuMSwxOS41LDhsOC4zLTguM2MtNy4xLTcuMS0xNy0xMS41LTI3LjgtMTEuNWMtMC4xLDAtMC4yLDAtMC4zLDBMMzksMzUuOQoJCUMzOS4xLDM1LjksMzkuMiwzNS45LDM5LjMsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfOF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTYuODgiIHkxPSIzNy44NjYyIiB4Mj0iMzYuNDk3NCIgeTI9IjI5LjUxMzUiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMjg5QjVEIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF84XykiIGQ9Ik0zOS4zLDM1LjlWMjQuMmMtMTEsMC0yMC45LDQuNS0yOCwxMS43bDguNCw4LjJDMjQuNiwzOS4xLDMxLjYsMzUuOSwzOS4zLDM1Ljl6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzlfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjUuNDEwNCIgeTE9IjYwLjcyMzUiIHgyPSIxMy40NTY2IiB5Mj0iNDEuNDEyNiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzUwQUI2MCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzlfKSIgZD0iTTExLjcsNjMuNWMwLTcuNiwzLjEtMTQuNSw4LjEtMTkuNWwtOC4zLTguM0M0LjQsNDIuOCwwLDUyLjYsMCw2My41YzAsMC4xLDAsMC4yLDAsMC4zbDExLjctMC4xCgkJQzExLjcsNjMuNiwxMS43LDYzLjUsMTEuNyw2My41eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xMF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iNS4zNTE0IiB5MT0iNjYuMzE5IiB4Mj0iMTMuNzA0MiIgeTI9Ijg1Ljc4MzIiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MEFCNjAiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMF8pIiBkPSJNMTEuNyw2My41SDBjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTQuOSw3OC4xLDExLjcsNzEuMiwxMS43LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzExXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxNS41MzYzIiB5MT0iODguNzAwMyIgeDI9IjM4LjMyMjkiIHkyPSI5OC4wMjIxIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45NjIzIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMV8pIiBkPSJNMzkuMyw5MWMtNy42LDAtMTQuNS0zLjEtMTkuNS04LjFsLTguMyw4LjNjNy4xLDcuMSwxNi45LDExLjUsMjcuOCwxMS41YzAuMSwwLDAuMiwwLDAuMywwCgkJTDM5LjUsOTFDMzkuNCw5MSwzOS40LDkxLDM5LjMsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzEyXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIzOS4yNTg4IiB5MT0iMTA2LjQ5MTEiIHgyPSI2Mi4zNDI2IiB5Mj0iODEuMDUxNyI+CgkJPHN0b3AgIG9mZnNldD0iMC4zMjkiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2O3N0b3Atb3BhY2l0eTowIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMl8pIiBkPSJNNjEuMSw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEw2MS4xLDgwLjJ6Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iNTYuNyIgZmlsbD0iI0M2QzZDNiIgd2lkdGg9IjQxIiBoZWlnaHQ9IjExLjciLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjI0Mi43NDExIiB5MT0iNTMuMzM5MiIgeDI9IjIzNS4zODQ2IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzEzXykiIGQ9Ik0yMzcuMyw1Ni43aDEyYy0xLjQtOC4zLTUuNS0xNS42LTExLjItMjEuM2wtOC4yLDguNEMyMzMuNCw0Ny4zLDIzNiw1MS43LDIzNy4zLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE0XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMzIuNDM2NyIgeTE9IjM3LjUzODIiIHgyPSIyMTIuOTcyNSIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE0XykiIGQ9Ik0yMTAuNSwzNS45YzcuNiwwLDE0LjUsMy4xLDE5LjUsOGw4LjMtOC4zYy03LjEtNy4xLTE3LTExLjUtMjcuOC0xMS41Yy0wLjEsMC0wLjIsMC0wLjMsMAoJCWwwLjEsMTEuN0MyMTAuMywzNS45LDIxMC40LDM1LjksMjEwLjUsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTVfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE4OC4wOTgxIiB5MT0iMzcuODY2MiIgeDI9IjIwNy43MTU2IiB5Mj0iMjkuNTEzNSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE1XykiIGQ9Ik0yMTAuNSwzNS45VjI0LjJjLTExLDAtMjAuOSw0LjUtMjgsMTEuN2w4LjQsOC4yQzE5NS44LDM5LjEsMjAyLjgsMzUuOSwyMTAuNSwzNS45eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xNl8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTc2LjYyODYiIHkxPSI2MC43MjM1IiB4Mj0iMTg0LjY3NDgiIHkyPSI0MS40MTI2Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTZfKSIgZD0iTTE4Mi45LDYzLjVjMC03LjYsMy4xLTE0LjUsOC4xLTE5LjVsLTguMy04LjNjLTcuMSw3LjEtMTEuNSwxNi45LTExLjUsMjcuOGMwLDAuMSwwLDAuMiwwLDAuMwoJCWwxMS43LTAuMUMxODIuOSw2My42LDE4Mi45LDYzLjUsMTgyLjksNjMuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE3Ni41Njk2IiB5MT0iNjYuMzE5IiB4Mj0iMTg0LjkyMjMiIHkyPSI4NS43ODMyIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTdfKSIgZD0iTTE4Mi45LDYzLjVoLTExLjdjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTg2LjEsNzguMSwxODIuOSw3MS4yLDE4Mi45LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE4XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxODYuNzU0NCIgeTE9Ijg4LjcwMDMiIHgyPSIyMDkuNTQxIiB5Mj0iOTguMDIyMSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOTYyMyIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMThfKSIgZD0iTTIxMC41LDkxYy03LjYsMC0xNC41LTMuMS0xOS41LTguMWwtOC4zLDguM2M3LjEsNy4xLDE2LjksMTEuNSwyNy44LDExLjVjMC4xLDAsMC4yLDAsMC4zLDAKCQlMMjEwLjcsOTFDMjEwLjcsOTEsMjEwLjYsOTEsMjEwLjUsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE5XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMTAuNDc2OSIgeTE9IjEwNi40OTExIiB4Mj0iMjMzLjU2MDgiIHkyPSI4MS4wNTE3Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMyOSIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODY7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE5XykiIGQ9Ik0yMzIuNCw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEwyMzIuNCw4MC4yeiIvPgoJPHJlY3QgeD0iMjA4LjIiIHk9IjU2LjciIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSI0MSIgaGVpZ2h0PSIxMS43Ii8+Cgk8Zz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTUzLjIsMTMzLjJ2Ny45Yy0yLDAuOC0zLjksMS02LDFjLTQuNiwwLTcuMi0zLjYtNy4yLTguN2MwLTQuMywyLjMtOC43LDcuMi04LjdjMi44LDAsNS42LDEuNSw1LjksNC41CgkJCWgtMS43Yy0wLjMtMi4xLTIuMi0zLjEtNC4yLTMuMWMtNCwwLTUuNSwzLjktNS41LDcuM2MwLDQuMywxLjgsNy4zLDYuMyw3LjNjMS4zLDAsMi41LTAuMywzLjctMC43di01LjRoLTQuMnYtMS40SDE1My4yeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xNTguNiwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2gwYzAuNC0xLjIsMS41LTIsMi42LTIuMWMwLjUsMCwwLjksMCwxLjQsMHYxLjMKCQkJYy0wLjMsMC0wLjYtMC4xLTAuOS0wLjFjLTIuMSwwLTMuMiwxLjUtMy4yLDMuN1YxNDEuOHoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTY1LjcsMTM2LjNjMCwyLjUsMS4yLDQuNiw0LDQuNmMxLjcsMCwzLTEuMiwzLjQtMi44aDEuNWMtMC43LDIuOC0yLjUsNC4xLTUuMyw0LjFjLTMuNSwwLTUuMS0zLTUuMS02LjIKCQkJYzAtMy4yLDEuNy02LjIsNS4yLTYuMmMzLjksMCw1LjMsMi45LDUuMyw2LjVIMTY1Ljd6IE0xNzMuMiwxMzVjLTAuMi0yLjMtMS40LTQtMy44LTRjLTIuMywwLTMuNSwxLjktMy43LDRIMTczLjJ6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTE3OC42LDEzNi4zYzAsMi41LDEuMiw0LjYsNCw0LjZjMS43LDAsMy0xLjIsMy40LTIuOGgxLjVjLTAuNywyLjgtMi41LDQuMS01LjMsNC4xYy0zLjUsMC01LjEtMy01LjEtNi4yCgkJCWMwLTMuMiwxLjctNi4yLDUuMi02LjJjMy45LDAsNS4zLDIuOSw1LjMsNi41SDE3OC42eiBNMTg2LjEsMTM1Yy0wLjItMi4zLTEuNC00LTMuOC00Yy0yLjMsMC0zLjUsMS45LTMuNyw0SDE4Ni4xeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xOTIuMSwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2wwLDBjMC44LTEuNCwyLjEtMi4xLDMuNi0yLjEKCQkJYzMuOCwwLDQuMSwzLjQsNC4xLDQuN3Y3LjNoLTEuNHYtNy41YzAtMi0xLjItMy4yLTMuMS0zLjJjLTIuMywwLTMuMywxLjktMy4zLDRWMTQxLjh6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIxMC42LDE0MS44VjEyNWg0LjJjMy4yLTAuMSw2LjksMC43LDYuOSw0LjdjMCw0LTMuNiw0LjgtNi45LDQuN2gtMi43djcuM0gyMTAuNnogTTIxMi4xLDEzMy4xaDMuNwoJCQljMi4zLDAsNC4zLTAuNyw0LjMtMy4zYzAtMi42LTItMy4zLTQuMy0zLjNoLTMuN1YxMzMuMXoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjMzLjEsMTM1LjljMCwzLjEtMS43LDYuMi01LjQsNi4yYy0zLjcsMC01LjQtMy4xLTUuNC02LjJzMS43LTYuMiw1LjQtNi4yCgkJCUMyMzEuNCwxMjkuOCwyMzMuMSwxMzIuOSwyMzMuMSwxMzUuOXogTTIyNy43LDEzMWMtMi44LDAtMy45LDIuNy0zLjksNC45czEuMSw0LjksMy45LDQuOWMyLjgsMCwzLjktMi43LDMuOS00LjkKCQkJUzIzMC41LDEzMSwyMjcuNywxMzF6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIzOSwxMzkuOUwyMzksMTM5LjlsMy42LTkuOGgxLjZsMy40LDkuN2gwbDMuNC05LjdoMS41bC00LjMsMTEuN0gyNDdsLTMuNi0xMC4xaDBsLTMuNiwxMC4xaC0xLjQKCQkJbC00LjMtMTEuN2gxLjVMMjM5LDEzOS45eiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0yNTUuMiwxMzYuM2MwLDIuNSwxLjIsNC42LDQsNC42YzEuNiwwLDMtMS4yLDMuNC0yLjhoMS41Yy0wLjcsMi44LTIuNSw0LjEtNS4zLDQuMWMtMy41LDAtNS4xLTMtNS4xLTYuMgoJCQljMC0zLjIsMS43LTYuMiw1LjItNi4yYzMuOSwwLDUuMywyLjksNS4zLDYuNUgyNTUuMnogTTI2Mi43LDEzNWMtMC4yLTIuMy0xLjQtNC0zLjgtNGMtMi4zLDAtMy41LDEuOS0zLjcsNEgyNjIuN3oiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjY4LjcsMTQxLjhoLTEuNHYtOWMwLTAuOS0wLjEtMS44LTAuMS0yLjZoMS40bDAuMSwxLjdoMGMwLjQtMS4yLDEuNS0yLDIuNi0yLjFjMC41LDAsMC45LDAsMS40LDB2MS4zCgkJCWMtMC4zLDAtMC42LTAuMS0wLjktMC4xYy0yLjEsMC0zLjIsMS41LTMuMiwzLjdWMTQxLjh6Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg==" alt="Enel Green Power">
        </div>
        <div class="header-info">
            <div class="title">REGISTRO TOMA DE CONOCIMIENTO PT WIND</div>
            <div class="subtitle">\xC1reas de Aplicaci\xF3n</div>
            <div class="areas">
                Per\xEDmetro, Chile y Pa\xEDses Andinos<br>
                Funci\xF3n: Health, Safety, Environment and Quality<br>
                Business Line: Renewable Energies
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">NOMBRE JEFE DE FAENA:</span>
                <span class="info-value">${data.jefeFaena || "No asignado"}</span>
            </div>
        </div>
        <div class="info-right">
            <div class="info-row">
                <span class="info-label">Firma:</span>
                <span class="info-value"></span>
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">Lugar:</span>
                <span class="info-value">${data.planta || ""}_${data.aerogenerador || ""}</span>
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${fechaFormateada}</span>
            </div>
        </div>
        <div class="info-right">
            <div class="info-row">
                <span class="info-label">Horario:</span>
                <span class="info-value">${horaFormateada}</span>
            </div>
        </div>
    </div>
    
    <div class="description-section">
        <div class="description-label">Descripci\xF3n de trabajo (s)</div>
        <div class="description-content">
            ${data.descripcion || "Sin descripci\xF3n"}
            <br><br>
            <strong>Tipo de Mantenimiento:</strong> ${data.tipoMantenimiento || "No especificado"}
            ${data.tipoMantenimientoOtros ? " - " + data.tipoMantenimientoOtros : ""}
        </div>
    </div>
    
    <div class="activities-section">
        <div class="activities-row">
            <span class="activities-label">Actividades Rutinarias asociadas:</span>
            <span class="activities-content">${data.actividadesRutinarias?.join(" - ") || "Ninguna"}</span>
        </div>
        <div class="activities-row">
            <span class="activities-label">Actividades Extraordinarias asociadas:</span>
            <span class="activities-content">Ninguna</span>
        </div>
    </div>
    
    <div class="table-section">
        <table class="participants-table">
            <thead>
                <tr>
                    <th>N\xB0</th>
                    <th>NOMBRE DEL PARTICIPANTE</th>
                    <th>RUT/C\xC9DULA</th>
                    <th>EMPRESA</th>
                    <th>FIRMA</th>
                </tr>
            </thead>
            <tbody>
                ${personalRows}
                ${filasVaciasHTML}
            </tbody>
        </table>
    </div>
    
    <script>
        setTimeout(() => {
            if (confirm('\xBFDesea imprimir el documento PDF ahora?')) {
                window.print();
            }
        }, 2000);
    <\/script>
</body>
</html>
  `;
}
__name(generateTomaConocimientoPDF, "generateTomaConocimientoPDF");
var pdf_default = generateTomaConocimientoPDF;

// src/core/handlers/permits.js
async function handlePermisos(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  if (request.method === "POST" || request.method === "PUT") {
    const rawData = await request.json();
    const permisoData = InputSanitizer.sanitizeObject(rawData);
    if (!permisoData.planta || !permisoData.descripcion || !permisoData.jefeFaena) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan campos obligatorios"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    try {
      if (request.method === "PUT") {
        return await handleUpdatePermiso(permisoData, env, currentUser, services, corsHeaders);
      }
      let numeroCorrelativo = 1;
      const lastPermiso = await env.DB_PERMISOS.prepare(`
        SELECT COALESCE(MAX(CAST(numero_correlativo AS INTEGER)), 0) as ultimo_numero 
        FROM permisos_trabajo 
        WHERE planta_nombre = ?
      `).bind(permisoData.planta).first();
      numeroCorrelativo = (lastPermiso?.ultimo_numero || 0) + 1;
      const codigoParque = permisoData.codigoParque || permisoData.planta.replace(/\s+/g, "").substring(0, 3).toUpperCase();
      const numeroPT = `PT-${codigoParque}-${numeroCorrelativo.toString().padStart(4, "0")}`;
      const insertPermiso = await env.DB_PERMISOS.prepare(`
        INSERT INTO permisos_trabajo (
          numero_pt, numero_correlativo, planta_id, planta_nombre, 
          aerogenerador_id, aerogenerador_nombre, descripcion, 
          jefe_faena_id, jefe_faena_nombre, supervisor_parque_id, 
          supervisor_parque_nombre, tipo_mantenimiento, tipo_mantenimiento_otros,
          usuario_creador, usuario_creador_id, observaciones, estado,
          fecha_inicio, fecha_creacion, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        numeroPT,
        numeroCorrelativo.toString(),
        permisoData.plantaId || "unknown",
        permisoData.planta,
        permisoData.aerogeneradorCodigo || null,
        permisoData.aerogenerador || null,
        permisoData.descripcion,
        permisoData.jefeFaenaId || "unknown",
        permisoData.jefeFaena,
        permisoData.supervisorParqueId || null,
        permisoData.supervisorParque || null,
        permisoData.tipoMantenimiento || "PREVENTIVO",
        permisoData.tipoMantenimientoOtros || null,
        permisoData.usuarioCreador || currentUser?.email || "unknown",
        parseInt(currentUser?.id) || "unknown",
        permisoData.observaciones || null,
        "CREADO",
        permisoData.fechaInicio || formatLocalDateTime(getLocalDateTime()),
        formatLocalDateTime(getLocalDateTime()),
        formatLocalDateTime(getLocalDateTime())
      ).run();
      const permisoId = insertPermiso.meta.last_row_id;
      if (permisoData.personal && permisoData.personal.length > 0) {
        for (const persona of permisoData.personal) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_personal (
              permiso_id, personal_id, personal_nombre, 
              personal_empresa, personal_rol, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            permisoId,
            parseInt(persona.id),
            // Ahora es el usuario.id directamente
            persona.nombre || "Sin nombre",
            persona.empresa || "Sin empresa",
            persona.rol || "Sin rol",
            formatLocalDateTime(getLocalDateTime())
          ).run();
        }
      }
      if (permisoData.actividades && permisoData.actividades.length > 0) {
        for (const actividad of permisoData.actividades) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_actividades (
              permiso_id, actividad_id, actividad_nombre, 
              tipo_actividad, created_at
            ) VALUES (?, ?, ?, ?, ?)
          `).bind(
            permisoId,
            actividad.id || "unknown",
            actividad.nombre || "Sin nombre",
            actividad.tipo || "RUTINARIA",
            formatLocalDateTime(getLocalDateTime())
          ).run();
        }
      }
      if (permisoData.matrizRiesgos && permisoData.matrizRiesgos.length > 0) {
        for (const riesgo of permisoData.matrizRiesgos) {
          await env.DB_PERMISOS.prepare(`
            INSERT INTO permiso_matriz_riesgos (
              permiso_id, actividad, peligro, riesgo, 
              medidas_preventivas, codigo_matriz, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            permisoId,
            riesgo.actividad || "Sin actividad",
            riesgo.peligro || "Sin peligro",
            riesgo.riesgo || "Sin riesgo",
            riesgo.medidas || "Sin medidas",
            riesgo.codigo || null,
            formatLocalDateTime(getLocalDateTime())
          ).run();
        }
      }
      if (auditLogger) {
        await auditLogger.log({
          action: "CREATE_PERMISO",
          resource: "permisos",
          resourceId: permisoId.toString(),
          userId: currentUser?.sub || "anonymous",
          userEmail: currentUser?.email || permisoData.usuarioCreador,
          ip: request.headers.get("CF-Connecting-IP"),
          success: true,
          metadata: { numeroPT, planta: permisoData.planta }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        id: permisoId,
        numeroPT,
        numeroCorrelativo,
        message: "Permiso guardado exitosamente"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (error) {
      console.error("Error creando permiso:", error);
      if (auditLogger) {
        await auditLogger.log({
          action: "CREATE_PERMISO_FAILED",
          resource: "permisos",
          userId: currentUser?.sub || "anonymous",
          userEmail: currentUser?.email || permisoData.usuarioCreador,
          ip: request.headers.get("CF-Connecting-IP"),
          success: false,
          error: error.message
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: `Error al guardar el permiso: ${error.message}`
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
  try {
    const permisosResult = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre,
        pc.usuario_aprobador_cierre_id,
        pc.usuario_aprobador_cierre_nombre,
        pc.fecha_aprobacion_cierre,
        pc.estado_aprobacion_cierre,
        pc.motivo_rechazo,
        GROUP_CONCAT(DISTINCT pp.personal_nombre || ' (' || pp.personal_empresa || ')') as personal_asignado,
        GROUP_CONCAT(DISTINCT pp.personal_id) as personal_ids
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      LEFT JOIN permiso_personal pp ON p.id = pp.permiso_id
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
      LIMIT 100
    `).all();
    const permisos = permisosResult.results || [];
    for (let permiso of permisos) {
      const actividadesResult = await env.DB_PERMISOS.prepare(`
        SELECT actividad_nombre, tipo_actividad
        FROM permiso_actividades
        WHERE permiso_id = ?
      `).bind(permiso.id).all();
      permiso.actividades_detalle = actividadesResult.results || [];
      try {
        const materialesResult = await env.DB_PERMISOS.prepare(`
          SELECT descripcion as material_nombre, cantidad as material_cantidad, 
                 propietario as material_propietario, almacen as material_almacen,
                 numero_item, numero_serie, observaciones_material
          FROM permiso_materiales
          WHERE permiso_id = ?
          ORDER BY descripcion ASC
        `).bind(permiso.id).all();
        permiso.materiales_detalle = materialesResult.results || [];
      } catch (e) {
        console.error("Error cargando materiales para permiso", permiso.id, ":", e);
        permiso.materiales_detalle = [];
      }
      try {
        const matrizResult = await env.DB_PERMISOS.prepare(`
          SELECT riesgo_descripcion, medida_control
          FROM permiso_matriz_riesgos
          WHERE permiso_id = ?
        `).bind(permiso.id).all();
        permiso.matriz_riesgos_detalle = matrizResult.results || [];
      } catch (e) {
        permiso.matriz_riesgos_detalle = [];
      }
    }
    return new Response(JSON.stringify({
      success: true,
      permisos
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error consultando permisos:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePermisos, "handlePermisos");
async function handleAprobarPermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const rawData = await request.json();
    const { permisoId, usuarioAprobador } = InputSanitizer.sanitizeObject(rawData);
    if (!permisoId || !usuarioAprobador) {
      return new Response(JSON.stringify({
        success: false,
        error: "Datos requeridos faltantes"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const result = await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = 'ACTIVO',
        usuario_aprobador = ?,
        usuario_aprobador_apertura_id = ?,
        usuario_aprobador_apertura_nombre = ?,
        fecha_aprobacion = ?
      WHERE id = ? AND estado = 'CREADO'
    `).bind(
      usuarioAprobador,
      currentUser?.sub || "unknown",
      currentUser?.email || usuarioAprobador,
      formatLocalDateTime(getLocalDateTime()),
      permisoId
    ).run();
    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Permiso no encontrado o ya procesado"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (auditLogger) {
      await auditLogger.log({
        action: "APPROVE_PERMISO",
        resource: "permisos",
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email || usuarioAprobador,
        ip: request.headers.get("CF-Connecting-IP"),
        success: true
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Permiso aprobado exitosamente"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error aprobando permiso:", error);
    if (auditLogger) {
      await auditLogger.log({
        action: "APPROVE_PERMISO_FAILED",
        resource: "permisos",
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email || "unknown",
        ip: request.headers.get("CF-Connecting-IP"),
        success: false,
        error: error.message
      });
    }
    return new Response(JSON.stringify({
      success: false,
      error: `Error al aprobar el permiso: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleAprobarPermiso, "handleAprobarPermiso");
async function handleCerrarPermiso(request, corsHeaders, env, currentUser, services) {
  const { auditLogger } = services;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const rawData = await request.json();
    const cierreData = InputSanitizer.sanitizeObject(rawData);
    const {
      permisoId,
      usuarioCierre,
      fechaFinTrabajos,
      materiales = []
    } = cierreData;
    if (!permisoId || !usuarioCierre || !fechaFinTrabajos) {
      return new Response(JSON.stringify({
        success: false,
        error: "Datos requeridos faltantes"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo 
      SET 
        estado = 'CERRADO_PENDIENTE_APROBACION',
        observaciones = ?
      WHERE id = ? AND estado IN ('ACTIVO', 'CIERRE_RECHAZADO')
    `).bind(
      cierreData.observacionesCierre || "Trabajo completado",
      permisoId
    ).run();
    const existingCierre = await env.DB_PERMISOS.prepare(`
      SELECT id FROM permiso_cierre WHERE permiso_id = ?
    `).bind(permisoId).first();
    if (existingCierre) {
      await env.DB_PERMISOS.prepare(`
        UPDATE permiso_cierre SET
          fecha_inicio_trabajos = ?,
          fecha_fin_trabajos = ?,
          fecha_parada_turbina = ?,
          fecha_puesta_marcha_turbina = ?,
          observaciones_cierre = ?,
          usuario_cierre = ?,
          fecha_cierre = ?,
          estado_aprobacion_cierre = 'PENDIENTE',
          updated_at = CURRENT_TIMESTAMP
        WHERE permiso_id = ?
      `).bind(
        cierreData.fechaInicioTrabajos || null,
        fechaFinTrabajos,
        cierreData.fechaParadaTurbina || null,
        cierreData.fechaPuestaMarcha || null,
        cierreData.observacionesCierre || "Trabajo completado",
        usuarioCierre,
        formatLocalDateTime(getLocalDateTime()),
        permisoId
      ).run();
    } else {
      await env.DB_PERMISOS.prepare(`
        INSERT INTO permiso_cierre (
          permiso_id, 
          fecha_inicio_trabajos, 
          fecha_fin_trabajos,
          fecha_parada_turbina,
          fecha_puesta_marcha_turbina,
          observaciones_cierre,
          usuario_cierre,
          fecha_cierre,
          estado_aprobacion_cierre
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        permisoId,
        cierreData.fechaInicioTrabajos || null,
        fechaFinTrabajos,
        cierreData.fechaParadaTurbina || null,
        cierreData.fechaPuestaMarcha || null,
        cierreData.observacionesCierre || "Trabajo completado",
        usuarioCierre,
        formatLocalDateTime(getLocalDateTime()),
        "PENDIENTE"
      ).run();
    }
    if (materiales && materiales.length > 0) {
      for (const material of materiales) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_materiales (
            permiso_id, cantidad, descripcion, propietario,
            almacen, fecha_uso, numero_item, numero_serie,
            observaciones_material, fecha_registro
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          permisoId,
          material.cantidad || 1,
          material.descripcion || "Material sin descripci\xF3n",
          material.propietario || "No especificado",
          material.almacen || "Central",
          formatLocalDateTime(getLocalDateTime()),
          material.numeroItem || null,
          material.numeroSerie || null,
          material.observaciones || null,
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }
    if (auditLogger) {
      await auditLogger.log({
        action: "CLOSE_PERMISO",
        resource: "permisos",
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email || usuarioCierre,
        ip: request.headers.get("CF-Connecting-IP"),
        success: true,
        metadata: { materialesCount: materiales.length }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Permiso cerrado exitosamente",
      materialesCount: materiales.length
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error cerrando permiso:", error);
    if (auditLogger) {
      await auditLogger.log({
        action: "CLOSE_PERMISO_FAILED",
        resource: "permisos",
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email || "unknown",
        ip: request.headers.get("CF-Connecting-IP"),
        success: false,
        error: error.message
      });
    }
    return new Response(JSON.stringify({
      success: false,
      error: `Error al cerrar el permiso: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleCerrarPermiso, "handleCerrarPermiso");
async function handleObtenerDetalleAprobacion(request, corsHeaders, env, currentUser, services) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const { InputSanitizer: InputSanitizer2 } = services;
  const url = new URL(request.url);
  const permisoId = url.searchParams.get("id");
  if (!permisoId) {
    return new Response(JSON.stringify({
      success: false,
      error: "ID del permiso requerido"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre,
        pc.estado_aprobacion_cierre,
        pc.motivo_rechazo,
        GROUP_CONCAT(DISTINCT pp.personal_nombre || ' (' || pp.personal_empresa || ')') as personal_asignado,
        GROUP_CONCAT(DISTINCT pa.actividad_nombre) as actividades_realizadas
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      LEFT JOIN permiso_personal pp ON p.id = pp.permiso_id
      LEFT JOIN permiso_actividades pa ON p.id = pa.permiso_id
      WHERE p.id = ?
      GROUP BY p.id
    `).bind(permisoId).first();
    if (!permiso) {
      return new Response(JSON.stringify({
        success: false,
        error: "Permiso no encontrado"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const materiales = await env.DB_PERMISOS.prepare(`
      SELECT * FROM permiso_materiales 
      WHERE permiso_id = ?
      ORDER BY fecha_registro DESC
    `).bind(permisoId).all();
    return new Response(JSON.stringify({
      success: true,
      permiso,
      materiales: materiales.results || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error obteniendo detalle para aprobaci\xF3n:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Error al obtener detalles del permiso"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleObtenerDetalleAprobacion, "handleObtenerDetalleAprobacion");
async function handleAprobarCierrePermiso(request, corsHeaders, env, currentUser, services) {
  const { InputSanitizer: InputSanitizer2, auditLogger } = services;
  const userRole = currentUser?.rol || "user";
  if (!["Admin", "Supervisor"].includes(userRole)) {
    return new Response(JSON.stringify({
      success: false,
      error: "No tienes permisos para aprobar cierres"
    }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const rawData = await request.json();
    const { permisoId, observaciones, accion } = InputSanitizer2.sanitizeObject(rawData);
    if (!permisoId || !accion) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID del permiso y acci\xF3n requeridos"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT p.id, p.estado, pc.id as cierre_id, pc.estado_aprobacion_cierre
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      WHERE p.id = ?
    `).bind(permisoId).first();
    if (!permiso || !permiso.cierre_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Permiso no encontrado o no est\xE1 cerrado"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (permiso.estado_aprobacion_cierre === "APROBADO") {
      return new Response(JSON.stringify({
        success: false,
        error: "El cierre ya fue aprobado"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (accion === "aprobar") {
      await env.DB_PERMISOS.prepare(`
        UPDATE permiso_cierre 
        SET 
          usuario_aprobador_cierre_id = ?,
          usuario_aprobador_cierre_nombre = ?,
          fecha_aprobacion_cierre = ?,
          estado_aprobacion_cierre = 'APROBADO',
          observaciones_aprobacion = ?,
          updated_at = ?
        WHERE permiso_id = ?
      `).bind(
        currentUser?.sub || "unknown",
        currentUser?.email || currentUser?.name || "Sistema",
        formatLocalDateTime(getLocalDateTime()),
        observaciones || null,
        formatLocalDateTime(getLocalDateTime()),
        permisoId
      ).run();
      await env.DB_PERMISOS.prepare(`
        UPDATE permisos_trabajo 
        SET estado = 'CERRADO'
        WHERE id = ?
      `).bind(permisoId).run();
    } else if (accion === "rechazar") {
      await env.DB_PERMISOS.prepare(`
        UPDATE permiso_cierre 
        SET 
          usuario_aprobador_cierre_id = ?,
          usuario_aprobador_cierre_nombre = ?,
          fecha_rechazo = ?,
          estado_aprobacion_cierre = 'RECHAZADO',
          motivo_rechazo = ?,
          updated_at = ?
        WHERE permiso_id = ?
      `).bind(
        currentUser?.sub || "unknown",
        currentUser?.email || currentUser?.name || "Sistema",
        formatLocalDateTime(getLocalDateTime()),
        observaciones || null,
        formatLocalDateTime(getLocalDateTime()),
        permisoId
      ).run();
      await env.DB_PERMISOS.prepare(`
        UPDATE permisos_trabajo 
        SET estado = 'CIERRE_RECHAZADO'
        WHERE id = ?
      `).bind(permisoId).run();
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "Acci\xF3n no v\xE1lida"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (auditLogger) {
      await auditLogger.log({
        action: "APPROVE_CIERRE_PERMISO",
        resource: "permisos",
        resourceId: permisoId.toString(),
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email || "unknown",
        ip: request.headers.get("CF-Connecting-IP"),
        details: { observaciones },
        success: true
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: accion === "aprobar" ? "Cierre aprobado exitosamente" : "Cierre rechazado, permiso marcado como cierre rechazado"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error aprobando cierre:", error);
    if (auditLogger) {
      await auditLogger.log({
        action: "APPROVE_CIERRE_PERMISO_FAILED",
        resource: "permisos",
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email || "unknown",
        ip: request.headers.get("CF-Connecting-IP"),
        success: false,
        error: error.message
      });
    }
    return new Response(JSON.stringify({
      success: false,
      error: `Error al aprobar cierre: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleAprobarCierrePermiso, "handleAprobarCierrePermiso");
async function handleGenerateRegister(request, corsHeaders, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const rawData = await request.json();
  const data = InputSanitizer.sanitizeObject(rawData);
  const htmlContent = pdf_default(data);
  return new Response(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="TomaConocimiento_${data.planta}_${formatLocalDateTime(getLocalDateTime()).split(" ")[0].replace(/-/g, "")}.html"`,
      ...corsHeaders
    }
  });
}
__name(handleGenerateRegister, "handleGenerateRegister");
async function handleHealth(request, corsHeaders, env) {
  try {
    const checks = {
      db_master: false,
      db_hseq: false,
      db_permisos: false
    };
    if (env.DB_MASTER) {
      try {
        const test = await env.DB_MASTER.prepare("SELECT COUNT(*) as count FROM usuarios").first();
        checks.db_master = true;
        checks.usuarios_count = test?.count || 0;
      } catch (error) {
        checks.db_master_error = error.message;
      }
    }
    if (env.DB_HSEQ) {
      try {
        const test = await env.DB_HSEQ.prepare("SELECT COUNT(*) as count FROM matriz_riesgos").first();
        checks.db_hseq = true;
        checks.matriz_count = test?.count || 0;
      } catch (error) {
        checks.db_hseq_error = error.message;
      }
    }
    if (env.DB_PERMISOS) {
      try {
        const test = await env.DB_PERMISOS.prepare("SELECT COUNT(*) as count FROM permisos_trabajo").first();
        checks.db_permisos = true;
        checks.permisos_count = test?.count || 0;
      } catch (error) {
        checks.db_permisos_error = error.message;
      }
    }
    return new Response(JSON.stringify({
      status: "OK",
      databases: checks,
      localTime: formatLocalDateTime(getLocalDateTime()),
      message: "Sistema operativo con D1 Database"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: "ERROR",
      error: error.message,
      timestamp: formatLocalDateTime(getLocalDateTime())
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleHealth, "handleHealth");
async function handleUpdatePermiso(permisoData, env, currentUser, services, corsHeaders) {
  const { auditLogger } = services;
  console.log("BACKEND - Recibiendo edici\xF3n permiso, ID:", permisoData.permisoId, "Datos:", JSON.stringify(permisoData, null, 2));
  if (!permisoData.permisoId) {
    return new Response(JSON.stringify({
      success: false,
      error: "ID del permiso requerido para actualizaci\xF3n"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const existingPermiso = await env.DB_PERMISOS.prepare(`
      SELECT * FROM permisos_trabajo WHERE id = ? AND estado = 'CREADO'
    `).bind(permisoData.permisoId).first();
    if (!existingPermiso) {
      return new Response(JSON.stringify({
        success: false,
        error: "Permiso no encontrado o no se puede editar (debe estar en estado CREADO)"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const esCreador = parseInt(currentUser.id) === parseInt(existingPermiso.usuario_creador_id);
    const esEnel = currentUser.esEnel || currentUser.rol === "Supervisor Enel";
    if (!esCreador && !esEnel) {
      return new Response(JSON.stringify({
        success: false,
        error: "Solo el creador del permiso puede editarlo"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    await env.DB_PERMISOS.prepare(`
      UPDATE permisos_trabajo SET 
        planta_id = ?, planta_nombre = ?, aerogenerador_id = ?, 
        aerogenerador_nombre = ?, descripcion = ?, jefe_faena_id = ?, 
        jefe_faena_nombre = ?, supervisor_parque_id = ?, supervisor_parque_nombre = ?, 
        tipo_mantenimiento = ?, tipo_mantenimiento_otros = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      permisoData.plantaId || "unknown",
      permisoData.planta,
      permisoData.aerogeneradorCodigo || null,
      permisoData.aerogenerador || null,
      permisoData.descripcion,
      permisoData.jefeFaenaId || "unknown",
      permisoData.jefeFaena,
      permisoData.supervisorParqueId || null,
      permisoData.supervisorParque || null,
      permisoData.tipoMantenimiento || "PREVENTIVO",
      permisoData.tipoMantenimientoOtros || null,
      formatLocalDateTime(getLocalDateTime()),
      permisoData.permisoId
    ).run();
    await env.DB_PERMISOS.prepare(`DELETE FROM permiso_personal WHERE permiso_id = ?`).bind(permisoData.permisoId).run();
    await env.DB_PERMISOS.prepare(`DELETE FROM permiso_actividades WHERE permiso_id = ?`).bind(permisoData.permisoId).run();
    await env.DB_PERMISOS.prepare(`DELETE FROM permiso_matriz_riesgos WHERE permiso_id = ?`).bind(permisoData.permisoId).run();
    if (permisoData.personal && permisoData.personal.length > 0) {
      for (const persona of permisoData.personal) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_personal (
            permiso_id, personal_id, personal_nombre, 
            personal_empresa, personal_rol, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          permisoData.permisoId,
          parseInt(persona.id),
          persona.nombre || "Sin nombre",
          persona.empresa || "Sin empresa",
          persona.rol || "Sin rol",
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }
    if (permisoData.actividades && permisoData.actividades.length > 0) {
      for (const actividad of permisoData.actividades) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_actividades (
            permiso_id, actividad_id, actividad_nombre, 
            tipo_actividad, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          permisoData.permisoId,
          actividad.id || "unknown",
          actividad.nombre || "Sin nombre",
          actividad.tipo || "RUTINARIA",
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }
    if (permisoData.matrizRiesgos && permisoData.matrizRiesgos.length > 0) {
      for (const riesgo of permisoData.matrizRiesgos) {
        await env.DB_PERMISOS.prepare(`
          INSERT INTO permiso_matriz_riesgos (
            permiso_id, actividad, peligro, riesgo, 
            medidas_preventivas, codigo_matriz, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          permisoData.permisoId,
          riesgo.actividad || "Sin actividad",
          riesgo.peligro || "Sin peligro",
          riesgo.riesgo || "Sin riesgo",
          riesgo.medidas || "Sin medidas",
          riesgo.codigo || null,
          formatLocalDateTime(getLocalDateTime())
        ).run();
      }
    }
    if (auditLogger) {
      await auditLogger.log({
        action: "UPDATE_PERMISO",
        resource: "permisos",
        resourceId: permisoData.permisoId.toString(),
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email,
        ip: null,
        success: true,
        metadata: { numeroPT: existingPermiso.numero_pt, planta: permisoData.planta }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      id: permisoData.permisoId,
      numeroPT: existingPermiso.numero_pt,
      message: "Permiso actualizado exitosamente"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error actualizando permiso:", error);
    if (auditLogger) {
      await auditLogger.log({
        action: "UPDATE_PERMISO_FAILED",
        resource: "permisos",
        resourceId: permisoData.permisoId?.toString(),
        userId: currentUser?.sub || "anonymous",
        userEmail: currentUser?.email,
        ip: null,
        success: false,
        error: error.message
      });
    }
    return new Response(JSON.stringify({
      success: false,
      error: `Error al actualizar el permiso: ${error.message}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleUpdatePermiso, "handleUpdatePermiso");
async function handlePermisoDetalle(request, corsHeaders, env, currentUser, services) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!currentUser || !currentUser.sub) {
    return new Response(JSON.stringify({ error: "Usuario no autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get("id");
    if (!permisoId) {
      return new Response(JSON.stringify({ error: "ID del permiso requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT * FROM permisos_trabajo WHERE id = ?
    `).bind(permisoId).first();
    if (!permiso) {
      return new Response(JSON.stringify({
        success: false,
        error: "Permiso no encontrado"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const esCreador = parseInt(currentUser.id) === parseInt(permiso.usuario_creador_id);
    const esEnel = currentUser.esEnel || currentUser.rol === "Supervisor Enel";
    if (!esCreador && !esEnel) {
      return new Response(JSON.stringify({
        success: false,
        error: "No tienes permisos para ver este permiso"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const actividadesResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad_id FROM permiso_actividades WHERE permiso_id = ?
    `).bind(permisoId).all();
    const actividades_ids = (actividadesResult.results || []).map((a) => a.actividad_id).join(",");
    const personalResult = await env.DB_PERMISOS.prepare(`
      SELECT personal_id FROM permiso_personal WHERE permiso_id = ?
    `).bind(permisoId).all();
    const personal_ids = (personalResult.results || []).map((p) => p.personal_id).join(",");
    permiso.actividades_ids = actividades_ids;
    permiso.personal_ids = personal_ids;
    return new Response(JSON.stringify({
      success: true,
      permiso
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error obteniendo detalle permiso:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handlePermisoDetalle, "handlePermisoDetalle");
async function handleExportarPermisoExcel(request, corsHeaders, env, currentUser, services) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!currentUser || !currentUser.sub) {
    return new Response(JSON.stringify({ error: "Usuario no autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get("id");
    if (!permisoId) {
      return new Response(JSON.stringify({ error: "ID del permiso requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre,
        pc.usuario_aprobador_cierre_id,
        pc.usuario_aprobador_cierre_nombre,
        pc.fecha_aprobacion_cierre,
        pc.estado_aprobacion_cierre
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      WHERE p.id = ?
    `).bind(permisoId).first();
    if (!permiso) {
      return new Response(JSON.stringify({ error: "Permiso no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const personalResult = await env.DB_PERMISOS.prepare(`
      SELECT personal_nombre, personal_empresa, personal_rol
      FROM permiso_personal
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    const actividadesResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad_nombre, tipo_actividad
      FROM permiso_actividades
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    const materialesResult = await env.DB_PERMISOS.prepare(`
      SELECT descripcion, cantidad, propietario, almacen, numero_item, numero_serie
      FROM permiso_materiales
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    const riesgosResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad, peligro, riesgo, medidas_preventivas, codigo_matriz
      FROM permiso_matriz_riesgos
      WHERE permiso_id = ?
    `).bind(permisoId).all();
    const BOM = "\uFEFF";
    let csvContent = BOM;
    csvContent += "=== INFORMACI\xD3N GENERAL ===\n";
    csvContent += "Campo,Valor\n";
    csvContent += `"N\xFAmero PT","${permiso.numero_pt || ""}"
`;
    csvContent += `"Planta","${permiso.planta_nombre || ""}"
`;
    csvContent += `"Aerogenerador","${permiso.aerogenerador_nombre || ""}"
`;
    csvContent += `"Estado","${permiso.estado || ""}"
`;
    csvContent += `"Fecha Creaci\xF3n","${permiso.fecha_creacion || ""}"
`;
    csvContent += `"Jefe de Faena","${permiso.jefe_faena_nombre || ""}"
`;
    csvContent += `"Supervisor Parque","${permiso.supervisor_parque_nombre || ""}"
`;
    csvContent += `"Tipo Mantenimiento","${permiso.tipo_mantenimiento || ""}"
`;
    csvContent += `"Descripci\xF3n","${(permiso.descripcion || "").replace(/"/g, '""')}"
`;
    csvContent += `"Observaciones de Cierre","${(permiso.observaciones_cierre || "").replace(/"/g, '""')}"
`;
    csvContent += `"Usuario Cierre","${permiso.usuario_cierre || ""}"
`;
    csvContent += `"Fecha Cierre","${permiso.fecha_cierre || ""}"
`;
    csvContent += `"Aprobador Apertura","${permiso.usuario_aprobador_apertura_nombre || permiso.usuario_aprobador || ""}"
`;
    csvContent += `"Fecha Aprobaci\xF3n Apertura","${permiso.fecha_aprobacion || ""}"
`;
    csvContent += `"Aprobador Cierre","${permiso.usuario_aprobador_cierre_nombre || ""}"
`;
    csvContent += `"Fecha Aprobaci\xF3n Cierre","${permiso.fecha_aprobacion_cierre || ""}"
`;
    csvContent += `"Estado Aprobaci\xF3n Cierre","${permiso.estado_aprobacion_cierre || "PENDIENTE"}"
`;
    csvContent += "\n";
    csvContent += "=== TIEMPOS ===\n";
    csvContent += "Evento,Fecha/Hora (Hora Chile)\n";
    csvContent += `"Creaci\xF3n Permiso","${permiso.fecha_creacion || ""}"
`;
    csvContent += `"Aprobaci\xF3n Apertura","${permiso.fecha_aprobacion || ""}"
`;
    csvContent += `"Inicio Trabajos","${permiso.fecha_inicio_trabajos || ""}"
`;
    csvContent += `"Fin Trabajos","${permiso.fecha_fin_trabajos || ""}"
`;
    csvContent += `"Parada Turbina","${permiso.fecha_parada_turbina || ""}"
`;
    csvContent += `"Puesta en Marcha","${permiso.fecha_puesta_marcha_turbina || ""}"
`;
    csvContent += `"Cierre Permiso","${permiso.fecha_cierre || ""}"
`;
    csvContent += `"Aprobaci\xF3n Cierre","${permiso.fecha_aprobacion_cierre || ""}"
`;
    csvContent += "\n";
    csvContent += "=== PERSONAL ASIGNADO ===\n";
    csvContent += "Nombre,Empresa,Rol\n";
    (personalResult.results || []).forEach((p) => {
      csvContent += `"${p.personal_nombre}","${p.personal_empresa}","${p.personal_rol}"
`;
    });
    csvContent += "\n";
    csvContent += "=== ACTIVIDADES ===\n";
    csvContent += "Actividad,Tipo\n";
    (actividadesResult.results || []).forEach((a) => {
      csvContent += `"${a.actividad_nombre}","${a.tipo_actividad}"
`;
    });
    csvContent += "\n";
    csvContent += "=== MATERIALES ===\n";
    csvContent += "Descripci\xF3n,Cantidad,Propietario,Almac\xE9n,N\xB0 Item,N\xB0 Serie\n";
    (materialesResult.results || []).forEach((m) => {
      csvContent += `"${m.descripcion}","${m.cantidad}","${m.propietario}","${m.almacen}","${m.numero_item || ""}","${m.numero_serie || ""}"
`;
    });
    csvContent += "\n";
    csvContent += "=== MATRIZ DE RIESGOS ===\n";
    csvContent += "Actividad,Peligro,Riesgo,Medidas Preventivas,C\xF3digo Matriz\n";
    (riesgosResult.results || []).forEach((r) => {
      csvContent += `"${(r.actividad || "").replace(/"/g, '""')}","${(r.peligro || "").replace(/"/g, '""')}","${(r.riesgo || "").replace(/"/g, '""')}","${(r.medidas_preventivas || "").replace(/"/g, '""')}","${r.codigo_matriz || ""}"
`;
    });
    const fechaActual = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "");
    const filename = `${permiso.numero_pt}_${fechaActual}.csv`;
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error exportando Excel:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleExportarPermisoExcel, "handleExportarPermisoExcel");
async function handleExportarPermisoPdf(request, corsHeaders, env, currentUser, services) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  if (!currentUser || !currentUser.sub) {
    return new Response(JSON.stringify({ error: "Usuario no autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  try {
    const url = new URL(request.url);
    const permisoId = url.searchParams.get("id");
    if (!permisoId) {
      return new Response(JSON.stringify({ error: "ID del permiso requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const permiso = await env.DB_PERMISOS.prepare(`
      SELECT 
        p.*,
        pc.fecha_inicio_trabajos,
        pc.fecha_fin_trabajos,
        pc.fecha_parada_turbina,
        pc.fecha_puesta_marcha_turbina,
        pc.observaciones_cierre,
        pc.usuario_cierre,
        pc.fecha_cierre,
        pc.usuario_aprobador_cierre_id,
        pc.usuario_aprobador_cierre_nombre,
        pc.fecha_aprobacion_cierre,
        pc.estado_aprobacion_cierre
      FROM permisos_trabajo p
      LEFT JOIN permiso_cierre pc ON p.id = pc.permiso_id
      WHERE p.id = ?
    `).bind(permisoId).first();
    if (!permiso) {
      return new Response(JSON.stringify({ error: "Permiso no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const personalResult = await env.DB_PERMISOS.prepare(`
      SELECT personal_nombre, personal_empresa, personal_rol
      FROM permiso_personal WHERE permiso_id = ?
    `).bind(permisoId).all();
    const actividadesResult = await env.DB_PERMISOS.prepare(`
      SELECT actividad_nombre, tipo_actividad
      FROM permiso_actividades WHERE permiso_id = ?
    `).bind(permisoId).all();
    const materialesResult = await env.DB_PERMISOS.prepare(`
      SELECT descripcion, cantidad, propietario, almacen
      FROM permiso_materiales WHERE permiso_id = ?
    `).bind(permisoId).all();
    let matrizRiesgosCompleta = [];
    if (actividadesResult.results && actividadesResult.results.length > 0) {
      const actividades = actividadesResult.results.map((a) => a.actividad_nombre);
      const placeholders = actividades.map(() => "?").join(",");
      const matrizResult = await env.DB_HSEQ.prepare(`
        SELECT codigo, actividad, peligro, riesgo, medidas_preventivas
        FROM matriz_riesgos 
        WHERE estado = 'Activo' AND actividad IN (${placeholders})
        ORDER BY actividad ASC, codigo ASC
      `).bind(...actividades).all();
      matrizRiesgosCompleta = matrizResult.results || [];
    }
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Permiso de Trabajo ${permiso.numero_pt} - Exportaci\xF3n</title>
    <style>
        @media print {
            @page {
                margin: 0.5in;
                size: A4;
            }
            body {
                margin: 0;
                padding: 0;
            }
            .print-button {
                display: none !important;
            }
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #333; 
            margin: 0;
            padding: 20px;
            background: white;
        }
        
        .header { 
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .logo {
            width: 120px;
            height: 80px;
            margin-right: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .header-info {
            flex: 1;
        }
        
        .title { 
            color: #0066cc; 
            font-size: 18px; 
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        
        .subtitle { 
            color: #666; 
            font-size: 14px; 
            margin-top: 5px;
            text-align: center;
        }
        
        .section { 
            margin-bottom: 25px; 
        }
        
        .section-title { 
            background: #4CAF50; 
            color: white; 
            padding: 8px 12px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        
        .info-item { 
            margin-bottom: 8px; 
        }
        
        .info-label { 
            font-weight: bold; 
            color: #0066cc; 
        }
        
        .info-value { 
            margin-left: 10px; 
        }
        
        .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
        }
        
        .table th { 
            background: #4CAF50; 
            color: white;
            padding: 8px; 
            border: 1px solid #000; 
            font-weight: bold;
            text-align: center;
            font-size: 10px;
        }
        
        .table td { 
            padding: 8px; 
            border: 1px solid #000; 
        }
        
        .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 10px; 
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background: #45a049;
        }
        
        .description-content {
            border: 1px solid #000;
            padding: 10px;
            min-height: 40px;
            background: #f9f9f9;
            margin-top: 5px;
        }
        
        .observaciones-box {
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #ddd;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">\u{1F5A8}\uFE0F Imprimir PDF</button>
    
    <div class="header">
        <div class="logo">
            <!-- AQU\xCD VA EL LOGO SVG DE ENEL -->
            <!-- Copiar el mismo src="data:image/svg+xml;base64,..." del archivo generateTomaConocimientoPDF -->
            <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiIFsKCTwhRU5USVRZIG5zX2V4dGVuZCAiaHR0cDovL25zLmFkb2JlLmNvbS9FeHRlbnNpYmlsaXR5LzEuMC8iPgoJPCFFTlRJVFkgbnNfYWkgImh0dHA6Ly9ucy5hZG9iZS5jb20vQWRvYmVJbGx1c3RyYXRvci8xMC4wLyI+Cgk8IUVOVElUWSBuc19ncmFwaHMgImh0dHA6Ly9ucy5hZG9iZS5jb20vR3JhcGhzLzEuMC8iPgoJPCFFTlRJVFkgbnNfdmFycyAiaHR0cDovL25zLmFkb2JlLmNvbS9WYXJpYWJsZXMvMS4wLyI+Cgk8IUVOVElUWSBuc19pbXJlcCAiaHR0cDovL25zLmFkb2JlLmNvbS9JbWFnZVJlcGxhY2VtZW50LzEuMC8iPgoJPCFFTlRJVFkgbnNfc2Z3ICJodHRwOi8vbnMuYWRvYmUuY29tL1NhdmVGb3JXZWIvMS4wLyI+Cgk8IUVOVElUWSBuc19jdXN0b20gImh0dHA6Ly9ucy5hZG9iZS5jb20vR2VuZXJpY0N1c3RvbU5hbWVzcGFjZS8xLjAvIj4KCTwhRU5USVRZIG5zX2Fkb2JlX3hwYXRoICJodHRwOi8vbnMuYWRvYmUuY29tL1hQYXRoLzEuMC8iPgpdPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkVHUF9Mb2dvX1ByaW1hcnlfUkdCIiB4bWxuczp4PSImbnNfZXh0ZW5kOyIgeG1sbnM6aT0iJm5zX2FpOyIgeG1sbnM6Z3JhcGg9IiZuc19ncmFwaHM7IgoJIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjgzLjUgMTQyLjEiCgkgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjgzLjUgMTQyLjEiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8bWV0YWRhdGE+Cgk8c2Z3ICB4bWxucz0iJm5zX3NmdzsiPgoJCTxzbGljZXM+PC9zbGljZXM+CgkJPHNsaWNlU291cmNlQm91bmRzICBib3R0b21MZWZ0T3JpZ2luPSJ0cnVlIiBoZWlnaHQ9IjE0Mi4xIiB3aWR0aD0iMjgzLjUiIHg9IjI2OTQuNiIgeT0iLTQxMzkuNSI+PC9zbGljZVNvdXJjZUJvdW5kcz4KCTwvc2Z3Pgo8L21ldGFkYXRhPgo8Zz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjY2Ljg2MiIgeTE9IjQxLjI5NjkiIHgyPSIyNjYuODYyIiB5Mj0iNzYuNDU5NCI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cmVjdCB4PSIyNjEiIHk9IjQxIiBmaWxsPSJ1cmwoI1NWR0lEXzFfKSIgd2lkdGg9IjExLjciIGhlaWdodD0iMzUuNCIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8yXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyNzEuMjU5OCIgeTE9Ijg2LjgzNzUiIHgyPSIyODEuOTk0NiIgeTI9Ijk1LjY4OSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzczQjk2NCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQ7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzJfKSIgZD0iTTI3Mi43LDc2LjNjMCw4LjUsMy45LDEyLjEsMTAuNywxNi44bC02LjcsOS42Yy0xMC02LjYtMTUuOC0xNC0xNS44LTI2LjRIMjcyLjd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjEwMS41MDY1IiB5MT0iNDEuNDQ0MSIgeDI9IjEyOC40Nzc4IiB5Mj0iNDEuNDQ0MSI+CgkJPHN0b3AgIG9mZnNldD0iNC43MDIyNDFlLTAzIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA4QzVBIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45OTU3IiBzdHlsZT0ic3RvcC1jb2xvcjojMzJBOTU5Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8zXykiIGQ9Ik0xMjcuNiwyNC4yYy0xMC4yLDAtMTkuNCw0LjEtMjYuMSwxMC43djIzLjhjMS44LTkuNCwxMC4xLTIyLjgsMjYuMS0yMi44YzAuMywwLDAuNiwwLDAuOSwwVjI0LjIKCQlDMTI4LjIsMjQuMiwxMjcuOSwyNC4yLDEyNy42LDI0LjJ6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzRfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE0NC4wNjczIiB5MT0iMzguMzY2IiB4Mj0iMTQ0LjA2NzMiIHkyPSI1OS4xMTYxIj4KCQk8c3RvcCAgb2Zmc2V0PSIxLjExMDQ1NmUtMDIiIHN0eWxlPSJzdG9wLWNvbG9yOiMzMkE5NTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjE3MDEiIHN0eWxlPSJzdG9wLWNvbG9yOiM0MUIyNTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMzMyIgc3R5bGU9InN0b3AtY29sb3I6IzU1QkU1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM1NUJFNUE7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzRfKSIgZD0iTTE2MC4yLDYwLjVoLTExLjdsMC0zLjljMC0xMS42LTkuMi0yMC42LTIwLjUtMjAuN1YyNC4yYzE3LjgsMC4yLDMyLjIsMTQuNSwzMi4yLDMyLjVWNjAuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfNV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTUzLjc0MjgiIHkxPSI1NC41ODI2IiB4Mj0iMTU0LjMzOTciIHkyPSI2MC42NjM5Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojRTk0OTg2Ii8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6I0U5NDk4NjtzdG9wLW9wYWNpdHk6MCIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxsaW5lIGZpbGw9InVybCgjU1ZHSURfNV8pIiB4MT0iMTYwLjIiIHkxPSI2MC41IiB4Mj0iMTQ4LjUiIHkyPSI2MC41Ii8+Cgk8cmVjdCB4PSI4OS44IiB5PSIyNy40IiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMjYxIiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMTQ4LjUiIHk9IjYwLjUiIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSIxMS43IiBoZWlnaHQ9IjQxIi8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzZfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjcxLjUyMyIgeTE9IjUzLjMzOTIiIHgyPSI2NC4xNjY0IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzZfKSIgZD0iTTY2LjEsNTYuN2gxMmMtMS40LTguMy01LjUtMTUuNi0xMS4yLTIxLjNsLTguMiw4LjRDNjIuMiw0Ny4zLDY0LjgsNTEuNyw2Ni4xLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjYxLjIxODUiIHkxPSIzNy41MzgyIiB4Mj0iNDEuNzU0MyIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzdfKSIgZD0iTTM5LjMsMzUuOWM3LjYsMCwxNC41LDMuMSwxOS41LDhsOC4zLTguM2MtNy4xLTcuMS0xNy0xMS41LTI3LjgtMTEuNWMtMC4xLDAtMC4yLDAtMC4zLDBMMzksMzUuOQoJCUMzOS4xLDM1LjksMzkuMiwzNS45LDM5LjMsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfOF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTYuODgiIHkxPSIzNy44NjYyIiB4Mj0iMzYuNDk3NCIgeTI9IjI5LjUxMzUiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMjg5QjVEIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF84XykiIGQ9Ik0zOS4zLDM1LjlWMjQuMmMtMTEsMC0yMC45LDQuNS0yOCwxMS43bDguNCw4LjJDMjQuNiwzOS4xLDMxLjYsMzUuOSwzOS4zLDM1Ljl6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzlfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjUuNDEwNCIgeTE9IjYwLjcyMzUiIHgyPSIxMy40NTY2IiB5Mj0iNDEuNDEyNiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzUwQUI2MCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzlfKSIgZD0iTTExLjcsNjMuNWMwLTcuNiwzLjEtMTQuNSw4LjEtMTkuNWwtOC4zLTguM0M0LjQsNDIuOCwwLDUyLjYsMCw2My41YzAsMC4xLDAsMC4yLDAsMC4zbDExLjctMC4xCgkJQzExLjcsNjMuNiwxMS43LDYzLjUsMTEuNyw2My41eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xMF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iNS4zNTE0IiB5MT0iNjYuMzE5IiB4Mj0iMTMuNzA0MiIgeTI9Ijg1Ljc4MzIiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MEFCNjAiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMF8pIiBkPSJNMTEuNyw2My41SDBjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTQuOSw3OC4xLDExLjcsNzEuMiwxMS43LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzExXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxNS41MzYzIiB5MT0iODguNzAwMyIgeDI9IjM4LjMyMjkiIHkyPSI5OC4wMjIxIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45NjIzIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMV8pIiBkPSJNMzkuMyw5MWMtNy42LDAtMTQuNS0zLjEtMTkuNS04LjFsLTguMyw4LjNjNy4xLDcuMSwxNi45LDExLjUsMjcuOCwxMS41YzAuMSwwLDAuMiwwLDAuMywwCgkJTDM5LjUsOTFDMzkuNCw5MSwzOS40LDkxLDM5LjMsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzEyXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIzOS4yNTg4IiB5MT0iMTA2LjQ5MTEiIHgyPSI2Mi4zNDI2IiB5Mj0iODEuMDUxNyI+CgkJPHN0b3AgIG9mZnNldD0iMC4zMjkiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2O3N0b3Atb3BhY2l0eTowIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMl8pIiBkPSJNNjEuMSw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEw2MS4xLDgwLjJ6Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iNTYuNyIgZmlsbD0iI0M2QzZDNiIgd2lkdGg9IjQxIiBoZWlnaHQ9IjExLjciLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjI0Mi43NDExIiB5MT0iNTMuMzM5MiIgeDI9IjIzNS4zODQ2IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzEzXykiIGQ9Ik0yMzcuMyw1Ni43aDEyYy0xLjQtOC4zLTUuNS0xNS42LTExLjItMjEuM2wtOC4yLDguNEMyMzMuNCw0Ny4zLDIzNiw1MS43LDIzNy4zLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE0XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMzIuNDM2NyIgeTE9IjM3LjUzODIiIHgyPSIyMTIuOTcyNSIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE0XykiIGQ9Ik0yMTAuNSwzNS45YzcuNiwwLDE0LjUsMy4xLDE5LjUsOGw4LjMtOC4zYy03LjEtNy4xLTE3LTExLjUtMjcuOC0xMS41Yy0wLjEsMC0wLjIsMC0wLjMsMAoJCWwwLjEsMTEuN0MyMTAuMywzNS45LDIxMC40LDM1LjksMjEwLjUsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTVfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE4OC4wOTgxIiB5MT0iMzcuODY2MiIgeDI9IjIwNy43MTU2IiB5Mj0iMjkuNTEzNSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE1XykiIGQ9Ik0yMTAuNSwzNS45VjI0LjJjLTExLDAtMjAuOSw0LjUtMjgsMTEuN2w4LjQsOC4yQzE5NS44LDM5LjEsMjAyLjgsMzUuOSwyMTAuNSwzNS45eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xNl8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTc2LjYyODYiIHkxPSI2MC43MjM1IiB4Mj0iMTg0LjY3NDgiIHkyPSI0MS40MTI2Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTZfKSIgZD0iTTE4Mi45LDYzLjVjMC03LjYsMy4xLTE0LjUsOC4xLTE5LjVsLTguMy04LjNjLTcuMSw3LjEtMTEuNSwxNi45LTExLjUsMjcuOGMwLDAuMSwwLDAuMiwwLDAuMwoJCWwxMS43LTAuMUMxODIuOSw2My42LDE4Mi45LDYzLjUsMTgyLjksNjMuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE3Ni41Njk2IiB5MT0iNjYuMzE5IiB4Mj0iMTg0LjkyMjMiIHkyPSI4NS43ODMyIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTdfKSIgZD0iTTE4Mi45LDYzLjVoLTExLjdjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTg2LjEsNzguMSwxODIuOSw3MS4yLDE4Mi45LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE4XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxODYuNzU0NCIgeTE9Ijg4LjcwMDMiIHgyPSIyMDkuNTQxIiB5Mj0iOTguMDIyMSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOTYyMyIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMThfKSIgZD0iTTIxMC41LDkxYy03LjYsMC0xNC41LTMuMS0xOS41LTguMWwtOC4zLDguM2M3LjEsNy4xLDE2LjksMTEuNSwyNy44LDExLjVjMC4xLDAsMC4yLDAsMC4zLDAKCQlMMjEwLjcsOTFDMjEwLjcsOTEsMjEwLjYsOTEsMjEwLjUsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE5XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMTAuNDc2OSIgeTE9IjEwNi40OTExIiB4Mj0iMjMzLjU2MDgiIHkyPSI4MS4wNTE3Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMyOSIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODY7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE5XykiIGQ9Ik0yMzIuNCw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEwyMzIuNCw4MC4yeiIvPgoJPHJlY3QgeD0iMjA4LjIiIHk9IjU2LjciIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSI0MSIgaGVpZ2h0PSIxMS43Ii8+Cgk8Zz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTUzLjIsMTMzLjJ2Ny45Yy0yLDAuOC0zLjksMS02LDFjLTQuNiwwLTcuMi0zLjYtNy4yLTguN2MwLTQuMywyLjMtOC43LDcuMi04LjdjMi44LDAsNS42LDEuNSw1LjksNC41CgkJCWgtMS43Yy0wLjMtMi4xLTIuMi0zLjEtNC4yLTMuMWMtNCwwLTUuNSwzLjktNS41LDcuM2MwLDQuMywxLjgsNy4zLDYuMyw3LjNjMS4zLDAsMi41LTAuMywzLjctMC43di01LjRoLTQuMnYtMS40SDE1My4yeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xNTguNiwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2gwYzAuNC0xLjIsMS41LTIsMi42LTIuMWMwLjUsMCwwLjksMCwxLjQsMHYxLjMKCQkJYy0wLjMsMC0wLjYtMC4xLTAuOS0wLjFjLTIuMSwwLTMuMiwxLjUtMy4yLDMuN1YxNDEuOHoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTY1LjcsMTM2LjNjMCwyLjUsMS4yLDQuNiw0LDQuNmMxLjcsMCwzLTEuMiwzLjQtMi44aDEuNWMtMC43LDIuOC0yLjUsNC4xLTUuMyw0LjFjLTMuNSwwLTUuMS0zLTUuMS02LjIKCQkJYzAtMy4yLDEuNy02LjIsNS4yLTYuMmMzLjksMCw1LjMsMi45LDUuMyw2LjVIMTY1Ljd6IE0xNzMuMiwxMzVjLTAuMi0yLjMtMS40LTQtMy44LTRjLTIuMywwLTMuNSwxLjktMy43LDRIMTczLjJ6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTE3OC42LDEzNi4zYzAsMi41LDEuMiw0LjYsNCw0LjZjMS43LDAsMy0xLjIsMy40LTIuOGgxLjVjLTAuNywyLjgtMi41LDQuMS01LjMsNC4xYy0zLjUsMC01LjEtMy01LjEtNi4yCgkJCWMwLTMuMiwxLjctNi4yLDUuMi02LjJjMy45LDAsNS4zLDIuOSw1LjMsNi41SDE3OC42eiBNMTg2LjEsMTM1Yy0wLjItMi4zLTEuNC00LTMuOC00Yy0yLjMsMC0zLjUsMS45LTMuNyw0SDE4Ni4xeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xOTIuMSwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2wwLDBjMC44LTEuNCwyLjEtMi4xLDMuNi0yLjEKCQkJYzMuOCwwLDQuMSwzLjQsNC4xLDQuN3Y3LjNoLTEuNHYtNy41YzAtMi0xLjItMy4yLTMuMS0zLjJjLTIuMywwLTMuMywxLjktMy4zLDRWMTQxLjh6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIxMC42LDE0MS44VjEyNWg0LjJjMy4yLTAuMSw2LjksMC43LDYuOSw0LjdjMCw0LTMuNiw0LjgtNi45LDQuN2gtMi43djcuM0gyMTAuNnogTTIxMi4xLDEzMy4xaDMuNwoJCQljMi4zLDAsNC4zLTAuNyw0LjMtMy4zYzAtMi42LTItMy4zLTQuMy0zLjNoLTMuN1YxMzMuMXoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjMzLjEsMTM1LjljMCwzLjEtMS43LDYuMi01LjQsNi4yYy0zLjcsMC01LjQtMy4xLTUuNC02LjJzMS43LTYuMiw1LjQtNi4yCgkJCUMyMzEuNCwxMjkuOCwyMzMuMSwxMzIuOSwyMzMuMSwxMzUuOXogTTIyNy43LDEzMWMtMi44LDAtMy45LDIuNy0zLjksNC45czEuMSw0LjksMy45LDQuOWMyLjgsMCwzLjktMi43LDMuOS00LjkKCQkJUzIzMC41LDEzMSwyMjcuNywxMzF6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIzOSwxMzkuOUwyMzksMTM5LjlsMy42LTkuOGgxLjZsMy40LDkuN2gwbDMuNC05LjdoMS41bC00LjMsMTEuN0gyNDdsLTMuNi0xMC4xaDBsLTMuNiwxMC4xaC0xLjQKCQkJbC00LjMtMTEuN2gxLjVMMjM5LDEzOS45eiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0yNTUuMiwxMzYuM2MwLDIuNSwxLjIsNC42LDQsNC42YzEuNiwwLDMtMS4yLDMuNC0yLjhoMS41Yy0wLjcsMi44LTIuNSw0LjEtNS4zLDQuMWMtMy41LDAtNS4xLTMtNS4xLTYuMgoJCQljMC0zLjIsMS43LTYuMiw1LjItNi4yYzMuOSwwLDUuMywyLjksNS4zLDYuNUgyNTUuMnogTTI2Mi43LDEzNWMtMC4yLTIuMy0xLjQtNC0zLjgtNGMtMi4zLDAtMy41LDEuOS0zLjcsNEgyNjIuN3oiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjY4LjcsMTQxLjhoLTEuNHYtOWMwLTAuOS0wLjEtMS44LTAuMS0yLjZoMS40bDAuMSwxLjdoMGMwLjQtMS4yLDEuNS0yLDIuNi0yLjFjMC41LDAsMC45LDAsMS40LDB2MS4zCgkJCWMtMC4zLDAtMC42LTAuMS0wLjktMC4xYy0yLjEsMC0zLjIsMS41LTMuMiwzLjdWMTQxLjh6Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg==" alt="Enel Green Power">
        </div>
        <div class="header-info">
            <div class="title">REPORTE DE PERMISO DE TRABAJO</div>
            <div class="subtitle">${permiso.numero_pt} - ${permiso.planta_nombre}</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">INFORMACI\xD3N GENERAL</div>
        <div class="info-grid">
            <div>
                <div class="info-item"><span class="info-label">N\xFAmero PT:</span><span class="info-value">${permiso.numero_pt || ""}</span></div>
                <div class="info-item"><span class="info-label">Planta:</span><span class="info-value">${permiso.planta_nombre || ""}</span></div>
                <div class="info-item"><span class="info-label">Aerogenerador:</span><span class="info-value">${permiso.aerogenerador_nombre || "N/A"}</span></div>
                <div class="info-item"><span class="info-label">Estado:</span><span class="info-value">${permiso.estado || ""}</span></div>
            </div>
            <div>
                <div class="info-item"><span class="info-label">Jefe de Faena:</span><span class="info-value">${permiso.jefe_faena_nombre || ""}</span></div>
                <div class="info-item"><span class="info-label">Supervisor Responsable:</span><span class="info-value">${permiso.supervisor_parque_nombre || "N/A"}</span></div>
                <div class="info-item"><span class="info-label">Tipo:</span><span class="info-value">${permiso.tipo_mantenimiento || ""}</span></div>
                <div class="info-item"><span class="info-label">Fecha Creaci\xF3n:</span><span class="info-value">${permiso.fecha_creacion || ""}</span></div>
                <div class="info-item"><span class="info-label">Aprobador Apertura:</span><span class="info-value">${permiso.usuario_aprobador_apertura_nombre || permiso.usuario_aprobador || "No aprobado"}</span></div>
                <div class="info-item"><span class="info-label">Aprobador Cierre:</span><span class="info-value">${permiso.usuario_aprobador_cierre_nombre || "No aprobado"}</span></div>
                <div class="info-item"><span class="info-label">Estado Aprobaci\xF3n Cierre:</span><span class="info-value">${permiso.estado_aprobacion_cierre || "PENDIENTE"}</span></div>
            </div>
        </div>
        <div class="info-item" style="margin-top: 15px;">
            <span class="info-label">Descripci\xF3n:</span>
            <div class="description-content">
                ${permiso.descripcion || "Sin descripci\xF3n"}
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">TIEMPOS DE TRABAJO (Hora Chile)</div>
        <table class="table">
            <tr><th>Evento</th><th>Fecha y Hora</th></tr>
            <tr><td>Creaci\xF3n Permiso</td><td>${permiso.fecha_creacion || "No registrado"}</td></tr>
            <tr><td>Aprobaci\xF3n Apertura</td><td>${permiso.fecha_aprobacion || "No aprobado"}</td></tr>
            <tr><td>Inicio de Trabajos</td><td>${permiso.fecha_inicio_trabajos || "No registrado"}</td></tr>
            <tr><td>Fin de Trabajos</td><td>${permiso.fecha_fin_trabajos || "No registrado"}</td></tr>
            <tr><td>Parada Turbina</td><td>${permiso.fecha_parada_turbina || "No aplica"}</td></tr>
            <tr><td>Puesta en Marcha</td><td>${permiso.fecha_puesta_marcha_turbina || "No aplica"}</td></tr>
            <tr><td>Cierre Permiso</td><td>${permiso.fecha_cierre || "No cerrado"}</td></tr>
            <tr><td>Aprobaci\xF3n Cierre</td><td>${permiso.fecha_aprobacion_cierre || "No aprobado"}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">PERSONAL ASIGNADO</div>
        <table class="table">
            <tr><th>Nombre</th><th>Empresa</th><th>Rol</th></tr>
            ${(personalResult.results || []).map(
      (p) => `<tr><td>${p.personal_nombre}</td><td>${p.personal_empresa}</td><td>${p.personal_rol}</td></tr>`
    ).join("")}
            ${(personalResult.results || []).length === 0 ? '<tr><td colspan="3" style="text-align: center;">No hay personal registrado</td></tr>' : ""}
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">ACTIVIDADES REALIZADAS</div>
        <table class="table">
            <tr><th>Actividad</th><th>Tipo</th></tr>
            ${(actividadesResult.results || []).map(
      (a) => `<tr><td>${a.actividad_nombre}</td><td>${a.tipo_actividad}</td></tr>`
    ).join("")}
            ${(actividadesResult.results || []).length === 0 ? '<tr><td colspan="2" style="text-align: center;">No hay actividades registradas</td></tr>' : ""}
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">MATERIALES UTILIZADOS</div>
        <table class="table">
            <tr><th>Descripci\xF3n</th><th>Cantidad</th><th>Propietario</th><th>Almac\xE9n</th></tr>
            ${(materialesResult.results || []).map(
      (m) => `<tr><td>${m.descripcion}</td><td>${m.cantidad}</td><td>${m.propietario}</td><td>${m.almacen}</td></tr>`
    ).join("")}
            ${(materialesResult.results || []).length === 0 ? '<tr><td colspan="4" style="text-align: center;">No hay materiales registrados</td></tr>' : ""}
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">MATRIZ DE RIESGOS</div>
        <table class="table">
            <tr><th style="width: 10%;">C\xF3digo</th><th style="width: 20%;">Actividad</th><th style="width: 20%;">Peligro</th><th style="width: 20%;">Riesgo</th><th style="width: 30%;">Medidas Preventivas</th></tr>
            ${matrizRiesgosCompleta.map(
      (m) => `<tr>
                <td style="text-align: center;">${m.codigo || "N/A"}</td>
                <td>${m.actividad}</td>
                <td>${m.peligro}</td>
                <td>${m.riesgo}</td>
                <td>${m.medidas_preventivas}</td>
              </tr>`
    ).join("")}
            ${matrizRiesgosCompleta.length === 0 ? '<tr><td colspan="5" style="text-align: center;">No hay matriz de riesgos disponible para las actividades seleccionadas</td></tr>' : ""}
        </table>
    </div>
    
    ${permiso.observaciones_cierre ? `
    <div class="section">
        <div class="section-title">OBSERVACIONES DE CIERRE</div>
        <div class="observaciones-box">
            ${permiso.observaciones_cierre}
        </div>
    </div>
    ` : ""}
    
    <div class="footer">
        <p>Documento generado el ${(/* @__PURE__ */ new Date()).toLocaleString("es-CL", { timeZone: "America/Santiago" })} - PT Wind - Sistema de Gesti\xF3n de Permisos de Trabajo</p>
        <p>\xA9 Enel Green Power - Todos los derechos reservados</p>
    </div>
    
    <script>
        // Auto-imprimir despu\xE9s de 2 segundos
        setTimeout(() => {
            if (confirm('\xBFDesea imprimir el documento PDF ahora?')) {
                window.print();
            }
        }, 2000);
    <\/script>
</body>
</html>
    `;
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="PT_${permiso.numero_pt}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "")}.html"`,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error exportando PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleExportarPermisoPdf, "handleExportarPermisoPdf");

// src/core/routes/api.js
async function handleApiRequest(request, corsHeaders, env, services) {
  const { rateLimiter, authService, auditLogger } = services;
  const url = new URL(request.url);
  const endpoint = url.pathname.replace("/api/", "");
  try {
    const publicEndpoints = ["login", "health"];
    let currentUser = null;
    if (!publicEndpoints.includes(endpoint)) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({
          success: false,
          error: "No autorizado - Token requerido"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const token = authHeader.substring(7);
      try {
        currentUser = await authService.verifyToken(token);
        if (!currentUser || !currentUser.sub) {
          throw new Error("Token inv\xE1lido - estructura incorrecta");
        }
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "Token inv\xE1lido o expirado"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    switch (endpoint) {
      case "login":
        return await handleLogin(request, corsHeaders, env, services);
      case "change-password":
        return await handleChangePassword(request, corsHeaders, env, services);
      case "users":
        return await handleUsers(request, corsHeaders, env);
      case "personal":
        return await handlePersonal(request, corsHeaders, env);
      case "personal-by-parque":
        return await handlePersonalByParque(request, corsHeaders, env, currentUser);
      case "supervisores":
        return await handleSupervisores(request, corsHeaders, env, currentUser);
      case "parques":
        return await handleParques(request, corsHeaders, env);
      case "aerogeneradores":
        return await handleAerogeneradores(request, corsHeaders, env);
      case "matriz-riesgos":
        return await handleMatrizRiesgos(request, corsHeaders, env);
      case "actividades":
        return await handleActividades(request, corsHeaders, env);
      case "permisos":
        return await handlePermisos(request, corsHeaders, env, currentUser, services);
      case "permiso-detalle":
        return await handlePermisoDetalle(request, corsHeaders, env, currentUser, services);
      case "cerrar-permiso":
        return await handleCerrarPermiso(request, corsHeaders, env, currentUser, services);
      case "aprobar-permiso":
        return await handleAprobarPermiso(request, corsHeaders, env, currentUser, services);
      case "detalle-aprobacion":
        return await handleObtenerDetalleAprobacion(request, corsHeaders, env, currentUser, services);
      case "aprobar-cierre-permiso":
        return await handleAprobarCierrePermiso(request, corsHeaders, env, currentUser, services);
      case "generate-register":
        return await handleGenerateRegister(request, corsHeaders, env);
      case "exportar-permiso-excel":
        return await handleExportarPermisoExcel(request, corsHeaders, env, currentUser, services);
      case "exportar-permiso-pdf":
        return await handleExportarPermisoPdf(request, corsHeaders, env, currentUser, services);
      case "health":
        return await handleHealth(request, corsHeaders, env);
      default:
        return new Response(JSON.stringify({ error: "Endpoint not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      endpoint
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleApiRequest, "handleApiRequest");
var api_default = handleApiRequest;

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(env, request);
    const secHeaders = getSecurityHeaders();
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...corsHeaders } });
    }
    const rateLimiter = new rateLimiter_default(env);
    const authService = new AuthService(env);
    const auditLogger = new AuditLogger(env);
    const services = {
      rateLimiter,
      authService,
      auditLogger,
      InputSanitizer: sanitizers_default,
      // alias (por si algún handler espera 'auth'/'audit')
      auth: authService,
      audit: auditLogger,
      security: security_default
    };
    try {
      const url = new URL(request.url);
      const { pathname } = url;
      if (request.method === "GET" && pathname === "/") {
        return new Response(template_default(), {
          headers: { "content-type": "text/html; charset=utf-8", ...secHeaders, ...corsHeaders }
        });
      }
      if (request.method === "GET" && pathname === "/styles.css") {
        return new Response(styles_default(), {
          headers: { "content-type": "text/css; charset=utf-8", ...secHeaders, ...corsHeaders }
        });
      }
      if (request.method === "GET" && pathname === "/app.js") {
        return new Response(script_default(), {
          headers: { "content-type": "application/javascript; charset=utf-8", ...secHeaders, ...corsHeaders }
        });
      }
      if (pathname.startsWith("/api/")) {
        const resp = await api_default(request, corsHeaders, env, services);
        const merged = new Headers(resp.headers);
        for (const [k, v] of Object.entries(corsHeaders))
          merged.set(k, v);
        for (const [k, v] of Object.entries(secHeaders))
          merged.set(k, v);
        return new Response(resp.body, { status: resp.status, headers: merged });
      }
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8", ...secHeaders, ...corsHeaders }
      });
    } catch (err) {
      const status = err instanceof errors_default ? 403 : 500;
      return new Response(JSON.stringify({ error: err?.message || "Internal Error" }), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", ...secHeaders, ...corsHeaders }
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-0RUOiZ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-0RUOiZ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
