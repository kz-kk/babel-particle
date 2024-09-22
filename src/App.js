// App.js
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { createNoise3D } from 'simplex-noise';
import ParticleText from './components/ParticleText';
import { useSpring, animated, a } from '@react-spring/three';

import circleImg from './assets/circle.png';
import './App.css';


function CameraControls({ position, up, target }) {
  const { camera } = useThree();
  
  const spring = useSpring({
    to: { position: position, up: up, target: target },
    config: { duration: 3000 }, // アニメーション時間を3秒に延長
  });

  useFrame(() => {
    camera.position.set(...spring.position.get());
    camera.up.set(...spring.up.get());
    camera.lookAt(...spring.target.get());
    camera.updateProjectionMatrix();
  });

  return <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} />;
}

function ParticleWave() {
  const pointsRef = useRef();
  const imgTex = useLoader(THREE.TextureLoader, circleImg);
  
  // Define noise3D within the ParticleWave component
  const noise3D = useMemo(() => createNoise3D(), []);

  const count = 80000;
  const radius = 5;
  const height = 10;
  const speed = 0.8; // 速度を上げて、粒子より早く集約するようにする
  const spiralSpeed = 0.3; // スパイラル速度も上げる
  const flowIntensity = 0.05; // フロー強度を少し強める

  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.3) * radius; // 0.5から0.3変更してより中心に集中させる
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (Math.random() * 2 - 1) * height * 0.5; // 高さ範囲を半分に縮小
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions.push(x, y, z);
    }
    return new Float32Array(positions);
  }, [count, radius, height]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionsArray = pointsRef.current.array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = positionsArray[i3];
      let y = positionsArray[i3 + 1];
      let z = positionsArray[i3 + 2];

      const noise = noise3D(x * 0.5, y * 0.5, z * 0.5 + time * 0.2) * flowIntensity;
      const angle = Math.atan2(z, x) + spiralSpeed * 0.02 + noise; // スパイラル速度を上げる
      const r = Math.sqrt(x * x + z * z);
      
      x = r * Math.cos(angle);
      z = r * Math.sin(angle);
      y += speed * 0.02 * (1 + noise); // 上昇速度を上げる

      if (y > height / 2) { // 上限に達したら下に戻す
        y = -height / 2;
        const newTheta = Math.random() * Math.PI * 2;
        const newPhi = Math.acos(2 * Math.random() - 1);
        const newR = Math.random() * radius;
        x = newR * Math.sin(newPhi) * Math.cos(newTheta);
        z = newR * Math.sin(newPhi) * Math.sin(newTheta);
      }

      positionsArray[i3] = x;
      positionsArray[i3 + 1] = y;
      positionsArray[i3 + 2] = z;
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
        map={imgTex}
        color={0x66ffff}
        size={0.015} // サイズを0.02から0.01減少
        sizeAttenuation
        transparent={true}
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ParticleBand({ yPosition, count = 100000, height = 0.4, color = 0x66ffff }) { // height0.4に増加
  const pointsRef = useRef();
  const imgTex = useLoader(THREE.TextureLoader, circleImg);
  const { viewport } = useThree();
  const noise3D = useMemo(() => createNoise3D(), []);

  const positions = useMemo(() => {
    const positions = [];
    const aspect = viewport.width / viewport.height;
    const width = viewport.width * 1.2; // 幅を1.2倍に調整して密度を増加
    const depth = width / aspect;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width;
      const y = yPosition + (Math.random() - 0.5) * height * 2; // 高さの範囲をさらに拡大
      const z = (Math.random() - 0.5) * depth;
      positions.push(x, y, z);
    }
    return new Float32Array(positions);
  }, [count, height, yPosition, viewport.width, viewport.height]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionsArray = pointsRef.current.array;
    const width = viewport.width * 1.5;
    const aspect = viewport.width / viewport.height;
    const depth = width / aspect;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = positionsArray[i3];
      let y = positionsArray[i3 + 1];
      let z = positionsArray[i3 + 2];

      // ノイズを使用してより複雑な動きを生成
      const noiseX = noise3D(x * 0.1, y * 0.1, time * 0.1) * 0.02;
      const noiseY = noise3D(y * 0.1, z * 0.1, time * 0.1) * 0.02;
      const noiseZ = noise3D(z * 0.1, x * 0.1, time * 0.1) * 0.02;

      x += noiseX;
      y += noiseY + Math.sin(x * 0.3 + time * 0.2) * 0.005; // 上下の動きを追加
      z += noiseZ;

      // 範囲外に出た粒子をリセット
      if (x < -width / 2 || x > width / 2 || 
          y < yPosition - height || y > yPosition + height || 
          z < -depth / 2 || z > depth / 2) {
        x = (Math.random() - 0.5) * width;
        y = yPosition + (Math.random() - 0.5) * height * 2;
        z = (Math.random() - 0.5) * depth;
      }

      positionsArray[i3] = x;
      positionsArray[i3 + 1] = y;
      positionsArray[i3 + 2] = z;
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
        map={imgTex}
        color={color}
        size={0.015}
        sizeAttenuation
        transparent={true}
        opacity={0.5} // 不透明度を上げて、より濃く見せる
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function MagicCircle({ fadeOut, fadeIn, scale }) {
  const pointsRef = useRef();
  const groupRef = useRef();
  const imgTex = useLoader(THREE.TextureLoader, circleImg);
  const noise3D = useMemo(() => createNoise3D(), []);

  const count = 100000; // 粒子数を増やす
  const radius = 3;
  const innerRadius = 1.5; // 内側の円の半径

  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (radius - innerRadius) + innerRadius;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const y = (Math.random() - 0.5) * 0.05; // より平面に近づける
      positions.push(x, y, z);
    }
    return new Float32Array(positions);
  }, [count, radius, innerRadius]);

  const rotationSpeed = useRef(0.0005); // 初期回転速度
  const maxRotationSpeed = 0.002; // 最大回転速度を増加
  const rotationAcceleration = 0.000002; // 加速��を加

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionsArray = pointsRef.current.array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let x = positionsArray[i3];
      let y = positionsArray[i3 + 1];
      let z = positionsArray[i3 + 2];

      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);
      
      // 回転速度を半径に応じて変える
      const rotationSpeedValue = rotationSpeed.current * (1 - (r - innerRadius) / (radius - innerRadius));
      const newAngle = angle + rotationSpeedValue * 0.02;

      // ノイズを使って微妙な揺らぎを加える
      const noise = noise3D(x * 0.5, y * 0.5, z * 0.5 + time * 0.2) * 0.01;
      
      x = r * Math.cos(newAngle) + noise;
      z = r * Math.sin(newAngle) + noise;
      y += Math.sin(time * 2 + r * 2) * 0.001; // 上下の動きを小さくする

      // フェードアウト時の粒子の動き
      if (fadeOut > 0) {
        const fadeOutEffect = fadeOut * 0.2; // フェードアウト効果を強める
        x += (Math.random() - 0.5) * fadeOutEffect;
        y += (Math.random() - 0.5) * fadeOutEffect;
        z += (Math.random() - 0.5) * fadeOutEffect;
      }

      positionsArray[i3] = x;
      positionsArray[i3 + 1] = y;
      positionsArray[i3 + 2] = z;
    }
    pointsRef.current.needsUpdate = true;

    // グループの回転を更新
    rotationSpeed.current = Math.min(maxRotationSpeed, rotationSpeed.current + rotationAcceleration);
    groupRef.current.rotation.y += rotationSpeed.current;

    // グループのスケールを更新
    groupRef.current.scale.set(scale, scale, scale);

    // フェードアウト時に回転速度を上げる
    if (fadeOut > 0) {
      groupRef.current.rotation.y += fadeOut * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
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
          map={imgTex}
          color={0x00ffff} // 青い蛍光色
          size={0.015}
          sizeAttenuation
          transparent={true}
          opacity={Math.min(fadeIn, Math.max(0, 0.8 - fadeOut))} // フェードインとフェードアウトを組み合わせる
          blending={THREE.AdditiveBlending}
        />
      </points>
      <MagicCircleDecorations radius={radius} innerRadius={innerRadius} fadeOut={fadeOut} fadeIn={fadeIn} />
    </group>
  );
}

