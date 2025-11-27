// Configuración Firebase (reemplazar con credenciales reales)
const firebaseConfig = {
  apiKey: "AIzaSyChkrgwbuUvcBHc1BpC6pMly6aufhCY0js",
  authDomain: "expedientes-centro.firebaseapp.com",
  projectId: "expedientes-centro",
  storageBucket: "expedientes-centro.firebasestorage.app",
  messagingSenderId: "296016960982",
  appId: "1:296016960982:web:daf661772ba509cadfd877",
  measurementId: "G-D4SR9D6R4F"
};

// Inicialización condicional para evitar errores si falta config
let app, db;
try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (e) {
  console.warn("Firebase no inicializado. Complete configuración.", e);
}

// Salidas optativas configurables (se pueden cargar de Firestore luego)
const OPTATIVAS = ["Humanidades", "Ciencias"];
let nombreCentro = 'Centro Educativo';

// Referencias DOM
const btnNueva = document.getElementById('btnNueva');
const btnConsulta = document.getElementById('btnConsulta');
const panelNueva = document.getElementById('nuevaSolicitud');
const panelConsulta = document.getElementById('consultaSolicitud');
const cancelNueva = document.getElementById('cancelNueva');
const cancelConsulta = document.getElementById('cancelConsulta');
const formSolicitud = document.getElementById('formSolicitud');
const formConsulta = document.getElementById('formConsulta');
const resultadoSolicitud = document.getElementById('resultadoSolicitud');
const resultadoConsulta = document.getElementById('resultadoConsulta');
const gradoSelect = document.getElementById('grado');
const optativasWrapper = document.getElementById('optativasWrapper');
const optativaSelect = document.getElementById('optativa');

function show(el){el.classList.remove('hidden');}
function hide(el){el.classList.add('hidden');}
function resetMessages(){resultadoSolicitud.textContent=''; resultadoConsulta.textContent=''; resultadoSolicitud.classList.remove('error'); resultadoConsulta.classList.remove('error');}

btnNueva.addEventListener('click',function(){hide(panelConsulta); show(panelNueva); resetMessages();});
btnConsulta.addEventListener('click',function(){hide(panelNueva); show(panelConsulta); resetMessages();});
cancelNueva.addEventListener('click',function(){hide(panelNueva); formSolicitud.reset();});
cancelConsulta.addEventListener('click',function(){hide(panelConsulta); formConsulta.reset();});

// Cargar configuración del centro
async function cargarConfiguracion() {
  if (!db) return;
  try {
    const configSnap = await db.collection('config').doc('general').get();
    if (configSnap.exists) {
      const config = configSnap.data();
      nombreCentro = config.nombreCentro || 'Centro Educativo';
      
      // Actualizar header y footer
      document.getElementById('nombreCentroHeader').textContent = nombreCentro;
      document.getElementById('subtituloHeader').textContent = 'Sistema de Gestión de Expedientes';
      document.getElementById('footerTexto').innerHTML = `&copy; ${new Date().getFullYear()} ${nombreCentro} - Todos los derechos reservados`;
      document.title = `Expedientes - ${nombreCentro}`;
      
      // Cargar optativas si existen
      if (config.optativas && config.optativas.length > 0) {
        OPTATIVAS.length = 0;
        OPTATIVAS.push(...config.optativas);
      }
    }
  } catch(e) {
    console.warn('No se pudo cargar configuración:', e);
  }
}

// Cargar optativas
function loadOptativas(){
  optativaSelect.innerHTML = '<option value="">Seleccione</option>' + OPTATIVAS.map(o=>`<option value="${o}">${o}</option>`).join('');
}

// Inicializar
cargarConfiguracion().then(() => loadOptativas());

gradoSelect.addEventListener('change', function() {
  const grado = gradoSelect.value;
  if(['4to','5to','6to'].includes(grado)) {
    show(optativasWrapper);
  } else {
    hide(optativasWrapper);
    optativaSelect.value='';
  }
});

// Aplicar máscaras en tiempo real
const cedulaInput = formSolicitud.querySelector('input[name="cedula"]');
const telefonoInput = formSolicitud.querySelector('input[name="telefono"]');
const cedulaConsultaInput = formConsulta.querySelector('input[name="cedulaConsulta"]');

cedulaInput.addEventListener('input', function(e) {
  const cursorPos = e.target.selectionStart;
  const valorAnterior = e.target.value;
  e.target.value = formatearCedula(e.target.value);
  if (e.target.value.length < valorAnterior.length) {
    e.target.setSelectionRange(cursorPos, cursorPos);
  }
});

