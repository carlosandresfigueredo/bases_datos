'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Send, 
  Database, 
  BookOpen, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Code, 
  Table, 
  Info,
  Check,
  RefreshCw,
  Key,
  FileDown,
  History,
  Settings,
  X,
  ChevronDown
} from 'lucide-react';
import SQLEditor from '@/components/SQLEditor';
import ResultsTable from '@/components/ResultsTable';

// Metadatos para el Explorador de Esquemas Interactivo
const schemaMetadata = {
  1: [
    {
      name: 'aprendices',
      columns: [
        { name: 'id', type: 'INTEGER', isPk: true },
        { name: 'nombre', type: 'TEXT' },
        { name: 'apellido', type: 'TEXT' },
        { name: 'ficha', type: 'TEXT' },
        { name: 'promedio', type: 'REAL' }
      ]
    }
  ],
  2: [
    {
      name: 'inventario',
      columns: [
        { name: 'id', type: 'INTEGER', isPk: true },
        { name: 'nombre', type: 'TEXT' },
        { name: 'categoria', type: 'TEXT' },
        { name: 'estado', type: 'TEXT' },
        { name: 'valor_estimado', type: 'REAL' }
      ]
    }
  ],
  3: [
    {
      name: 'instructores',
      columns: [
        { name: 'id', type: 'INTEGER', isPk: true },
        { name: 'nombre', type: 'TEXT' },
        { name: 'apellido', type: 'TEXT' },
        { name: 'especialidad', type: 'TEXT' }
      ]
    },
    {
      name: 'fichas',
      columns: [
        { name: 'codigo', type: 'TEXT', isPk: true },
        { name: 'programa', type: 'TEXT' },
        { name: 'instructor_id', type: 'INTEGER', isFk: true, fkRef: 'instructores(id)' },
        { name: 'horas_semanales', type: 'INTEGER' }
      ]
    }
  ],
  4: [
    {
      name: 'inventario',
      columns: [
        { name: 'id', type: 'INTEGER', isPk: true },
        { name: 'nombre', type: 'TEXT' },
        { name: 'categoria', type: 'TEXT' },
        { name: 'estado', type: 'TEXT' },
        { name: 'valor_estimado', type: 'REAL' }
      ]
    }
  ],
  5: [
    {
      name: 'instructores',
      columns: [
        { name: 'id', type: 'INTEGER', isPk: true },
        { name: 'nombre', type: 'TEXT' },
        { name: 'apellido', type: 'TEXT' },
        { name: 'especialidad', type: 'TEXT' }
      ]
    },
    {
      name: 'fichas',
      columns: [
        { name: 'codigo', type: 'TEXT', isPk: true },
        { name: 'programa', type: 'TEXT' },
        { name: 'instructor_id', type: 'INTEGER', isFk: true, fkRef: 'instructores(id)' },
        { name: 'horas_semanales', type: 'INTEGER' }
      ]
    }
  ],
  6: [
    {
      name: 'prestamos',
      columns: [
        { name: 'id', type: 'INTEGER', isPk: true },
        { name: 'aprendiz', type: 'TEXT' },
        { name: 'equipo', type: 'TEXT' },
        { name: 'fecha_prestamo', type: 'TEXT' },
        { name: 'fecha_devolucion', type: 'TEXT' }
      ]
    }
  ]
};

