import React, { useState, useEffect } from 'react';
import Game3D from './game/Game3D';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from './ui/card';
import { preloadAudio, playSound, toggleMute, getMuteState, toggleMusicMute, getMusicMuteState } from '@/lib/audio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import score1Audio from '@assets/audio/score-1.mp3';
import score3Audio from '@assets/audio/score-3.mp3';
import score5Audio from '@assets/audio/score-5.mp3';
import ambientMusicAudio from '@assets/audio/ambient-music.mp3';
import winAudio from '@assets/audio/win.mp3';

// Audio files to preload
const audioFiles = {
    score1: score1Audio,
    score3: score3Audio,
    score5: score5Audio,
    ambientMusic: ambientMusicAudio,
    win: winAudio
};

const Game = ({ onSceneReady }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [audioReady, setAudioReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [scoreStats, setScoreStats] = useState({
        total: 0,
        ones: 0,
        twos: 0,
        threes: 0
    });

    // Initialize audio only once when component mounts
    useEffect(() => {
        preloadAudio(audioFiles).then(() => {
            setAudioReady(true);
            // Start ambient music at low volume
            playSound('ambientMusic', { 
                volume: 0.1, 
                loop: true,
                isMusic: true
            });
        });
    }, []);

    // Only adjust volume when game state changes
    useEffect(() => {
        if (!audioReady) return;

        const volume = gameStarted ? 0.3 : 0.1;
        // Use the audio API to adjust volume without restarting playback
        const audio = document.querySelector(`audio[data-sound="ambientMusic"]`);
        if (audio) {
            audio.volume = volume;
        }
    }, [gameStarted, audioReady]);

    // Handle mute toggle
    const handleMuteToggle = () => {
        const newMuteState = toggleMute();
        setIsMuted(newMuteState);
    };

    // Handle music mute toggle
    const handleMusicMuteToggle = () => {
        const newMusicMuteState = toggleMusicMute();
        setIsMusicMuted(newMusicMuteState);
    };

    const handleSceneReady = () => {
        if (onSceneReady) {
            onSceneReady();
        }
    };

    const handleScore = (points) => {
        // Play appropriate scoring sound
        const soundKey = `score${points}`;
        if (audioFiles[soundKey] && audioReady) {
            const playbackRate = points >= 3 ? (points === 5 ? 1.1 : 1.05) : 1.0;
            playSound(soundKey, { 
                volume: 0.3,
                playbackRate
            });
        }

        // Update score statistics
        setScoreStats(prev => {
            const updates = {
                total: prev.total + points
            };
            
            if (points === 1) updates.ones = prev.ones + 1;
            else if (points === 3) updates.twos = prev.twos + 1;
            else if (points === 5) updates.threes = prev.threes + 1;
            
            return { ...prev, ...updates };
        });
    };

    const startGame = () => {
        setGameStarted(true);
        setTimeLeft(30);
        setScoreStats({ total: 0, ones: 0, twos: 0, threes: 0 });
    };

    const resetGame = () => {
        setGameStarted(false);
        setTimeLeft(30);
        setScoreStats({ total: 0, ones: 0, twos: 0, threes: 0 });
    };

    useEffect(() => {
        let timer;
        if (gameStarted && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameStarted) {
            setGameStarted(false);
            // Play win sound when game ends
            if (audioReady) {
                playSound('win', { volume: 0.5 });
            }
        }
        
        return () => clearTimeout(timer);
    }, [timeLeft, gameStarted, audioReady]);

    return (
        <div className="relative min-h-svh">
            {/* Timer UI in top center */}
            {gameStarted && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Card className="bg-black/10 py-0">
                        <CardContent className="p-2 md:p-4">
                            <div className="text-xl md:text-5xl font-bold text-yellow-400 tabular-nums">
                                {timeLeft}s
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Scoreboard UI in top left */}
            {gameStarted && (
                <div className="absolute top-4 left-4 z-10">
                    <Card className="bg-black/10 py-0">
                        <CardContent className="p-2 md:p-4">
                            {/* Score statistics */}
                            <div className="text-xl md:text-6xl font-bold text-yellow-400 tabular-nums">
                                {scoreStats.total}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Audio controls in top right */}
            {gameStarted && (
                <div className="absolute top-4 right-4 z-10 flex flex-col md:flex-row gap-2">
                    <Button 
                        onClick={handleMusicMuteToggle}
                        className={`${isMusicMuted ? 'bg-gray-500' : 'bg-blue-500'} hover:bg-opacity-80 text-white`}
                    >
                        {isMusicMuted ? '🎵' : '🎵'}
                    </Button>
                    <Button 
                        onClick={handleMuteToggle}
                        className={`${isMuted ? 'bg-gray-500' : 'bg-green-500'} hover:bg-opacity-80 text-white`}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </Button>
                    <Button 
                        onClick={resetGame}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        🔄
                    </Button>
                </div>
            )}

            {/* Game UI Overlay */}
            {!gameStarted && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    {timeLeft === 0 ? (
                        <div className="text-center">
                            <div className="text-7xl md:text-9xl font-bold text-yellow-400 mb-2 drop-shadow-lg">
                                {scoreStats.total}
                            </div>
                            <div className="text-xl md:text-3xl text-white font-medium">
                                Your Score
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 justify-center mt-10">
                                <Button
                                    onClick={startGame}
                                    className="bg-yellow-500 hover:bg-yellow-600 hover:cursor-pointer text-black font-bold py-6 px-8 md:py-8 md:px-12 text-2xl md:text-4xl rounded-xl drop-shadow-lg"
                                >
                                    PLAY AGAIN
                                </Button>
                                <Button
                                    onClick={() => setShowInfoModal(true)}
                                    className="bg-blue-500 hover:bg-blue-600 hover:cursor-pointer text-white font-bold py-6 px-8 md:py-8 md:px-12 text-2xl md:text-4xl rounded-xl drop-shadow-lg"
                                >
                                    INFO
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                onClick={startGame}
                                className="bg-yellow-500 hover:bg-yellow-600 hover:cursor-pointer text-black font-bold py-6 md:py-8 px-8 md:px-12 text-2xl md:text-4xl rounded-xl drop-shadow-lg"
                            >
                                START
                            </Button>
                            <Button
                                onClick={() => setShowInfoModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 hover:cursor-pointer text-white font-bold py-6 md:py-8 px-8 md:px-12 text-2xl  rounded-xl drop-shadow-lg"
                            >
                                INFO
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Info Modal */}
            <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
                <DialogContent className="bg-gray-900 text-white border-yellow-500/50 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-400">Tech Stack Information</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-400">Frontend</h3>
                            <ul className="list-disc pl-5 mt-2">
                                <li>React - Frontend UI library</li>
                                <li>Three.js - 3D rendering engine</li>
                                <li>React Three Fiber - React renderer for Three.js</li>
                                <li>React Three Cannon - Physics engine for Three.js</li>
                                <li>TailwindCSS - Utility-first CSS framework</li>
                                <li>shadcn/ui - UI component library</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-400">Audio</h3>
                            <ul className="list-disc pl-5 mt-2">
                                <li>Web Audio API - For spatial audio and effects</li>
                                <li>Custom audio management system</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-red-400">Physics</h3>
                            <ul className="list-disc pl-5 mt-2">
                                <li>cannon.js - Physics simulation</li>
                                <li>Custom collision detection system</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-purple-400">Developer</h3>
                            <ul className="list-disc pl-5 mt-2">
                                <li>Developed by <a href="https://twitter.com/rakeden" className="text-purple-400 hover:text-purple-500">@rakeden</a></li>
                                <li>Passionate about creating interactive web experiences</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={() => setShowInfoModal(false)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3D Game Scene */}
            <Game3D onScore={handleScore} onSceneReady={handleSceneReady} />
        </div>
    );
};

export default Game; 