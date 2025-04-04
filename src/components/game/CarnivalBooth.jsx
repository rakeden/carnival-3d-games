import React from 'react';
import { useFrame } from '@react-three/fiber';

const NeonText = ({ text, position, color = '#ff00ff' }) => {
    const textRef = React.useRef();
    const glowRef = React.useRef();

    useFrame((state) => {
        // Animate neon glow
        const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        if (glowRef.current) {
            glowRef.current.material.emissiveIntensity = intensity;
        }
    });

    return (
        <group position={position}>
            {/* Glow effect */}
            <mesh ref={glowRef}>
                <planeGeometry args={[8, 1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.3}
                />
            </mesh>
            {/* Text */}
            {/* <mesh ref={textRef}>
                <textGeometry
                    args={[text, {
                        font: '/fonts/helvetiker_regular.typeface.json',
                        size: 0.5,
                        height: 0.1,
                        curveSegments: 12,
                    }]}
                    center
                />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh> */}
        </group>
    );
};

const CarnivalBooth = ({ position }) => {
    return (
        <group position={position}>
            {/* Booth Structure */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[8, 4, 2]} />
                <meshStandardMaterial color="#4a4a4a" />
            </mesh>

            {/* Canopy */}
            <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[10, 0.5, 10]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>

            {/* Neon Signs */}
            <group position={[0, 3, 0]}>
                <NeonText text="Horse Derby!" position={[-2, 0, 0]} />
            </group>

            {/* Decorative Lights */}
            {[...Array(10)].map((_, i) => (
                <mesh
                    key={i}
                    position={[
                        -4 + (i * 0.8),
                        2,
                        0
                    ]}
                >
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial
                        color={i % 2 === 0 ? '#ff0000' : '#00ff00'}
                        emissive={i % 2 === 0 ? '#ff0000' : '#00ff00'}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            ))}
        </group>
    );
};

export default CarnivalBooth; 