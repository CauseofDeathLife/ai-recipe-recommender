import { useState, useEffect, useRef } from 'react'
import { domToPng, domToBlob } from 'modern-screenshot'

// ─────────────────────────────────────────────
// MAPEO DE PROPIEDADES DEL JSON EXTERNO
// El JSON en public/ usa tildes: Descripción, Categoría, Región, etc.
// Esta función normaliza cada objeto al esquema interno sin tildes.
// ─────────────────────────────────────────────
function normalizarProducto(raw) {
  return {
    SKU: raw.SKU,
    Marca: raw.Marca,
    Producto: raw.Producto,
    Descripcion: raw['Descripción'] ?? raw.Descripcion ?? '',
    Presentacion: raw['Presentación'] ?? raw.Presentacion ?? '',
    Categoria: raw['Categoría'] ?? raw.Categoria ?? '',
    Region: raw['Región'] ?? raw.Region ?? '',
    Preparacion: raw.Preparacion_Lista ?? raw.Preparacion ?? [],
    Rango: raw.Rango_Personas ?? raw.Rango ?? '',
    Ocasion: raw.Ocasion ?? '',
  }
}

// ─────────────────────────────────────────────
// LÓGICA DE FILTRADO — recibe el catálogo como parámetro
// ─────────────────────────────────────────────
function personasARango(n) {
  if (!n || n === '') return null
  const num = parseInt(n, 10)
  if (isNaN(num)) return null
  if (num <= 4) return '1-4 personas'
  if (num <= 15) return '5-15 personas'
  return '16+ personas'
}

function filtrarCatalogo(catalogo, { region, ocasion, preparacion, personas }) {
  return catalogo.filter((p) => {
    if (region && p.Region !== region) return false
    if (ocasion && !p.Ocasion.includes(ocasion)) return false
    if (preparacion && !p.Preparacion.includes(preparacion)) return false
    const rango = personasARango(personas)
    if (rango && p.Rango !== rango) return false
    return true
  })
}

// ─────────────────────────────────────────────
// RECETA PLACEHOLDER
// ─────────────────────────────────────────────
function generarRecetaPlaceholder(producto) {
  const metodo = producto.Preparacion[0]
  const nombre = producto.Producto

  const instruccionesPorMetodo = {
    Parrilla: [
      'Precalienta la parrilla a fuego medio-alto durante 10 minutos.',
      `Coloca los ${nombre} sobre la parrilla caliente.`,
      'Cocina 6-8 minutos por cada lado hasta dorar bien.',
      'Retira del fuego y deja reposar 3 minutos antes de servir.',
    ],
    Sartén: [
      'Calienta una sartén con un chorrito de aceite a fuego medio.',
      `Agrega los ${nombre} cuando el aceite esté caliente.`,
      'Cocina 5-7 minutos por cada lado hasta que estén bien dorados.',
      'Sirve caliente y acompaña con tu salsa favorita.',
    ],
    Horno: [
      'Precalienta el horno a 200 °C.',
      `Distribuye los ${nombre} en una bandeja con papel encerado.`,
      'Hornea durante 20-25 minutos, volteando a mitad del tiempo.',
      'Verifica que estén dorados por fuera y jugosos por dentro.',
    ],
    Airfryer: [
      'Precalienta el Airfryer a 190 °C por 3 minutos.',
      `Coloca los ${nombre} en la canasta sin apilar.`,
      'Cocina 12-15 minutos, agitando la canasta a mitad del tiempo.',
      'Sirve de inmediato para mantener la textura crujiente.',
    ],
    Plancha: [
      'Calienta la plancha a temperatura alta y engrasa ligeramente.',
      `Coloca los ${nombre} sobre la plancha caliente.`,
      'Cocina 4-5 minutos por lado presionando levemente.',
      'Sirve con limón y hierbas frescas al gusto.',
    ],
    Salteado: [
      'Calienta un wok o sartén profunda con aceite a fuego alto.',
      'Añade ajo y vegetales al gusto y saltea 2 minutos.',
      `Incorpora los ${nombre} y saltea moviendo constantemente por 6-8 minutos.`,
      'Sazona con salsa de soja, pimienta y sirve de inmediato.',
    ],
    Wok: [
      'Calienta el wok a fuego alto con un poco de aceite de ajonjolí.',
      'Añade jengibre rallado y cebolla en julianas, saltea 1 minuto.',
      `Agrega los ${nombre} y cocina 5-7 minutos removiendo.',`,
      'Termina con salsa de soja y sirve sobre arroz blanco.',
    ],
  }

  const pasos = instruccionesPorMetodo[metodo] || [
    `Prepara los ${nombre} siguiendo las indicaciones del empaque.`,
    'Cocina a temperatura adecuada hasta obtener el punto deseado.',
    'Sirve caliente y disfruta.',
  ]

  return {
    nombre: `${nombre} a la ${metodo}`,
    ingredientes: [
      `1 porción de ${producto.Presentacion} de ${nombre}`,
      'Sal y pimienta al gusto',
      'Aceite o mantequilla',
      'Hierbas y especias al gusto',
      'Acompañamientos de tu preferencia',
    ],
    pasos,
  }
}

