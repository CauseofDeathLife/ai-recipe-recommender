import { useState, useEffect } from 'react'

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
// TODO: Conectar con webhook N8N cuando el equipo lo tenga listo
// fetch("https://TU-N8N/webhook/receta", { method: "POST", body: JSON.stringify({ producto, preparacion, personas }) })
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
// ÍCONOS SVG INLINE
// ─────────────────────────────────────────────
const IconRegion = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const IconOcasion = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconPreparacion = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
  </svg>
)

const IconPersonas = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

const IconStar = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

// ─────────────────────────────────────────────
// ÍCONOS DECORATIVOS DE FONDO
// ─────────────────────────────────────────────
const DecoFork = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 2C10.45 2 10 2.45 10 3V8C10 9.86 11.28 11.43 13 11.87V21C13 21.55 13.45 22 14 22C14.55 22 15 21.55 15 21V11.87C16.72 11.43 18 9.86 18 8V3C18 2.45 17.55 2 17 2C16.45 2 16 2.45 16 3V8C16 8.55 15.55 9 15 9V3C15 2.45 14.55 2 14 2C13.45 2 13 2.45 13 3V9C12.45 9 12 8.55 12 8V3C12 2.45 11.55 2 11 2ZM6 2C5.45 2 5 2.45 5 3V10C5 11.66 6.34 13 8 13V21C8 21.55 8.45 22 9 22C9.55 22 10 21.55 10 21V13C11.66 13 13 11.66 13 10V3C13 2.45 12.55 2 12 2C11.45 2 11 2.45 11 3V10H9V3C9 2.45 8.55 2 8 2C7.45 2 7 2.45 7 3V10H6V3C6 2.45 5.55 2 5 2H6Z"/>
  </svg>
)

const DecoPot = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C4.45 11 4 11.45 4 12V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V12C20 11.45 19.55 11 19 11ZM17 8H7C6.45 8 6 8.45 6 9V11H18V9C18 8.45 17.55 8 17 8ZM15 6H9V8H15V6ZM22 12H21V19H22C22.55 19 23 18.55 23 18V13C23 12.45 22.55 12 22 12ZM2 12H1C0.45 12 0 12.45 0 13V18C0 18.55 0.45 19 1 19H2V12Z"/>
  </svg>
)

const DecoChicken = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M52 20c-2-6-8-10-14-10-2 0-4 .4-5.8 1.2C30 8 26 6 22 6c-6 0-10 4-10 10 0 4 2 8 6 10l-6 18h28l-2-8c4-2 8-6 10-10 2 0 4-2 4-6z"/>
  </svg>
)

const DecoCarrot = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.47 5.53C17.08 5.14 16.5 5 16 5.06L13 2.06C12.22 1.28 10.97 1.28 10.19 2.06L2.06 10.19C1.28 10.97 1.28 12.22 2.06 13L5.06 16C5 16.5 5.14 17.08 5.53 17.47L8.41 20.35C9.19 21.13 10.44 21.13 11.22 20.35L20.35 11.22C21.13 10.44 21.13 9.19 20.35 8.41L17.47 5.53ZM8.5 17L7 15.5L15.5 7L17 8.5L8.5 17Z"/>
  </svg>
)

const DecoFlame = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 .67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

const DecoKnife = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7H1v-2h15.03v2zm0-4H1v-2h15.03v2z"/>
  </svg>
)

const DecoChefHat = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.5 4.6C17.4 3 15.6 2 13.5 2c-1.5 0-2.9.6-3.9 1.5C8.7 2.6 7.3 2 5.8 2 3.2 2 1 4.2 1 6.8c0 1.9 1.1 3.6 2.8 4.4V19c0 .55.45 1 1 1h14.4c.55 0 1-.45 1-1v-7.8C22 10.4 23 8.7 23 6.8c0-2.6-2.2-4.8-4.5-4.2zM15 17H9v-2h6v2zm0-4H9v-2h6v2z"/>
  </svg>
)