export default function Home() {
  const [exercises, setExercises] = useState([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [clientApiKey, setClientApiKey] = useState('');
  
  // Claves temporales para el modal
  const [tempKey, setTempKey] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('instructions'); // 'instructions' o 'schema'
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(''); // 'run' o 'submit'
  
  // Estados de resultado
  const [evalResult, setEvalResult] = useState(null);
  const [activeTab, setActiveTab] = useState('resultados'); // 'resultados', 'comparativa', 'tutor'
  const [errorMsg, setErrorMsg] = useState('');

  // Historial de Consultas
  const [queryHistory, setQueryHistory] = useState({});
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  // Animación de Celebración
  const [showConfetti, setShowConfetti] = useState(false);

  // 1. Cargar ejercicios e inicializar claves
  const loadExercises = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/exercises');
      const data = await res.json();
      if (data.exercises) {
        setExercises(data.exercises);
        setHasApiKey(data.hasApiKey);
        if (data.exercises.length > 0) {
          const firstEx = data.exercises[0];
          setSelectedExercise(firstEx);
          
          // Cargar borrador de consulta si existe en localStorage
          const draft = localStorage.getItem(`sql_draft_${firstEx.id}`);
          if (draft) {
            setQuery(draft);
          } else {
            setQuery(`-- Escribe tu consulta SQL para el ejercicio ${firstEx.id}\nSELECT * FROM ...`);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar ejercicios:', err);
      setErrorMsg('No se pudieron cargar los ejercicios. Intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();

    // Cargar clave API local
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setClientApiKey(savedKey);
      setTempKey(savedKey);
    }

    // Cargar historial de consultas
    const savedHistory = localStorage.getItem('sql_query_history');
    if (savedHistory) {
      try {
        setQueryHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Guardar borrador automáticamente al cambiar la consulta
  useEffect(() => {
    if (selectedExercise && query) {
      localStorage.setItem(`sql_draft_${selectedExercise.id}`, query);
    }
  }, [query, selectedExercise]);

  // 2. Guardar/Eliminar clave API del cliente
  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempKey);
    setClientApiKey(tempKey);
    setIsKeyModalOpen(false);
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setClientApiKey('');
    setTempKey('');
    setIsKeyModalOpen(false);
  };

  // 3. Cambiar de ejercicio seleccionado
  const selectExercise = (exercise) => {
    setSelectedExercise(exercise);
    setActiveLeftTab('instructions');
    
    const draft = localStorage.getItem(`sql_draft_${exercise.id}`);
    if (draft) {
      setQuery(draft);
    } else {
      setQuery(`-- Escribe tu consulta SQL para el ejercicio ${exercise.id}\nSELECT * FROM ...`);
    }
    
    setEvalResult(null);
    setActiveTab('resultados');
    setErrorMsg('');
    setShowHistoryDropdown(false);
  };

  // 4. Agregar consulta al historial
  const addQueryToHistory = (exerciseId, sql) => {
    if (!sql || sql.trim().startsWith('--') || sql.trim().length === 0) return;
    const currentHistory = { ...queryHistory };
    const list = currentHistory[exerciseId] || [];
    
    // Evitar duplicados consecutivos
    if (list.length > 0 && list[0].sql === sql) return;

    const newItem = {
      sql,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    currentHistory[exerciseId] = [newItem, ...list].slice(0, 5); // Mantener últimas 5
    setQueryHistory(currentHistory);
    localStorage.setItem('sql_query_history', JSON.stringify(currentHistory));
  };

  // 5. Ejecutar consulta (Solo prueba rápida)
  const handleRunQuery = async () => {
    if (!selectedExercise) return;
    setLoading(true);
    setActionType('run');
    setEvalResult(null);
    setErrorMsg('');
    setShowHistoryDropdown(false);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (clientApiKey) {
        headers['x-gemini-key'] = clientApiKey;
      }

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          exerciseId: selectedExercise.id,
          runOnly: true
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setEvalResult({
          runOnly: true,
          datosEstudiante: data.datosEstudiante,
          errorSQL: data.errorSQL
        });
        setActiveTab('resultados');
        if (data.datosEstudiante && !data.errorSQL) {
          addQueryToHistory(selectedExercise.id, query);
        }
      } else {
        setErrorMsg(data.error || 'Error al ejecutar la consulta.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Previsualizar contenido de una tabla desde el explorador
  const handlePreviewTable = async (tableName) => {
    setLoading(true);
    setActionType('run');
    setEvalResult(null);
    setErrorMsg('');
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT * FROM ${tableName} LIMIT 5;`,
          exerciseId: selectedExercise.id,
          runOnly: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setEvalResult({
          runOnly: true,
          datosEstudiante: data.datosEstudiante,
          isDDL: data.isDDL,
          ddlMessage: data.ddlMessage,
          rowsModified: data.rowsModified,
          mysqlAdapted: data.mysqlAdapted,
          errorSQL: data.errorSQL
        });
        setActiveTab('resultados');
      } else {
        setErrorMsg(data.error || 'Error al obtener la vista previa.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Enviar consulta para calificación y feedback
  const handleSubmitQuery = async () => {
    if (!selectedExercise) return;
    setLoading(true);
    setActionType('submit');
    setEvalResult(null);
    setErrorMsg('');
    setShowHistoryDropdown(false);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (clientApiKey) {
        headers['x-gemini-key'] = clientApiKey;
      }

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          exerciseId: selectedExercise.id,
          runOnly: false
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setEvalResult({
          runOnly: false,
          correcto: data.correcto,
          score: data.score,
          datosEstudiante: data.datosEstudiante,
          datosEsperados: data.datosEsperados,
          isDDL: data.isDDL,
          ddlMessage: data.ddlMessage,
          rowsModified: data.rowsModified,
          mysqlAdapted: data.mysqlAdapted,
          errorSQL: data.errorSQL,
          feedback: data.feedback
        });
        
        // Agregar al historial
        addQueryToHistory(selectedExercise.id, query);

        // Desencadenar animación de confeti si es correcto con 100 puntos
        if (data.correcto && data.score === 100) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
        }
        
        // Direccionar pestaña
        if (data.correcto) {
          setActiveTab('resultados');
        } else {
          setActiveTab('tutor'); // Feedback automático si falla
        }
      } else {
        setErrorMsg(data.error || 'Error al evaluar la consulta.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al evaluar la consulta.');
    } finally {
      setLoading(false);
    }
  };

  // 8. Exportadores de datos
  const exportCSV = () => {
    const rows = evalResult?.datosEstudiante;
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).map(v => {
      const str = String(v === null || v === undefined ? '' : v);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resultados_ejercicio_${selectedExercise.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const rows = evalResult?.datosEstudiante;
    if (!rows || rows.length === 0) return;
    const jsonString = JSON.stringify(rows, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resultados_ejercicio_${selectedExercise.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isTutorIAActive = hasApiKey || !!clientApiKey;

  return (
    <div className="app-container">
      {/* Confetti Celebration */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 80 }).map((_, i) => {
            const style = {
              left: `${Math.random() * 100}vw`,
              backgroundColor: ['#10b981', '#3b82f6', '#fbbf24', '#f43f5e', '#a78bfa'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              transform: `scale(${0.5 + Math.random() * 0.8})`
            };
            return <div key={i} className="confetti-particle" style={style} />;
          })}
        </div>
      )}

      {/* Cabecera */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-sena">S</div>
          <span className="brand-text">SENA STEM SQL Sandbox</span>
          <span className="brand-tag">v1.0 (Beta)</span>
        </div>
        <div className="header-status">
          <div 
            className={`api-key-badge interactive ${isTutorIAActive ? 'configured' : ''}`}
            onClick={() => setIsKeyModalOpen(true)}
            title="Configurar Clave API de Gemini"
          >
            <Sparkles size={14} />
            <span>Tutor IA: {isTutorIAActive ? 'Activo' : 'Inactivo (Modo Local)'}</span>
            <Settings size={12} style={{ marginLeft: '0.3rem', opacity: 0.8 }} />
          </div>
          <button className="btn" onClick={loadExercises} title="Recargar Ejercicios">
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Espacio de trabajo principal */}
      <main className="workspace">
        {/* Barra Lateral: Lista de Ejercicios */}
        <aside className="sidebar">
          <h2 className="sidebar-title">Ejercicios Disponibles</h2>
          <div className="exercise-list">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => selectExercise(ex)}
                className={`exercise-card ${selectedExercise?.id === ex.id ? 'active' : ''}`}
              >
                <h3 className="exercise-card-title">{ex.title}</h3>
                <div className="exercise-card-meta">
                  <span className={`badge badge-${ex.difficulty.toLowerCase()}`}>
                    {ex.difficulty}
                  </span>
                  <span className="badge badge-category">{ex.category}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* IDE y Resultados */}
        {selectedExercise ? (
          <div className="ide-container">
            {/* Panel Izquierdo: Guía y Esquemas con Pestañas */}
            <section className="instruction-panel">
              <div className="panel-tabs">
                <button 
                  className={`panel-tab ${activeLeftTab === 'instructions' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab('instructions')}
                >
                  <BookOpen size={14} />
                  <span>Guía de Ejercicio</span>
                </button>
                <button 
                  className={`panel-tab ${activeLeftTab === 'schema' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab('schema')}
                >
                  <Database size={14} />
                  <span>Esquema de Tablas</span>
                </button>
              </div>

              {activeLeftTab === 'instructions' ? (
                <>
                  <div>
                    <h1 className="panel-title">{selectedExercise.title}</h1>
                    <div className="difficulty-row" style={{ marginTop: '0.5rem' }}>
                      <span className={`badge badge-${selectedExercise.difficulty.toLowerCase()}`}>
                        Dificultad: {selectedExercise.difficulty}
                      </span>
                      <span className="badge badge-category">Categoría: {selectedExercise.category}</span>
                    </div>
                  </div>

                  <hr style={{ borderColor: 'var(--border-color)' }} />

                  <div 
                    className="instruction-text"
                    dangerouslySetInnerHTML={{ __html: selectedExercise.description.replace(/\n/g, '<br/>') }}
                  />

                  <div className="schema-box">
                    <div className="schema-box-header">
                      <span className="schema-box-title">Esquema Relacional (Tablas)</span>
                      <Database size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <pre className="schema-content">{selectedExercise.schemaSQL}</pre>
                  </div>
                </>
              ) : (
                <div className="schema-explorer">
                  <h2 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                    Explorador de Tablas
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    A continuación se listan las tablas asignadas a este ejercicio. Haz clic en "Previsualizar" para inspeccionar sus primeras filas.
                  </p>
                  {(schemaMetadata[selectedExercise.id] || []).map((table) => (
                    <div key={table.name} className="schema-table-card">
                      <div className="schema-table-header">
                        <Database size={14} />
                        <span>{table.name}</span>
                      </div>
                      <div className="schema-table-columns">
                        {table.columns.map((col) => (
                          <div key={col.name} className="schema-col-row">
                            <span className="schema-col-name">
                              {col.name}
                              {col.isPk && <span className="key-icon pk-icon" title="Clave Primaria">PK</span>}
                              {col.isFk && <span className="key-icon fk-icon" title={`Clave Foránea: ref ${col.fkRef}`}>FK</span>}
                            </span>
                            <span className="schema-col-type">{col.type}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        className="seed-preview-btn"
                        onClick={() => handlePreviewTable(table.name)}
                        disabled={loading}
                      >
                        <Play size={10} style={{ fill: 'currentColor' }} />
                        <span>Previsualizar {table.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Panel de Editor y Consola */}
            <section className="editor-console-panel">
              {/* Editor */}
              <div className="editor-wrapper">
                <div className="editor-toolbar">
                  <div className="toolbar-title">
                    <Code size={14} />
                    <span>Consola de Consulta SQL</span>
                  </div>
                  <div className="actions-group">
                    {/* Historial de Consultas */}
                    <div className="history-group">
                      <button 
                        className="btn" 
                        onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                        title="Ver consultas anteriores en este ejercicio"
                        disabled={loading}
                      >
                        <History size={14} />
                        <span>Historial</span>
                        <ChevronDown size={12} />
                      </button>
                      
                      {showHistoryDropdown && (
                        <div className="history-dropdown">
                          <div className="history-header">
                            <span>Consultas Recientes</span>
                            <button 
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              onClick={() => setShowHistoryDropdown(false)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="history-list">
                            {(!queryHistory[selectedExercise.id] || queryHistory[selectedExercise.id].length === 0) ? (
                              <div className="history-empty">No hay consultas recientes</div>
                            ) : (
                              queryHistory[selectedExercise.id].map((item, index) => (
                                <button 
                                  key={index} 
                                  className="history-item"
                                  onClick={() => {
                                    setQuery(item.sql);
                                    setShowHistoryDropdown(false);
                                  }}
                                >
                                  <span className="history-item-sql" title={item.sql}>{item.sql}</span>
                                  <span className="history-item-time">{item.time}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      className="btn" 
                      onClick={handleRunQuery} 
                      disabled={loading || !query}
                      title="Ejecuta la consulta en el sandbox rápido sin enviar a calificar (Ctrl+Enter)"
                    >
                      <Play size={14} style={{ fill: 'currentColor' }} />
                      <span>Probar</span>
                    </button>
                    <button 
                      className="btn btn-success" 
                      onClick={handleSubmitQuery} 
                      disabled={loading || !query}
                      title="Califica tu consulta y recibe retroalimentación de la IA"
                    >
                      <Send size={14} />
                      <span>Calificar</span>
                    </button>
                  </div>
                </div>
                <div className="editor-container">
                  <SQLEditor 
                    value={query} 
                    onChange={setQuery} 
                    onRun={handleRunQuery}
                  />
                </div>
              </div>

              {/* Consola de Resultados */}
              <div className="console-panel">
                <div className="console-tabs">
                  <button 
                    onClick={() => setActiveTab('resultados')}
                    className={`console-tab ${activeTab === 'resultados' ? 'active' : ''}`}
                  >
                    <Table size={14} />
                    <span>Resultados</span>
                  </button>

                  {!evalResult?.runOnly && evalResult && (
                    <>
                      <button 
                        onClick={() => setActiveTab('comparativa')}
                        className={`console-tab ${activeTab === 'comparativa' ? 'active' : ''}`}
                      >
                        <Terminal size={14} />
                        <span>Respuesta Esperada</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('tutor')}
                        className={`console-tab ${evalResult.correcto ? 'success-tab' : 'error-tab'} ${activeTab === 'tutor' ? 'active' : ''}`}
                      >
                        <Sparkles size={14} />
                        <span>Tutor IA</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="console-content">
                  {/* Pantalla de Carga */}
                  {loading && (
                    <div className="loader-overlay">
                      <div className="spinner"></div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {actionType === 'run' ? 'Ejecutando en sandbox...' : 'Evaluando consulta con IA...'}
                      </span>
                    </div>
                  )}

                  {/* Mensajes de error general */}
                  {errorMsg && (
                    <div className="score-banner error">
                      <AlertTriangle size={18} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Pestaña: Resultados */}
                  {activeTab === 'resultados' && (
                    <>
                      {/* Puntaje de Calificación */}
                      {!evalResult?.runOnly && evalResult && (
                        <div className={`score-banner ${evalResult.correcto ? 'success' : 'partial'}`}>
                          {evalResult.correcto ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                          <div>
                            Calificación: <span className="score-number">{evalResult.score}/100</span> - {evalResult.correcto ? 'Aprobado' : 'Incorrecto'}
                          </div>
                        </div>
                      )}

                      {/* Error de SQL del Sandbox */}
                      {evalResult?.errorSQL && (
                        <div className="score-banner error" style={{ marginBottom: '1rem' }}>
                          <AlertTriangle size={18} />
                          <span>{evalResult.errorSQL}</span>
                        </div>
                      )}

                      {evalResult?.datosEstudiante && evalResult.datosEstudiante.length > 0 && (
                        <div className="results-toolbar">
                          <button className="btn-export" onClick={exportCSV} title="Exportar resultados a CSV">
                            <FileDown size={12} />
                            <span>Exportar CSV</span>
                          </button>
                          <button className="btn-export" onClick={exportJSON} title="Exportar resultados a JSON">
                            <FileDown size={12} />
                            <span>Exportar JSON</span>
                          </button>
                        </div>
                      )}

                      {/* Éxito DDL/DML: CREATE, INSERT, UPDATE, DELETE, DROP */}
                      {evalResult && evalResult.isDDL && !evalResult.errorSQL && (
                        <div className="score-banner success" style={{ marginBottom: '1rem' }}>
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>Sentencia ejecutada correctamente</strong>
                            {evalResult.ddlMessage && (
                              <span style={{ marginLeft: '0.5rem', fontWeight: 400, opacity: 0.9 }}>
                                — {evalResult.ddlMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Nota de adaptación MySQL → SQLite */}
                      {evalResult?.mysqlAdapted && evalResult.mysqlAdapted.length > 0 && (
                        <div className="score-banner" style={{
                          background: 'rgba(251,191,36,0.12)',
                          border: '1px solid rgba(251,191,36,0.3)',
                          color: '#fbbf24',
                          marginBottom: '1rem'
                        }}>
                          <Info size={16} />
                          <div style={{ fontSize: '0.8rem' }}>
                            <strong>Adaptación automática MySQL → SQLite:</strong>{' '}
                            {evalResult.mysqlAdapted.map((s, i) => (
                              <code key={i} style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                marginRight: '4px'
                              }}>{s}</code>
                            ))}{' '}
                            fue(ron) ignorada(s) (no existen en SQLite).
                          </div>
                        </div>
                      )}

                      <ResultsTable rows={evalResult?.datosEstudiante} />
                    </>
                  )}

                  {/* Pestaña: Comparativa (Respuesta Esperada) */}
                  {activeTab === 'comparativa' && evalResult && !evalResult.runOnly && (
                    <>
                      <div className="score-banner success" style={{ marginBottom: '1rem' }}>
                        <Info size={18} />
                        <span>Esta es la salida correcta que debe retornar tu consulta SQL.</span>
                      </div>

                      {evalResult.datosEsperados && evalResult.datosEsperados.length > 0 && (
                        <div className="results-toolbar">
                          <button className="btn-export" onClick={() => {
                            const rows = evalResult.datosEsperados;
                            const headers = Object.keys(rows[0]).join(',');
                            const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${String(v === null || v === undefined ? '' : v).replace(/"/g, '""')}"`).join(','))].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute("download", `esperado_ejercicio_${selectedExercise.id}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }} title="Exportar respuesta esperada a CSV">
                            <FileDown size={12} />
                            <span>Exportar CSV</span>
                          </button>
                        </div>
                      )}

                      <ResultsTable rows={evalResult.datosEsperados} />
                    </>
                  )}

                  {/* Pestaña: Tutor de IA */}
                  {activeTab === 'tutor' && evalResult && !evalResult.runOnly && (
                    <div className="ai-feedback-container">
                      <div className="ai-avatar">
                        <div className="ai-avatar-icon">IA</div>
                        <span>Tutor Inteligente de SQL (SENA STEM)</span>
                      </div>
                      <div className="ai-feedback-text">
                        {evalResult.feedback}
                      </div>
                    </div>
                  )}

                  {/* Estado Inicial vacío */}
                  {!evalResult && !loading && !errorMsg && (
                    <div className="empty-state">
                      <Terminal size={24} />
                      <p>Presiona "Probar" para ver la salida o "Calificar" para recibir evaluación del tutor.</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atajo: Ctrl + Enter en el editor para ejecutar rápidamente.</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="empty-state" style={{ height: '100%', gridColumn: 'span 2' }}>
            <div className="spinner"></div>
            <p>Cargando laboratorio SQL...</p>
          </div>
        )}
      </main>

      {/* Modal de Configuración de Clave API */}
      {isKeyModalOpen && (
        <div className="modal-overlay" onClick={() => setIsKeyModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Configurar Tutor de IA</h3>
              <button className="modal-close" onClick={() => setIsKeyModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Clave API de Gemini (Guardado Local)</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Pega tu clave API aquí (AIzaSy...)" 
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Tu clave se guarda únicamente en tu navegador (localStorage) y se envía en las cabeceras de tus peticiones para que el Tutor IA pueda darte retroalimentación cognitiva personalizada.
              </span>
            </div>
            <div className="modal-actions">
              {clientApiKey && (
                <button 
                  className="btn" 
                  style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }} 
                  onClick={handleRemoveApiKey}
                >
                  Eliminar Clave
                </button>
              )}
              <button className="btn" onClick={() => setIsKeyModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleSaveApiKey} disabled={!tempKey}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
