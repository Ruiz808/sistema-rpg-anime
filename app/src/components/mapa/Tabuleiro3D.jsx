import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Sky, useTexture } from '@react-three/drei';

const fogColor = '#cfd8dc'; 
const displacementScale = 2.5; 

// 🌍 SUB-COMPONENTE: O Mundo carrega a textura de forma segura
function MundoComRelevo({ mapSize, handleChaoClick }) {
    const mapTexture = useTexture('/image_8875aa.png');

    return (
        <group>
            {/* O Chão do Mundo */}
            <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -0.2, 0]} 
                receiveShadow 
                onClick={handleChaoClick}
            >
                {/* 🔥 REDUZIDO DE 512 PARA 128: O Salvador de Placas de Vídeo! */}
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

            {/* A Grelha de Combate */}
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
        </group>
    );
}

// ⏳ COMPONENTE DE CARREGAMENTO
function CarregandoMundo() {
    return (
        <Html center style={{ pointerEvents: 'none' }}>
            <div style={{ 
                color: '#00ffcc', fontWeight: 'bold', textShadow: '0 0 10px #0088ff', 
                fontSize: '1.2em', width: '250px', textAlign: 'center', 
                background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px',
                border: '1px solid #00ffcc'
            }}>
                ⏳ A Forjar o Mundo...
            </div>
        </Html>
    );
}

export default function Tabuleiro3D({ mapSize, tokens, moverJogador, altitudeAtual }) {
    function handleChaoClick(e) {
        e.stopPropagation();
        const point = e.point;
        const gridX = Math.round(point.x);
        const gridY = Math.round(point.z); 
        moverJogador(gridX, gridY);
    };

    return (
        <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
            <fog attach="fog" args={[fogColor, 30, 100]} />
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.02} />

            {/* A Barreira de Proteção que espera a imagem carregar */}
            <Suspense fallback={<CarregandoMundo />}>
                <MundoComRelevo mapSize={mapSize} handleChaoClick={handleChaoClick} />
            </Suspense>

            {/* OS JOGADORES */}
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