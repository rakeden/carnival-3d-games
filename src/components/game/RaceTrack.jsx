import React from 'react';

const RaceTrack = ({ horse, isWinner }) => {
    return (
        <div className="relative h-32 bg-amber-800 rounded-lg overflow-hidden border-4 border-amber-900">
            {/* Track markings */}
            <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-amber-600"></div>
            </div>
            
            {/* Horse */}
            <div 
                className={`absolute bottom-4 transition-all duration-300 ${
                    isWinner ? 'animate-bounce' : ''
                }`}
                style={{ left: `${horse.position}%` }}
            >
                <div className="relative w-16 h-16">
                    {/* Horse body */}
                    <div className="absolute inset-0 bg-amber-600 rounded-full transform rotate-45"></div>
                    {/* Horse head */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-amber-600 rounded-full"></div>
                    {/* Horse legs */}
                    <div className="absolute bottom-0 left-1/4 w-2 h-4 bg-amber-600"></div>
                    <div className="absolute bottom-0 right-1/4 w-2 h-4 bg-amber-600"></div>
                    {/* Horse name */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-sm font-bold">
                        {horse.name}
                    </div>
                </div>
            </div>

            {/* Finish line */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-black/50 flex items-center justify-center">
                <div className="w-1 h-full bg-white"></div>
            </div>
        </div>
    );
};

export default RaceTrack; 