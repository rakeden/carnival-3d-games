import React, { useState, useRef, useEffect } from 'react';

const SkeeBallLane = ({ onScore, disabled }) => {
    const [isRolling, setIsRolling] = useState(false);
    const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const laneRef = useRef(null);

    const holes = [
        { value: 50, position: 0 },
        { value: 40, position: 20 },
        { value: 30, position: 40 },
        { value: 20, position: 60 },
        { value: 10, position: 80 }
    ];

    const handleMouseDown = (e) => {
        if (disabled) return;
        setIsDragging(true);
        const rect = laneRef.current.getBoundingClientRect();
        setStartPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const rect = laneRef.current.getBoundingClientRect();
        setBallPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        setIsRolling(true);
        
        // Calculate velocity based on drag distance
        const velocity = Math.sqrt(
            Math.pow(ballPosition.x - startPosition.x, 2) +
            Math.pow(ballPosition.y - startPosition.y, 2)
        );

        // Simulate ball rolling
        const rollInterval = setInterval(() => {
            setBallPosition(prev => ({
                x: prev.x + velocity * 0.1,
                y: prev.y + 5
            }));

            // Check if ball hit any holes
            const hitHole = holes.find(hole => 
                Math.abs(ballPosition.x - hole.position) < 10 &&
                ballPosition.y > 80
            );

            if (hitHole) {
                clearInterval(rollInterval);
                setIsRolling(false);
                onScore(hitHole.value);
                setBallPosition({ x: 0, y: 0 });
            }

            // Reset if ball goes off track
            if (ballPosition.y > 100) {
                clearInterval(rollInterval);
                setIsRolling(false);
                setBallPosition({ x: 0, y: 0 });
            }
        }, 16);
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [isDragging]);

    return (
        <div 
            ref={laneRef}
            className="relative h-48 bg-amber-700 rounded-t-lg border-4 border-amber-900"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
        >
            {/* Holes */}
            {holes.map((hole, index) => (
                <div
                    key={index}
                    className="absolute w-8 h-8 bg-black rounded-full"
                    style={{
                        left: `${hole.position}%`,
                        top: '80%'
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                        {hole.value}
                    </div>
                </div>
            ))}

            {/* Ball */}
            <div
                className={`absolute w-6 h-6 bg-red-500 rounded-full shadow-lg transition-transform ${
                    isRolling ? 'animate-spin' : ''
                }`}
                style={{
                    left: `${ballPosition.x}px`,
                    top: `${ballPosition.y}px`,
                    cursor: disabled ? 'not-allowed' : 'grab'
                }}
            />
        </div>
    );
};

export default SkeeBallLane; 