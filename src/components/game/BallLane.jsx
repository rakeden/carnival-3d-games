import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSphere, useBox, useTrimesh } from '@react-three/cannon';
import * as THREE from 'three';
import { useGesture } from '@use-gesture/react';
import { preloadAudio, playBounceSound } from '@/lib/audio';
import ballBounceAudio from '@assets/audio/ball-bounce.mp3';

// Preload audio when component is first used
const audioFiles = {
  bounce: ballBounceAudio,
};

// Flag to track if audio has been initialized
let audioInitialized = false;

// Function to get color based on score value
const getHoleColor = (score) => {
  switch(score) {
    case 3: return "#ff0000"; // Red for highest score
    case 2: return "#00ff00"; // Green for medium score
    case 1: return "#0000ff"; // Blue for lowest score
    default: return "#ffffff"; // White as fallback
  }
};

// Define scoring holes at the module level so both components can access them
const SCORING_HOLES = [
    { score: 5, position: [0, 0, 6.5], radius: 0.16 }, // Top
    
    { score: 1, position: [-0.8, 0, 6], radius: 0.16 }, // Bottom left
    { score: 3, position: [-0.4, 0, 6], radius: 0.16 }, // Bottom left
    { score: 5, position: [0, 0, 6], radius: 0.16 }, // Top
    { score: 3, position: [0.4, 0, 6], radius: 0.16 }, // Bottom right
    { score: 1, position: [0.8, 0, 6], radius: 0.16 }, // Bottom right
    
    { score: 1, position: [-0.6, 0, 5.5], radius: 0.16 }, // Bottom left
    { score: 3, position: [0.2, 0, 5.5], radius: 0.16 }, // Bottom left
    { score: 3, position: [-0.2, 0, 5.5], radius: 0.16 }, // Bottom left
    { score: 1, position: [0.6, 0, 5.5], radius: 0.16 }, // Bottom left
    
    { score: 1, position: [-0.4, 0, 5], radius: 0.16 }, // Far left
    { score: 1, position: [0, 0, 5], radius: 0.16 }, // Middle
    { score: 1, position: [0.4, 0, 5], radius: 0.16 }, // Far right
];

