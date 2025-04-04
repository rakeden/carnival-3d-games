import React, { useState, useEffect } from 'react';
import Game from '../components/Game';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../components/ui/card';

// Loading screen component using shadcn UI with theme colors
const LoadingScreen = ({ onPlay, isLoaded }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10">
      <div className="flex flex-col items-center justify-center max-w-4xl w-full px-4">
        {/* Main Card */}
        <Card className="w-full max-w-2xl bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-primary-foreground">
                <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 tracking-wider text-center">
                    CARNIVAL GAMES
                </h1>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            {!isLoaded ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <div className="h-4 w-4 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-4 w-4 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-4 w-4 rounded-full bg-primary animate-bounce"></div>
                <span className="text-primary ml-2">Loading...</span>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                {/* How to Play Card */}
                <p className="text-xl md:text-2xl font-bold text-card-foreground text-center">How to Play</p>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <li className="flex flex-col items-center text-center">
                        <span className="text-2xl md:text-4xl inline-flex items-center justify-center w-10 h-10 rounded-full text-primary-foreground/20 font-bold">1</span>
                        <span className="text-card-foreground">Pick up a ball</span>
                    </li>
                    <li className="flex flex-col items-center text-center">
                        <span className="text-2xl md:text-4xl inline-flex items-center justify-center w-10 h-10 rounded-full text-primary-foreground/20 font-bold">2</span>
                        <span className="text-card-foreground">Throw it</span>
                    </li>
                    <li className="flex flex-col items-center text-center">
                        <span className="text-2xl md:text-4xl inline-flex items-center justify-center w-10 h-10 rounded-full text-primary-foreground/20 font-bold">3</span>
                        <span className="text-card-foreground">Score high in 30 seconds</span>
                    </li>
                </ul>
              </div>
            )}
          </CardContent>
          
          {isLoaded && (
            <CardFooter className="flex justify-center mt-4 pt-2 pb-6">
              <Button 
                onClick={onPlay}
                variant="default"
                size="lg"
              >
                Let's Play!
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

const Home = () => {
    const [sceneReady, setSceneReady] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    
    const handleStartGame = () => {
        setGameStarted(true);
    };
    
    // This function will be passed to Game to know when assets are loaded
    const handleSceneReady = () => {
        setSceneReady(true);
    };

    return (
        <div className="relative w-full h-screen">
            {!gameStarted && <LoadingScreen onPlay={handleStartGame} isLoaded={sceneReady} />}
            <div className={`transition-opacity duration-1000 ${gameStarted ? 'opacity-100' : 'opacity-20'}`}>
                <Game onSceneReady={handleSceneReady} />
            </div>
        </div>
    );
};

export default Home;
