// App.js
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader, extend } from '@react-three/fiber';
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

  const count = 100; // グリッドのサイズ（100x100）
  const separation = 0.5; // 点と点の間隔を狭める
  const amplitude = 1.5; // 波の振幅を減少
  const frequency = 1.0; // 波の周波数を調整

  // ポイントの初期位置と色を計算
  const { positions, colors } = useMemo(() => {
    const positions = [];
    const colors = [];
    for (let xi = 0; xi < count; xi++) {
      for (let zi = 0; zi < count; zi++) {
        const x = separation * (xi - count / 2);
        const z = separation * (zi - count / 2);
        const y = 0; // 初期Y座標
        positions.push(x, y, z);

        // 色のグラデーション（例: 青から赤へ）
        const hue = (x + z) / (count * separation) * 0.5; // 0から0.5の範囲
        const color = new THREE.Color();
        color.setHSL(hue, 1.0, 0.5);
        colors.push(color.r, color.g, color.b);
      }
    }
    return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
  }, [count, separation]);

  // フレームごとにY座標を更新
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionsArray = pointsRef.current.array;
    let i = 0;
    for (let xi = 0; xi < count; xi++) {
      for (let zi = 0; zi < count; zi++) {
        const x = separation * (xi - count / 2);
        const z = separation * (zi - count / 2);
        // 波の関数（より平面的なサイン波）
        positionsArray[i + 1] = Math.sin((x + z + time * frequency) * 0.5) * amplitude;
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
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        // vertexColors // 頂点ごとの色を使用
        map={imgTex} // テクスチャを適用
        color={0xffffff} // 白色に設定（テクスチャの色が反映されやすい）
        size={0.05} // 粒子のサイズをさらに小さく設定
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
    <Canvas camera={{ position: [0, 5, 20], fov: 75 }}>
      <color attach="background" args={['#000']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} />
      <CameraControls />
      {/* <axesHelper args={[5]} /> */}
      {/* <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#ffffff"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#ffffff"
        fadeDistance={30}
        fadeStrength={1}
        opacity={0.1}
        material-opacity={0.1}
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
