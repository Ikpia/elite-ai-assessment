"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Cylinder, Stars, Environment, Box } from '@react-three/drei';
import * as THREE from 'three';

const QuantumParticle = ({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.2;
      ref.current.rotation.x = t * 0.5;
      ref.current.rotation.z = t * 0.3;
    }
  });

  return (
    <Sphere ref={ref} args={[1, 32, 32]} position={position} scale={scale}>
      <MeshDistortMaterial
        color={color}
        envMapIntensity={1}
        clearcoat={1}
        clearcoatRoughness={0}
        metalness={0.5}
        distort={0.4}
        speed={2}
      />
    </Sphere>
  );
};

const MacroscopicWave = () => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
       const t = state.clock.getElapsedTime();
       ref.current.rotation.x = Math.sin(t * 0.2) * 0.2;
       ref.current.rotation.y = t * 0.1;
    }
  });

  return (
    <Torus ref={ref} args={[3, 0.1, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#60A5FA" emissive="#60A5FA" emissiveIntensity={0.45} transparent opacity={0.6} wireframe />
    </Torus>
  );
}

const LANDMASSES: Array<Array<[number, number]>> = [
  [
    [0.12, 0.14], [0.18, 0.08], [0.28, 0.08], [0.34, 0.13], [0.35, 0.23],
    [0.31, 0.33], [0.26, 0.39], [0.22, 0.49], [0.18, 0.54], [0.14, 0.48],
    [0.12, 0.38], [0.1, 0.24]
  ],
  [
    [0.28, 0.48], [0.33, 0.52], [0.36, 0.62], [0.34, 0.77], [0.3, 0.92],
    [0.24, 0.98], [0.21, 0.88], [0.23, 0.73], [0.25, 0.61]
  ],
  [
    [0.53, 0.2], [0.59, 0.16], [0.66, 0.18], [0.69, 0.24], [0.66, 0.31],
    [0.6, 0.34], [0.56, 0.31]
  ],
  [
    [0.54, 0.34], [0.62, 0.34], [0.68, 0.4], [0.69, 0.53], [0.65, 0.66],
    [0.58, 0.74], [0.53, 0.68], [0.5, 0.54], [0.5, 0.42]
  ],
  [
    [0.69, 0.69], [0.76, 0.68], [0.81, 0.73], [0.79, 0.82], [0.72, 0.84], [0.67, 0.77]
  ],
  [
    [0.67, 0.36], [0.76, 0.34], [0.84, 0.4], [0.84, 0.5], [0.78, 0.55],
    [0.71, 0.52], [0.67, 0.44]
  ],
  [
    [0.82, 0.14], [0.87, 0.12], [0.91, 0.17], [0.88, 0.24], [0.83, 0.22]
  ]
];

function createGlobeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;

  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  const { width, height } = canvas;

  const oceanGradient = context.createLinearGradient(0, 0, width, height);
  oceanGradient.addColorStop(0, '#0b2a49');
  oceanGradient.addColorStop(0.5, '#143d66');
  oceanGradient.addColorStop(1, '#081d34');
  context.fillStyle = oceanGradient;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 120; index += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 18 + Math.random() * 140;
    const alpha = 0.025 + Math.random() * 0.04;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const landGradient = context.createLinearGradient(0, 0, width, height);
  landGradient.addColorStop(0, '#d7e2ef');
  landGradient.addColorStop(0.5, '#b9cadf');
  landGradient.addColorStop(1, '#8ba4c4');

  context.fillStyle = landGradient;
  LANDMASSES.forEach((points) => {
    context.beginPath();
    points.forEach(([x, y], pointIndex) => {
      const px = x * width;
      const py = y * height;
      if (pointIndex === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    });
    context.closePath();
    context.fill();
  });

  const polarFade = context.createLinearGradient(0, 0, 0, height);
  polarFade.addColorStop(0, 'rgba(255,255,255,0.22)');
  polarFade.addColorStop(0.12, 'rgba(255,255,255,0)');
  polarFade.addColorStop(0.88, 'rgba(255,255,255,0)');
  polarFade.addColorStop(1, 'rgba(255,255,255,0.18)');
  context.fillStyle = polarFade;
  context.fillRect(0, 0, width, height);

  const vignette = context.createRadialGradient(width / 2, height / 2, height * 0.12, width / 2, height / 2, height * 0.7);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(5,15,30,0.34)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const RotatingGlobe = () => {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const globeMap = useMemo(() => createGlobeTexture(), []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (globeRef.current) {
      globeRef.current.rotation.y = elapsed * 0.18;
      globeRef.current.rotation.x = Math.sin(elapsed * 0.35) * 0.06;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = elapsed * 0.22;
    }
  });

  return (
    <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.08}>
      <group position={[0, 0, 0]}>
        <Sphere ref={globeRef} args={[1.8, 96, 96]}>
          <meshPhysicalMaterial
            map={globeMap || undefined}
            color="#dbeafe"
            metalness={0.06}
            roughness={0.82}
            clearcoat={0.28}
            clearcoatRoughness={0.7}
          />
        </Sphere>

        <Sphere ref={atmosphereRef} args={[1.9, 64, 64]}>
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.13} side={THREE.BackSide} />
        </Sphere>

        <Torus args={[2.25, 0.018, 20, 160]} rotation={[Math.PI / 2.7, 0.2, 0]}>
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.35} transparent opacity={0.5} />
        </Torus>
      </group>
    </Float>
  );
};

