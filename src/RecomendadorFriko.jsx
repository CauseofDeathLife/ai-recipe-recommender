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

const IconChef = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
    <line x1="6" y1="17" x2="18" y2="17"/>
  </svg>
)

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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

  const marcaColor = resultado?.Marca === 'FRIKO'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-teal-100 text-teal-800'

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #1B0B5E 0%, #130845 40%, #1B0B5E 100%)' }}
    >
      {/* ── HEADER ── */}
      <header className="flex flex-col items-center mb-6 gap-3">
        {/* Logo — carga desde public/logo-friko.png, fallback círculo amarillo */}
        <div className="flex items-center justify-center" style={{ height: '90px' }}>
          {!logoError ? (
            <img
              src="/logo-friko.png"
              alt="Logo Friko"
              style={{ width: '140px', objectFit: 'contain' }}
              className="drop-shadow-lg"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#FFC600' }}
            >
              <span className="text-3xl font-black" style={{ color: '#C41E24' }}>F</span>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Recomendador Friko
        </h1>
        <p className="text-blue-200 text-sm font-light tracking-wide">
          Tu receta perfecta con productos Friko
        </p>
      </header>

      {/* ── PANEL BLANCO ── */}
      <main
        className="bg-white rounded-2xl shadow-2xl w-full px-6 py-7 flex flex-col gap-6"
        style={{ maxWidth: '820px' }}
      >

        {/* ── ESTADO DE CARGA DEL CATÁLOGO ── */}
        {cargando && (
          <div className="flex items-center justify-center gap-2 py-4 text-gray-400 text-sm">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Cargando catálogo...
          </div>
        )}
        {errorCarga && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 font-medium">
            {errorCarga}
          </div>
        )}

        {/* ── SELECTORES 2×2 ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Región */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-900">
              <IconRegion /> Región
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={cargando}
              className="border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent bg-indigo-50 hover:bg-indigo-100/50 transition-colors disabled:opacity-50"
            >
              <option value="">Todas las regiones</option>
              {regiones.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Ocasión */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-900">
              <IconOcasion /> Ocasión
            </label>
            <select
              value={ocasion}
              onChange={(e) => setOcasion(e.target.value)}
              className="border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent bg-indigo-50 hover:bg-indigo-100/50 transition-colors"
            >
              <option value="">Cualquier ocasión</option>
              <option>Hogar</option>
              <option>Evento</option>
            </select>
          </div>

          {/* Preparación */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-900">
              <IconPreparacion /> Preparación
            </label>
            <select
              value={preparacion}
              onChange={(e) => setPreparacion(e.target.value)}
              disabled={cargando}
              className="border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent bg-indigo-50 hover:bg-indigo-100/50 transition-colors disabled:opacity-50"
            >
              <option value="">Cualquier método</option>
              {metodos.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Personas */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-900">
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
              className="border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent bg-indigo-50 hover:bg-indigo-100/50 transition-colors"
            />
          </div>
        </div>

        {/* ── BOTONES ── */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleGenerar}
            disabled={cargando || !!errorCarga}
            className="px-10 py-3 rounded-xl text-white font-bold text-sm tracking-wide shadow-md hover:brightness-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#C41E24' }}
          >
            Generar
          </button>
          <button
            onClick={handleReiniciar}
            className="px-10 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all hover:brightness-90"
            style={{ backgroundColor: '#FFC600', color: '#1B0B5E' }}
          >
            Reiniciar
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* ── NOTA DE AJUSTE (cuando se relajó el filtro de personas) ── */}
        {nota && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              backgroundColor: '#FFF8E1',
              color: '#92400E',
              border: '1px solid rgba(255, 198, 0, 0.4)',
            }}
          >
            💡 {nota}
          </div>
        )}

        {/* ── ZONA DE RESULTADOS ── */}
        {!resultado && !error && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-300">
            <IconChef />
            <p className="text-sm font-medium text-gray-400 text-center">
              Selecciona tus preferencias y presiona <span className="font-bold" style={{ color: '#C41E24' }}>Generar</span>
            </p>
          </div>
        )}

        {resultado && receta && (
          <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">

            {/* ─── IZQUIERDA: PRODUCTO ─── */}
            <div className="p-5 flex flex-col gap-3 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Producto recomendado
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-gray-800 leading-tight">
                  {resultado.Producto}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{resultado.Descripcion}</p>
              </div>

              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <span>
                  <span className="font-semibold text-gray-700">Presentación:</span>{' '}
                  {resultado.Presentacion}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">Categoría:</span>{' '}
                  {resultado.Categoria}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">SKU:</span>{' '}
                  <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded font-mono">
                    {resultado.SKU}
                  </code>
                </span>
              </div>

              {/* Badges preparación */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {resultado.Preparacion.map((m) => (
                  <span
                    key={m}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                  >
                    {m}
                  </span>
                ))}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${marcaColor}`}>
                  {resultado.Marca}
                </span>
              </div>

              <div className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
                Región: <span className="font-medium text-gray-600">{resultado.Region}</span>
                {' · '}
                {resultado.Rango}
              </div>
            </div>

            {/* ─── DERECHA: RECETA ─── */}
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Receta sugerida
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#FFF8E1', color: '#92400E', border: '1px solid rgba(255,198,0,0.4)' }}
                >
                  <IconStar />
                  Generado por IA
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-gray-800 leading-tight">
                {receta.nombre}
              </h2>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Ingredientes
                </p>
                <ul className="space-y-1">
                  {receta.ingredientes.map((ing, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#FFC600' }}
                      />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Preparación
                </p>
                <ol className="space-y-1.5">
                  {receta.pasos.map((paso, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
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
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-6 text-blue-300/60 text-xs font-light tracking-widest">
        Reto 12 · Grupo 5 · NODO EAFIT × Friko
      </footer>
    </div>
  )
}
