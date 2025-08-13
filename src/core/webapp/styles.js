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
    
    .permiso-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 20px;
        margin-bottom: 16px;
        transition: all 0.2s ease;
    }
    
    .permiso-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
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
    
    .estado-cerrado {
        background: rgba(149, 165, 166, 0.1);
        color: var(--text-secondary);
        border: 1px solid rgba(149, 165, 166, 0.2);
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
            padding: 10px;
        }
        
        .login-container {
            padding: 32px 24px;
        }
        
        .grid-three {
            grid-template-columns: 1fr;
        }
        
        .selector-dual {
            grid-template-columns: 1fr;
        }
        
        .selector-controls {
            flex-direction: row;
            justify-content: center;
        }
        
        .tabs {
            overflow-x: auto;
        }
        
        .tab {
            white-space: nowrap;
        }
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
