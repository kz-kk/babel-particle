// App.js
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import circleImg from './assets/circle.png'; // テクスチャのパスを正しく設定
import './App.css';

function CameraControls() {
  return <OrbitControls autoRotate autoRotateSpeed={-0.2} />;
}

function ParticleWave() {
  const pointsRef = useRef();
  const imgTex = useLoader(THREE.TextureLoader, circleImg); // テクスチャの読み込み

  const count = 200; // グリッドのサイズを400x400に増やす
  const separation = 0.2; // 点と点の間隔を狭める
  const amplitude = 0.3; // 波の振幅をさらに大きくする
  const frequency = 1.5; // 波の周波数を下げて、間隔を広くする
  const speed = 0.8; // リップルの速度

  // ポイントの初期位置を計算
  const positions = useMemo(() => {
    const positions = [];
    for (let xi = 0; xi < count; xi++) {
      for (let zi = 0; zi < count; zi++) {
        const x = separation * (xi - count / 2);
        const z = separation * (zi - count / 2);
        const y = 0; // 初期Y座標
        positions.push(x, y, z);
      }
    }
    return new Float32Array(positions);
  }, [count, separation]);

  // フレームごとにY座標を更新（リップルアニメーション）
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionsArray = pointsRef.current.array;
    let i = 0;
    for (let xi = 0; xi < count; xi++) {
      for (let zi = 0; zi < count; zi++) {
        const x = separation * (xi - count / 2);
        const z = separation * (zi - count / 2);
        const distance = Math.sqrt(x * x + z * z);
        // リップル波の関数（周波数を下げ、振幅を大きくした）
        positionsArray[i + 1] = Math.sin((distance - time * speed) * frequency) * amplitude;
        i += 3;
      }
    }
    pointsRef.current.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          ref={pointsRef}
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={imgTex} // テクスチャを適用
        color={0xffffff} // 白色に設定
        size={0.01} // 粒子のサイズをさらに小さく設定
        sizeAttenuation
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending} // 加算ブレンディングを使用
      />
    </points>
  );
}

function AnimationCanvas() {
  return (
    <Canvas camera={{ position: [10, 10, 20], fov: 60 }}>
      <color attach="background" args={['#000']} />
      {/* <ambientLight intensity={0.3} /> */}
      <pointLight position={[10, 10, 10]} />
      <CameraControls />
      {/* <axesHelper args={[5]} /> */}
      {/* <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#ffffff"
        sectionSize={5}
        sectionThickness={0.5}
        sectionColor="#ffffff"
        // fadeDistance={50}
        fadeStrength={1}
        material-opacity={0.5}
        material-transparent
      /> */}
      <ParticleWave />
    </Canvas>
  );
}

function App() {
  return (
    <div className="anim">
      <AnimationCanvas />
    </div>
  );
}

export default App;
