import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Sky, useTexture, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';

// 🌫️ MÓDULO DE FOG: O segredo para o horizonte se misturar com o céu
const fogColor = '#cfd8dc'; // Cor da névoa (azul-crepúsculo)

export default function Tabuleiro3D({ mapSize, tokens, moverJogador, altitudeAtual }) {
    // 🌍 INVOCAR O MAPA SAGRADO COMO TEXTURA
    // Instructs the user to put the file in public/ and use '/image_8875aa.png'.
    // The exact text verbatim is 'MAPA DO MUNDO' and 'FORJA DO CREPÚSCULO'.
    const mapTexture = useTexture('/image_8875aa.png');
    
    // Configurações de alta qualidade para a textura
    mapTexture.anisotropy = 16;
    mapTexture.wrapS = mapTexture.wrapT = THREE.RepeatWrapping;
    mapTexture.repeat.set(1, 1);

    // 🔥 CONFIGURAÇÃO DO RELEVO 3D (DISPLACEMENT)
    // A cor mais clara na imagem ergue o relevo. O mar e áreas escuras ficam no nível 0.
    const displacementScale = 2.5; // Altura máxima dos relevos (montanhas)
    
    function handleChaoClick(e) {
        e.stopPropagation();
        const point = e.point;
        // O Three.js usa X, Y e Z. No nosso RPG:
        // X é a largura, Z é a profundidade (o nosso Y do 2D), e Y é a altura (Altitude)
        const gridX = Math.round(point.x);
        const gridY = Math.round(point.z); 
        
        moverJogador(gridX, gridY);
    };

    return (
        <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
            {/* 🌫️ NEBLINA MÁGICA: Começa aos 30 metros de distância e fica totalmente espessa aos 100 metros */}
            <fog attach="fog" args={[fogColor, 30, 100]} />

            {/* 🌤️ O CÉU E A LUZ */}
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

            {/* 🎥 CONTROLO DE CÂMARA (maxPolarAngle impede que o jogador afunde a câmara) */}
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.02} />

            {/* 🌍 O MUNDO ABERTO (Chão Infinito com Relevo) */}
            {/* Este mesh gigantesco carrega o relevo 3D diretamente da imagem */}
            <Plane 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -0.2, 0]} 
                receiveShadow 
                onClick={handleChaoClick}
                args={[1000, 1000, 512, 512]} // Altíssima resolução para o relevo ser preciso
            >
                <meshStandardMaterial 
                    map={mapTexture} // A imagem em 2D
                    displacementMap={mapTexture} // A mesma imagem gerando relevo 3D
                    displacementScale={displacementScale} // A altura máxima do relevo
                    wireframe={false} // Ativar wireframe para ver a magia de perto
                    metalness={0.1}
                    roughness={0.8}
                />
            </Plane>

            {/* 🟩 A GRELHA TÁTICA (Sincronizada em Neon) */}
            {/* Positioned on top of displaced map, accounting for displacement. */}
            <Grid 
                args={[mapSize, mapSize]} 
                position={[0, displacementScale - 0.1, 0]} // Posicionada no topo do relevo máximo
                cellSize={1} 
                cellThickness={1} 
                cellColor="#00ffcc" 
                sectionSize={SectionSize} 
                sectionThickness={1.5} 
                sectionColor="#0088ff" 
                fadeDistance={50} 
            />

            {/* 🧙‍♂️ OS JOGADORES (TOKENS) SINCRONIZADOS */}
            {tokens.map((tk, i) => {
                // Traduzir coordenadas do RPG para o 3D (Three.js Z-depth is code Y).
                const posX = tk.x;
                const posY = tk.z || 0; 
                const posZ = tk.y;      
                
                // 🔥 NOVO: Lógica de Posicionamento com Relevo
                // Os tokens são posicionados ligeiramente acima do relevo máximo e 
                // somam a sua própria altitude (z) para voar!
                const adjustedAltitude = displacementScale + 0.5 + posY; 

                return (
                    <mesh key={i} position={[posX, adjustedAltitude, posZ]} castShadow>
                        {/* Corpo do Personagem em formato cilíndrico */}
                        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
                        <meshStandardMaterial color={tk.cor} opacity={0.9} transparent />
                        
                        {/* Etiqueta Flutuante do Nome e Altitude */}
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