import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Sky } from '@react-three/drei';
import * as THREE from 'three';

export default function Tabuleiro3D({ mapSize, tokens, moverJogador, altitudeAtual }) {
    // 🔥 ESTADOS DO ESCUDO DE CONTENÇÃO
    const [mapTexture, setMapTexture] = useState(null);
    const [statusMundo, setStatusMundo] = useState('carregando'); // 'carregando', 'sucesso' ou 'erro'

    // O Sistema carrega a imagem em segundo plano sem quebrar o site
    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.load(
            '/image_8875aa.png',
            (texture) => {
                // SUCESSO! A imagem foi encontrada.
                texture.anisotropy = 16;
                setMapTexture(texture);
                setStatusMundo('sucesso');
            },
            undefined, // Progresso (ignorado)
            (erro) => {
                // FALHA! A imagem não está na pasta ou o nome está errado.
                console.error("Erro arcano ao ler a imagem do mapa:", erro);
                setStatusMundo('erro');
            }
        );
    }, []);

    const displacementScale = 2.5; // Altura máxima do relevo das montanhas

    function handleChaoClick(e) {
        e.stopPropagation();
        const point = e.point;
        const gridX = Math.round(point.x);
        const gridY = Math.round(point.z); 
        moverJogador(gridX, gridY);
    };

    // 🛡️ PROTEÇÃO 1: Ecrã de Carregamento Seguro
    if (statusMundo === 'carregando') {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', border: '2px solid #0088ff' }}>
                <h2 style={{ color: '#00ffcc', textShadow: '0 0 10px #0088ff', animation: 'pulse 1.5s infinite' }}>
                    ⏳ A conjurar os relevos do mundo...
                </h2>
            </div>
        );
    }

    // 🛡️ PROTEÇÃO 2: Ecrã de Erro (Se o ficheiro não estiver no sítio certo)
    if (statusMundo === 'erro') {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#2a0000', border: '2px solid #ff003c', padding: '20px', textAlign: 'center' }}>
                <h2 style={{ color: '#ff003c', textShadow: '0 0 10px #ff0000' }}>❌ Falha na Invocação do Mapa</h2>
                <p style={{ color: '#fff', fontSize: '1.2em' }}>O sistema não conseguiu encontrar o ficheiro <strong>image_8875aa.png</strong></p>
                <div style={{ color: '#aaa', marginTop: '10px', background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px' }}>
                    <strong>Instruções para o Mestre:</strong><br/>
                    1. Certifique-se de que a imagem foi guardada dentro da pasta <strong>public</strong> do seu projeto (e não na pasta src).<br/>
                    2. Confirme se o nome do ficheiro está exato (sem espaços a mais).<br/>
                    3. Reinicie o servidor se necessário.
                </div>
            </div>
        );
    }

    // 🌍 SUCESSO: Renderizar o Mundo 3D
    return (
        <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
            <fog attach="fog" args={['#cfd8dc', 30, 100]} />
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.02} />

            {/* O CHÃO DE RELEVO */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow onClick={handleChaoClick}>
                {/* Geometria otimizada (128x128) para não derreter a placa gráfica */}
                <planeGeometry args={[1000, 1000, 128, 128]} />
                <meshStandardMaterial 
                    map={mapTexture} 
                    displacementMap={mapTexture} 
                    displacementScale={displacementScale} 
                    wireframe={false} 
                    metalness={0.1}
                    roughness={0.8}
                />
            </mesh>

            {/* A GRELHA TÁTICA NEON */}
            <Grid 
                args={[mapSize, mapSize]} 
                position={[0, displacementScale - 0.1, 0]} 
                cellSize={1} 
                cellThickness={1} 
                cellColor="#00ffcc" 
                sectionSize={5} 
                sectionThickness={1.5} 
                sectionColor="#0088ff" 
                fadeDistance={50} 
            />

            {/* OS JOGADORES (A flutuar sobre o relevo) */}
            {tokens.map((tk, i) => {
                const posX = tk.x;
                const posY = tk.z || 0; 
                const posZ = tk.y;      
                const adjustedAltitude = displacementScale + 0.5 + posY; 

                return (
                    <mesh key={i} position={[posX, adjustedAltitude, posZ]} castShadow>
                        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
                        <meshStandardMaterial color={tk.cor} opacity={0.9} transparent />
                        <Html position={[0, 1, 0]} center style={{ pointerEvents: 'none' }}>
                            <div style={{
                                background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px',
                                color: '#fff', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${tk.cor}`,
                                textShadow: '0 0 5px #000'
                            }}>
                                {tk.nome} {tk.z > 0 ? `☁️ ${tk.z}m` : ''}
                            </div>
                        </Html>
                    </mesh>
                );
            })}
        </Canvas>
    );
}