import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Sky } from '@react-three/drei';

// 🏰 MÓDULO DE CENÁRIO: Aqui pode adicionar árvores, pedras, muros ou castelos no futuro!
function EstruturasDoCenario() {
    return (
        <group>
            {/* Montanha / Monólito ao Norte */}
            <mesh position={[-25, 10, -35]} castShadow receiveShadow>
                <boxGeometry args={[15, 20, 15]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Estrutura Pontiaguda a Leste */}
            <mesh position={[35, 15, -20]} castShadow receiveShadow>
                <cylinderGeometry args={[0, 12, 30, 4]} />
                <meshStandardMaterial color="#222222" />
            </mesh>
            {/* Bloco ao Sul */}
            <mesh position={[20, 5, 30]} castShadow receiveShadow>
                <boxGeometry args={[10, 10, 10]} />
                <meshStandardMaterial color="#111111" />
            </mesh>
            {/* Ruína Redonda a Oeste */}
            <mesh position={[-35, 8, 15]} castShadow receiveShadow>
                <cylinderGeometry args={[5, 8, 16, 6]} />
                <meshStandardMaterial color="#1f1f1f" />
            </mesh>
        </group>
    );
}

export default function Tabuleiro3D({ mapSize, tokens, moverJogador, altitudeAtual }) {
    const handleChaoClick = (e) => {
        e.stopPropagation();
        const point = e.point;
        
        const gridX = Math.round(point.x);
        const gridY = Math.round(point.z); 
        
        // Agora que o mundo é aberto, o jogador pode tentar clicar fora da grelha!
        // O sistema vai permitir que ele ande para o infinito se o Mestre assim quiser.
        moverJogador(gridX, gridY);
    };

    return (
        <Canvas camera={{ position: [0, 15, 20], fov: 50 }}>
            {/* 🌫️ NEBLINA MÁGICA: O segredo para misturar o chão escuro com o céu claro */}
            {/* Começa aos 30 metros de distância e fica totalmente espessa aos 100 metros */}
            <fog attach="fog" args={['#d3d8df', 30, 100]} />

            {/* 🌤️ O CÉU E A LUZ */}
            <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

            {/* 🎥 CONTROLO DE CÂMARA */}
            {/* maxPolarAngle impede que o jogador afunde a câmara para debaixo da terra */}
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.02} />

            {/* 🌍 O MUNDO ABERTO (Chão Infinito) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow onClick={handleChaoClick}>
                {/* Um chão gigantesco de 1000x1000 metros */}
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial color="#0b0c10" /> {/* Cor de terra/relva noturna */}
            </mesh>

            {/* 🟩 A GRELHA TÁTICA DO MAPA (Permanece no centro brilhando em Neon) */}
            <Grid 
                args={[mapSize, mapSize]} 
                position={[0, -0.1, 0]} 
                cellSize={1} 
                cellThickness={1} 
                cellColor="#00ffcc" 
                sectionSize={5} 
                sectionThickness={1.5} 
                sectionColor="#0088ff" 
                fadeDistance={50} 
            />

            {/* 🏰 INVOCAR O CENÁRIO EXTERNO */}
            <EstruturasDoCenario />

            {/* 🧙‍♂️ OS JOGADORES (TOKENS) */}
            {tokens.map((tk, i) => {
                const posX = tk.x;
                const posY = tk.z || 0; 
                const posZ = tk.y;      

                return (
                    <mesh key={i} position={[posX, posY + 0.5, posZ]} castShadow>
                        {/* Corpo do Personagem em formato cilíndrico */}
                        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
                        <meshStandardMaterial color={tk.cor} opacity={0.9} transparent />
                        
                        {/* Etiqueta Flutuante do Nome */}
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