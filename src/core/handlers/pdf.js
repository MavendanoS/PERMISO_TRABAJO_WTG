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
        <img src="https://www.prwave.ro/wp-content/uploads/2018/08/Enel-Green-Power-logo.jpg" alt="Enel Green Power">
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