// 魔法陣の装飾的な要素を追加るコンポーネント
function MagicCircleDecorations({ radius, innerRadius, fadeOut, fadeIn }) {
  const outerCircleRef = useRef();
  const innerCircleRef = useRef();
  const linesRef = useRef([]);

  useEffect(() => {
    // 外側の円を描画
    const outerCircleGeometry = new THREE.BufferGeometry();
    const outerCircleVertices = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      outerCircleVertices.push(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    }
    outerCircleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outerCircleVertices, 3));
    outerCircleRef.current.geometry = outerCircleGeometry;

    // 内側の円を描画
    const innerCircleGeometry = new THREE.BufferGeometry();
    const innerCircleVertices = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      innerCircleVertices.push(innerRadius * Math.cos(angle), 0, innerRadius * Math.sin(angle));
    }
    innerCircleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(innerCircleVertices, 3));
    innerCircleRef.current.geometry = innerCircleGeometry;
  }, [radius, innerRadius]);

  useFrame(() => {
    const opacity = Math.min(fadeIn, Math.max(0, 1 - fadeOut * 2)); // フェードインとフェードアウトを組み合わせる
    outerCircleRef.current.material.opacity = opacity;
    innerCircleRef.current.material.opacity = opacity;
    linesRef.current.forEach(line => {
      line.material.opacity = opacity;
    });

    if (fadeOut) {
      // 霧散エフェクト
      const scatter = fadeOut * 1;
      outerCircleRef.current.position.y = (Math.random() - 0.5) * scatter;
      innerCircleRef.current.position.y = (Math.random() - 0.5) * scatter;
      linesRef.current.forEach(line => {
        line.position.y = (Math.random() - 0.5) * scatter;
      });
    }
  });

  return (
    <group>
      <line ref={outerCircleRef}>
        <lineBasicMaterial color={0x00ffff} linewidth={2} transparent={true} />
      </line>
      <line ref={innerCircleRef}>
        <lineBasicMaterial color={0x00ffff} linewidth={2} transparent={true} />
      </line>
      {[0, 60, 120, 180, 240, 300].map((angle, index) => (
        <line key={index} ref={el => linesRef.current[index] = el}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                Math.cos(angle * Math.PI / 180) * innerRadius,
                0,
                Math.sin(angle * Math.PI / 180) * innerRadius,
                Math.cos(angle * Math.PI / 180) * radius,
                0,
                Math.sin(angle * Math.PI / 180) * radius,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={0x00ffff} linewidth={2} transparent={true} />
        </line>
      ))}
    </group>
  );
}

