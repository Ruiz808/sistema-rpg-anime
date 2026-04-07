import React, { useEffect } from 'react'
import useTemaStore from '../../stores/useTemaStore'
import { iniciarListenerTemasCustom } from '../../services/firebase-sync'

/**
 * Provider para o sistema de temas
 * Inicia o tema na montagem e escuta mudanças no Firebase
 */
export default function TemaProvider({ children }) {
  const { iniciarTema, setTemasCustom } = useTemaStore()

  useEffect(() => {
    // Inicia o tema salvo na inicialização
    iniciarTema()

    // Se tivermos Firebase, escuta temas custom
    const unsubscribe = iniciarListenerTemasCustom((temas) => {
      setTemasCustom(temas)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [iniciarTema, setTemasCustom])

  return <>{children}</>
}
