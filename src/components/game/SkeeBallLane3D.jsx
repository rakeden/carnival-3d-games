import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere, useBox } from '@react-three/cannon';
import { Html } from '@react-three/drei';

const Ball = ({ position, onScore }) => {
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position: position,
        args: [0.15],
    }));

    const ballRef = useRef();

    useFrame(() => {
        if (ballRef.current) {
            const position = api.position.get();
            // Check if ball is in scoring position
            if (position[2] > 3.5 && Math.abs(position[0]) < 0.3) {
                const score = Math.floor((position[2] - 3.5) * 10);
                if (score > 0 && score <= 50) {
                    onScore(score);
                    api.position.set(position[0], position[1], 0);
                    api.velocity.set(0, 0, 0);
                }
            }
        }
    });

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color="#ff0000" />
        </mesh>
    );
};

const SkeeBallLane3D = ({ position, onScore }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [ballPosition, setBallPosition] = useState([0, 0, 0]);
    const groupRef = useRef();

    // Calculate the height at the far end (4 units long, 10 degrees)
    const farEndHeight = Math.tan(10 * Math.PI / 180) * 4;

    const [laneBody] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + farEndHeight/2, position[2] + 2],
        args: [1, 0.1, 4],
        rotation: [-10 * Math.PI / 180, 0, 0],
    }));

    const handlePointerDown = (event) => {
        if (event.button === 0) {
            setIsDragging(true);
            const intersection = event.intersections[0];
            if (intersection) {
                setBallPosition([
                    intersection.point.x,
                    intersection.point.y + 0.2,
                    intersection.point.z
                ]);
            }
        }
    };

    const handlePointerMove = (event) => {
        if (isDragging) {
            const intersection = event.intersections[0];
            if (intersection) {
                setBallPosition([
                    intersection.point.x,
                    intersection.point.y + 0.2,
                    intersection.point.z
                ]);
            }
        }
    };

    const handlePointerUp = () => {
        if (isDragging) {
            setIsDragging(false);
            const force = [
                (ballPosition[0] - position[0]) * 10,
                0,
                (ballPosition[2] - position[2]) * 10
            ];
            // TODO: Apply force to ball
        }
    };

    // Define scoring holes in triangular pattern
    const scoringHoles = [
        { score: 50, position: [0, farEndHeight + 0.1, 3.8] }, // Top
        { score: 40, position: [-0.2, farEndHeight + 0.1, 3.6] }, // Bottom left
        { score: 30, position: [0.2, farEndHeight + 0.1, 3.6] }, // Bottom right
        { score: 20, position: [-0.3, farEndHeight + 0.1, 3.4] }, // Far left
        { score: 10, position: [0.3, farEndHeight + 0.1, 3.4] }, // Far right
    ];

    return (
        <group
            ref={groupRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Lane surface */}
            <mesh position={[0, farEndHeight/2, 2]} rotation={[-10 * Math.PI / 180, 0, 0]} receiveShadow>
                <boxGeometry args={[1, 0.1, 4]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>

            {/* Lane edges */}
            <mesh position={[0.5, farEndHeight/2, 2]} rotation={[-10 * Math.PI / 180, 0, 0]} receiveShadow>
                <boxGeometry args={[0.1, 0.2, 4]} />
                <meshStandardMaterial color="#6B3410" />
            </mesh>
            <mesh position={[-0.5, farEndHeight/2, 2]} rotation={[-10 * Math.PI / 180, 0, 0]} receiveShadow>
                <boxGeometry args={[0.1, 0.2, 4]} />
                <meshStandardMaterial color="#6B3410" />
            </mesh>

            {/* Scoring holes in triangular pattern */}
            {scoringHoles.map(({ score, position: holePosition }) => (
                <group key={score} position={holePosition}>
                    <mesh>
                        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
                        <meshStandardMaterial color="#000000" />
                    </mesh>
                    <Html position={[0, 0.2, 0]} center>
                        <div className="text-white text-sm font-bold">{score}</div>
                    </Html>
                </group>
            ))}

            {/* Ball */}
            <Ball position={ballPosition} onScore={onScore} />
        </group>
    );
};

export default SkeeBallLane3D; 