const Ball = ({ position, onScore, onPointerDown }) => {
    const [ref, api] = useSphere(() => ({
        mass: 2,
        position: position,
        args: [0.13],
        onCollide: handleCollision, // Add collision handler
    }));
    
    const [hovered, setHovered] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(position);
    const resetThreshold = position[1] - 2; // Reset if ball falls 2 units below starting position
    const [lastScoredHole, setLastScoredHole] = useState(null);
    const [hasScored, setHasScored] = useState(false);
    const BALL_RADIUS = 0.13; // Matching the sphere args
    
    // Track velocity for calculating impact force
    const velocityRef = useRef([0, 0, 0]);
    const lastCollisionTime = useRef(0);
    const COLLISION_COOLDOWN = 50; // Minimum ms between bounce sounds
    
    // Add a new ref to track if ball is in starting area
    const isInStartingArea = useRef(false);
    
    // Initialize audio on first interaction
    useEffect(() => {
        if (!audioInitialized) {
            preloadAudio(audioFiles).then(() => {
                audioInitialized = true;
            });
        }
    }, []);
    
    // Subscribe to velocity updates for collision force calculation
    useEffect(() => {
        const unsubscribe = api.velocity.subscribe((v) => {
            velocityRef.current = v;
        });
        return () => unsubscribe();
    }, [api.velocity]);
    
    // Handle physical collisions with other objects
    const handleCollision = (event) => {
        if (!audioInitialized) return;
        
        const now = performance.now();
        if (now - lastCollisionTime.current < COLLISION_COOLDOWN) return;
        
        // Get collision data
        const { contact, body, target } = event;
        
        // Skip if missing contact information
        if (!contact) return;
        
        // Get impulse from collision - this is the key physics parameter
        // The impulse represents the change in momentum during collision
        const impulse = contact.impulse || 0;
        
        // Get velocity at impact moment
        const velocity = velocityRef.current;
        
        // Calculate impact speed (magnitude of velocity vector)
        const impactSpeed = Math.sqrt(
            velocity[0] * velocity[0] + 
            velocity[1] * velocity[1] + 
            velocity[2] * velocity[2]
        );
        
        // Calculate normalized impact intensity (0-1 range)
        const normalizedImpact = Math.min(impactSpeed / 15, 1);
        
        // Calculate impact angle - how direct the hit is
        let impactDirectness = 1;
        if (contact && contact.ni) {
            const vNorm = new THREE.Vector3(velocity[0], velocity[1], velocity[2]).normalize();
            const contactNormal = new THREE.Vector3(contact.ni[0], contact.ni[1], contact.ni[2]);
            impactDirectness = Math.abs(vNorm.dot(contactNormal));
        }
        
        // Calculate final impact strength, combining speed and directness
        const impactStrength = normalizedImpact * (0.4 + (impactDirectness * 0.6));

        // Only play sound if impact is strong enough
        if (impactStrength > 0.02) {
            // Calculate pitch based on impact strength
            const basePitch = 1.0;
            const pitchVariation = 0.2; // 20% variation
            const impactPitch = basePitch + (impactStrength * pitchVariation);
            
            playBounceSound(impactStrength, {
                playbackRate: impactPitch // Higher impacts get higher pitches
            });
            lastCollisionTime.current = now;
        }
    };
    
    // Modify the position subscription useEffect to include scoring reset logic
    useEffect(() => {
        const unsubscribe = api.position.subscribe((p) => {
            setCurrentPosition(p);
            
            // Check if ball fell below threshold
            if (p[1] < resetThreshold) {
                // Reset ball position with a slight random offset
                const randomX = (Math.random() - 0.5) * 0.4;
                const randomZ = (Math.random() - 0.5) * 0.4;
                api.position.set(position[0] + randomX, position[1], position[2] + randomZ);
                api.velocity.set(0, 0, 0);
                api.angularVelocity.set(0, 0, 0);
                setLastScoredHole(null);
                setHasScored(false);
                isInStartingArea.current = true;
            }
            
            // Check if ball is in starting area (near original position)
            const inStartingArea = 
                Math.abs(p[2] - position[2]) < 1.5 && // Close to starting Z
                Math.abs(p[1] - position[1]) < 0.5;   // Close to starting Y
            
            // Reset scoring when ball returns to starting area
            if (inStartingArea && !isInStartingArea.current) {
                setHasScored(false);
                setLastScoredHole(null);
            }
            
            isInStartingArea.current = inStartingArea;
        });
        return () => unsubscribe();
    }, [api.position, position, resetThreshold]);

    // Track last hole the ball was above for scoring validation
    const currentHoleRef = useRef(null);
    const scoringTimeoutRef = useRef(null);

    useEffect(() => {
        const unsubscribe = api.position.subscribe((p) => {
            // Don't check for scoring if already scored with this ball
            if (hasScored) return;
            
            // Check each scoring hole
            for (const hole of SCORING_HOLES) {
                // Calculate distance from ball center to hole center on X-Z plane
                const dx = p[0] - hole.position[0];
                const dz = p[2] - hole.position[2];
                const distanceXZ = Math.sqrt(dx * dx + dz * dz);
                
                // Ball must be:
                // 1. Centered over the hole (within a slightly larger radius for better detection)
                // 2. At the right Z position (around hole.position[2])
                // 3. Below the initial height (falling through)
                if (distanceXZ < hole.radius * 1.2 && // Slightly larger radius for better detection
                    Math.abs(p[2] - hole.position[2]) < 0.3 && // Close to the hole's Z position
                    p[1] < position[1] - 0.5) { // Ball has fallen at least 0.5 units
                    
                    // Prevent multiple scoring
                    if (!hasScored) {
                        setHasScored(true);
                        onScore(hole.score);
                        break;
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [hasScored, position, onScore]);

    // Also reset scoring state when ball is grabbed
    const handlePointerDown = (e) => {
        e.stopPropagation();
        setHasScored(false);
        setLastScoredHole(null);
        if (onPointerDown) onPointerDown(e, api);
    };

    return (
        <mesh 
            ref={ref} 
            position={currentPosition}
            castShadow 
            receiveShadow
            onPointerOver={() => {
                document.body.style.cursor = 'pointer';
                setHovered(true);
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
                setHovered(false);
            }}
            onPointerDown={handlePointerDown}  // Use the new handler
        >
            <sphereGeometry args={[0.13, 32, 32]} />
            <meshStandardMaterial 
                color="#34495e"
                emissive="#34495e"
                emissiveIntensity={hovered ? 0.25 : 0}
            />
        </mesh>
    );
};

const BallLane = ({ position, onScore }) => {
    const [ballPositions] = useState([
        [0, position[1] + 1.5, 0.6],      // Center ball
        [-0.2, position[1] + 1.5, 0.8], // Left ball
        [0.2, position[1] + 1.5, 0.8],  // Right ball
    ]);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    const groupRef = useRef();
    const ballRef = useRef();
    const ballApiRef = useRef(null);
    
    // Get Three.js scene objects
    const { camera, scene, gl } = useThree();
    
    // Raycaster for screen-to-world coordinate conversion
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const mouse = useMemo(() => new THREE.Vector2(), []);

    // Calculate the height at the far end (4 units long, 10 degrees)
    const farEndHeight = Math.tan(10 * Math.PI / 180) * 4;

    // Create a custom geometry with holes for the scoring surface
    const surfaceGeometry = useMemo(() => {
        // Create the main shape (rectangular surface)
        const shape = new THREE.Shape();
        const width = 1; // Half-width
        const length = 3; // Half-length for the scoring area
        shape.moveTo(-width, -length);
        shape.lineTo(width, -length);
        shape.lineTo(width, length);
        shape.lineTo(-width, length);
        shape.lineTo(-width, -length);

        // Add circular holes for each scoring position
        const holes = SCORING_HOLES.map(({ position: holePosition }) => {
            const holePath = new THREE.Path();
            const holeRadius = 0.16;
            holePath.absarc(holePosition[0], holePosition[2] - 4, holeRadius, 0, Math.PI * 2, true);
            return holePath;
        });

        shape.holes = holes;
        
        // Create the geometry from the shape
        // Increased segments for better physics approximation
        const geometry = new THREE.ShapeGeometry(shape, 32); 
        
        // Rotate the geometry to match the lane's slope before applying position
        // Note: Rotation for the Trimesh will be handled in the useTrimesh hook
        geometry.rotateX(Math.PI / 2); 
        geometry.computeVertexNormals(); // Important for Trimesh
        
        return geometry;
    }, []);

    // Extract vertices and indices for Trimesh
    const vertices = useMemo(() => surfaceGeometry.attributes.position.array, [surfaceGeometry]);
    const indices = useMemo(() => surfaceGeometry.index.array, [surfaceGeometry]);

    // Physics bodies for the lane
    // Replace useBox with useTrimesh for the surface
    const [laneSurface] = useTrimesh(() => ({
        mass: 0,
        args: [vertices, indices],
        // Match the position and rotation of the visual mesh
        position: [position[0], position[1] + farEndHeight/2 + 0.5, position[2] + 4], 
        rotation: [-8 * Math.PI / 180, 0, 0],
    }), useRef()); // No need to pass geometry ref here unless it changes dynamically

    const [leftEdge] = useBox(() => ({
        mass: 0,
        position: [position[0] + 1, position[1] + farEndHeight/2 + 0.75, position[2] + 3.95],
        args: [0.1, 0.2, 6],
        rotation: [-8 * Math.PI / 180, 0, 0],
    }));

    const [rightEdge] = useBox(() => ({
        mass: 0,
        position: [position[0] - 1, position[1] + farEndHeight/2 + 0.75, position[2] + 3.95],
        args: [0.1, 0.2, 6],
        rotation: [-8 * Math.PI / 180, 0, 0],
    }));

    const [backEdge] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + farEndHeight + 0.82, position[2] + 6.95],
        args: [2, 0.01, 0.5],
        rotation: [-Math.PI / 2, 0, 0],
    }));

    const [laneRamp] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + 0.5, position[2] + 5],
        args: [2, 0.1, 3.95],
        rotation: [-10 * Math.PI / 130, 0, 0],
    }));

    const [laneFloor] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + 0.06, position[2] + 2],
        args: [2, 0.1, 4],
        rotation: [Math.PI / -100, 0, 0],
    }));

    const [laneLeftSide] = useBox(() => ({
        mass: 0,
        position: [position[0] + 1.001, position[1] + 0.20, position[2] + 3.5],
        args: [0.5, 0.1, 7],
        rotation: [0, 0, Math.PI / 2],
    }));

    const [laneRightSide] = useBox(() => ({
        mass: 0,
        position: [position[0] - 1.001, position[1] + 0.20, position[2] + 3.5],
        args: [0.5, 0.1, 7],
        rotation: [0, 0, -Math.PI / 2],
    }));

    const [laneFrontSide] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + 0.2, position[2]],
        args: [2, 0.1, 0.5],
        rotation: [-Math.PI / 2, 0, 0],
    }));

    const [laneBackSide] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + 0.25, position[2] + 6.98],
        args: [2, 0.1, 0.5],
        rotation: [-Math.PI / 2, 0, 0],
    }));

    const [laneBackSideTop] = useBox(() => ({
        mass: 0,
        position: [position[0], position[1] + 0.93, position[2] + 6.98],
        args: [2, 0.1, 0.85],
        rotation: [-Math.PI / 2, 0, 0],
    }));

    // Define the dragPlaneY value to be used consistently
    const dragPlaneY = position[1] + 1;
    
    // Track gesture velocity
    const lastPositionRef = useRef(null);
    const velocityHistoryRef = useRef([]);
    const frameTimeRef = useRef(null);

    const handleBallPointerDown = (event, api) => {
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
        
        // Store the ball API for use during drag
        ballApiRef.current = api;
        
        // Get client position from either mouse or touch event
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        // Convert position to normalized device coordinates (-1 to +1)
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        
        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate intersection with drag plane
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragPlaneY);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            // Apply constraints to keep the ball within the lane floor area bounds
            const floorZStart = position[2];
            const floorZEnd = position[2] + 1;
            const laneWidth = 1.0;

            // Properly clamp the ball position within the lane boundaries
            const newX = Math.max(position[0] - laneWidth + 0.15, Math.min(position[0] + laneWidth - 0.15, intersection.x));
            // Use the exact z-coordinate from the intersection
            const newZ = Math.max(floorZStart + 0.15, Math.min(floorZEnd - 0.15, intersection.z));
            
            // Store initial position for velocity calculation
            dragStartRef.current = {
                screenX: clientX,
                screenY: clientY,
                worldPos: new THREE.Vector3(newX, dragPlaneY, newZ),
                time: performance.now()
            };
            
            // Initialize gesture tracking
            lastPositionRef.current = new THREE.Vector3(newX, dragPlaneY, newZ);
            velocityHistoryRef.current = [];
            frameTimeRef.current = performance.now();
            
            // Set mass to 0 to prevent physics affecting the ball during drag
            api.mass.set(0);
            
            // Stop rotation without locking it (set angular velocity to zero)
            api.angularVelocity.set(0, 0, 0);
            
            // Move ball to drag plane immediately
            api.position.set(newX, dragPlaneY, newZ);
            api.velocity.set(0, 0, 0); // Reset any existing velocity
        }
    };

    useEffect(() => {
        
        // Add mouse and touch event listeners to track drag
        const handlePointerMove = (e) => {
            if (isDragging && ballApiRef.current) {
                // Get coordinates from either mouse or touch event
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                // Convert mouse position to normalized device coordinates (-1 to +1)
                mouse.x = (clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(clientY / window.innerHeight) * 2 + 1;
                
                // Update the raycaster
                raycaster.setFromCamera(mouse, camera);
                
                // Calculate objects intersecting the ray
                const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragPlaneY);
                const intersection = new THREE.Vector3();
                
                if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                    // Apply constraints to keep the ball within the lane floor area bounds
                    const floorZStart = position[2];
                    const floorZEnd = position[2] + 1;
                    const laneWidth = 1.0;

                    // Check if intersection would hit the positive Z boundary BEFORE clamping
                    // Only detect hitting the back (positive) Z boundary
                    const wouldHitPositiveZBoundary = intersection.z > floorZEnd - 0.15;
                    
                    // Always calculate properly clamped position for velocity tracking
                    const newX = Math.max(position[0] - laneWidth + 0.15, Math.min(position[0] + laneWidth - 0.15, intersection.x));
                    const newZ = Math.max(floorZStart + 0.15, Math.min(floorZEnd - 0.15, intersection.z));
                    
                    // Update the physics ball position directly - ensure Y is at drag plane height
                    ballApiRef.current.position.set(newX, dragPlaneY, newZ);
                    
                    // Calculate velocity for this frame
                    const now = performance.now();
                    const deltaTime = now - frameTimeRef.current;
                    
                    if (deltaTime > 0 && lastPositionRef.current) {
                        // Get the current position
                        const currentPos = new THREE.Vector3(newX, dragPlaneY, newZ);
                        
                        // Calculate velocity vectors
                        const deltaX = currentPos.x - lastPositionRef.current.x;
                        const deltaZ = currentPos.z - lastPositionRef.current.z;
                        
                        // Calculate speed in units per second
                        const vx = deltaX / (deltaTime / 1000);
                        const vz = deltaZ / (deltaTime / 1000);
                        
                        // Add to velocity history (keep last 5 frames)
                        velocityHistoryRef.current.push({ vx, vz, timestamp: now });
                        if (velocityHistoryRef.current.length > 5) {
                            velocityHistoryRef.current.shift();
                        }
                        
                        // Update references for next frame
                        lastPositionRef.current = currentPos;
                        frameTimeRef.current = now;
                    }
                    
                    // Keep rotation stopped during dragging without locking
                    ballApiRef.current.angularVelocity.set(0, 0, 0);
                    
                    // If the ball would hit the positive Z boundary during dragging, trigger release
                    if (wouldHitPositiveZBoundary && velocityHistoryRef.current.length > 0) {
                        // Create a mock event to reuse existing release logic
                        const releaseEvent = new Event('autorelease');
                        
                        // Call handlePointerUp to release the ball with current velocity
                        handlePointerUp(releaseEvent);
                    }
                }
            }
        };
        
        const handlePointerUp = (e) => {
            if (isDragging && dragStartRef.current && ballApiRef.current) {
                setIsDragging(false);
                document.body.style.cursor = 'auto';
                
                // Get the final position
                const finalPos = new THREE.Vector3();
                ballApiRef.current.position.subscribe((p) => {
                    finalPos.set(p[0], p[1], p[2]);
                })();
                
                // Calculate z position percentage within dragplane for strength scaling
                const floorZStart = position[2];
                const floorZEnd = position[2] + 1;
                const totalZLength = floorZEnd - floorZStart - 0.3; // Adjusting for the buffer
                const zPosition = finalPos.z - floorZStart - 0.15; // Adjust for min buffer
                const zPercentage = Math.max(0, Math.min(1, zPosition / totalZLength));
                
                // Scale throw strength based on z position (0.5 - 1.5 range)
                const positionStrength = 0.5 + zPercentage * 1.0; // Maps 0-1 to 0.5-1.5
                
                // Calculate average velocity from recent history (weighted toward most recent)
                let vxSum = 0;
                let vzSum = 0;
                let totalWeight = 0;
                
                // Use velocity history if available, or fallback to position difference
                if (velocityHistoryRef.current.length > 0) {
                    // Get current time
                    const now = performance.now();
                    
                    // Process velocity history with recency weighting
                    velocityHistoryRef.current.forEach((entry, index) => {
                        // More recent entries get higher weight
                        // Also weight by recency (newer entries matter more)
                        const recencyWeight = Math.exp(-(now - entry.timestamp) / 200); // Decay factor
                        const weight = (index + 1) * recencyWeight;
                        
                        vxSum += entry.vx * weight;
                        vzSum += entry.vz * weight;
                        totalWeight += weight;
                    });
                    
                    // Restore mass for physics simulation
                    ballApiRef.current.mass.set(1);
                    
                    // Calculate final velocities
                    const gestureVelocityScale = 0.25; // Adjust this value to control throw strength
                    let finalVx = (totalWeight > 0) ? (vxSum / totalWeight) * gestureVelocityScale * 2.0 : 0; // Double X velocity
                    let finalVz = (totalWeight > 0) ? (vzSum / totalWeight) * gestureVelocityScale * 2.0 : 0; // Double Z velocity
                    
                    // Increase finalVz by 10%
                    finalVz *= 1.1;
                    
                    // Add upward velocity based on position and gesture speed
                    const gestureSpeed = Math.sqrt(finalVx * finalVx + finalVz * finalVz);
                    let finalVy = Math.max(2, gestureSpeed * 0.5) * positionStrength;
                    
                    // Ensure minimum forward velocity if gesture is too weak - double this as well
                    const minForwardVz = 20 * positionStrength; // Increased from 16 to 20
                    let adjustedVz = (finalVz > 0) ? Math.max(finalVz, minForwardVz) : minForwardVz;
                    
                    // Apply limits to velocity values
                    finalVx = Math.min(Math.max(finalVx, -3), 3); // Limit finalVx to -3 to 3
                    finalVy = Math.min(finalVy * 1.15, 2); // Limit finalVy to 2
                    adjustedVz = Math.min(adjustedVz, 20); // Limit adjustedVz to 20
                    
                    // Apply final velocity
                    ballApiRef.current.velocity.set(finalVx, finalVy, adjustedVz);
                } else {
                    // Fallback to original throwing mechanism if no velocity history
                    // Restore mass for physics simulation
                    ballApiRef.current.mass.set(1);
                    
                    // Calculate velocity based on position change from start to end
                    const startPos = dragStartRef.current.worldPos;
                    const dx = finalPos.x - startPos.x;
                    
                    // Scale factors for velocity - double the horizontal scale
                    const horizontalVelocityScale = 10 * positionStrength; // Doubled from 5 to 10
                    const verticalVelocityScale = 3 * positionStrength; 
                    const forwardVelocityScale = 15 * positionStrength;
                    
                    // Calculate velocities
                    let vx = dx * horizontalVelocityScale; // This will now be doubled due to the doubled scale
                    let vy = verticalVelocityScale * 1.15; // Increased vertical velocity by 15% 
                    let vz = Math.max(20 * positionStrength, -0.2 * forwardVelocityScale); // Increased from 16 to 20
                    
                    // Increase vz by 10%
                    vz *= 1.1;
                    
                    // Apply limits to velocity values
                    vx = Math.min(Math.max(vx, -3), 3); // Limit vx to -3 to 3
                    vy = Math.min(vy, 2); // Limit vy to 2
                    vz = Math.min(vz, 20); // Limit vz to 20
                    
                    // Apply velocity
                    ballApiRef.current.velocity.set(vx, vy, vz);
                }
                
                // Reset refs
                dragStartRef.current = null;
                lastPositionRef.current = null;
                velocityHistoryRef.current = [];
            }
        };

        // Add mouse event listeners
        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);
        
        // Add touch event listeners
        window.addEventListener('touchmove', handlePointerMove, { passive: false });
        window.addEventListener('touchend', handlePointerUp);
        
        return () => {
            // Remove mouse event listeners
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', handlePointerUp);
            
            // Remove touch event listeners
            window.removeEventListener('touchmove', handlePointerMove);
            window.removeEventListener('touchend', handlePointerUp);
        };
    }, [isDragging, camera, position]);

    return (
        <group
            ref={groupRef}
        >
            {/* Lane surface visual mesh */}
            <mesh 
                position={[position[0], position[1] + farEndHeight/2 + 0.5, position[2] + 4]} 
                rotation={[-8 * Math.PI / 180, 0, 0]} 
                castShadow 
                receiveShadow
            >
                <primitive object={surfaceGeometry} attach="geometry" />
                <meshStandardMaterial color="#e5e5e5" side={THREE.DoubleSide} />
            </mesh>
            
            {/* Add colored borders around scoring holes */}
            {SCORING_HOLES.map((hole, index) => {
                // Calculate the correct position that matches the hole in the surface
                // Note that we need to adjust for the surface position and rotation
                const holeAngleOffset = 8 * Math.PI / 180; // 8 degrees in radians (same as surface tilt)
                const surfaceZ = position[2] + 4; // Z position of the surface center
                
                // Calculate the hole position on the rotated surface
                // The Z position needs to be adjusted for the angle
                const holeZ = surfaceZ + (hole.position[2] - 4) * Math.cos(holeAngleOffset);
                // The Y position needs to be adjusted for the angle and height
                const holeY = position[1] + farEndHeight/2 + 0.5 + (hole.position[2] - 4) * Math.sin(holeAngleOffset);
                
                // Slightly larger radius for the border
                const borderRadius = hole.radius * 1.15; 
                // Thinner border thickness
                const borderThickness = 0.01;
                
                return (
                    <mesh
                        key={`hole-border-${index}`}
                        position={[hole.position[0], holeY + 0.001, holeZ]} 
                        // Fix rotation to align with surface plane (90 degrees + surface angle)
                        rotation={[Math.PI/2 - holeAngleOffset, 0, 0]}
                    >
                        <ringGeometry args={[hole.radius, borderRadius, 32]} />
                        <meshStandardMaterial 
                            color={getHoleColor(hole.score)} 
                            emissive={getHoleColor(hole.score)}
                            emissiveIntensity={0.5}
                            side={THREE.DoubleSide} 
                        />
                    </mesh>
                );
            })}

            {/* Lane box ramp */}
            <mesh ref={laneRamp} castShadow receiveShadow>
                <boxGeometry args={[2, 0.01, 3.95]} />
                <meshStandardMaterial color="#999999" />
            </mesh>

            {/* Lane edges with physics */}
            <mesh ref={leftEdge} castShadow receiveShadow>
                <boxGeometry args={[0.01, 0.5, 6]} />
                <meshStandardMaterial color="#e5e5e5" />
            </mesh>
            <mesh ref={rightEdge} castShadow receiveShadow>
                <boxGeometry args={[0.01, 0.5, 6]} />
                <meshStandardMaterial color="#e5e5e5" />
            </mesh>
            {/* Lane edge backside with physics */}
            <mesh ref={backEdge} castShadow receiveShadow> 
                <boxGeometry args={[2, 0.01, 0.5]} />
                <meshStandardMaterial color="#e5e5e5" />
            </mesh>

            {/* Lane box floor */}
            <mesh ref={laneFloor} castShadow receiveShadow>
                <boxGeometry args={[2, 0.01, 4]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            {/* Lane box left side */}
            <mesh ref={laneLeftSide} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.01, 7]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            {/* Lane box right side */}
            <mesh ref={laneRightSide} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.01, 7]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            {/* Lane box front side */}
            <mesh ref={laneFrontSide} castShadow receiveShadow>
                <boxGeometry args={[2, 0.01, 0.5]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            {/* Lane box back side */}
            <mesh ref={laneBackSide} castShadow receiveShadow>
                <boxGeometry args={[2, 0.01, 0.5]} />
                <meshStandardMaterial color="#999999" />
            </mesh>
            {/* Lane box back side top */}
            <mesh ref={laneBackSideTop} castShadow receiveShadow>
                <boxGeometry args={[2, 0.01, 0.85]} />
                <meshStandardMaterial color="#999999" />
            </mesh>

            {/* Multiple Balls */}
            {ballPositions.map((ballPos, index) => (
                <Ball 
                    key={index}
                    position={ballPos}
                    onScore={onScore}
                    onPointerDown={handleBallPointerDown}
                />
            ))}
        </group>
    );
};

export default BallLane; 