import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Sky } from '@react-three/drei';

export default function Tabuleiro3D({ mapSize, tokens, moverJogador, altitudeAtual }) {
    const handleChaoClick = (e) => {
        e.stopPropagation();
        const point = e.point;
        // O Three.js usa X, Y e Z. No nosso RPG:
        // X é a largura, Z é a profundidade (o nosso Y do 2D), e Y é a altura (a nossa Altitude)
        const gridX = Math.round(point.x);
        const gridY = Math.round(point.z); 
        
        moverJogador(gridX, gridY);
    };

    return (
        <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
            {/* O CÉU E A LUZ */}
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

            {/* CONTROLO DE CÂMARA (Permite rodar o mapa com o rato) */}
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />

            {/* O CHÃO E A GRELHA TÁTICA */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow onClick={handleChaoClick}>
                <planeGeometry args={[mapSize, mapSize]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <Grid 
                args={[mapSize, mapSize]} 
                position={[0, 0, 0]} 
                cellSize={1} 
                cellThickness={1} 
                cellColor="#00ffcc" 
                sectionSize={5} 
                sectionThickness={1.5} 
                sectionColor="#0088ff" 
                fadeDistance={50} 
            />

            {/* OS JOGADORES (TOKENS) */}
            {tokens.map((tk, i) => {
                // Traduzir coordenadas do RPG para o 3D
                const posX = tk.x;
                const posY = tk.z || 0; // A nossa Altitude vira o Y no 3D
                const posZ = tk.y;      // O nosso Y do 2D vira a profundidade Z no 3D

                return (
                    <mesh key={i} position={[posX, posY + 0.5, posZ]} castShadow>
                        {/* Corpo do Personagem (Um cilindro) */}
                        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
                        <meshStandardMaterial color={tk.cor} opacity={0.9} transparent />
                        
                        {/* Nome do Personagem Flutuante */}
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