export const HeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <QuantumParticle position={[0, 0, 0]} color="#4F46E5" scale={1.2} />
          <MacroscopicWave />
        </Float>
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
           <QuantumParticle position={[-3, 1, -2]} color="#93C5FD" scale={0.5} />
           <QuantumParticle position={[3, -1, -3]} color="#BFDBFE" scale={0.6} />
        </Float>

        <Environment preset="city" />
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
    </div>
  );
};

export const QuantumComputerScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <ambientLight intensity={1} />
        <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={2} color="#60A5FA" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        <Environment preset="studio" />
        
        <Float rotationIntensity={0.4} floatIntensity={0.2} speed={1}>
          <group rotation={[0, 0, 0]} position={[0, 0.5, 0]}>
            {/* Main Cryostat Structure (Gold Chandelier) */}
            
            {/* Top Plate */}
            <Cylinder args={[1.2, 1.2, 0.1, 64]} position={[0, 1, 0]}>
              <meshStandardMaterial color="#93C5FD" metalness={1} roughness={0.15} />
            </Cylinder>
            
            {/* Middle Stage */}
            <Cylinder args={[1, 1, 0.1, 64]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#93C5FD" metalness={1} roughness={0.15} />
            </Cylinder>
            
            {/* Bottom Stage (Mixing Chamber) */}
            <Cylinder args={[0.6, 0.6, 0.1, 64]} position={[0, -0.6, 0]}>
              <meshStandardMaterial color="#60A5FA" metalness={1} roughness={0.15} />
            </Cylinder>

            {/* Connecting Rods */}
            <Cylinder args={[0.04, 0.04, 0.8, 16]} position={[0.5, 0.6, 0]}>
               <meshStandardMaterial color="#D1D5DB" metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.04, 0.04, 0.8, 16]} position={[-0.5, 0.6, 0]}>
               <meshStandardMaterial color="#D1D5DB" metalness={0.8} roughness={0.2} />
            </Cylinder>
             <Cylinder args={[0.04, 0.04, 0.8, 16]} position={[0, 0.6, 0.5]}>
               <meshStandardMaterial color="#D1D5DB" metalness={0.8} roughness={0.2} />
            </Cylinder>
             <Cylinder args={[0.04, 0.04, 0.8, 16]} position={[0, 0.6, -0.5]}>
               <meshStandardMaterial color="#D1D5DB" metalness={0.8} roughness={0.2} />
            </Cylinder>

             {/* Lower Rods */}
             <Cylinder args={[0.03, 0.03, 0.8, 16]} position={[0.2, -0.2, 0]}>
               <meshStandardMaterial color="#D1D5DB" metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.03, 0.03, 0.8, 16]} position={[-0.2, -0.2, 0]}>
               <meshStandardMaterial color="#D1D5DB" metalness={0.8} roughness={0.2} />
            </Cylinder>

            {/* Coils/Wires - Copper colored */}
            <Torus args={[0.7, 0.015, 16, 64]} position={[0, -0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
               <meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.3} />
            </Torus>
             <Torus args={[0.3, 0.015, 16, 64]} position={[0, -1, 0]} rotation={[Math.PI/2, 0, 0]}>
               <meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.3} />
            </Torus>
            
            {/* Central processor chip simulation at bottom */}
            <Box args={[0.2, 0.05, 0.2]} position={[0, -0.7, 0]}>
                <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.1} />
            </Box>
          </group>
        </Float>
      </Canvas>
    </div>
  );
}