function Lightning() {
  const [lightnings, setLightnings] = useState([]);

  const createLightningPath = (startX, endX, segments) => {
    const path = [];
    let x = startX;
    let y = 5;
    path.push(new THREE.Vector3(x, y, 0));

    for (let i = 0; i < segments; i++) {
      const newX = x + (endX - x) / segments + (Math.random() - 0.5) * 2; // より大きな横方向の変動
      const newY = y - 10 / segments + (Math.random() - 0.5) * 1; // より大きな縦方向の変動
      path.push(new THREE.Vector3(newX, newY, 0));
      x = newX;
      y = newY;
    }

    path.push(new THREE.Vector3(endX, -5, 0));
    return path;
  };

  useEffect(() => {
    const createLightning = () => {
      const startX = (Math.random() - 0.5) * 20; // より広い範囲で開始
      const endX = startX + (Math.random() - 0.5) * 10; // より大きな終点の変動
      const segments = Math.floor(15 + Math.random() * 15); // セグメント数を増やしてよりギザギザに
      const path = createLightningPath(startX, endX, segments);

      const newLightning = {
        id: Date.now(),
        path: path,
        opacity: 0.8 + Math.random() * 0.2, // 0.8から1.0の間でランダムな透明度
        width: 0.05 + Math.random() * 0.05, // 0.05から0.1の間でランダムな幅（太くする）
      };
      setLightnings(prev => [...prev, newLightning]);
      
      setTimeout(() => {
        setLightnings(prev => prev.filter(l => l.id !== newLightning.id));
      }, 100 + Math.random() * 200); // 0.1秒から0.3秒の間でランダムに消える
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10%の確率で稲妻が発生（確率を下げる）
        createLightning();
      }
    }, 200); // 0.2秒ごとにチェック（間隔を増やす）

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {lightnings.map(lightning => (
        <Line
          key={lightning.id}
          points={lightning.path}
          color={0xffffff} // 白色
          lineWidth={lightning.width}
          transparent
          opacity={lightning.opacity}
        />
      ))}
    </>
  );
}