// ─────────────────────────────────────────────
// FETCH AL WEBHOOK N8N (con timeout y validación)
// ─────────────────────────────────────────────
async function obtenerRecetaDesdeN8N(producto, preparacionElegida, personas) {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('VITE_N8N_WEBHOOK_URL no está definida. Usando receta local como fallback.')
    throw new Error('Variable de entorno VITE_N8N_WEBHOOK_URL no configurada.')
  }

  let personasNum
  if (personas && personas !== '') {
    personasNum = parseInt(personas, 10)
    if (isNaN(personasNum)) {
      const rango = producto.Rango
      personasNum = rango === '1-4 personas' ? 4 : rango === '5-15 personas' ? 10 : 20
    }
  } else {
    const rango = producto.Rango
    personasNum = rango === '1-4 personas' ? 4 : rango === '5-15 personas' ? 10 : 20
  }

  const preparacion_elegida = preparacionElegida && preparacionElegida !== ''
    ? preparacionElegida
    : producto.Preparacion[0]

  const payload = {
    producto: producto.Producto,
    marca: producto.Marca,
    descripcion: producto.Descripcion,
    presentacion: producto.Presentacion,
    preparacion_elegida,
    personas: personasNum,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error(`N8N respondió con error HTTP ${res.status}. Payload enviado:`, payload)
      throw new Error(`HTTP ${res.status}`)
    }

    let data
    try {
      data = await res.json()
    } catch (parseErr) {
      console.error('N8N devolvió JSON inválido:', parseErr.message)
      throw parseErr
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.error('N8N devolvió un array vacío. Payload enviado:', payload)
        throw new Error('N8N devolvió un array vacío.')
      }
      console.info('Respuesta de N8N venía envuelta en array. Desempacada correctamente.')
      data = data[0]
    }

    if (
      typeof data.nombre !== 'string' || data.nombre.trim() === '' ||
      !Array.isArray(data.ingredientes) || data.ingredientes.length === 0 ||
      !Array.isArray(data.pasos) || data.pasos.length === 0
    ) {
      console.error('N8N devolvió estructura inválida:', data)
      throw new Error('Respuesta de N8N no tiene la estructura esperada.')
    }

    return { nombre: data.nombre, ingredientes: data.ingredientes, pasos: data.pasos }
  } catch (err) {
    clearTimeout(timeoutId)
    console.error('Error al obtener receta desde N8N:', err.message)
    throw err
  }
}

// ─────────────────────────────────────────────
// ÍCONOS SVG DE LABELS (con color como prop)
// ─────────────────────────────────────────────
const IconRegion = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconOcasion = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconPreparacion = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
  </svg>
)

const IconPersonas = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

const IconStar = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const IconBook = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)

const IconWhatsApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const IconPhone = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.64 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.06 6.06l1.96-1.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

// ─────────────────────────────────────────────
// ESTILOS REUTILIZABLES
// ─────────────────────────────────────────────
const selectStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  border: '1.5px solid #e2e8f0',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  fontSize: '1.0625rem',
  color: '#0d1b6f',
  width: '100%',
  outline: 'none',
  transition: 'all 0.2s',
  cursor: 'pointer',
  textAlign: 'center',
  textAlignLast: 'center',
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  color: '#475569',
  fontSize: '15px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  marginBottom: '6px',
}