export const SpinningGlobeScene: React.FC<{ className?: string }> = ({ className }) => {
  const globeVideoSrc =
    'https://video.wixstatic.com/video/3cb561_00f38b988e344eadbdc19a6a9a029f82/720p/mp4/file.mp4';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewportMode = () => setIsMobileViewport(mediaQuery.matches);

    syncViewportMode();
    mediaQuery.addEventListener('change', syncViewportMode);

    return () => {
      mediaQuery.removeEventListener('change', syncViewportMode);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      return;
    }

    const drawFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        rafRef.current = window.requestAnimationFrame(drawFrame);
        return;
      }

      const resolutionScale = isMobileViewport ? 0.55 : 1;
      const targetWidth = Math.max(320, Math.round(video.videoWidth * resolutionScale));
      const targetHeight = Math.max(320, Math.round(video.videoHeight * resolutionScale));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = frame;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];
        const maxChannel = Math.max(red, green, blue);
        const minChannel = Math.min(red, green, blue);
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        const chroma = maxChannel - minChannel;

        const isDarkNeutralBackground = luminance < 82 && chroma < 18;
        const isSoftVignetteBackground = luminance < 110 && chroma < 10;

        if (isDarkNeutralBackground) {
          data[index + 3] = 0;
          continue;
        }

        if (isSoftVignetteBackground) {
          const feather = Math.max(0, Math.min(1, (luminance - 60) / 50));
          data[index + 3] = Math.round(alpha * feather * 0.65);
          continue;
        }

        if (blue > red + 10 && blue > green + 6) {
          data[index] = Math.min(255, red + 10);
          data[index + 1] = Math.min(255, green + 10);
          data[index + 2] = Math.min(255, blue + 6);
        }
      }

      context.putImageData(frame, 0, 0);
      setIsReady(true);
      rafRef.current = window.requestAnimationFrame(drawFrame);
    };

    const start = () => {
      void video.play().catch(() => undefined);
      drawFrame();
    };

    if (video.readyState >= 2) {
      start();
    } else {
      video.addEventListener('loadeddata', start, { once: true });
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      video.pause();
    };
  }, [isMobileViewport]);

  return (
    <div className={className || 'relative h-full w-full'}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_42%,rgba(191,219,254,0.52),rgba(230,238,246,0.22)_34%,rgba(249,248,244,0)_72%)]" />
      <div className="relative flex h-full w-full items-start justify-center overflow-visible">
        <video
          ref={videoRef}
          className="hidden"
          src={globeVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          className={`h-[104%] w-[104%] -translate-y-[6%] object-contain drop-shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:h-[116%] sm:w-[116%] sm:-translate-y-[12%] sm:drop-shadow-[0_30px_80px_rgba(15,23,42,0.12)] ${isReady ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </div>
  );
};
