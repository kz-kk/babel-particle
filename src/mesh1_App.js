// ./src/App.js
import './App.css';
import * as THREE from 'three';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// import circleImg from './assets/circle.png'; // テクスチャのインポート（現在は使用しない）

function CameraControls() {
  return <OrbitControls autoRotate autoRotateSpeed={-0.2} />;
}

function MeshSurface() {
  // const imgTex = useLoader(THREE.TextureLoader, circleImg); // テクスチャの読み込み（現在は使用しない）
  const meshRef = useRef();

  const tRef = useRef(0);
  const speed = 1; // 波の速度
  const frequency = 0.05; // 波の周波数
  const amplitude = 5; // 波の振幅

  useFrame((state, delta) => {
    tRef.current += delta * speed;

    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < positions.length; i += 3) {
        vertex.fromArray(positions, i);
        const distance = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
        positions[i + 1] = Math.sin(distance * frequency - tRef.current) * amplitude;

        // 最初の3頂点のy座標をログに出力
        if (i < 9) {
          console.log(`Vertex ${i / 3}: y = ${positions[i + 1]}`);
        }
      }

      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[300, 300, 200, 200]} />
      <meshStandardMaterial
        // map={imgTex} // テクスチャをコメントアウト
        color={0x00ff00} // 緑色に設定
        side={THREE.DoubleSide}
        wireframe={true} // ワイヤーフレームを有効にする
      />
    </mesh>
  );
}

function AnimationCanvas() {
  return (
    <Canvas
      colorManagement={false}
      camera={{ position: [0, 150, 300], fov: 75 }} // カメラ位置を調整
    >
      <Suspense fallback={null}>
        <MeshSurface />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <axesHelper args={[100]} />
        <gridHelper args={[300, 30]} />
      </Suspense>
      <CameraControls />
    </Canvas>
  );
}

function App() {
  return (
    <div className="anim">
      <Suspense fallback={<div>Loading...</div>}>
        <AnimationCanvas />
      </Suspense>
    </div>
  );
}

export default App;