telefonoInput.addEventListener('input', function(e) {
  const cursorPos = e.target.selectionStart;
  const valorAnterior = e.target.value;
  e.target.value = formatearTelefono(e.target.value);
  if (e.target.value.length < valorAnterior.length) {
    e.target.setSelectionRange(cursorPos, cursorPos);
  }
});

cedulaConsultaInput.addEventListener('input', function(e) {
  const cursorPos = e.target.selectionStart;
  const valorAnterior = e.target.value;
  e.target.value = formatearCedula(e.target.value);
  if (e.target.value.length < valorAnterior.length) {
    e.target.setSelectionRange(cursorPos, cursorPos);
  }
});

// Generar código único (doc id externo)
function generarCodigoUnico(){
  const alfanum = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for(let i=0;i<8;i++){rand += alfanum[Math.floor(Math.random()*alfanum.length)];}
  const ts = Date.now().toString(36).toUpperCase().slice(-4); // compresión timestamp
  return rand + '-' + ts; // Ej: K7ZPD3A2-1F4G
}

// Máscaras de formato
function formatearCedula(valor) {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 10) return numeros.slice(0, 3) + '-' + numeros.slice(3);
  return numeros.slice(0, 3) + '-' + numeros.slice(3, 10) + '-' + numeros.slice(10, 11);
}

function formatearTelefono(valor) {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.slice(0, 3) + '-' + numeros.slice(3);
  return numeros.slice(0, 3) + '-' + numeros.slice(3, 6) + '-' + numeros.slice(6, 10);
}

// Validar al menos un tipo de documento
function obtenerTiposSeleccionados(){
  return Array.from(formSolicitud.querySelectorAll('input[type=checkbox][name=tipo]:checked')).map(x=>x.value);
}

formSolicitud.addEventListener('submit', async function(e) {
  e.preventDefault();
  if(!db){resultadoSolicitud.textContent='Firebase no configurado.'; resultadoSolicitud.classList.add('error'); return;}
  const tipos = obtenerTiposSeleccionados();
  if(tipos.length === 0){resultadoSolicitud.textContent='Seleccione al menos un tipo de documento.'; resultadoSolicitud.classList.add('error'); return;}
  
  // Validar formato cédula (básico)
  const cedula = formSolicitud.cedula.value.trim();
  if(!/^\d{3}-?\d{7}-?\d{1}$/.test(cedula)){resultadoSolicitud.textContent='Formato de cédula inválido. Use: 001-1234567-8'; resultadoSolicitud.classList.add('error'); return;}
  
  // Validar duplicados (solicitudes activas)
  try {
    const duplicados = await db.collection('solicitudes')
      .where('cedula', '==', cedula)
      .where('estado', 'in', ['Pendiente', 'En Proceso'])
      .get();
    if (!duplicados.empty) {
      const existente = duplicados.docs[0];
      resultadoSolicitud.textContent = `Ya tiene una solicitud activa con código: ${existente.id}\nEstado: ${existente.data().estado}\nConsulte su estado o espere a que sea completada.`;
      resultadoSolicitud.classList.add('error');
      return;
    }
  } catch(err) {
    console.warn('No se pudo verificar duplicados:', err);
  }

  const data = {
    nombreSolicitante: formSolicitud.nombreSolicitante.value.trim(),
    nombreEstudiante: formSolicitud.nombreEstudiante.value.trim(),
    anosCentro: formSolicitud.anosCentro.value.trim(),
    grado: formSolicitud.grado.value,
    optativa: formSolicitud.optativa ? formSolicitud.optativa.value || null : null,
    fechaNacimiento: formSolicitud.fechaNacimiento.value,
    cedula: formSolicitud.cedula.value.trim(),
    telefono: formSolicitud.telefono.value.trim(),
    tiposDocumentos: tipos,
    estado: 'Pendiente',
    creadoEn: new Date().toISOString()
  };

  // Mostrar modal de confirmación
  mostrarModalConfirmacion(data);
});

// Variable temporal para datos de confirmación
let datosTemporales = null;

