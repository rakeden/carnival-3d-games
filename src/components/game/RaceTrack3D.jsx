import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Html } from '@react-three/drei';

const Horse = ({ position, isWinner }) => {
    const [ref] = useBox(() => ({
        mass: 0,
        position: position,
        args: [0.5, 0.5, 0.5],
    }));

    const horseRef = useRef();

    useFrame((state) => {
        if (horseRef.current) {
            // Subtle bobbing animation
            horseRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        }
    });

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <group ref={horseRef}>
                {/* Horse body */}
                <mesh>
                    <boxGeometry args={[0.5, 0.3, 1]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
                {/* Horse head */}
                <mesh position={[0.4, 0.2, 0]}>
                    <boxGeometry args={[0.3, 0.3, 0.3]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
                {/* Horse legs */}
                {[-0.3, 0.3].map((x, i) => (
                    <mesh key={i} position={[x, -0.3, 0]}>
                        <boxGeometry args={[0.1, 0.6, 0.1]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                ))}
                {/* Horse name */}
                <Html position={[0, 1.5, 0]} center>
                    <div className="text-white text-sm font-bold">{position.name}</div>
                </Html>
            </group>
        </mesh>
    );
};

const RaceTrack3D = ({ horse }) => {
    const trackRef = useRef();

    // Calculate horse position based on progress (0-100)
    const horsePosition = [
        0, // x position (centered on track)
        0, // y position (ground level)
        (horse.position / 100) * 5 - 2.5 // z position (from start to finish)
    ];

    return (
        <group ref={trackRef}>
            {/* Track base */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
                <boxGeometry args={[0.5, 0.2, 5]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>

            {/* Track markings */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.1, 0.1, 5]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>

            {/* Finish line */}
            <mesh position={[0, 0, 2.5]}>
                <boxGeometry args={[0.5, 0.1, 0.1]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>

            {/* Horse */}
            <Horse position={horsePosition} isWinner={horse.position >= 100} />
        </group>
    );
};

export default RaceTrack3D; 