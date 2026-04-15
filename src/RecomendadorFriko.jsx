import { useState, useEffect } from 'react'
import { ChefHat, CookingPot, Utensils, Carrot, Fish, Beef, Cherry, Egg, Pizza, Soup, Wine, Wheat } from 'lucide-react'

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

// ─────────────────────────────────────────────
// ESTILOS REUTILIZABLES
// ─────────────────────────────────────────────
const selectStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  border: '1.5px solid #e2e8f0',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  color: '#0d1b6f',
  width: '100%',
  outline: 'none',
  transition: 'all 0.2s',
  cursor: 'pointer',
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#475569',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  marginBottom: '6px',
}

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

  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #1a2d6b 0%, #111f54 30%, #0c1842 60%, #070f30 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '5rem 1rem 3rem',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >

      {/* ── Íconos decorativos del fondo ── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        {/* Columna izquierda */}
        <ChefHat style={{ position:'absolute', top:'3%', left:'3%', opacity:0.07, transform:'rotate(-15deg)' }} size={44} color="white" strokeWidth={1} />
        <Soup style={{ position:'absolute', top:'12%', left:'8%', opacity:0.06, transform:'rotate(8deg)' }} size={38} color="white" strokeWidth={1} />
        <Carrot style={{ position:'absolute', top:'24%', left:'2%', opacity:0.07, transform:'rotate(25deg)' }} size={40} color="white" strokeWidth={1} />
        <Beef style={{ position:'absolute', top:'36%', left:'6%', opacity:0.06, transform:'rotate(-10deg)' }} size={42} color="white" strokeWidth={1} />
        <Wine style={{ position:'absolute', top:'48%', left:'3%', opacity:0.05, transform:'rotate(18deg)' }} size={36} color="white" strokeWidth={1} />
        <CookingPot style={{ position:'absolute', top:'60%', left:'7%', opacity:0.06, transform:'rotate(-5deg)' }} size={44} color="white" strokeWidth={1} />
        <Egg style={{ position:'absolute', top:'72%', left:'2%', opacity:0.07, transform:'rotate(12deg)' }} size={34} color="white" strokeWidth={1} />
        <Fish style={{ position:'absolute', top:'84%', left:'6%', opacity:0.06, transform:'rotate(-18deg)' }} size={40} color="white" strokeWidth={1} />
        {/* Columna derecha */}
        <Utensils style={{ position:'absolute', top:'5%', right:'4%', opacity:0.07, transform:'rotate(12deg)' }} size={42} color="white" strokeWidth={1} />
        <Pizza style={{ position:'absolute', top:'15%', right:'8%', opacity:0.06, transform:'rotate(-8deg)' }} size={38} color="white" strokeWidth={1} />
        <Cherry style={{ position:'absolute', top:'27%', right:'3%', opacity:0.07, transform:'rotate(20deg)' }} size={34} color="white" strokeWidth={1} />
        <Wheat style={{ position:'absolute', top:'39%', right:'7%', opacity:0.06, transform:'rotate(-12deg)' }} size={40} color="white" strokeWidth={1} />
        <ChefHat style={{ position:'absolute', top:'51%', right:'4%', opacity:0.05, transform:'rotate(6deg)' }} size={38} color="white" strokeWidth={1} />
        <Carrot style={{ position:'absolute', top:'63%', right:'8%', opacity:0.06, transform:'rotate(-22deg)' }} size={36} color="white" strokeWidth={1} />
        <Soup style={{ position:'absolute', top:'75%', right:'3%', opacity:0.07, transform:'rotate(10deg)' }} size={42} color="white" strokeWidth={1} />
        <Beef style={{ position:'absolute', top:'87%', right:'6%', opacity:0.06, transform:'rotate(-8deg)' }} size={38} color="white" strokeWidth={1} />
        {/* Columna central */}
        <CookingPot style={{ position:'absolute', top:'8%', left:'35%', opacity:0.04, transform:'rotate(-10deg)' }} size={36} color="white" strokeWidth={1} />
        <Fish style={{ position:'absolute', top:'18%', right:'30%', opacity:0.04, transform:'rotate(15deg)' }} size={34} color="white" strokeWidth={1} />
        <Wine style={{ position:'absolute', top:'45%', left:'25%', opacity:0.03, transform:'rotate(-8deg)' }} size={32} color="white" strokeWidth={1} />
        <Pizza style={{ position:'absolute', top:'55%', right:'25%', opacity:0.03, transform:'rotate(12deg)' }} size={34} color="white" strokeWidth={1} />
        <Egg style={{ position:'absolute', top:'70%', left:'30%', opacity:0.04, transform:'rotate(-15deg)' }} size={30} color="white" strokeWidth={1} />
        <Wheat style={{ position:'absolute', top:'80%', right:'35%', opacity:0.04, transform:'rotate(8deg)' }} size={32} color="white" strokeWidth={1} />
        <Utensils style={{ position:'absolute', top:'92%', left:'40%', opacity:0.03, transform:'rotate(-5deg)' }} size={34} color="white" strokeWidth={1} />
      </div>

      {/* ── Efecto de lucecitas en el fondo ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        {[...Array(15)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            filter: 'blur(1px)',
            top: `${5 + (i * 6.3) % 90}%`,
            left: `${3 + (i * 7.7) % 94}%`,
          }} />
        ))}
      </div>

      {/* ── GLASS CARD ── */}
      <main style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.42) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25), inset 0 2px 0 rgba(255, 255, 255, 0.7), inset 0 -2px 4px rgba(0, 0, 0, 0.06)',
        maxWidth: '900px',
        width: '100%',
        padding: '2rem 2rem 2rem',
        position: 'relative',
        marginTop: '1rem',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>

        {/* ── Logos Friko + Antillana ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '0',
        }}>
          <img
            src="/logo-friko-improved.png"
            alt="Logo Friko"
            style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <img
            src="/logo-antillana-improved.png"
            alt="Logo Antillana"
            style={{ height: '55px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        {/* ── TÍTULO Y SUBTÍTULO ── */}
        <div style={{ textAlign: 'center', marginTop: '0' }}>
          <h1 style={{
            color: '#0d1b6f',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '0.25rem',
            letterSpacing: '-0.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}>
            Recomendador de Recetas
          </h1>
          <p style={{
            color: '#3b4a6b',
            fontSize: '0.875rem',
            fontWeight: 300,
          }}>
            Tu receta perfecta con productos Friko y Antillana
          </p>
        </div>

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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

          {/* Región */}
          <div>
            <label style={{...labelStyle, color: '#4ade80'}}>
              <IconRegion color="#4ade80" /> Región
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={cargando}
              style={{ ...selectStyle, opacity: cargando ? 0.5 : 1 }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.2)'; e.currentTarget.style.borderColor = '#0d1b6f' }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              <option value="" style={{ background: '#ffffff', color: '#1e293b' }}>Todas las regiones</option>
              {regiones.map((r) => <option key={r} style={{ background: '#ffffff', color: '#1e293b' }}>{r}</option>)}
            </select>
          </div>

          {/* Ocasión */}
          <div>
            <label style={{...labelStyle, color: '#60a5fa'}}>
              <IconOcasion color="#60a5fa" /> Ocasión
            </label>
            <select
              value={ocasion}
              onChange={(e) => setOcasion(e.target.value)}
              style={selectStyle}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.2)'; e.currentTarget.style.borderColor = '#0d1b6f' }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              <option value="" style={{ background: '#ffffff', color: '#1e293b' }}>Cualquier ocasión</option>
              <option style={{ background: '#ffffff', color: '#1e293b' }}>Hogar</option>
              <option style={{ background: '#ffffff', color: '#1e293b' }}>Evento</option>
            </select>
          </div>

          {/* Preparación */}
          <div>
            <label style={{...labelStyle, color: '#f59e0b'}}>
              <IconPreparacion color="#f59e0b" /> Preparación
            </label>
            <select
              value={preparacion}
              onChange={(e) => setPreparacion(e.target.value)}
              disabled={cargando}
              style={{ ...selectStyle, opacity: cargando ? 0.5 : 1 }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.2)'; e.currentTarget.style.borderColor = '#0d1b6f' }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              <option value="" style={{ background: '#ffffff', color: '#1e293b' }}>Cualquier método</option>
              {metodos.map((m) => <option key={m} style={{ background: '#ffffff', color: '#1e293b' }}>{m}</option>)}
            </select>
          </div>

          {/* Personas */}
          <div>
            <label style={{...labelStyle, color: '#a78bfa'}}>
              <IconPersonas color="#a78bfa" /> Personas
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
              style={{
                ...selectStyle,
                color: personas ? '#0d1b6f' : '#7b8fa8',
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,27,111,0.2)'; e.currentTarget.style.borderColor = '#0d1b6f'; e.currentTarget.style.color = '#0d1b6f' }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            />
          </div>

        </div>

        {/* ── BOTONES ── */}
        <div style={{ display:'flex', justifyContent:'center', gap:'1rem' }}>

          {/* Botón Generar */}
          <button
            onClick={handleGenerar}
            disabled={cargando || !!errorCarga}
            style={{
              background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '0.85rem 2.5rem',
              borderRadius: '1rem',
              border: 'none',
              cursor: cargando || !!errorCarga ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 0 #991b1b, 0 8px 20px rgba(0,0,0,0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.15s ease',
              opacity: cargando || !!errorCarga ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.filter = 'brightness(1.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 0 #991b1b, 0 10px 25px rgba(0,0,0,0.35)'
              }
            }}
            onMouseDown={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(6px)'
              }
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
            Generar
          </button>

          {/* Botón Reiniciar */}
          <button
            onClick={handleReiniciar}
            style={{
              background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1e293b',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '0.85rem 2.5rem',
              borderRadius: '1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #b45309, 0 8px 20px rgba(0,0,0,0.3)',
              transform: 'translateY(0)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.08)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 0 #b45309, 0 10px 25px rgba(0,0,0,0.35)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(6px)'
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
            Reiniciar
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
        <div style={{
          border: '1.5px dashed rgba(13, 27, 111, 0.15)',
          borderRadius: '1.5rem',
          padding: '1rem',
        }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

          {/* ─── IZQUIERDA: PRODUCTO ─── */}
          {resultado ? (
            <div style={{
              background: 'rgba(255, 252, 245, 0.75)',
              border: '1.5px solid rgba(13, 27, 111, 0.1)',
              borderRadius: '1.25rem',
              padding: '1.25rem',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <span style={{ color:'#7c5a28', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px' }}>
                Producto recomendado
              </span>

              <div>
                <h2 style={{ color:'#1a2332', fontSize:'18px', fontWeight:800, lineHeight:1.3, margin:0 }}>
                  {resultado.Producto}
                </h2>
                <p style={{ color:'#374151', fontSize:'14px', marginTop:'4px', marginBottom:0 }}>
                  {resultado.Descripcion}
                </p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'4px', fontSize:'13px' }}>
                <span>
                  <span style={{ color:'#5a6b7a', fontWeight:600 }}>Presentación:</span>
                  <span style={{ color:'#1a2332' }}>{resultado.Presentacion}</span>
                </span>
                <span>
                  <span style={{ color:'#5a6b7a', fontWeight:600 }}>Categoría:</span>
                  <span style={{ color:'#1a2332' }}>{resultado.Categoria}</span>
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ color:'#5a6b7a', fontWeight:600 }}>SKU:</span>
                  <code style={{ background:'rgba(255,255,255,0.8)', borderRadius:'4px', padding:'2px 6px', fontSize:'11px', fontFamily:'monospace', color:'#374151' }}>
                    {resultado.SKU}
                  </code>
                </span>
              </div>

              {/* Badges preparación + marca */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'4px' }}>
                {resultado.Preparacion.map((m) => (
                  <span key={m} style={{ background:'#FEF3C7', color:'#92400e', fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'9999px' }}>
                    {m}
                  </span>
                ))}
                {resultado.Marca === 'FRIKO' ? (
                  <span style={{ background:'#DBEAFE', color:'#1e40af', fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'9999px' }}>
                    FRIKO
                  </span>
                ) : (
                  <span style={{ background:'#CCFBF1', color:'#115e59', fontSize:'11px', fontWeight:600, padding:'3px 10px', borderRadius:'9999px', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                    <img src="/logo-antillana-improved.png" alt="Antillana" style={{ height:'14px', width:'auto', objectFit:'contain' }} onError={(e) => { e.currentTarget.style.display='none' }} />
                    ANTILLANA
                  </span>
                )}
              </div>

              {/* Footer región/rango */}
              <div style={{ marginTop:'auto', paddingTop:'10px', borderTop:'1px solid rgba(255,255,255,0.3)', color:'#5a6b7a', fontSize:'12px' }}>
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
              padding: '2rem',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #e8dcc8 0%, #d4c4a8 100%)',
                borderRadius: '1rem',
                padding: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}>
                <Beef size={48} color="#8b7355" strokeWidth={1.5} />
              </div>
              <span style={{ color: 'rgba(13, 27, 111, 0.45)', fontSize: '13px', fontWeight: 500 }}>Producto recomendado</span>
              <span style={{ color: 'rgba(13, 27, 111, 0.3)', fontSize: '11px' }}>Aparecerá aquí al generar</span>
            </div>
          )}

          {/* ─── DERECHA: RECETA ─── */}
          {resultado && receta ? (
            <div style={{
              background: 'rgba(255, 252, 245, 0.75)',
              border: '1.5px solid rgba(13, 27, 111, 0.1)',
              borderRadius: '1.25rem',
              padding: '1.25rem',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ color:'#7c5a28', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px' }}>
                  Receta sugerida
                </span>
                <span style={{ background:'#D1FAE5', color:'#065f46', fontSize:'10px', fontWeight:700, padding:'3px 10px', borderRadius:'9999px', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                  <IconStar /> Generado por IA
                </span>
              </div>

              <h2 style={{ color:'#1a2332', fontSize:'18px', fontWeight:800, lineHeight:1.3, margin:0 }}>
                {receta.nombre}
              </h2>

              <div>
                <p style={{ color:'#7c5a28', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', marginBottom:'8px', marginTop:0 }}>
                  Ingredientes
                </p>
                <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'4px' }}>
                  {receta.ingredientes.map((ing, i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px', color:'#374151' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fbbf24', flexShrink:0, marginTop:'5px' }} />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p style={{ color:'#7c5a28', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', marginBottom:'8px', marginTop:0 }}>
                  Preparación
                </p>
                <ol style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'8px' }}>
                  {receta.pasos.map((paso, i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px', color:'#374151' }}>
                      <span style={{ background:'#dc2626', color:'#fff', width:'20px', height:'20px', borderRadius:'50%', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
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
              padding: '2rem',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #dfe8f0 0%, #c8d4e0 100%)',
                borderRadius: '1rem',
                padding: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}>
                <ChefHat size={48} color="#5a7a96" strokeWidth={1.5} />
              </div>
              <span style={{ color: 'rgba(13, 27, 111, 0.45)', fontSize: '13px', fontWeight: 500 }}>Receta sugerida</span>
              <span style={{ color: 'rgba(13, 27, 111, 0.3)', fontSize: '11px' }}>Aparecerá aquí al generar</span>
            </div>
          )}

        </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: '0.75rem',
        fontWeight: 300,
        letterSpacing: '2px',
        textAlign: 'center',
        marginTop: '1.5rem',
        zIndex: 1,
        position: 'relative',
      }}>
        Reto 12 · Grupo 5 · NODO EAFIT × Friko
      </footer>

    </div>
  )
}