// 新しい ParticleCube コンポーネントを追加
function ParticleCube({ size = 2, particleCount = 20000 }) {
  const pointsRef = useRef();
  const groupRef = useRef();
  const imgTex = useLoader(THREE.TextureLoader, circleImg);
  const noise3D = useMemo(() => createNoise3D(), []);

  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
      const face = Math.floor(Math.random() * 6);
      let x, y, z;
      switch (face) {
        case 0: x = size / 2; y = (Math.random() - 0.5) * size; z = (Math.random() - 0.5) * size; break;
        case 1: x = -size / 2; y = (Math.random() - 0.5) * size; z = (Math.random() - 0.5) * size; break;
        case 2: x = (Math.random() - 0.5) * size; y = size / 2; z = (Math.random() - 0.5) * size; break;
        case 3: x = (Math.random() - 0.5) * size; y = -size / 2; z = (Math.random() - 0.5) * size; break;
        case 4: x = (Math.random() - 0.5) * size; y = (Math.random() - 0.5) * size; z = size / 2; break;
        case 5: x = (Math.random() - 0.5) * size; y = (Math.random() - 0.5) * size; z = -size / 2; break;
      }
      positions.push(x, y, z);
    }
    return new Float32Array(positions);
  }, [size, particleCount]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionsArray = pointsRef.current.array;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let x = positionsArray[i3];
      let y = positionsArray[i3 + 1];
      let z = positionsArray[i3 + 2];

      const noiseX = noise3D(x * 0.5, y * 0.5, z * 0.5 + time * 0.2) * 0.02;
      const noiseY = noise3D(y * 0.5, z * 0.5, x * 0.5 + time * 0.2) * 0.02;
      const noiseZ = noise3D(z * 0.5, x * 0.5, y * 0.5 + time * 0.2) * 0.02;

      // 粒子を立方体の表面に制限
      const maxDist = size / 2;
      if (Math.abs(x) === maxDist) x = Math.sign(x) * (maxDist + noiseX);
      else if (Math.abs(y) === maxDist) y = Math.sign(y) * (maxDist + noiseY);
      else if (Math.abs(z) === maxDist) z = Math.sign(z) * (maxDist + noiseZ);

      positionsArray[i3] = Math.max(-maxDist, Math.min(maxDist, x));
      positionsArray[i3 + 1] = Math.max(-maxDist, Math.min(maxDist, y));
      positionsArray[i3 + 2] = Math.max(-maxDist, Math.min(maxDist, z));
    }
    pointsRef.current.needsUpdate = true;

    // 立方体全体の回転
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    groupRef.current.rotation.y += 0.002;
    groupRef.current.rotation.z = Math.cos(time * 0.2) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <points>
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
          map={imgTex}
          color={0x00ffff}
          size={0.03}
          sizeAttenuation
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function AnimationCanvas() {
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showLogo, setShowLogo] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showMagicCircle, setShowMagicCircle] = useState(false);
  const [cameraState, setCameraState] = useState({
    position: [0, 0, 7],
    up: [0, 1, 0],
    target: [0, 0, 0]
  });
  const [showCastle, setShowCastle] = useState(false);
  const [magicCircleFadeOut, setMagicCircleFadeOut] = useState(0);
  const [magicCircleFadeIn, setMagicCircleFadeIn] = useState(0);
  const [magicCircleScale, setMagicCircleScale] = useState(1);
  const [showCube, setShowCube] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    const logoTimer = setTimeout(() => setShowLogo(true), 3000);
    const buttonTimer = setTimeout(() => setShowButtons(true), 3000);
    const magicCircleTimer = setTimeout(() => {
      // カメラの動きを7段階に分け、より魔法陣に寄せる
      const step1 = setTimeout(() => {
        setCameraState({
          position: [2, 0.5, 5],
          up: [0, 1, 0],
          target: [0, 0, 0]
        });
      }, 0);

      const step2 = setTimeout(() => {
        setCameraState({
          position: [3, 1, 3],
          up: [0, 1, -0.2],
          target: [0, 0, 0]
        });
      }, 1000);

      const step3 = setTimeout(() => {
        setCameraState({
          position: [4, 1.5, 1],
          up: [0, 1, -0.4],
          target: [0, 0, 0]
        });
      }, 2000);

      const step4 = setTimeout(() => {
        setCameraState({
          position: [3, 2, -1],
          up: [0, 1, -0.6],
          target: [0, 0, 0]
        });
      }, 3000);

      const step5 = setTimeout(() => {
        setCameraState({
          position: [1, 2.5, -2],
          up: [0, 1, -0.8],
          target: [0, 0, 0]
        });
      }, 4000);

      const step6 = setTimeout(() => {
        setCameraState({
          position: [0, 3, -2.5],
          up: [0, 0.2, -1],
          target: [0, 0, 0]
        });
      }, 5000);

      let fadeInInterval;
      let fadeOutInterval;
      let scaleInterval;
      let zoomInterval;

      const step7 = setTimeout(() => {
        setShowMagicCircle(true);
        setCameraState({
          position: [0, 5, 0], // カメラを魔法陣の真上に配置
          up: [0, 0, -1],
          target: [0, 0, 0]
        });
        // フェードイン開始
        fadeInInterval = setInterval(() => {
          setMagicCircleFadeIn(prev => {
            if (prev >= 1) {
              clearInterval(fadeInInterval);
              return 1;
            }
            return prev + 0.05; // 0.05ずつ増加（約1秒でフェードイン）
          });
        }, 50);
      }, 6000);

      // MagicCircleの表示時間を2秒延長
      const fadeOutTimer = setTimeout(() => {
        // 2秒かけてフェードアウト
        const fadeOutDuration = 2000;
        const startTime = Date.now();

        const fadeOutAnimation = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / fadeOutDuration, 1);
          setMagicCircleFadeOut(progress);
          setMagicCircleScale(1 + progress * 2);

          // カメラを徐々に引く
          setCameraState(prev => ({
            ...prev,
            position: [0, 5 + progress * 2, progress * 2],
          }));

          if (progress < 1) {
            requestAnimationFrame(fadeOutAnimation);
          } else {
            setShowMagicCircle(false);
            setShowCube(true);  // 立方体を表示
            setCameraState({
              position: [0, 0, 7],
              up: [0, 1, 0],
              target: [0, 0, 0]
            });
          }
        };

        fadeOutAnimation();
      }, 10000); // 10秒間表示した後にフェードアウト開始（2秒延長）

      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
        clearTimeout(step4);
        clearTimeout(step5);
        clearTimeout(step6);
        clearTimeout(step7);
        clearTimeout(fadeOutTimer);
        clearInterval(fadeInInterval);
        clearInterval(fadeOutInterval);
        clearInterval(scaleInterval);
        clearInterval(zoomInterval);
      };
    }, 5000);
    const castleTimer = setTimeout(() => {
      setShowMagicCircle(false);
      setShowCastle(true);
      setShowCube(true); // 立方体を表示
      setCameraState({
        position: [0, 0, 7],
        up: [0, 1, 0],
        target: [0, 0, 0]
      });
    }, 24000); // 24秒に変更（2秒延長）

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(logoTimer);
      clearTimeout(buttonTimer);
      clearTimeout(magicCircleTimer);
      clearTimeout(castleTimer);
    };
  }, []);

  return (
    <>
      <Canvas camera={{ fov: 75 }} style={{ width: canvasSize.width, height: canvasSize.height }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <CameraControls position={cameraState.position} up={cameraState.up} target={cameraState.target} />
        {!showMagicCircle && !showCube && <ParticleWave />}
        {showMagicCircle && (
          <MagicCircle 
            fadeOut={magicCircleFadeOut} 
            fadeIn={magicCircleFadeIn} 
            scale={magicCircleScale}
          />
        )}
        {showCube && <ParticleCube size={3} particleCount={30000} />}
        <ParticleBand yPosition={-4.5} color={0x66ffff} count={50000} height={0.4} />
        <Lightning />
      </Canvas>
      <div className="overlay-content">
        <h1
          className={`logo ${showLogo ? 'visible' : ''}`}
        >
          Babel & Zoltraak
        </h1>
        <h2 className={`leed ${showLogo ? 'visible' : ''}`}>
          言語を超え、文化を繋ぐ 新たな世界の創造へ
        </h2>
        <div className={`button-container ${showLogo ? 'visible' : ''}`}>
          <a href="https://www.babel-ai.com/development/editor" className="action-button" target="_blank">Babel Editor</a>
          <a href="https://www.babel-ai.com/development/systems" className="action-button" target="_blank">System List</a>
        </div>
        {/* <div className={`auth-links ${showLogo ? 'visible' : ''}`}>
          <a href="#signin">Sign In</a>
          <a href="#signup">Sign Up</a>
        </div> */}
      </div>
    </>
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