function mostrarModalConfirmacion(data) {
  datosTemporales = data; // Guardar en variable global
  const tiposTexto = data.tiposDocumentos.map(function(t) { return formatTipo(t); }).join(', ');
  const optativaTexto = data.optativa ? ' (' + data.optativa + ')' : '';
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay-confirmacion';
  modal.innerHTML = '<div class="modal-content-confirmacion">' +
    '<h3>✅ Confirme sus Datos</h3>' +
    '<p class="modal-subtitle">Por favor, verifique que toda la información sea correcta antes de enviar.</p>' +
    '<div class="datos-confirmacion">' +
      '<div class="dato-item"><strong>Solicitante:</strong> ' + data.nombreSolicitante + '</div>' +
      '<div class="dato-item"><strong>Estudiante:</strong> ' + data.nombreEstudiante + '</div>' +
      '<div class="dato-item"><strong>Cédula:</strong> ' + data.cedula + '</div>' +
      '<div class="dato-item"><strong>Teléfono:</strong> ' + data.telefono + '</div>' +
      '<div class="dato-item"><strong>Grado:</strong> ' + data.grado + optativaTexto + '</div>' +
      '<div class="dato-item"><strong>Años en centro:</strong> ' + data.anosCentro + '</div>' +
      '<div class="dato-item"><strong>Fecha de nacimiento:</strong> ' + data.fechaNacimiento + '</div>' +
      '<div class="dato-item"><strong>Documentos solicitados:</strong><br>' + tiposTexto + '</div>' +
    '</div>' +
    '<div class="modal-buttons-confirmacion">' +
      '<button onclick="confirmarEnvio()" class="btn-confirmar">✔️ Confirmar y Enviar</button>' +
      '<button onclick="cerrarModalConfirmacion()" class="btn-modificar">✏️ Modificar Datos</button>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(modal);
  setTimeout(function() { modal.classList.add('visible'); }, 10);
}

window.cerrarModalConfirmacion = function() {
  const modal = document.querySelector('.modal-overlay-confirmacion');
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(function() { modal.remove(); }, 300);
  }
  datosTemporales = null; // Limpiar datos
};

window.confirmarEnvio = async function() {
  if (!datosTemporales) return;
  const data = datosTemporales;
  cerrarModalConfirmacion();
  
  // Generar ID manual para usar como código
  const codigo = generarCodigoUnico();

  try {
    await db.collection('solicitudes').doc(codigo).set(data);
    resultadoSolicitud.classList.remove('error');
    
    // Guardar datos para descarga
    window.datosSolicitudActual = { codigo, data };
    
    resultadoSolicitud.innerHTML = '<div class="exito-mensaje">' +
      '<div class="exito-icono">✅</div>' +
      '<h3>Solicitud Enviada Correctamente</h3>' +
      '<div class="codigo-destacado">' + codigo + '</div>' +
      '<p>Guarde este código para consultar el estado de su expediente.</p>' +
      '<button onclick="descargarComprobanteActual()" class="btn-descargar">📄 Descargar Comprobante PDF</button>' +
      '<button onclick="volverAlInicio()" class="btn-volver">🏠 Volver al Inicio</button>' +
    '</div>';
    formSolicitud.reset();
    hide(optativasWrapper);
    
    // Mostrar banner superior con el código y descargar PDF automáticamente
    mostrarCodigoArriba(codigo);
    try { descargarComprobante(codigo, data); } catch(e) { console.warn('No se pudo descargar automáticamente el PDF:', e); }
    // Llevar al usuario al inicio visualmente
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(_) { window.scrollTo(0,0); }
  } catch(err){
    console.error(err);
    resultadoSolicitud.textContent='Error guardando la solicitud. Intente nuevamente.';
    resultadoSolicitud.classList.add('error');
  }
};

// Banner superior para mostrar el código destacado
function mostrarCodigoArriba(codigo) {
  var existente = document.getElementById('codigoBanner');
  if (!existente) {
    var banner = document.createElement('div');
    banner.id = 'codigoBanner';
    banner.innerHTML = '<div class="codigo-banner-inner">' +
      '<span class="codigo-banner-label">Código de Ticket:</span>' +
      '<span class="codigo-banner-value">' + codigo + '</span>' +
      '<button type="button" class="codigo-banner-copy" onclick="copiarCodigoTicket()">Copiar</button>' +
      '<button type="button" class="codigo-banner-close" onclick="this.parentElement.parentElement.remove()">✖</button>' +
    '</div>';
    // Insertar al inicio del body
    var body = document.body;
    if (body.firstChild) body.insertBefore(banner, body.firstChild); else body.appendChild(banner);
  } else {
    var valueEl = existente.querySelector('.codigo-banner-value');
    if (valueEl) valueEl.textContent = codigo;
  }
}

