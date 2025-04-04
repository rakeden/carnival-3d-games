import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars, Grid, AccumulativeShadows, RandomizedLight, PerspectiveCamera } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { useSpring, animated } from '@react-spring/three';
import BallLane from './BallLane';
import RaceTrack3D from './RaceTrack3D';
import CarnivalBooth from './CarnivalBooth';

// Helper function to detect mobile devices
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    (window.innerWidth <= 768);
};

// Animated scene wrapper component
const AnimatedScene = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  
  // Set loaded to true after small delay to ensure components are mounted
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Create spring animation for the scene
  const spring = useSpring({
    opacity: loaded ? 1 : 0,
    scale: loaded ? 1 : 0.9,
    config: { mass: 1, tension: 280, friction: 60 }
  });
  
  return (
    <animated.group {...spring}>
      {children}
    </animated.group>
  );
};

const Game3D = ({ onScore, onSceneReady }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const cameraRotationRef = useRef([Math.PI / 4, Math.PI, 0]);
    const [sceneReady, setSceneReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if the user is on a mobile device
        setIsMobile(isMobileDevice());

        // Only add mouse move listener on desktop devices
        if (!isMobileDevice()) {
            const handleMouseMove = (event) => {
                // Get mouse position relative to window center
                const x = (event.clientX / window.innerWidth - 0.5) * 2;
                const y = (event.clientY / window.innerHeight - 0.5) * 2;
                setMousePosition({ x, y });
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }
    }, []);

    // Update camera rotation based on mouse position (only on desktop)
    useEffect(() => {
        if (!isMobile) {
            // Convert 10 degrees to radians
            const maxRotation = 10 * Math.PI / 180;
            
            // Calculate new rotation based on mouse position
            cameraRotationRef.current = [
                Math.PI / 4 + (mousePosition.y * maxRotation), // Pitch
                Math.PI + (-mousePosition.x * maxRotation), // Yaw (negated to fix direction)
                0 // Roll
            ];
        }
    }, [mousePosition, isMobile]);

    // Handler when all 3D assets are loaded
    const handleSceneReady = () => {
        setSceneReady(true);
        if (onSceneReady) {
            onSceneReady();
        }
    };

    return (
        <div className="w-full h-screen relative">
            <Canvas
                shadows
                onCreated={handleSceneReady}
                className="w-full h-full"
            >
                <Suspense fallback={null}>
                    <Physics gravity={[0, -30, 0]}>
                        <AnimatedScene>
                            {/* Environment */}
                            <Environment preset="night" />
                            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
                            
                            {/* Lighting */}
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                            <spotLight
                                position={[0, 5, 0]}
                                angle={0.3}
                                penumbra={0.5}
                                intensity={1}
                                castShadow
                            />
                            <directionalLight
                                position={[5, 5, 5]}
                                intensity={1}
                                castShadow
                                shadow-mapSize={[1024, 1024]}
                                shadow-camera-far={50}
                                shadow-camera-left={-10}
                                shadow-camera-right={10}
                                shadow-camera-top={10}
                                shadow-camera-bottom={-10}
                            />
                            
                            {/* Debug Grid */}
                            <Grid
                                args={[100, 100]}
                                position={[0, 0, 0]}
                                cellColor="#6e6e6e"
                                sectionColor="#9d9d9d"
                                fadeDistance={30}
                                fadeStrength={1}
                                followCamera={false}
                                infiniteGrid={true}
                            />

                            {/* Ground */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                                <planeGeometry args={[100, 100]} />
                                <meshStandardMaterial color="#303030" transparent opacity={0.5} />
                            </mesh>

                            {/* Carnival Booth */}
                            {/* <CarnivalBooth position={[0, 0, -5]} /> */}

                            {/* Race Tracks and Ball Lanes 
                            {horses.map((horse, index) => (
                                <group key={horse.id} position={[index * 3 - 4, 0, 0]}>
                                    <RaceTrack3D horse={horse} />
                                    <BallLane 
                                        position={[0, 0, 2]} 
                                        onScore={(points) => onScore(horse.id, points)}
                                    />
                                </group>
                            ))}
                            */}

                            <BallLane 
                                position={[0, 0, 0]}
                                onScore={(points) => onScore(points)}
                            />
                        </AnimatedScene>

                        {/* Camera - Fixed position on mobile, dynamic on desktop */}
                        <PerspectiveCamera
                            makeDefault
                            position={[0, 2.5, -0.1]}
                            rotation={cameraRotationRef.current}
                            fov={90}
                            near={0.1}
                            far={10}
                        />
                    </Physics>
                </Suspense>
            </Canvas>
        </div>
    );
};

export default Game3D; 