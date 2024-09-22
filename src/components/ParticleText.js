import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleText({ text, font, ...props }) {
  const points = useRef();

  const particlesData = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 256;
    context.font = '200px ' + font;
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const particles = [];
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          particles.push({
            x: (x - canvas.width / 2) / 2,
            y: -(y - canvas.height / 2) / 2,
            z: 0,
            ox: (x - canvas.width / 2) / 2,
            oy: -(y - canvas.height / 2) / 2,
            oz: 0,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            vz: (Math.random() - 0.5) * 2,
          });
        }
      }
    }
    return particles;
  }, [text, font]);

  const positions = useMemo(() => {
    return new Float32Array(particlesData.length * 3);
  }, [particlesData]);

  useEffect(() => {
    if (points.current) {
      points.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, [positions]);

  useFrame(({ clock }) => {
    if (points.current) {
      const time = clock.getElapsedTime();
      for (let i = 0; i < particlesData.length; i++) {
        const particle = particlesData[i];
        const life = Math.sin(time * 0.5) * 0.5 + 0.5;
        particle.x = particle.ox + particle.vx * life * 20;
        particle.y = particle.oy + particle.vy * life * 20;
        particle.z = particle.oz + particle.vz * life * 20;

        positions[i * 3] = particle.x;
        positions[i * 3 + 1] = particle.y;
        positions[i * 3 + 2] = particle.z;
      }
      points.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={points} {...props}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesData.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={4} sizeAttenuation={true} transparent opacity={0.8} />
    </points>
  );
}

export default ParticleText;