// Copiar código al portapapeles con feedback visual
window.copiarCodigoTicket = function() {
  var valorEl = document.querySelector('#codigoBanner .codigo-banner-value');
  if (!valorEl) return;
  var texto = valorEl.textContent ? valorEl.textContent.trim() : '';
  var btn = document.querySelector('#codigoBanner .codigo-banner-copy');
  var ok = function(){
    if (btn) {
      var old = btn.textContent;
      btn.textContent = '¡Copiado!';
      btn.disabled = true;
      setTimeout(function(){ btn.textContent = old; btn.disabled = false; }, 1500);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(ok).catch(function(){ fallbackCopy(texto, ok); });
  } else {
    fallbackCopy(texto, ok);
  }
};

function fallbackCopy(texto, onDone) {
  try {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (onDone) onDone();
  } catch(e) { console.warn('No se pudo copiar:', e); }
}

formConsulta.addEventListener('submit', async function(e) {
  e.preventDefault();
  if(!db){resultadoConsulta.textContent='Firebase no configurado.'; resultadoConsulta.classList.add('error'); return;}
  const cedula = formConsulta.cedulaConsulta.value.trim();
  const codigo = formConsulta.codigoConsulta.value.trim();
  if(!cedula || !codigo){resultadoConsulta.textContent='Complete ambos campos.'; resultadoConsulta.classList.add('error'); return;}
  try {
    const docRef = db.collection('solicitudes').doc(codigo);
    const snap = await docRef.get();
    if(!snap.exists){resultadoConsulta.textContent='No se encontró la solicitud. Verifique el código.'; resultadoConsulta.classList.add('error'); return;}
    const info = snap.data();
    if(info.cedula !== cedula){resultadoConsulta.textContent='Cédula no coincide con la solicitud.'; resultadoConsulta.classList.add('error'); return;}
    resultadoConsulta.classList.remove('error');
    
    // Formatear fecha estimada
    let fechaEstimada = '';
    if(info.fechaEstimadaEntrega && info.estado === 'En Proceso') {
      const fecha = new Date(info.fechaEstimadaEntrega);
      fechaEstimada = `\n\n📅 Fecha estimada de entrega: ${fecha.toLocaleDateString('es-DO', {year:'numeric', month:'long', day:'numeric'})}`;
    }
    
    // Mensajes según estado
    let mensajeEstado = '';
    if(info.estado === 'Pendiente') mensajeEstado = '⏳ Su solicitud está pendiente de revisión.';
    else if(info.estado === 'En Proceso') mensajeEstado = '🔄 Su solicitud está en proceso.' + fechaEstimada;
    else if(info.estado === 'Listo') mensajeEstado = '✅ Su expediente está listo para retirar.';
    else if(info.estado === 'Entregado') mensajeEstado = '📦 Su expediente fue entregado.';
    
    // Guardar datos para descarga
    window.datosSolicitudActual = { codigo, data: info };
    
    // Generar lista de documentos
    const listaDocumentos = info.tiposDocumentos.map(function(t) { return '• ' + formatTipo(t); }).join('<br>');
    const estadoClass = info.estado.toLowerCase().replace(/ /g, '-');
    const optativaTexto = info.optativa ? ' (' + info.optativa + ')' : '';
    
    resultadoConsulta.innerHTML = '<div class="estado-header estado-' + estadoClass + '">' + info.estado + '</div>' +
      '<div class="consulta-info">' +
        '<p><strong>Estudiante:</strong> ' + info.nombreEstudiante + '</p>' +
        '<p><strong>Solicitante:</strong> ' + info.nombreSolicitante + '</p>' +
        '<p><strong>Grado:</strong> ' + info.grado + optativaTexto + '</p>' +
        '<p><strong>Documentos solicitados:</strong><br>' + listaDocumentos + '</p>' +
        '<div class="mensaje-estado">' + mensajeEstado + '</div>' +
        '<button onclick="descargarComprobanteActual()" class="btn-descargar">📄 Descargar Comprobante PDF</button>' +
      '</div>';
  } catch(err){
    console.error(err);
    resultadoConsulta.textContent='Error consultando solicitud.';
    resultadoConsulta.classList.add('error');
  }
});

function formatTipo(tipo) {
  const tipos = {
    'record_notas': 'Record de Notas',
    'boletin': 'Boletín de Calificaciones',
    'certificacion': 'Certificación',
    'otros': 'Otros'
  };
  return tipos[tipo] || tipo;
}

window.volverAlInicio = function() {
  hide(panelNueva);
  hide(panelConsulta);
  resultadoSolicitud.innerHTML = '';
  resultadoConsulta.innerHTML = '';
  window.datosSolicitudActual = null;
};

window.descargarComprobanteActual = function() {
  if (!window.datosSolicitudActual) {
    alert('No hay datos para descargar.');
    return;
  }
  descargarComprobante(window.datosSolicitudActual.codigo, window.datosSolicitudActual.data);
};

// =========== GENERAR PDF ===========
window.descargarComprobante = async function(codigo, datosStr) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Parse datos si viene como string
  const datos = typeof datosStr === 'string' ? JSON.parse(datosStr.replace(/&quot;/g, '"')) : datosStr;
  
  // Cargar nombre del centro desde config
  let nombreCentro = 'Centro Educativo';
  if (db) {
    try {
      const configSnap = await db.collection('config').doc('general').get();
      if (configSnap.exists) nombreCentro = configSnap.data().nombreCentro || nombreCentro;
    } catch(e) { console.warn('No se pudo cargar config:', e); }
  }
  
  // Encabezado
  doc.setFillColor(13, 71, 161);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text(nombreCentro, 105, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text('Comprobante de Solicitud de Expediente', 105, 28, { align: 'center' });
  
  // Generar QR Code
  const qrContainer = document.createElement('div');
  qrContainer.style.display = 'none';
  document.body.appendChild(qrContainer);
  
  const qrCode = new QRCode(qrContainer, {
    text: `CODIGO:${codigo}|CEDULA:${datos.cedula}`,
    width: 128,
    height: 128
  });
  
  // Esperar a que se genere el QR
  await new Promise(resolve => setTimeout(resolve, 300));
  const qrImg = qrContainer.querySelector('img');
  const qrDataURL = qrImg ? qrImg.src : null;
  
  // Código destacado
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Código de Ticket:', 20, 55);
  doc.setFillColor(255, 193, 7);
  doc.roundedRect(20, 60, 80, 15, 3, 3, 'F');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(codigo, 60, 70, { align: 'center' });
  
  // QR Code
  if (qrDataURL) {
    doc.addImage(qrDataURL, 'PNG', 145, 50, 40, 40);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Escanee para consultar', 165, 95, { align: 'center' });
  }
  
  // Información del solicitante
  let y = 105;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Información de la Solicitud', 20, y);
  doc.setLineWidth(0.5);
  doc.line(20, y + 2, 190, y + 2);
  
  y += 12;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Solicitante:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.nombreSolicitante, 60, y);
  
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Estudiante:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.nombreEstudiante, 60, y);
  
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Cédula:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.cedula, 60, y);
  
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Teléfono:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.telefono || 'N/A', 60, y);
  
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Grado:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.grado + (datos.optativa ? ` (${datos.optativa})` : ''), 60, y);
  
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Años en centro:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.anosCentro, 60, y);
  
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Fecha de nacimiento:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(datos.fechaNacimiento, 60, y);
  
  // Documentos solicitados
  y += 12;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Documentos Solicitados:', 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  datos.tiposDocumentos.forEach(tipo => {
    doc.text('• ' + formatTipo(tipo), 25, y);
    y += 6;
  });
  
  // Estado y fecha estimada
  if (datos.estado) {
    y += 5;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Estado:', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(datos.estado, 45, y);
    
    if (datos.fechaEstimadaEntrega && datos.estado === 'En Proceso') {
      y += 8;
      doc.setFont(undefined, 'bold');
      doc.text('Fecha Estimada de Entrega:', 20, y);
      doc.setFont(undefined, 'normal');
      const fechaEst = new Date(datos.fechaEstimadaEntrega);
      doc.text(fechaEst.toLocaleDateString('es-DO', {year:'numeric', month:'long', day:'numeric'}), 80, y);
    }
  }
  
  // Fecha de emisión
  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const fechaEmision = new Date().toLocaleString('es-DO', {year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'});
  doc.text(`Comprobante emitido: ${fechaEmision}`, 20, y);
  
  // Instrucciones
  y += 10;
  doc.setFillColor(227, 242, 253);
  doc.roundedRect(20, y, 170, 30, 3, 3, 'F');
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(13, 71, 161);
  doc.setFont(undefined, 'bold');
  doc.text('Instrucciones:', 25, y);
  y += 6;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text('• Conserve este comprobante hasta retirar su expediente', 25, y);
  y += 5;
  doc.text('• Consulte el estado con su código y cédula en nuestro portal', 25, y);
  y += 5;
  doc.text('• Al retirar, presente este comprobante y su cédula original', 25, y);
  
  // Pie de página
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Sistema de Gestión de Expedientes - ' + nombreCentro, 105, 285, { align: 'center' });
  
  // Limpiar QR temporal
  document.body.removeChild(qrContainer);
  
  // Descargar
  doc.save(`Comprobante_${codigo}.pdf`);
};
