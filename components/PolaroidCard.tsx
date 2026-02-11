/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { DraggableCardContainer, DraggableCardBody } from './ui/draggable-card';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

type ImageStatus = 'pending' | 'done' | 'error';

interface PolaroidCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    dragConstraintsRef?: React.RefObject<HTMLElement>;
    onShake?: (caption: string) => void;
    onDownload?: (caption: string) => void;
    isMobile?: boolean;
}

const DEVELOPING_STEPS = [
    "Exposing film...",
    "Submerging...",
    "Developing...",
    "Fixing image...",
    "Rinsing...",
    "Drying..."
];

const DevelopingState = () => {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % DEVELOPING_STEPS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
            {/* Film Grain Effect Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat animate-pulse"></div>
            
            {/* Chemical Wash Effect */}
            <motion.div 
                animate={{ 
                    y: ['100%', '-100%'],
                    opacity: [0, 0.2, 0]
                }}
                transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-transparent to-transparent pointer-events-none"
            />

            {/* Pulsating Darkroom Light */}
            <motion.div 
                animate={{ 
                    opacity: [0.4, 1, 0.4],
                    scale: [0.95, 1.05, 0.95],
                    boxShadow: [
                        "0 0 20px 5px rgba(220, 38, 38, 0.2)",
                        "0 0 40px 10px rgba(220, 38, 38, 0.5)",
                        "0 0 20px 5px rgba(220, 38, 38, 0.2)"
                    ]
                }}
                transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="w-10 h-10 rounded-full bg-red-600/30 blur-md mb-6 relative z-10"
            />

            <div className="flex flex-col items-center gap-4 z-10">
                <div className="relative h-6 w-48 overflow-hidden flex justify-center">
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={stepIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="font-permanent-marker text-neutral-500 text-xs tracking-[0.2em] uppercase whitespace-nowrap"
                        >
                            {DEVELOPING_STEPS[stepIndex]}
                        </motion.span>
                    </AnimatePresence>
                </div>
                
                {/* Progress-like visual bar */}
                <div className="w-32 h-[1px] bg-neutral-800 relative overflow-hidden">
                    <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-red-500/50 w-1/3"
                    />
                </div>
            </div>

            {/* Ambient Shimmer */}
            <motion.div 
                animate={{ 
                    opacity: [0.05, 0.1, 0.05],
                    rotate: [0, 360]
                }}
                transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none"
            />
        </div>
    );
};

const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 p-6 text-center">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-neutral-500 text-xs font-medium">Failed to expose film</span>
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500 group-hover:text-neutral-400 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-permanent-marker text-xl">Insert Film</span>
    </div>
);


const PolaroidCard: React.FC<PolaroidCardProps> = ({ imageUrl, caption, status, error, dragConstraintsRef, onShake, onDownload, isMobile }) => {
    const [isDeveloped, setIsDeveloped] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const lastShakeTime = useRef(0);
    const lastVelocity = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (status === 'pending') {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
        if (status === 'done' && imageUrl) {
            // When a new image comes in, reset development state to trigger animation
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
    }, [imageUrl, status]);

    useEffect(() => {
        if (isImageLoaded) {
            const timer = setTimeout(() => {
                setIsDeveloped(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isImageLoaded]);

    const handleDragStart = () => {
        lastVelocity.current = { x: 0, y: 0 };
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!onShake || isMobile) return;

        const velocityThreshold = 1500;
        const shakeCooldown = 2000;

        const { x, y } = info.velocity;
        const { x: prevX, y: prevY } = lastVelocity.current;
        const now = Date.now();

        const magnitude = Math.sqrt(x * x + y * y);
        const dotProduct = (x * prevX) + (y * prevY);

        if (magnitude > velocityThreshold && dotProduct < 0 && (now - lastShakeTime.current > shakeCooldown)) {
            lastShakeTime.current = now;
            onShake(caption);
        }

        lastVelocity.current = { x, y };
    };

    const cardInnerContent = (
        <>
            <div className="w-full bg-neutral-900 shadow-inner flex-grow relative overflow-hidden group">
                <AnimatePresence mode="wait">
                    {status === 'pending' && (
                        <motion.div 
                            key="developing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <DevelopingState />
                        </motion.div>
                    )}
                    
                    {status === 'error' && (
                        <motion.div 
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0"
                        >
                            <ErrorDisplay />
                        </motion.div>
                    )}

                    {status === 'done' && imageUrl && (
                        <motion.div 
                            key="image"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0"
                        >
                            <div className={cn(
                                "absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity duration-300",
                                !isMobile && "opacity-0 group-hover:opacity-100",
                            )}>
                                {onDownload && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDownload(caption);
                                        }}
                                        className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                                        aria-label={`Download image for ${caption}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                )}
                                 {isMobile && onShake && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onShake(caption);
                                        }}
                                        className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                                        aria-label={`Regenerate image for ${caption}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1 1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div
                                className={`absolute inset-0 z-10 bg-[#12100e] transition-opacity duration-[5000ms] ease-out pointer-events-none ${
                                    isDeveloped ? 'opacity-0' : 'opacity-100'
                                }`}
                                aria-hidden="true"
                            />
                            
                            <img
                                key={imageUrl}
                                src={imageUrl}
                                alt={caption}
                                onLoad={() => setIsImageLoaded(true)}
                                className={`w-full h-full object-cover transition-all duration-[6000ms] ease-in-out ${
                                    isDeveloped 
                                    ? 'opacity-100 filter-none scale-100' 
                                    : 'opacity-30 filter sepia(1) contrast(1.4) brightness(0.4) scale-110'
                                }`}
                                style={{ opacity: isImageLoaded ? undefined : 0 }}
                            />
                        </motion.div>
                    )}

                    {status === 'done' && !imageUrl && (
                        <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0"
                        >
                            <Placeholder />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center px-2">
                <p className={cn(
                    "font-permanent-marker text-lg truncate transition-colors duration-500",
                    status === 'done' && imageUrl ? 'text-black/80' : 'text-neutral-500'
                )}>
                    {caption}
                </p>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <div className="bg-neutral-100 p-4 pb-16 flex flex-col items-center justify-start aspect-[3/4] w-80 max-w-full rounded-sm shadow-md relative overflow-hidden">
                {cardInnerContent}
            </div>
        );
    }

    return (
        <DraggableCardContainer>
            <DraggableCardBody 
                className="!p-4 !pb-16 flex flex-col items-center justify-start aspect-[3/4] w-80 max-w-full"
                dragConstraintsRef={dragConstraintsRef}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
            >
                {cardInnerContent}
            </DraggableCardBody>
        </DraggableCardContainer>
    );
};

export default PolaroidCard;
