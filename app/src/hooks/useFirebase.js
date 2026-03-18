import { useState, useEffect } from 'react';
import useStore from '../stores/useStore';
import { db } from '../services/firebase-config';
import {
    carregarFichaDoFirebase,
    iniciarListenerPersonagens,
    iniciarListenerFeed
} from '../services/firebase-sync';

/**
 * Hook que gerencia a conexão com Firebase:
 * - Carrega a ficha do personagem ao montar
 * - Escuta mudanças em /personagens
 * - Escuta novas entradas no feed de combate
 * - Limpa listeners ao desmontar
 *
 * @returns {{ loading: boolean }}
 */
export default function useFirebase() {
    const [loading, setLoading] = useState(true);

    const meuNome = useStore((s) => s.meuNome);
    const carregarDadosFicha = useStore((s) => s.carregarDadosFicha);
    const setPersonagens = useStore((s) => s.setPersonagens);
    const addFeedEntry = useStore((s) => s.addFeedEntry);

    useEffect(() => {
        let unsubPersonagens = () => {};
        let unsubFeed = () => {};
        let cancelled = false;

        async function init() {
            // Load character sheet from Firebase if available
            if (meuNome && db) {
                try {
                    const dados = await carregarFichaDoFirebase(meuNome);
                    if (!cancelled && dados) {
                        carregarDadosFicha(dados);
                    }
                } catch (err) {
                    console.error('[useFirebase] Erro ao carregar ficha:', err);
                }
            }

            if (!cancelled) {
                setLoading(false);
            }

            // Set up personagens listener
            unsubPersonagens = iniciarListenerPersonagens((personagens) => {
                if (!cancelled) {
                    setPersonagens(personagens);
                }
            });

            // Set up feed listener
            unsubFeed = iniciarListenerFeed((entry) => {
                if (!cancelled) {
                    addFeedEntry(entry);
                }
            });
        }

        init();

        return () => {
            cancelled = true;
            unsubPersonagens();
            unsubFeed();
        };
    }, [meuNome, carregarDadosFicha, setPersonagens, addFeedEntry]);

    return { loading };
}