const DecoPlate = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
  </svg>
)

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function RecomendadorFriko() {
  // ── Estado del catálogo (cargado desde public/) ──
  const [catalogo, setCatalogo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  useEffect(() => {
    fetch('/catalogo_friko_limpio.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCatalogo(data.map(normalizarProducto))
        setCargando(false)
      })
      .catch((err) => {
        setErrorCarga(`No se pudo cargar el catálogo (${err.message}). Verifica que catalogo_friko_limpio.json esté en public/.`)
        setCargando(false)
      })
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
  const [nota, setNota] = useState('')
  const [logoError, setLogoError] = useState(false)

  const handleGenerar = () => {
    setError('')
    setNota('')

    // Validación: al menos un filtro debe estar seleccionado
    if (!region && !ocasion && !preparacion && !personas) {
      setResultado(null)
      setReceta(null)
      setError('Selecciona al menos un criterio para generar una recomendación.')
      return
    }

    // Validación: número de personas debe ser válido y estar en rango
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
      setReceta(generarRecetaPlaceholder(producto))
      return
    }

    // === FALLBACK: si no hay resultado y hay filtro de personas, relajarlo ===
    if (personas) {
      const sinPersonas = filtrarCatalogo(catalogo, { region, ocasion, preparacion, personas: '' })

      if (sinPersonas.length > 0) {
        const producto = sinPersonas[0]
        setResultado(producto)
        setReceta(generarRecetaPlaceholder(producto))
        setNota(
          `No hay productos exactos para ${personas} persona${parseInt(personas) !== 1 ? 's' : ''} con esos criterios. ` +
          `Te recomendamos este producto que es para ${producto.Rango}.`
        )
        return
      }
    }

    // === SIN RESULTADOS incluso con fallback ===
    setResultado(null)
    setReceta(null)
    setError('No encontramos un producto que coincida con tus preferencias. Intenta con otras combinaciones.')
  }

  const handleReiniciar = () => {
    setRegion('')
    setOcasion('')
    setPreparacion('')
    setPersonas('')
    setResultado(null)
    setReceta(null)
    setError('')
    setNota('')
  }

  const marcaBadge = resultado?.Marca === 'FRIKO'
    ? 'bg-blue-400/20 text-blue-300'
    : 'bg-teal-400/20 text-teal-300'

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-16 px-4 relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(30,58,138,0.35) 0%, #050b1d 70%)',
        backgroundColor: '#050b1d',
      }}
    >
      {/* ── ÍCONOS DECORATIVOS DE FONDO ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <DecoFork      className="absolute top-[8%]  left-[4%]   w-14 h-14 text-white rotate-12"   style={{ opacity: 0.07 }} />
        <DecoPot       className="absolute top-[15%] right-[6%]  w-16 h-16 text-white -rotate-6"   style={{ opacity: 0.07 }} />
        <DecoChicken   className="absolute top-[40%] left-[3%]   w-12 h-12 text-white rotate-45"   style={{ opacity: 0.06 }} />
        <DecoCarrot    className="absolute top-[60%] right-[4%]  w-10 h-10 text-white -rotate-12"  style={{ opacity: 0.07 }} />
        <DecoFlame     className="absolute top-[75%] left-[8%]   w-12 h-12 text-white rotate-6"    style={{ opacity: 0.07 }} />
        <DecoKnife     className="absolute top-[25%] right-[10%] w-10 h-10 text-white rotate-[30deg]" style={{ opacity: 0.06 }} />
        <DecoChefHat   className="absolute bottom-[12%] right-[7%]  w-14 h-14 text-white -rotate-12" style={{ opacity: 0.07 }} />
        <DecoPlate     className="absolute bottom-[20%] left-[5%]  w-10 h-10 text-white rotate-[20deg]" style={{ opacity: 0.06 }} />
      </div>

      {/* ── GLASS CARD ── */}
      <main
        className="relative w-full flex flex-col gap-6 pt-14 pb-8 px-8 rounded-[2.5rem] border border-white/20 shadow-2xl"
        style={{
          maxWidth: '860px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          backgroundColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ── LOGO SOBRESALIENTE ── */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div
            className="rounded-full p-2 shadow-xl flex items-center justify-center"
            style={{ backgroundColor: '#ffffff', border: '4px solid #050b1d' }}
          >
            {!logoError ? (
              <img
                src="/logo-friko.png"
                alt="Logo Friko"
                className="h-16 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFC600' }}
              >
                <span className="text-3xl font-black" style={{ color: '#C41E24' }}>F</span>
              </div>
            )}
          </div>
        </div>

        {/* ── HEADER ── */}
        <header className="flex flex-col items-center gap-1 mt-2">
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">
            Recomendador Friko
          </h1>
          <p className="text-blue-300 text-sm font-light tracking-wide">
            Tu receta perfecta con productos Friko
          </p>
        </header>

        {/* ── ESTADO DE CARGA DEL CATÁLOGO ── */}
        {cargando && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm" style={{ color: 'rgba(147,197,253,0.6)' }}>
            <svg className="animate-spin w-4 h-4 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Cargando catálogo...
          </div>
        )}
        {errorCarga && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium text-orange-300 border border-orange-400/30" style={{ backgroundColor: 'rgba(249,115,22,0.15)' }}>
            {errorCarga}
          </div>
        )}

        {/* ── SELECTORES 2×2 ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Región */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <IconRegion /> Región
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={cargando}
              className="rounded-xl p-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <option value="" className="bg-slate-900">Todas las regiones</option>
              {regiones.map((r) => <option key={r} className="bg-slate-900">{r}</option>)}
            </select>
          </div>

          {/* Ocasión */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <IconOcasion /> Ocasión
            </label>
            <select
              value={ocasion}
              onChange={(e) => setOcasion(e.target.value)}
              className="rounded-xl p-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <option value="" className="bg-slate-900">Cualquier ocasión</option>
              <option className="bg-slate-900">Hogar</option>
              <option className="bg-slate-900">Evento</option>
            </select>
          </div>

          {/* Preparación */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <IconPreparacion /> Preparación
            </label>
            <select
              value={preparacion}
              onChange={(e) => setPreparacion(e.target.value)}
              disabled={cargando}
              className="rounded-xl p-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <option value="" className="bg-slate-900">Cualquier método</option>
              {metodos.map((m) => <option key={m} className="bg-slate-900">{m}</option>)}
            </select>
          </div>

          {/* Personas */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <IconPersonas /> Personas
            </label>
            <input
              type="number"
              min="1"
              max="50"
              placeholder="¿Cuántas personas?"
              value={personas}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 50)) {
                  setPersonas(val)
                }
              }}
              className="rounded-xl p-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all placeholder:text-blue-300/40"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>

        {/* ── BOTONES ── */}
        <div className="flex justify-center gap-4">
          {/* Botón Generar — efecto 3D neobrutalismo rojo */}
          <button
            onClick={handleGenerar}
            disabled={cargando || !!errorCarga}
            className="px-8 py-3 rounded-2xl text-white font-bold text-sm uppercase tracking-wider transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            style={{
              backgroundColor: '#C41E24',
              boxShadow: '0 6px 0 rgb(153,27,27)',
            }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.boxShadow = '0 4px 0 rgb(153,27,27)'; e.currentTarget.style.transform = 'translateY(2px)' }}}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 0 rgb(153,27,27)'; e.currentTarget.style.transform = 'translateY(0)' }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(6px)' }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 6px 0 rgb(153,27,27)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Generar
          </button>

          {/* Botón Reiniciar — efecto 3D neobrutalismo amarillo */}
          <button
            onClick={handleReiniciar}
            className="px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-150"
            style={{
              backgroundColor: '#FFC600',
              color: '#1a1a1a',
              boxShadow: '0 6px 0 rgb(180,140,0)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 0 rgb(180,140,0)'; e.currentTarget.style.transform = 'translateY(2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 0 rgb(180,140,0)'; e.currentTarget.style.transform = 'translateY(0)' }}
            onMouseDown={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(6px)' }}
            onMouseUp={e => { e.currentTarget.style.boxShadow = '0 6px 0 rgb(180,140,0)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Reiniciar
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-300 border border-red-400/30" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}

        {/* ── NOTA DE AJUSTE (cuando se relajó el filtro de personas) ── */}
        {nota && (
          <div className="rounded-xl px-4 py-3 text-sm text-amber-200 border border-amber-400/30" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
            💡 {nota}
          </div>
        )}

        {/* ── ZONA DE RESULTADOS — siempre visible ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* ─── IZQUIERDA: PRODUCTO ─── */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-3 border transition-all"
            style={{
              minHeight: '280px',
              backgroundColor: resultado ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              borderColor: resultado ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)',
              backdropFilter: resultado ? 'blur(8px)' : undefined,
              borderStyle: resultado ? 'solid' : 'dashed',
            }}
          >
            {resultado ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(147,197,253,0.8)' }}>
                  Producto recomendado
                </span>

                <div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">
                    {resultado.Producto}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(191,219,254,0.75)' }}>
                    {resultado.Descripcion}
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-sm" style={{ color: 'rgba(191,219,254,0.7)' }}>
                  <span>
                    <span className="font-semibold text-blue-200">Presentación:</span>{' '}
                    {resultado.Presentacion}
                  </span>
                  <span>
                    <span className="font-semibold text-blue-200">Categoría:</span>{' '}
                    {resultado.Categoria}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-semibold text-blue-200">SKU:</span>
                    <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(147,197,253,0.9)' }}>
                      {resultado.SKU}
                    </code>
                  </span>
                </div>

                {/* Badges preparación */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {resultado.Preparacion.map((m) => (
                    <span
                      key={m}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-amber-300"
                      style={{ backgroundColor: 'rgba(251,191,36,0.18)' }}
                    >
                      {m}
                    </span>
                  ))}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${marcaBadge}`}>
                    {resultado.Marca}
                  </span>
                </div>

                <div className="text-xs mt-auto pt-2 border-t" style={{ color: 'rgba(147,197,253,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  Región: <span className="font-medium text-blue-300">{resultado.Region}</span>
                  {' · '}
                  {resultado.Rango}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ minHeight: '240px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <path d="M16.5 9.4 7.55 4.24"/>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.29 7 12 12 20.71 7"/>
                  <line x1="12" x2="12" y1="22" y2="12"/>
                </svg>
                <span className="text-xs font-medium" style={{ color: 'rgba(147,197,253,0.55)' }}>
                  Producto recomendado
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  Aparecerá aquí al generar
                </span>
              </div>
            )}
          </div>

          {/* ─── DERECHA: RECETA ─── */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-3 border transition-all"
            style={{
              minHeight: '280px',
              backgroundColor: receta ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              borderColor: receta ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)',
              backdropFilter: receta ? 'blur(8px)' : undefined,
              borderStyle: receta ? 'solid' : 'dashed',
            }}
          >
            {resultado && receta ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(147,197,253,0.8)' }}>
                    Receta sugerida
                  </span>
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-300"
                    style={{ backgroundColor: 'rgba(52,211,153,0.18)' }}
                  >
                    <IconStar />
                    Generado por IA
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-white leading-tight">
                  {receta.nombre}
                </h2>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(147,197,253,0.7)' }}>
                    Ingredientes
                  </p>
                  <ul className="space-y-1">
                    {receta.ingredientes.map((ing, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm" style={{ color: 'rgba(191,219,254,0.8)' }}>
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400"
                        />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(147,197,253,0.7)' }}>
                    Preparación
                  </p>
                  <ol className="space-y-1.5">
                    {receta.pasos.map((paso, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(191,219,254,0.8)' }}>
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                          style={{ backgroundColor: '#C41E24' }}
                        >
                          {i + 1}
                        </span>
                        {paso}
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ minHeight: '240px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                  <line x1="6" y1="17" x2="18" y2="17"/>
                </svg>
                <span className="text-xs font-medium" style={{ color: 'rgba(147,197,253,0.55)' }}>
                  Receta sugerida
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  Aparecerá aquí al generar
                </span>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-6 text-xs font-light tracking-widest text-center" style={{ color: 'rgba(96,165,250,0.4)' }}>
        Reto 12 · Grupo 5 · NODO EAFIT × Friko
      </footer>
    </div>
  )
}
