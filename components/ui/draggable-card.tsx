/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { cn } from "../../lib/utils";
import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useVelocity,
  useAnimationControls,
  PanInfo,
} from "framer-motion";
 
export const DraggableCardBody = ({
  className,
  children,
  dragConstraintsRef,
  onDrag,
  onDragStart,
}: {
  className?: string;
  children?: React.ReactNode;
  dragConstraintsRef?: React.RefObject<HTMLElement>;
  onDrag?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onDragStart?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
 
  const velocityX = useVelocity(mouseX);
  const velocityY = useVelocity(mouseY);
 
  const springConfig = {
    stiffness: 150,
    damping: 20,
    mass: 0.5,
  };
 
  const rotateX = useSpring(
    useTransform(mouseY, [-300, 300], [15, -15]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-300, 300], [-15, 15]),
    springConfig,
  );
 
  const opacity = useSpring(
    useTransform(mouseX, [-300, 0, 300], [0.9, 1, 0.9]),
    springConfig,
  );
 
  const glareOpacity = useSpring(
    useTransform(mouseX, [-300, 0, 300], [0.3, 0, 0.3]),
    springConfig,
  );
 
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;

    const { clientX, clientY } = e;
    const { width, height, left, top } =
      cardRef.current?.getBoundingClientRect() ?? {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
      };
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    mouseX.set(deltaX);
    mouseY.set(deltaY);
  };
 
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };
 
  return (
    <motion.div
      ref={cardRef}
      drag
      dragConstraints={dragConstraintsRef}
      dragElastic={0.1}
      onDrag={onDrag}
      onDragStart={(event, info) => {
        setIsDragging(true);
        document.body.style.cursor = "grabbing";
        // Reset rotation on drag start for a cleaner "lifted" look
        controls.start({
          rotateX: 0,
          rotateY: 0,
          transition: { duration: 0.2 }
        });
        onDragStart?.(event, info);
      }}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        document.body.style.cursor = "default";
 
        const currentVelocityX = velocityX.get();
        const currentVelocityY = velocityY.get();
 
        const velocityMagnitude = Math.sqrt(
          currentVelocityX * currentVelocityX +
            currentVelocityY * currentVelocityY,
        );
        const bounce = Math.min(0.5, velocityMagnitude / 1500);
 
        animate(info.point.x, info.point.x + currentVelocityX * 0.2, {
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1],
          bounce,
          type: "spring",
          stiffness: 80,
          damping: 12,
          mass: 0.7,
        });
 
        animate(info.point.y, info.point.y + currentVelocityY * 0.2, {
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1],
          bounce,
          type: "spring",
          stiffness: 80,
          damping: 12,
          mass: 0.7,
        });
      }}
      style={{
        rotateX,
        rotateY,
        opacity,
        zIndex: isDragging ? 100 : 10,
        willChange: "transform, box-shadow",
      }}
      animate={controls}
      whileHover={{ 
        scale: 1.05, 
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)" 
      }}
      whileDrag={{ 
        scale: 1.1,
        boxShadow: "0 35px 60px -15px rgb(0 0 0 / 0.5)",
        cursor: 'grabbing' 
      }}
      whileTap={{ scale: 1.08 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative min-h-96 w-80 overflow-hidden rounded-sm bg-neutral-100 p-6 shadow-xl [transform-style:preserve-3d] transition-shadow duration-200",
        className,
      )}
    >
      {children}
      <motion.div
        style={{
          opacity: glareOpacity,
          background: "radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
          transform: "translate(-50%, -50%)",
          left: useTransform(mouseX, (v) => `${50 + v * 0.1}%`),
          top: useTransform(mouseY, (v) => `${50 + v * 0.1}%`),
          width: "200%",
          height: "200%",
        }}
        className="pointer-events-none absolute inset-0 select-none"
      />
    </motion.div>
  );
};
 
export const DraggableCardContainer = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className={cn("flex items-center justify-center [perspective:1200px]", className)}>{children}</div>
  );
};
