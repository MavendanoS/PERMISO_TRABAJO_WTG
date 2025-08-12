export function generateTomaConocimientoPDF(data) {
  // Mantener la función original sin cambios
  const fecha = new Date();
  const fechaFormateada = fecha.toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Santiago'
  });
  const horaFormateada = fecha.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Santiago'
  });

  const personalRows = data.personal?.map((persona, index) => `
  <tr>
    <td style="text-align: center; padding: 8px; border: 1px solid #000;">${index + 1}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.nombre}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.rut || 'Sin RUT'}</td>
    <td style="padding: 8px; border: 1px solid #000;">${persona.empresa || 'N/A'}</td>
    <td style="padding: 8px; border: 1px solid #000; width: 100px;"></td>
  </tr>
`).join('') || `
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
  `).join('');

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
    <button class="print-button" onclick="window.print()">🖨️ Imprimir PDF</button>
    
    <div class="header">
        <div class="logo">
        <!-- 🎨 LOGO ENEL GREEN POWER - INSTRUCCIONES PARA CAMBIAR -->
        <!-- Para reemplazar el logo: -->
        <!-- 1. Convertir imagen nueva a base64: https://base64.guru/converter/encode/image -->
        <!-- 2. Reemplazar SOLO el string después de "base64," en la línea de abajo -->
        <!-- 3. Mantener el formato: data:image/[tipo];base64,[string-base64] -->
        <!-- Logo actual: SVG embebido para garantizar disponibilidad -->
        <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiIFsKCTwhRU5USVRZIG5zX2V4dGVuZCAiaHR0cDovL25zLmFkb2JlLmNvbS9FeHRlbnNpYmlsaXR5LzEuMC8iPgoJPCFFTlRJVFkgbnNfYWkgImh0dHA6Ly9ucy5hZG9iZS5jb20vQWRvYmVJbGx1c3RyYXRvci8xMC4wLyI+Cgk8IUVOVElUWSBuc19ncmFwaHMgImh0dHA6Ly9ucy5hZG9iZS5jb20vR3JhcGhzLzEuMC8iPgoJPCFFTlRJVFkgbnNfdmFycyAiaHR0cDovL25zLmFkb2JlLmNvbS9WYXJpYWJsZXMvMS4wLyI+Cgk8IUVOVElUWSBuc19pbXJlcCAiaHR0cDovL25zLmFkb2JlLmNvbS9JbWFnZVJlcGxhY2VtZW50LzEuMC8iPgoJPCFFTlRJVFkgbnNfc2Z3ICJodHRwOi8vbnMuYWRvYmUuY29tL1NhdmVGb3JXZWIvMS4wLyI+Cgk8IUVOVElUWSBuc19jdXN0b20gImh0dHA6Ly9ucy5hZG9iZS5jb20vR2VuZXJpY0N1c3RvbU5hbWVzcGFjZS8xLjAvIj4KCTwhRU5USVRZIG5zX2Fkb2JlX3hwYXRoICJodHRwOi8vbnMuYWRvYmUuY29tL1hQYXRoLzEuMC8iPgpdPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkVHUF9Mb2dvX1ByaW1hcnlfUkdCIiB4bWxuczp4PSImbnNfZXh0ZW5kOyIgeG1sbnM6aT0iJm5zX2FpOyIgeG1sbnM6Z3JhcGg9IiZuc19ncmFwaHM7IgoJIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjgzLjUgMTQyLjEiCgkgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjgzLjUgMTQyLjEiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8bWV0YWRhdGE+Cgk8c2Z3ICB4bWxucz0iJm5zX3NmdzsiPgoJCTxzbGljZXM+PC9zbGljZXM+CgkJPHNsaWNlU291cmNlQm91bmRzICBib3R0b21MZWZ0T3JpZ2luPSJ0cnVlIiBoZWlnaHQ9IjE0Mi4xIiB3aWR0aD0iMjgzLjUiIHg9IjI2OTQuNiIgeT0iLTQxMzkuNSI+PC9zbGljZVNvdXJjZUJvdW5kcz4KCTwvc2Z3Pgo8L21ldGFkYXRhPgo8Zz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjY2Ljg2MiIgeTE9IjQxLjI5NjkiIHgyPSIyNjYuODYyIiB5Mj0iNzYuNDU5NCI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cmVjdCB4PSIyNjEiIHk9IjQxIiBmaWxsPSJ1cmwoI1NWR0lEXzFfKSIgd2lkdGg9IjExLjciIGhlaWdodD0iMzUuNCIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8yXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyNzEuMjU5OCIgeTE9Ijg2LjgzNzUiIHgyPSIyODEuOTk0NiIgeTI9Ijk1LjY4OSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzczQjk2NCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM3M0I5NjQ7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzJfKSIgZD0iTTI3Mi43LDc2LjNjMCw4LjUsMy45LDEyLjEsMTAuNywxNi44bC02LjcsOS42Yy0xMC02LjYtMTUuOC0xNC0xNS44LTI2LjRIMjcyLjd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjEwMS41MDY1IiB5MT0iNDEuNDQ0MSIgeDI9IjEyOC40Nzc4IiB5Mj0iNDEuNDQ0MSI+CgkJPHN0b3AgIG9mZnNldD0iNC43MDIyNDFlLTAzIiBzdHlsZT0ic3RvcC1jb2xvcjojMDA4QzVBIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45OTU3IiBzdHlsZT0ic3RvcC1jb2xvcjojMzJBOTU5Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8zXykiIGQ9Ik0xMjcuNiwyNC4yYy0xMC4yLDAtMTkuNCw0LjEtMjYuMSwxMC43djIzLjhjMS44LTkuNCwxMC4xLTIyLjgsMjYuMS0yMi44YzAuMywwLDAuNiwwLDAuOSwwVjI0LjIKCQlDMTI4LjIsMjQuMiwxMjcuOSwyNC4yLDEyNy42LDI0LjJ6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzRfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE0NC4wNjczIiB5MT0iMzguMzY2IiB4Mj0iMTQ0LjA2NzMiIHkyPSI1OS4xMTYxIj4KCQk8c3RvcCAgb2Zmc2V0PSIxLjExMDQ1NmUtMDIiIHN0eWxlPSJzdG9wLWNvbG9yOiMzMkE5NTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjE3MDEiIHN0eWxlPSJzdG9wLWNvbG9yOiM0MUIyNTkiLz4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMzMyIgc3R5bGU9InN0b3AtY29sb3I6IzU1QkU1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM1NUJFNUE7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzRfKSIgZD0iTTE2MC4yLDYwLjVoLTExLjdsMC0zLjljMC0xMS42LTkuMi0yMC42LTIwLjUtMjAuN1YyNC4yYzE3LjgsMC4yLDMyLjIsMTQuNSwzMi4yLDMyLjVWNjAuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfNV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTUzLjc0MjgiIHkxPSI1NC41ODI2IiB4Mj0iMTU0LjMzOTciIHkyPSI2MC42NjM5Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojRTk0OTg2Ii8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6I0U5NDk4NjtzdG9wLW9wYWNpdHk6MCIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxsaW5lIGZpbGw9InVybCgjU1ZHSURfNV8pIiB4MT0iMTYwLjIiIHkxPSI2MC41IiB4Mj0iMTQ4LjUiIHkyPSI2MC41Ii8+Cgk8cmVjdCB4PSI4OS44IiB5PSIyNy40IiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMjYxIiBmaWxsPSIjQzZDNkM2IiB3aWR0aD0iMTEuNyIgaGVpZ2h0PSI0MSIvPgoJPHJlY3QgeD0iMTQ4LjUiIHk9IjYwLjUiIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSIxMS43IiBoZWlnaHQ9IjQxIi8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzZfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjcxLjUyMyIgeTE9IjUzLjMzOTIiIHgyPSI2NC4xNjY0IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzZfKSIgZD0iTTY2LjEsNTYuN2gxMmMtMS40LTguMy01LjUtMTUuNi0xMS4yLTIxLjNsLTguMiw4LjRDNjIuMiw0Ny4zLDY0LjgsNTEuNyw2Ni4xLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjYxLjIxODUiIHkxPSIzNy41MzgyIiB4Mj0iNDEuNzU0MyIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzdfKSIgZD0iTTM5LjMsMzUuOWM3LjYsMCwxNC41LDMuMSwxOS41LDhsOC4zLTguM2MtNy4xLTcuMS0xNy0xMS41LTI3LjgtMTEuNWMtMC4xLDAtMC4yLDAtMC4zLDBMMzksMzUuOQoJCUMzOS4xLDM1LjksMzkuMiwzNS45LDM5LjMsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfOF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTYuODgiIHkxPSIzNy44NjYyIiB4Mj0iMzYuNDk3NCIgeTI9IjI5LjUxMzUiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMjg5QjVEIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF84XykiIGQ9Ik0zOS4zLDM1LjlWMjQuMmMtMTEsMC0yMC45LDQuNS0yOCwxMS43bDguNCw4LjJDMjQuNiwzOS4xLDMxLjYsMzUuOSwzOS4zLDM1Ljl6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzlfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjUuNDEwNCIgeTE9IjYwLjcyMzUiIHgyPSIxMy40NTY2IiB5Mj0iNDEuNDEyNiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzUwQUI2MCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMzREE0NUYiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzlfKSIgZD0iTTExLjcsNjMuNWMwLTcuNiwzLjEtMTQuNSw4LjEtMTkuNWwtOC4zLTguM0M0LjQsNDIuOCwwLDUyLjYsMCw2My41YzAsMC4xLDAsMC4yLDAsMC4zbDExLjctMC4xCgkJQzExLjcsNjMuNiwxMS43LDYzLjUsMTEuNyw2My41eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xMF8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iNS4zNTE0IiB5MT0iNjYuMzE5IiB4Mj0iMTMuNzA0MiIgeTI9Ijg1Ljc4MzIiPgoJCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MEFCNjAiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMF8pIiBkPSJNMTEuNyw2My41SDBjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTQuOSw3OC4xLDExLjcsNzEuMiwxMS43LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzExXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxNS41MzYzIiB5MT0iODguNzAwMyIgeDI9IjM4LjMyMjkiIHkyPSI5OC4wMjIxIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNjdCNDYyIi8+CgkJPHN0b3AgIG9mZnNldD0iMC45NjIzIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2Ii8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMV8pIiBkPSJNMzkuMyw5MWMtNy42LDAtMTQuNS0zLjEtMTkuNS04LjFsLTguMyw4LjNjNy4xLDcuMSwxNi45LDExLjUsMjcuOCwxMS41YzAuMSwwLDAuMiwwLDAuMywwCgkJTDM5LjUsOTFDMzkuNCw5MSwzOS40LDkxLDM5LjMsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzEyXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIzOS4yNTg4IiB5MT0iMTA2LjQ5MTEiIHgyPSI2Mi4zNDI2IiB5Mj0iODEuMDUxNyI+CgkJPHN0b3AgIG9mZnNldD0iMC4zMjkiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODYiLz4KCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojOTJDODg2O3N0b3Atb3BhY2l0eTowIi8+Cgk8L2xpbmVhckdyYWRpZW50PgoJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8xMl8pIiBkPSJNNjEuMSw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEw2MS4xLDgwLjJ6Ii8+Cgk8cmVjdCB4PSIzNyIgeT0iNTYuNyIgZmlsbD0iI0M2QzZDNiIgd2lkdGg9IjQxIiBoZWlnaHQ9IjExLjciLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTNfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjI0Mi43NDExIiB5MT0iNTMuMzM5MiIgeDI9IjIzNS4zODQ2IiB5Mj0iNDAuNjk1MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzAwOEM1QSIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMxRDk3NUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzEzXykiIGQ9Ik0yMzcuMyw1Ni43aDEyYy0xLjQtOC4zLTUuNS0xNS42LTExLjItMjEuM2wtOC4yLDguNEMyMzMuNCw0Ny4zLDIzNiw1MS43LDIzNy4zLDU2Ljd6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE0XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMzIuNDM2NyIgeTE9IjM3LjUzODIiIHgyPSIyMTIuOTcyNSIgeTI9IjI5LjQ5MiI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzFEOTc1RCIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE0XykiIGQ9Ik0yMTAuNSwzNS45YzcuNiwwLDE0LjUsMy4xLDE5LjUsOGw4LjMtOC4zYy03LjEtNy4xLTE3LTExLjUtMjcuOC0xMS41Yy0wLjEsMC0wLjIsMC0wLjMsMAoJCWwwLjEsMTEuN0MyMTAuMywzNS45LDIxMC40LDM1LjksMjEwLjUsMzUuOXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTVfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE4OC4wOTgxIiB5MT0iMzcuODY2MiIgeDI9IjIwNy43MTU2IiB5Mj0iMjkuNTEzNSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiMyODlCNUQiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE1XykiIGQ9Ik0yMTAuNSwzNS45VjI0LjJjLTExLDAtMjAuOSw0LjUtMjgsMTEuN2w4LjQsOC4yQzE5NS44LDM5LjEsMjAyLjgsMzUuOSwyMTAuNSwzNS45eiIvPgoJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xNl8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTc2LjYyODYiIHkxPSI2MC43MjM1IiB4Mj0iMTg0LjY3NDgiIHkyPSI0MS40MTI2Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzNEQTQ1RiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTZfKSIgZD0iTTE4Mi45LDYzLjVjMC03LjYsMy4xLTE0LjUsOC4xLTE5LjVsLTguMy04LjNjLTcuMSw3LjEtMTEuNSwxNi45LTExLjUsMjcuOGMwLDAuMSwwLDAuMiwwLDAuMwoJCWwxMS43LTAuMUMxODIuOSw2My42LDE4Mi45LDYzLjUsMTgyLjksNjMuNXoiLz4KCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMTdfIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE3Ni41Njk2IiB5MT0iNjYuMzE5IiB4Mj0iMTg0LjkyMjMiIHkyPSI4NS43ODMyIj4KCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojNTBBQjYwIi8+CgkJPHN0b3AgIG9mZnNldD0iMSIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMTdfKSIgZD0iTTE4Mi45LDYzLjVoLTExLjdjMCwxMSw0LjUsMjAuOSwxMS43LDI4bDguMi04LjRDMTg2LjEsNzguMSwxODIuOSw3MS4yLDE4Mi45LDYzLjV6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE4XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxODYuNzU0NCIgeTE9Ijg4LjcwMDMiIHgyPSIyMDkuNTQxIiB5Mj0iOTguMDIyMSI+CgkJPHN0b3AgIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzY3QjQ2MiIvPgoJCTxzdG9wICBvZmZzZXQ9IjAuOTYyMyIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJPC9saW5lYXJHcmFkaWVudD4KCTxwYXRoIGZpbGw9InVybCgjU1ZHSURfMThfKSIgZD0iTTIxMC41LDkxYy03LjYsMC0xNC41LTMuMS0xOS41LTguMWwtOC4zLDguM2M3LjEsNy4xLDE2LjksMTEuNSwyNy44LDExLjVjMC4xLDAsMC4yLDAsMC4zLDAKCQlMMjEwLjcsOTFDMjEwLjcsOTEsMjEwLjYsOTEsMjEwLjUsOTF6Ii8+Cgk8bGluZWFyR3JhZGllbnQgaWQ9IlNWR0lEXzE5XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIyMTAuNDc2OSIgeTE9IjEwNi40OTExIiB4Mj0iMjMzLjU2MDgiIHkyPSI4MS4wNTE3Ij4KCQk8c3RvcCAgb2Zmc2V0PSIwLjMyOSIgc3R5bGU9InN0b3AtY29sb3I6IzkyQzg4NiIvPgoJCTxzdG9wICBvZmZzZXQ9IjEiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MkM4ODY7c3RvcC1vcGFjaXR5OjAiLz4KCTwvbGluZWFyR3JhZGllbnQ+Cgk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzE5XykiIGQ9Ik0yMzIuNCw4MC4yYy01LDYuNi0xMywxMC44LTIxLjksMTAuOHYxMS43YzEyLjcsMCwyNC02LDMxLjItMTUuNEwyMzIuNCw4MC4yeiIvPgoJPHJlY3QgeD0iMjA4LjIiIHk9IjU2LjciIGZpbGw9IiNDNkM2QzYiIHdpZHRoPSI0MSIgaGVpZ2h0PSIxMS43Ii8+Cgk8Zz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTUzLjIsMTMzLjJ2Ny45Yy0yLDAuOC0zLjksMS02LDFjLTQuNiwwLTcuMi0zLjYtNy4yLTguN2MwLTQuMywyLjMtOC43LDcuMi04LjdjMi44LDAsNS42LDEuNSw1LjksNC41CgkJCWgtMS43Yy0wLjMtMi4xLTIuMi0zLjEtNC4yLTMuMWMtNCwwLTUuNSwzLjktNS41LDcuM2MwLDQuMywxLjgsNy4zLDYuMyw3LjNjMS4zLDAsMi41LTAuMywzLjctMC43di01LjRoLTQuMnYtMS40SDE1My4yeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xNTguNiwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2gwYzAuNC0xLjIsMS41LTIsMi42LTIuMWMwLjUsMCwwLjksMCwxLjQsMHYxLjMKCQkJYy0wLjMsMC0wLjYtMC4xLTAuOS0wLjFjLTIuMSwwLTMuMiwxLjUtMy4yLDMuN1YxNDEuOHoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMTY1LjcsMTM2LjNjMCwyLjUsMS4yLDQuNiw0LDQuNmMxLjcsMCwzLTEuMiwzLjQtMi44aDEuNWMtMC43LDIuOC0yLjUsNC4xLTUuMyw0LjFjLTMuNSwwLTUuMS0zLTUuMS02LjIKCQkJYzAtMy4yLDEuNy02LjIsNS4yLTYuMmMzLjksMCw1LjMsMi45LDUuMyw2LjVIMTY1Ljd6IE0xNzMuMiwxMzVjLTAuMi0yLjMtMS40LTQtMy44LTRjLTIuMywwLTMuNSwxLjktMy43LDRIMTczLjJ6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTE3OC42LDEzNi4zYzAsMi41LDEuMiw0LjYsNCw0LjZjMS43LDAsMy0xLjIsMy40LTIuOGgxLjVjLTAuNywyLjgtMi41LDQuMS01LjMsNC4xYy0zLjUsMC01LjEtMy01LjEtNi4yCgkJCWMwLTMuMiwxLjctNi4yLDUuMi02LjJjMy45LDAsNS4zLDIuOSw1LjMsNi41SDE3OC42eiBNMTg2LjEsMTM1Yy0wLjItMi4zLTEuNC00LTMuOC00Yy0yLjMsMC0zLjUsMS45LTMuNyw0SDE4Ni4xeiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0xOTIuMSwxNDEuOGgtMS40di05YzAtMC45LTAuMS0xLjgtMC4xLTIuNmgxLjRsMC4xLDEuN2wwLDBjMC44LTEuNCwyLjEtMi4xLDMuNi0yLjEKCQkJYzMuOCwwLDQuMSwzLjQsNC4xLDQuN3Y3LjNoLTEuNHYtNy41YzAtMi0xLjItMy4yLTMuMS0zLjJjLTIuMywwLTMuMywxLjktMy4zLDRWMTQxLjh6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIxMC42LDE0MS44VjEyNWg0LjJjMy4yLTAuMSw2LjksMC43LDYuOSw0LjdjMCw0LTMuNiw0LjgtNi45LDQuN2gtMi43djcuM0gyMTAuNnogTTIxMi4xLDEzMy4xaDMuNwoJCQljMi4zLDAsNC4zLTAuNyw0LjMtMy4zYzAtMi42LTItMy4zLTQuMy0zLjNoLTMuN1YxMzMuMXoiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjMzLjEsMTM1LjljMCwzLjEtMS43LDYuMi01LjQsNi4yYy0zLjcsMC01LjQtMy4xLTUuNC02LjJzMS43LTYuMiw1LjQtNi4yCgkJCUMyMzEuNCwxMjkuOCwyMzMuMSwxMzIuOSwyMzMuMSwxMzUuOXogTTIyNy43LDEzMWMtMi44LDAtMy45LDIuNy0zLjksNC45czEuMSw0LjksMy45LDQuOWMyLjgsMCwzLjktMi43LDMuOS00LjkKCQkJUzIzMC41LDEzMSwyMjcuNywxMzF6Ii8+CgkJPHBhdGggZmlsbD0iIzAwOEM1QSIgZD0iTTIzOSwxMzkuOUwyMzksMTM5LjlsMy42LTkuOGgxLjZsMy40LDkuN2gwbDMuNC05LjdoMS41bC00LjMsMTEuN0gyNDdsLTMuNi0xMC4xaDBsLTMuNiwxMC4xaC0xLjQKCQkJbC00LjMtMTEuN2gxLjVMMjM5LDEzOS45eiIvPgoJCTxwYXRoIGZpbGw9IiMwMDhDNUEiIGQ9Ik0yNTUuMiwxMzYuM2MwLDIuNSwxLjIsNC42LDQsNC42YzEuNiwwLDMtMS4yLDMuNC0yLjhoMS41Yy0wLjcsMi44LTIuNSw0LjEtNS4zLDQuMWMtMy41LDAtNS4xLTMtNS4xLTYuMgoJCQljMC0zLjIsMS43LTYuMiw1LjItNi4yYzMuOSwwLDUuMywyLjksNS4zLDYuNUgyNTUuMnogTTI2Mi43LDEzNWMtMC4yLTIuMy0xLjQtNC0zLjgtNGMtMi4zLDAtMy41LDEuOS0zLjcsNEgyNjIuN3oiLz4KCQk8cGF0aCBmaWxsPSIjMDA4QzVBIiBkPSJNMjY4LjcsMTQxLjhoLTEuNHYtOWMwLTAuOS0wLjEtMS44LTAuMS0yLjZoMS40bDAuMSwxLjdoMGMwLjQtMS4yLDEuNS0yLDIuNi0yLjFjMC41LDAsMC45LDAsMS40LDB2MS4zCgkJCWMtMC4zLDAtMC42LTAuMS0wLjktMC4xYy0yLjEsMC0zLjIsMS41LTMuMiwzLjdWMTQxLjh6Ii8+Cgk8L2c+CjwvZz4KPC9zdmc+Cg==" alt="Enel Green Power">
        </div>
        <div class="header-info">
            <div class="title">REGISTRO TOMA DE CONOCIMIENTO PT WIND</div>
            <div class="subtitle">Áreas de Aplicación</div>
            <div class="areas">
                Perímetro, Chile y Países Andinos<br>
                Función: Health, Safety, Environment and Quality<br>
                Business Line: Renewable Energies
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div class="info-row">
                <span class="info-label">NOMBRE JEFE DE FAENA:</span>
                <span class="info-value">${data.jefeFaena || 'No asignado'}</span>
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
                <span class="info-value">${data.planta || ''}_${data.aerogenerador || ''}</span>
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
        <div class="description-label">Descripción de trabajo (s)</div>
        <div class="description-content">
            ${data.descripcion || 'Sin descripción'}
            <br><br>
            <strong>Tipo de Mantenimiento:</strong> ${data.tipoMantenimiento || 'No especificado'}
            ${data.tipoMantenimientoOtros ? ' - ' + data.tipoMantenimientoOtros : ''}
        </div>
    </div>
    
    <div class="activities-section">
        <div class="activities-row">
            <span class="activities-label">Actividades Rutinarias asociadas:</span>
            <span class="activities-content">${data.actividadesRutinarias?.join(' - ') || 'Ninguna'}</span>
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
                    <th>N°</th>
                    <th>NOMBRE DEL PARTICIPANTE</th>
                    <th>RUT/CÉDULA</th>
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
            if (confirm('¿Desea imprimir el documento PDF ahora?')) {
                window.print();
            }
        }, 2000);
    </script>
</body>
</html>
  `;
}

export default generateTomaConocimientoPDF;