// ─────────────────────────────────────────────
// CARRUSEL FADE — imágenes en cross-dissolve
// ─────────────────────────────────────────────
const CarruselFade = ({ imagenes, indice, alt, modo = 'producto' }) => {
  const esReceta = modo === 'receta'
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '200px',
      overflow: 'hidden',
      borderRadius: '12px',
      backgroundColor: esReceta ? 'transparent' : '#FFFFFF',
      boxSizing: 'border-box',
    }}>
      {imagenes.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: esReceta ? 'cover' : 'contain',
            opacity: i === indice ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

const CARRUSEL_PRODUCTOS = [
  '/images/producto-02-alitas-bbq.webp',
  '/images/producto-03-camaron-tigre.webp',
  '/images/producto-04-filete-robalo.webp',
  '/images/producto-05-perniles-pollo.png',
  '/images/producto-06-muslos-pollo.webp',
  '/images/producto-08-pollo-molido.png',
  '/images/producto-09-salmon-noruego.webp',
]

const CARRUSEL_RECETAS = [
  '/images/receta-01-arepa-pollo.png',
  '/images/receta-02-banderas-salchicha.jpg',
  '/images/receta-05-fiambre-pollo.jpg',
  '/images/receta-06-muslos-asados.jpg',
  '/images/receta-07-ensalada-pollo.png',
  '/images/receta-08-pizza.png',
]

const INTEGRANTES = [
  { nombre: 'Daniel Quintero', url: 'https://www.linkedin.com/in/danielesban/'},
  { nombre: 'Juan Herrera', url: 'https://www.linkedin.com/in/juanherrera9/'  },
  { nombre: 'Luisa Quiceno', url: 'https://www.linkedin.com/in/luisafernandaquicenogiraldo' },
  { nombre: 'Héctor Mejía', url: 'https://www.linkedin.com/in/himv82' },
  { nombre: 'Brayan Pabón', url: null },
]

// ─────────────────────────────────────────────
// MENSAJE DE FALLBACK DINÁMICO
// ─────────────────────────────────────────────
function construirMensajeFallback(seleccion, producto) {
  const { ocasion, preparacion, personas } = seleccion
  const frases = []

  if (preparacion && !producto.Preparacion.includes(preparacion)) {
    frases.push(`Ajustamos la preparación de ${preparacion} a ${producto.Preparacion[0]}`)
  }

  if (ocasion && !producto.Ocasion.includes(ocasion)) {
    frases.push(`la ocasión de ${ocasion} a ${producto.Ocasion}`)
  }

  if (personas) {
    const rango = personasARango(personas)
    if (rango && rango !== producto.Rango) {
      frases.push(`el tamaño del grupo de ${personas} personas a un producto para ${producto.Rango}`)
    }
  }

  let ajustes = ''
  if (frases.length === 1) {
    ajustes = ` ${frases[0]}.`
  } else if (frases.length === 2) {
    ajustes = ` ${frases[0]} y ${frases[1]}.`
  } else if (frases.length >= 3) {
    ajustes = ` ${frases.slice(0, -1).join(', ')} y ${frases[frases.length - 1]}.`
  }

  return `No encontramos un producto que coincida exactamente con tu selección.${ajustes} Te recomendamos este producto disponible en tu región:`
}

// ─────────────────────────────────────────────
// HOOK DE DETECCIÓN DE VIEWPORT
// ─────────────────────────────────────────────
function useIsMobile() {
  const query = '(max-width: 767px)'
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

export default function RecomendadorFriko() {
  // ── Estado del catálogo (cargado desde public/) ──
  const [catalogo, setCatalogo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  useEffect(() => {
    fetch('/data/catalogo_friko_limpio.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCatalogo(data.map(normalizarProducto))
        setCargando(false)
      })
      .catch((err) => {
        setErrorCarga(`No se pudo cargar el catálogo (${err.message}). Verifica que catalogo_friko_limpio.json esté en public/data/.`)
        setCargando(false)
      })
  }, [])

  // ── Estado de tiendas (cargado desde public/) ──
  const [tiendasData, setTiendasData] = useState(null)

  useEffect(() => {
    fetch('/data/tiendas_friko.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setTiendasData(data))
      .catch(() => {})
  }, [])

  // Opciones derivadas dinámicamente del catálogo cargado
  const regiones = [...new Set(catalogo.map((p) => p.Region))].sort()
  const metodos = [...new Set(catalogo.flatMap((p) => p.Preparacion))].sort()

  // ── Estado de filtros y resultados ──
  const [region, setRegion] = useState('')
  const [ocasion, setOcasion] = useState('')
  const [preparacion, setPreparacion] = useState('')
  const [personas, setPersonas] = useState('')
  const [resultado, setResultado] = useState(null)
  const [receta, setReceta] = useState(null)
  const [error, setError] = useState('')
  const [mensajeFallback, setMensajeFallback] = useState('')
  const [nota, setNota] = useState('')
  const [logoError, setLogoError] = useState(false)
  const [cargandoReceta, setCargandoReceta] = useState(false)
  const [origenReceta, setOrigenReceta] = useState(null)
  const [descargando, setDescargando] = useState(false)

  // ── Ref para captura de imagen ──
  const recetaContainerRef = useRef(null)

  // ── Estado del carrusel ──
  const [indiceProducto, setIndiceProducto] = useState(0)
  const [indiceReceta, setIndiceReceta] = useState(0)

  // ── Detección de móvil ──
  const isMobile = useIsMobile()

  // ── Efecto carrusel: rota cada 5 segundos mientras no hay resultado ──
  useEffect(() => {
    if (resultado !== null) return

    const interval = setInterval(() => {
      setIndiceProducto(i => (i + 1) % CARRUSEL_PRODUCTOS.length)
      setIndiceReceta(i => (i + 1) % CARRUSEL_RECETAS.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [resultado])

  const handleGenerar = async () => {
    setError('')
    setMensajeFallback('')
    setNota('')

    if (!region && !ocasion && !preparacion && !personas) {
      setResultado(null)
      setReceta(null)
      setError('Selecciona al menos un criterio para generar una recomendación.')
      return
    }

    if (personas) {
      const num = parseInt(personas, 10)
      if (isNaN(num) || num < 1) {
        setResultado(null)
        setReceta(null)
        setError('El número de personas debe ser al menos 1.')
        return
      }
      if (num > 50) {
        setResultado(null)
        setReceta(null)
        setError('Para grupos de más de 50 personas, contacta directamente a Friko para una cotización especial.')
        return
      }
    }

    // === BÚSQUEDA PRINCIPAL: con todos los filtros ===
    const encontrados = filtrarCatalogo(catalogo, { region, ocasion, preparacion, personas })

    if (encontrados.length > 0) {
      const producto = encontrados[0]
      setResultado(producto)
      setCargandoReceta(true)
      try {
        const recetaN8N = await obtenerRecetaDesdeN8N(producto, preparacion, personas)
        setReceta(recetaN8N)
        setOrigenReceta('ia')
      } catch (err) {
        console.error('Fallback a receta local por error en N8N:', err)
        setReceta(generarRecetaPlaceholder(producto))
        setOrigenReceta('local')
      } finally {
        setCargandoReceta(false)
      }
      return
    }

    // === FALLBACK 1: sin preparación ===
    const fallback1 = filtrarCatalogo(catalogo, { region, ocasion, preparacion: '', personas })
    if (fallback1.length > 0) {
      const producto = fallback1[0]
      setMensajeFallback(construirMensajeFallback({ region, ocasion, preparacion, personas }, producto))
      setResultado(producto)
      setCargandoReceta(true)
      try {
        const preparacionReal = producto.Preparacion?.[0] ?? ''
        const recetaN8N = await obtenerRecetaDesdeN8N(producto, preparacionReal, personas)
        setReceta(recetaN8N)
        setOrigenReceta('ia')
      } catch (err) {
        console.error('Fallback a receta local por error en N8N:', err)
        setReceta(generarRecetaPlaceholder(producto))
        setOrigenReceta('local')
      } finally {
        setCargandoReceta(false)
      }
      return
    }

    // === FALLBACK 2: sin preparación ni ocasión ===
    const fallback2 = filtrarCatalogo(catalogo, { region, ocasion: '', preparacion: '', personas })
    if (fallback2.length > 0) {
      const producto = fallback2[0]
      setMensajeFallback(construirMensajeFallback({ region, ocasion, preparacion, personas }, producto))
      setResultado(producto)
      setCargandoReceta(true)
      try {
        const preparacionReal = producto.Preparacion?.[0] ?? ''
        const recetaN8N = await obtenerRecetaDesdeN8N(producto, preparacionReal, personas)
        setReceta(recetaN8N)
        setOrigenReceta('ia')
      } catch (err) {
        console.error('Fallback a receta local por error en N8N:', err)
        setReceta(generarRecetaPlaceholder(producto))
        setOrigenReceta('local')
      } finally {
        setCargandoReceta(false)
      }
      return
    }

    // === FALLBACK 3: solo región ===
    const fallback3 = filtrarCatalogo(catalogo, { region, ocasion: '', preparacion: '', personas: '' })
    if (fallback3.length > 0) {
      const producto = fallback3[0]
      setMensajeFallback(construirMensajeFallback({ region, ocasion, preparacion, personas }, producto))
      setResultado(producto)
      setCargandoReceta(true)
      try {
        const preparacionReal = producto.Preparacion?.[0] ?? ''
        const recetaN8N = await obtenerRecetaDesdeN8N(producto, preparacionReal, personas)
        setReceta(recetaN8N)
        setOrigenReceta('ia')
      } catch (err) {
        console.error('Fallback a receta local por error en N8N:', err)
        setReceta(generarRecetaPlaceholder(producto))
        setOrigenReceta('local')
      } finally {
        setCargandoReceta(false)
      }
      return
    }

    // === SIN RESULTADOS incluso con todos los fallbacks ===
    setResultado(null)
    setReceta(null)
    setError('No se encontraron productos con esos criterios. Intenta con menos filtros.')
  }

  const handleReiniciar = () => {
    setRegion('')
    setOcasion('')
    setPreparacion('')
    setPersonas('')
    setResultado(null)
    setReceta(null)
    setError('')
    setMensajeFallback('')
    setNota('')
    setOrigenReceta(null)
  }

  const handleCompartir = async () => {
    if (!receta || !resultado) return
    const personasText = personas ? `${personas} personas` : resultado.Rango
    const urlApp = 'https://recetasbios.vercel.app'

    const textoSaludo = `¡Mira esta receta que generé con productos Friko y Antillana! Pruébala tú también en ${urlApp}`
    const textoCorto = `Mira esta receta: *${receta.nombre}* (${personasText}) — ${urlApp}`

    if (navigator.share && recetaContainerRef.current) {
      try {
        const imgs = recetaContainerRef.current.querySelectorAll('img')
        await Promise.all(
          Array.from(imgs).map(img =>
            img.complete ? Promise.resolve() : new Promise(resolve => {
              img.onload = resolve
              img.onerror = resolve
            })
          )
        )
        await new Promise(r => requestAnimationFrame(r))

        const blob = await domToBlob(recetaContainerRef.current, {
          scale: 2,
          backgroundColor: '#f8fafc',
          useCORS: true,
        })
        const file = new File([blob], 'receta.png', { type: 'image/png' })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: textoSaludo,
          })
          return
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        console.warn('navigator.share falló, usando fallback wa.me:', err)
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(textoCorto)}`, '_blank')
  }

  const handleDescargar = async () => {
    if (!recetaContainerRef.current || !resultado) return
    setDescargando(true)
    try {
      const imgs = recetaContainerRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(imgs).map(img =>
          img.complete ? Promise.resolve() : new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve
          })
        )
      )
      await new Promise(r => requestAnimationFrame(r))

      const dataUrl = await domToPng(recetaContainerRef.current, {
        scale: 2,
        backgroundColor: '#f8fafc',
        useCORS: true,
      })
      const nombreArchivo = resultado.Producto
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      const link = document.createElement('a')
      link.download = `receta-${nombreArchivo}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error al descargar:', err)
      const msg = err?.message || ''
      if (msg.includes('tainted') || msg.includes('CORS')) {
        alert('No se pudo capturar por restricciones del navegador. Intenta recargar la página')
      } else {
        alert('No se pudo descargar la imagen, intenta de nuevo')
      }
    } finally {
      setDescargando(false)
    }
  }

  // ── Tiendas para la región seleccionada ──
  const tiendas = region && tiendasData ? (tiendasData[region] || []) : []

  // ── Personas: lógica de contador ──
  const personasNum = personas === '' ? 0 : (parseInt(personas, 10) || 0)
  const puedeDecrementar = personasNum >= 2
  const puedeIncrementar = personasNum < 50

  const handleDecrement = () => {
    if (!puedeDecrementar) return
    setPersonas(String(personasNum - 1))
  }

  const handleIncrement = () => {
    if (!puedeIncrementar) return
    setPersonas(String(personasNum + 1))
  }

  return (
    <div
      style={{
        // TEMA AZUL ORIGINAL (respaldo, restaurar si el blanco no funciona):
        // background: 'radial-gradient(ellipse at 50% 40%, #1A3BA0 0%, #102B88 60%, #0A1F66 100%)',
        background: 'radial-gradient(ellipse at 50% 40%, #EEF2F8 0%, #D5DEED 60%, #BCC8DD 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: isMobile ? '2rem 1rem 2rem' : '5rem 1rem 3rem',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >

      {/* Blobs decorativos para glassmorphism */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '-10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-15%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(196, 30, 36, 0.30) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.20) 0%, transparent 70%)',
        filter: 'blur(90px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* ── CONTENEDOR PRINCIPAL (tres paneles) ── */}
      <main style={{
        maxWidth: '900px',
        width: '100%',
        marginTop: '1rem',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>

        {/* ── PANEL A: Amarillo — logos + título ── */}
        <section style={{
          background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.92) 0%, rgba(248, 178, 28, 0.94) 60%, rgba(245, 158, 11, 0.96) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '2rem',
          border: '2px solid rgba(212, 135, 16, 0.55)',
          boxShadow: '0 25px 60px rgba(20, 30, 70, 0.30), 0 8px 20px rgba(20, 30, 70, 0.18), inset 0 0 90px rgba(20, 30, 70, 0.06), inset 0 0 35px rgba(20, 30, 70, 0.03), inset 0 2px 4px rgba(255, 255, 255, 0.80), inset 0 -3px 6px rgba(150, 100, 10, 0.18)',
          padding: isMobile ? '1.25rem 1rem 1rem' : '2rem 2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}>

          {/* ── Logos Friko + Antillana ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '12px' : '24px',
            marginBottom: '16px',
          }}>
            <img
              src="/logos/friko.png"
              alt="Friko"
              style={{ height: '87px', width: '120px', objectFit: 'contain', transition: 'transform 0.2s ease, filter 0.2s ease', cursor: 'default' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.08)'
                  e.currentTarget.style.filter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.filter = 'none'
                }
              }}
            />
            <img
              src="/logos/antillana.png"
              alt="Antillana"
              style={{ height: '70px', width: '149px', objectFit: 'contain', transition: 'transform 0.2s ease, filter 0.2s ease', cursor: 'default' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.08)'
                  e.currentTarget.style.filter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.filter = 'none'
                }
              }}
            />
          </div>

          {/* ── TÍTULO Y SUBTÍTULO ── */}
          <div style={{ textAlign: 'center', marginTop: '0' }}>
            <h1 style={{
              color: '#0d1b6f',
              fontSize: isMobile ? '1.4rem' : '2rem',
              fontWeight: 800,
              marginBottom: '0.25rem',
              letterSpacing: '-0.5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}>
              Recomendador de Recetas
            </h1>
            <p style={{
              color: '#0d1b6f',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: 400,
            }}>
              Tu receta perfecta con productos Friko y Antillana
            </p>
          </div>

        </section>

        {/* ── PANEL B: Blanco — selectores, botones, resultados ── */}
        <section style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '2rem',
          border: '1.5px solid rgba(220, 225, 240, 0.75)',
          boxShadow: '0 25px 60px rgba(20, 30, 70, 0.30), 0 8px 20px rgba(20, 30, 70, 0.18), inset 0 0 90px rgba(20, 30, 70, 0.06), inset 0 0 35px rgba(20, 30, 70, 0.03), inset 0 3px 6px rgba(255, 255, 255, 1), inset 0 -3px 6px rgba(20, 30, 70, 0.03)',
          padding: isMobile ? '1rem 0.75rem 1.75rem' : '2rem 2rem 2.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>

          {/* ── ESTADO DE CARGA DEL CATÁLOGO ── */}
          {cargando && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'1rem 0', color:'#64748b', fontSize:'0.875rem' }}>
              <svg className="animate-spin" style={{ width:16, height:16, color:'#64748b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Cargando catálogo...
            </div>
          )}
          {errorCarga && (
            <div style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              color: '#c2410c',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              {errorCarga}
            </div>
          )}

          {/* ── SELECTORES 2×2 ── */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '0.75rem' : '1.25rem' }}>

            {/* Dónde estás (región) */}
            <div>
              <label style={{ ...labelStyle, color: '#0d1b6f', fontSize: isMobile ? '13px' : '15px' }}>
                <IconRegion color="#0d1b6f" /> ¿Dónde estás?
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={cargando}
                style={{
                  ...selectStyle,
                  opacity: cargando ? 0.5 : 1,
                  borderColor: region ? '#0d1b6f' : '#e2e8f0',
                  boxShadow: region ? '0 0 0 2px rgba(13,27,111,0.18)' : 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.45)'; e.currentTarget.style.borderColor = '#0d1b6f' }}
                onBlur={(e) => {
                  if (region) {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(13,27,111,0.18)'
                    e.currentTarget.style.borderColor = '#0d1b6f'
                  } else {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }
                }}
              >
                <option value="" style={{ background: '#ffffff', color: '#1e293b' }}>Todas las regiones</option>
                {regiones.map((r) => <option key={r} style={{ background: '#ffffff', color: '#1e293b' }}>{r}</option>)}
              </select>
            </div>

            {/* Para qué ocasión */}
            <div>
              <label style={{ ...labelStyle, color: '#0d1b6f', fontSize: isMobile ? '13px' : '15px' }}>
                <IconOcasion color="#0d1b6f" /> ¿Para qué ocasión?
              </label>
              <select
                value={ocasion}
                onChange={(e) => setOcasion(e.target.value)}
                style={{
                  ...selectStyle,
                  borderColor: ocasion ? '#0d1b6f' : '#e2e8f0',
                  boxShadow: ocasion ? '0 0 0 2px rgba(13,27,111,0.18)' : 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.45)'; e.currentTarget.style.borderColor = '#0d1b6f' }}
                onBlur={(e) => {
                  if (ocasion) {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(13,27,111,0.18)'
                    e.currentTarget.style.borderColor = '#0d1b6f'
                  } else {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }
                }}
              >
                <option value="" style={{ background: '#ffffff', color: '#1e293b' }}>Cualquier ocasión</option>
                <option style={{ background: '#ffffff', color: '#1e293b' }}>Hogar</option>
                <option style={{ background: '#ffffff', color: '#1e293b' }}>Evento</option>
              </select>
            </div>

            {/* Preparación */}
            <div>
              <label style={{ ...labelStyle, color: '#0d1b6f', fontSize: isMobile ? '13px' : '15px' }}>
                <IconPreparacion color="#0d1b6f" /> ¿Tipo de preparación?
              </label>
              <select
                value={preparacion}
                onChange={(e) => setPreparacion(e.target.value)}
                disabled={cargando}
                style={{
                  ...selectStyle,
                  opacity: cargando ? 0.5 : 1,
                  borderColor: preparacion ? '#0d1b6f' : '#e2e8f0',
                  boxShadow: preparacion ? '0 0 0 2px rgba(13,27,111,0.18)' : 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.45)'; e.currentTarget.style.borderColor = '#0d1b6f' }}
                onBlur={(e) => {
                  if (preparacion) {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(13,27,111,0.18)'
                    e.currentTarget.style.borderColor = '#0d1b6f'
                  } else {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }
                }}
              >
                <option value="" style={{ background: '#ffffff', color: '#1e293b' }}>Elige el tipo de preparación</option>
                {metodos.map((m) => <option key={m} style={{ background: '#ffffff', color: '#1e293b' }}>{m}</option>)}
              </select>
            </div>

            {/* Personas — con botones +/- */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label style={{ ...labelStyle, color: '#0d1b6f', fontSize: isMobile ? '13px' : '15px' }}>
                <IconPersonas color="#0d1b6f" /> ¿Para cuántas personas?
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'stretch',
                border: '1.5px solid #e2e8f0',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.95)',
                transition: 'border-color 0.2s',
                width: '280px',
                maxWidth: '100%',
              }}>
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={!puedeDecrementar}
                  aria-label="Menos personas"
                  style={{
                    minWidth: '44px',
                    width: '44px',
                    background: puedeDecrementar ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)' : 'rgba(254, 226, 226, 0.5)',
                    color: puedeDecrementar ? '#fff' : '#fca5a5',
                    border: 'none',
                    cursor: puedeDecrementar ? 'pointer' : 'not-allowed',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                    padding: 0,
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Máximo 50 personas"
                  value={personas}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 50)) {
                      setPersonas(val)
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderLeft: '1.5px solid #e2e8f0',
                    borderRight: '1.5px solid #e2e8f0',
                    borderRadius: 0,
                    padding: '0.75rem 0.5rem',
                    fontSize: '1.0625rem',
                    color: personas ? '#0d1b6f' : '#7b8fa8',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.parentElement.style.borderColor = '#0d1b6f'
                    e.currentTarget.parentElement.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.45)'
                    e.currentTarget.style.color = '#0d1b6f'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement.style.borderColor = '#e2e8f0'
                    e.currentTarget.parentElement.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={!puedeIncrementar}
                  aria-label="Más personas"
                  style={{
                    minWidth: '44px',
                    width: '44px',
                    background: puedeIncrementar ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' : 'rgba(254, 243, 199, 0.5)',
                    color: puedeIncrementar ? '#0d1b6f' : '#d97706',
                    border: 'none',
                    cursor: puedeIncrementar ? 'pointer' : 'not-allowed',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                    padding: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* ── BOTONES ── */}
          <div style={{ display:'flex', justifyContent:'center', gap: isMobile ? '0.75rem' : '1rem', marginTop: isMobile ? '1.5rem' : '2rem' }}>

            {/* Botón Generar */}
            <button
              onClick={handleGenerar}
              disabled={cargando || !!errorCarga}
              style={{
                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#0d1b6f',
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '0.875rem 1rem' : '0.875rem 1.25rem',
                borderRadius: '1rem',
                border: 'none',
                cursor: cargando || !!errorCarga ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 0 #b45309, 0 8px 20px rgba(0,0,0,0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.15s ease',
                opacity: cargando || !!errorCarga ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.filter = 'brightness(1.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 0 #b45309, 0 10px 25px rgba(0,0,0,0.35)'
                }
              }}
              onMouseDown={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(6px)'
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 0 #b45309, 0 8px 20px rgba(0,0,0,0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 0 #b45309, 0 8px 20px rgba(0,0,0,0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.filter = 'brightness(1)'
              }}
            >
              Generar receta
            </button>

            {/* Botón Reiniciar */}
            <button
              onClick={handleReiniciar}
              style={{
                background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '0.875rem 1rem' : '0.875rem 1.25rem',
                borderRadius: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 0 #991b1b, 0 8px 20px rgba(0,0,0,0.3)',
                transform: 'translateY(0)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 0 #991b1b, 0 10px 25px rgba(0,0,0,0.35)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(6px)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 0 #991b1b, 0 8px 20px rgba(0,0,0,0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 0 #991b1b, 0 8px 20px rgba(0,0,0,0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.filter = 'brightness(1)'
              }}
            >
              Nueva búsqueda
            </button>

          </div>

          {/* ── Línea separadora ── */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(13,27,111,0.15) 20%, rgba(13,27,111,0.2) 50%, rgba(13,27,111,0.15) 80%, transparent 100%)',
            margin: '0.25rem 0',
          }} />

          {/* ── ERROR ── */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#b91c1c',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* ── MENSAJE FALLBACK ── */}
          {mensajeFallback && (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              color: '#92400E',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              {mensajeFallback}
            </div>
          )}

          {/* ── NOTA DE AJUSTE ── */}
          {nota && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: '#92400e',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
            }}>
              💡 {nota}
            </div>
          )}

          {/* ── ZONA DE RESULTADOS — siempre visible ── */}
          <div
            ref={recetaContainerRef}
            style={{
              border: '1.5px dashed rgba(13, 27, 111, 0.15)',
              borderRadius: '1.5rem',
              padding: isMobile ? '0.75rem' : '1rem',
            }}
          >
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'1rem' }}>

            {/* ─── IZQUIERDA: PRODUCTO ─── */}
            {resultado ? (
              <div style={{
                background: '#F5EDDC',
                border: '1.5px solid rgba(13, 27, 111, 0.1)',
                borderRadius: '1.25rem',
                padding: isMobile ? '1rem' : '1.25rem',
                minHeight: isMobile ? '220px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 27, 111, 0.18)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}>
                <span style={{ color:'#2DA9E1', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px' }}>
                  Producto recomendado
                </span>

                <div>
                  <h2 style={{ color:'#0d1b6f', fontSize:'19px', fontWeight:800, lineHeight:1.3, margin:0 }}>
                    {resultado.Producto}
                  </h2>
                  <p style={{ color:'#0d1b6f', fontSize:'15px', marginTop:'4px', marginBottom:0 }}>
                    {resultado.Descripcion}
                  </p>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'4px', fontSize:'14px' }}>
                  <span>
                    <span style={{ color:'#5a6b7a', fontWeight:600 }}>Presentación:</span>
                    <span style={{ color:'#0d1b6f' }}>{resultado.Presentacion}</span>
                  </span>
                  <span>
                    <span style={{ color:'#5a6b7a', fontWeight:600 }}>Categoría:</span>
                    <span style={{ color:'#0d1b6f' }}>{resultado.Categoria}</span>
                  </span>
                </div>

                {/* Badges preparación + marca */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'4px' }}>
                  {resultado.Preparacion.map((m) => (
                    <span key={m} style={{ background:'#FEF3C7', color:'#92400e', fontSize:'12px', fontWeight:600, padding:'3px 10px', borderRadius:'9999px' }}>
                      {m}
                    </span>
                  ))}
                  {resultado.Marca === 'FRIKO' ? (
                    <span style={{ background:'#DBEAFE', color:'#1e40af', fontSize:'12px', fontWeight:700, padding:'3px 10px', borderRadius:'9999px', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                      <img src="/logos/friko.png" alt="Friko" style={{ height:'14px', width:'19px', objectFit:'contain' }} onError={(e) => { e.currentTarget.style.display='none' }} />
                      FRIKO
                    </span>
                  ) : (
                    <span style={{ background:'#CCFBF1', color:'#115e59', fontSize:'12px', fontWeight:700, padding:'3px 10px', borderRadius:'9999px', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                      <img src="/logos/antillana.png" alt="Antillana" style={{ height:'11px', width:'24px', objectFit:'contain' }} onError={(e) => { e.currentTarget.style.display='none' }} />
                      ANTILLANA
                    </span>
                  )}
                </div>

                {/* Footer región/rango */}
                <div style={{ marginTop:'auto', paddingTop:'10px', borderTop:'1px solid rgba(255,255,255,0.3)', color:'#5a6b7a', fontSize:'13px' }}>
                  Región: <span style={{ fontWeight:600, color:'#374151' }}>{resultado.Region}</span>
                  {' · '}
                  {resultado.Rango}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1.5px dashed rgba(13, 27, 111, 0.12)',
                borderRadius: '1.25rem',
                padding: '1rem',
                minHeight: isMobile ? '220px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <a
                  href="https://www.campoazul.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', width: '100%', cursor: 'pointer', textDecoration: 'none' }}
                >
                  <CarruselFade
                    imagenes={CARRUSEL_PRODUCTOS}
                    indice={indiceProducto}
                    alt="Producto de muestra"
                    modo="producto"
                  />
                </a>
                <span style={{ color: 'rgba(13, 27, 111, 0.75)', fontSize: '16px', fontWeight: 600 }}>Producto recomendado</span>
              </div>
            )}

            {/* ─── DERECHA: RECETA ─── */}
            {cargandoReceta ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1.5px dashed rgba(13, 27, 111, 0.12)',
                borderRadius: '1.25rem',
                padding: '1rem',
                minHeight: isMobile ? '220px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
              }}>
                {/* Logo spinner: Friko y Antillana alternándose con CSS */}
                <div style={{ position: 'relative', width: '149px', height: '87px' }}>
                  <img
                    src="/logos/friko.png"
                    alt="Friko"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '120px',
                      height: '87px',
                      objectFit: 'contain',
                      animation: 'logoFricoFade 3s infinite ease-in-out',
                    }}
                  />
                  <img
                    src="/logos/antillana.png"
                    alt="Antillana"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '149px',
                      height: '70px',
                      objectFit: 'contain',
                      animation: 'logoAntillanaFade 3s infinite ease-in-out',
                      opacity: 0,
                    }}
                  />
                </div>
                <span style={{ color: '#7c5a28', fontSize: '14px', fontWeight: 600 }}>Generando tu receta...</span>
              </div>
            ) : resultado && receta ? (
              <div style={{
                background: '#F5EDDC',
                border: '1.5px solid rgba(13, 27, 111, 0.1)',
                borderRadius: '1.25rem',
                padding: isMobile ? '1rem' : '1.25rem',
                minHeight: isMobile ? '220px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 27, 111, 0.18)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'#2DA9E1', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px' }}>
                    Receta sugerida
                  </span>
                  {origenReceta === 'ia' && (
                    <span style={{ background:'#D1FAE5', color:'#065f46', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'9999px', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                      <IconStar /> Generado por IA
                    </span>
                  )}
                  {origenReceta === 'local' && (
                    <span style={{ background:'#E0E7FF', color:'#3730a3', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'9999px', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                      <IconBook /> Receta sugerida
                    </span>
                  )}
                </div>

                <h2 style={{ color:'#0d1b6f', fontSize:'19px', fontWeight:800, lineHeight:1.3, margin:0 }}>
                  {receta.nombre}
                </h2>

                <div>
                  <p style={{ color:'#2DA9E1', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', marginBottom:'8px', marginTop:0 }}>
                    Ingredientes
                  </p>
                  <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'4px' }}>
                    {receta.ingredientes.map((ing, i) => (
                      <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'14px', color:'#0d1b6f' }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fbbf24', flexShrink:0, marginTop:'5px' }} />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p style={{ color:'#2DA9E1', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', marginBottom:'8px', marginTop:0 }}>
                    Preparación
                  </p>
                  <ol style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'8px' }}>
                    {receta.pasos.map((paso, i) => (
                      <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'14px', color:'#0d1b6f' }}>
                        <span style={{ background:'#dc2626', color:'#fff', width:'20px', height:'20px', borderRadius:'50%', fontSize:'11px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                          {i + 1}
                        </span>
                        {paso}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1.5px dashed rgba(13, 27, 111, 0.12)',
                borderRadius: '1.25rem',
                padding: '1rem',
                minHeight: isMobile ? '220px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <a
                  href="https://www.momentosfriko.com/recetas"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', width: '100%', cursor: 'pointer', textDecoration: 'none' }}
                >
                  <CarruselFade
                    imagenes={CARRUSEL_RECETAS}
                    indice={indiceReceta}
                    alt="Receta de muestra"
                    modo="receta"
                  />
                </a>
                <span style={{ color: 'rgba(13, 27, 111, 0.75)', fontSize: '16px', fontWeight: 600 }}>Receta sugerida</span>
              </div>
            )}

          </div>
          </div>

          {/* ── BOTONES COMPARTIR / DESCARGAR — solo cuando hay receta ── */}
          {resultado && receta && !cargandoReceta && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: isMobile ? '0.75rem' : '1rem',
              flexWrap: 'wrap',
              transform: isMobile ? 'none' : 'translateX(-30px)',
            }}>
              <button
                onClick={handleCompartir}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#25D366',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  padding: isMobile ? '0.875rem 1rem' : '0.875rem 1.25rem',
                  borderRadius: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 0 #1aab52, 0 8px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 0 #1aab52, 0 10px 25px rgba(0,0,0,0.35)' }}
                onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(6px)' }}
                onMouseUp={(e) => { e.currentTarget.style.boxShadow = '0 6px 0 #1aab52, 0 8px 20px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 0 #1aab52, 0 8px 20px rgba(0,0,0,0.3)' }}
              >
                <IconWhatsApp />
                Compartir por WhatsApp
              </button>

              <button
                onClick={handleDescargar}
                disabled={descargando}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(180deg, #4FC3F7 0%, #2DA9E1 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  padding: isMobile ? '0.875rem 1rem' : '0.875rem 1.25rem',
                  borderRadius: '1rem',
                  border: 'none',
                  cursor: descargando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 0 #1e88c4, 0 8px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.15s ease',
                  opacity: descargando ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!descargando) { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 0 #1e88c4, 0 10px 25px rgba(0,0,0,0.35)' } }}
                onMouseDown={(e) => { if (!descargando) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(6px)' } }}
                onMouseUp={(e) => { e.currentTarget.style.boxShadow = '0 6px 0 #1e88c4, 0 8px 20px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 0 #1e88c4, 0 8px 20px rgba(0,0,0,0.3)' }}
              >
                <IconDownload />
                {descargando ? 'Generando receta...' : 'Descargar receta'}
              </button>
            </div>
          )}

        </section>

        {/* ── PANEL C: Puntos de venta — panel independiente ── */}
        {region && resultado && tiendas.length > 0 && (
          <section style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0.92) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '2rem',
            border: '1.5px solid rgba(220, 225, 240, 0.75)',
            boxShadow: '0 25px 60px rgba(20, 30, 70, 0.30), 0 8px 20px rgba(20, 30, 70, 0.18), inset 0 0 90px rgba(20, 30, 70, 0.06), inset 0 0 35px rgba(20, 30, 70, 0.03), inset 0 3px 6px rgba(255, 255, 255, 1), inset 0 -3px 6px rgba(20, 30, 70, 0.03)',
            padding: isMobile ? '1.25rem 1rem' : '2rem',
          }}>
            <p style={{
              color: '#0d1b6f',
              fontSize: '16px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '1.5rem',
              marginTop: 0,
              textAlign: 'center',
            }}>
              Puntos de venta en tu región
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : tiendas.length === 2
                ? '1fr 1fr'
                : '1fr 1fr 1fr',
              gap: '0.75rem',
            }}>
              {tiendas.map((tienda, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(13, 27, 111, 0.1)',
                  borderRadius: '1rem',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 27, 111, 0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}>
                  <img
                    src="/logos/marcador-posicion.png"
                    alt=""
                    style={{
                      width: isMobile ? '40px' : '48px',
                      height: isMobile ? '40px' : '48px',
                      objectFit: 'contain',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#0d1b6f', fontSize: isMobile ? '17px' : '18px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                      {tienda.nombre}
                    </p>
                    <p style={{ color: '#374151', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                      {tienda.direccion}
                    </p>
                    <p style={{ color: '#7b8fa8', fontSize: '12px', margin: 0 }}>
                      {tienda.ciudad}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <IconPhone />
                      <span style={{ color: '#7b8fa8', fontSize: '12px' }}>{tienda.telefono}</span>
                    </div>
                    <div style={{ marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {tienda.horarios.map((h, hi) => (
                        <span key={hi} style={{ color: '#7b8fa8', fontSize: '12px' }}>{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── PANEL D: Aviso de privacidad — panel independiente ── */}
        <section style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0.92) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '2rem',
          border: '1.5px solid rgba(220, 225, 240, 0.75)',
          boxShadow: '0 25px 60px rgba(20, 30, 70, 0.30), 0 8px 20px rgba(20, 30, 70, 0.18), inset 0 0 90px rgba(20, 30, 70, 0.06), inset 0 0 35px rgba(20, 30, 70, 0.03), inset 0 3px 6px rgba(255, 255, 255, 1), inset 0 -3px 6px rgba(20, 30, 70, 0.03)',
          padding: isMobile ? '1rem 1rem' : '1.25rem 1.5rem',
        }}>
          <div style={{
            borderLeft: '4px solid #0d1b6f',
            paddingLeft: '1rem',
          }}>
            <p style={{ color: '#0d1b6f', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Aviso de privacidad
            </p>
            <p style={{ color: '#374151', fontSize: '12px', lineHeight: 1.6, marginTop: '6px', marginBottom: 0 }}>
              Este es un proyecto académico desarrollado en el marco del Reto 12 del NODO EAFIT, sin fines comerciales ni operación real en producción. La aplicación no solicita, recolecta ni almacena datos personales de los usuarios: las selecciones de región, ocasión, método de preparación y número de comensales son parámetros anónimos que no permiten identificar a la persona que las realiza. Por lo anterior, al no existir tratamiento de datos personales en los términos del artículo 3 de la Ley 1581 de 2012, no se configura la obligación de autorización previa ni las demás cargas derivadas del régimen de protección de datos personales en Colombia.
            </p>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        color: 'rgba(13, 27, 111, 0.55)',
        fontSize: '0.75rem',
        fontWeight: 300,
        letterSpacing: '2px',
        textAlign: 'center',
        marginTop: '1.5rem',
        zIndex: 1,
        position: 'relative',
      }}>
        <div>Reto 12 · Grupo 5 · NODO EAFIT — Grupo Bios</div>
        <div style={{ marginTop: '4px', letterSpacing: '1px' }}>
          {INTEGRANTES.map((p, i) => (
            <span key={p.nombre}>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(13, 27, 111, 0.55)', textDecoration: 'none' }}
                  onMouseOver={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseOut={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                >
                  {p.nombre}
                </a>
              ) : (
                p.nombre
              )}
              {i < INTEGRANTES.length - 1 && ' · '}
            </span>
          ))}
        </div>
      </footer>

    </div>
  )
}
