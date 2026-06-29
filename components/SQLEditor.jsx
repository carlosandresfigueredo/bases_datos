'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

/**
 * Componente SQLEditor que integra Monaco Editor para la escritura de consultas.
 * @param {string} value - El código actual en el editor.
 * @param {function} onChange - Callback disparado al editar el código.
 * @param {function} onRun - Callback disparado al ejecutar la consulta (atajo teclado).
 */
export default function SQLEditor({ value, onChange, onRun }) {
  
  // Agregar atajo de teclado Ctrl+Enter / Cmd+Enter para ejecutar la consulta
  const handleEditorDidMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) onRun();
    });
  };

  return (
    <Editor
      height="100%"
      language="sql"
      theme="vs-dark"
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', monospace, consolas",
        fontLigatures: true,
        automaticLayout: true,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        suggestOnTriggerCharacters: true,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        }
      }}
    />
  );
}
