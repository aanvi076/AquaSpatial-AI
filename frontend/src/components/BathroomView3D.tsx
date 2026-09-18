import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  RotateCcw, 
  Layers, 
  Droplets, 
  Sparkles, 
  ShieldCheck
} from 'lucide-react';
import type { SpatialLayout, KohlerProduct, FixturePlacement } from '../types';
import { buildProductMesh, getPlacementCenterAndBounds } from './FixtureMeshBuilder';

interface BathroomView3DProps {
  layout: SpatialLayout | null;
  products: KohlerProduct[];
  selectedProductIds?: string[];
  roomLength?: number;
  roomWidth?: number;
  themeStyle?: string;
  onSelectFixture?: (productId: string) => void;
}

export const BathroomView3D: React.FC<BathroomView3DProps> = ({
  layout,
  products,
  selectedProductIds,
  roomLength = 10,
  roomWidth = 8,
  themeStyle = 'modern',
  onSelectFixture
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeFinish, setActiveFinish] = useState<'chrome' | 'matte_black' | 'gold'>('chrome');
  const [showClearances, setShowClearances] = useState<boolean>(true);
  const [showWaterSpray, setShowWaterSpray] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front'>('iso');
  const [selectedFixture, setSelectedFixture] = useState<{ placement: FixturePlacement; product: KohlerProduct } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number>(0);
  const fixturesGroupRef = useRef<THREE.Group | null>(null);
  const clearanceGroupRef = useRef<THREE.Group | null>(null);
  const waterParticlesRef = useRef<THREE.Points | null>(null);
  const onSelectFixtureRef = useRef(onSelectFixture);
  onSelectFixtureRef.current = onSelectFixture;

  // Mouse interaction state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const sphericalCoords = useRef({ radius: 24, theta: Math.PI / 4, phi: Math.PI / 3 });

  // Update camera position from spherical coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalCoords.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 2, 0);
  };

  const setCameraView = (preset: 'iso' | 'top' | 'front') => {
    setCameraPreset(preset);
    if (preset === 'iso') {
      sphericalCoords.current = { radius: 22, theta: Math.PI / 4, phi: Math.PI / 3 };
    } else if (preset === 'top') {
      sphericalCoords.current = { radius: 22, theta: 0.001, phi: 0.05 };
    } else if (preset === 'front') {
      sphericalCoords.current = { radius: 22, theta: 0, phi: Math.PI / 2.3 };
    }
    updateCameraPosition();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.008);

    // 2. Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 0.9);
    mainSun.position.set(15, 25, 15);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    scene.add(mainSun);

    const softFill = new THREE.DirectionalLight(0x88aaff, 0.4);
    softFill.position.set(-15, 12, -15);
    scene.add(softFill);

    // Downlight over bathroom
    const ceilingDownlight = new THREE.PointLight(0xfff3d6, 1.5, 30);
    ceilingDownlight.position.set(0, 9, 0);
    scene.add(ceilingDownlight);

    // 5. Room Geometry: Floor & Walls
    const roomL = layout ? layout.room_length : roomLength;
    const roomW = layout ? layout.room_width : roomWidth;
    const roomH = 8.5;

    // Floor Tile
    const floorGeo = new THREE.PlaneGeometry(roomL, roomW);
    const floorMat = new THREE.MeshStandardMaterial({
      color: themeStyle.includes('zen') ? 0xe2e8f0 : 0xf1f5f9,
      roughness: 0.3,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid on floor for scale
    const gridHelper = new THREE.GridHelper(Math.max(roomL, roomW), Math.max(roomL, roomW), 0x0f172a, 0xe2e8f0);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Wall enclosure (Back and Left walls for open stage view)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05
    });

    // Back wall (along room width at -roomL/2)
    const backWallGeo = new THREE.BoxGeometry(roomL, roomH, 0.2);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, roomH / 2, -roomW / 2 - 0.1);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall (along room length at -roomL/2)
    const leftWallGeo = new THREE.BoxGeometry(0.2, roomH, roomW);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-roomL / 2 - 0.1, roomH / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Wall trims / baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(roomL, 0.4, 0.25), baseboardMat);
    bbBack.position.set(0, 0.2, -roomW / 2 - 0.05);
    scene.add(bbBack);

    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, roomW), baseboardMat);
    bbLeft.position.set(-roomL / 2 - 0.05, 0.2, 0);
    scene.add(bbLeft);

    // 6. Create Groups for Fixtures & Clearances
    const fixturesGroup = new THREE.Group();
    fixturesGroupRef.current = fixturesGroup;
    scene.add(fixturesGroup);

    const clearanceGroup = new THREE.Group();
    clearanceGroupRef.current = clearanceGroup;
    scene.add(clearanceGroup);

    // 7. Mouse Orbit & Inspection Click Handlers
    let clickStartPos = { x: 0, y: 0 };
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      clickStartPos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      sphericalCoords.current.theta -= deltaX * 0.008;
      sphericalCoords.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, sphericalCoords.current.phi - deltaY * 0.008));

      updateCameraPosition();
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging.current = false;
      const dx = Math.abs(e.clientX - clickStartPos.x);
      const dy = Math.abs(e.clientY - clickStartPos.y);

      // Treat as click if mouse moved less than 6px
      if (dx < 6 && dy < 6 && cameraRef.current && fixturesGroupRef.current) {
        const rect = domElem.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const intersects = raycaster.intersectObjects(fixturesGroupRef.current.children, true);

        if (intersects.length > 0) {
          let cur: THREE.Object3D | null = intersects[0].object;
          while (cur && (!cur.userData || !cur.userData.product) && cur.parent && cur.parent !== fixturesGroupRef.current) {
            cur = cur.parent;
          }
          if (cur && cur.userData && cur.userData.product) {
            setSelectedFixture({
              placement: cur.userData.placement,
              product: cur.userData.product
            });
            if (onSelectFixtureRef.current) {
              onSelectFixtureRef.current(cur.userData.product.id);
            }
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalCoords.current.radius = Math.max(8, Math.min(45, sphericalCoords.current.radius + e.deltaY * 0.03));
      updateCameraPosition();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      // Animate shower spray particles if active
      if (waterParticlesRef.current && waterParticlesRef.current.geometry) {
        const positions = waterParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.12;
          if (positions[i] < 0.2) {
            positions[i] = 7.0;
          }
        }
        waterParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [layout, roomLength, roomWidth, themeStyle]);

  // Update Fixtures & Clearances when products, bundle, or layout change
  useEffect(() => {
    if (!fixturesGroupRef.current || !clearanceGroupRef.current) return;

    const fixturesGroup = fixturesGroupRef.current;
    const clearanceGroup = clearanceGroupRef.current;

    while (fixturesGroup.children.length > 0) {
      fixturesGroup.remove(fixturesGroup.children[0]);
    }
    while (clearanceGroup.children.length > 0) {
      clearanceGroup.remove(clearanceGroup.children[0]);
    }

    const activeProducts = selectedProductIds && selectedProductIds.length > 0
      ? products.filter(p => selectedProductIds.includes(p.id))
      : products;

    if (activeProducts.length === 0) return;

    const rLength = layout ? layout.room_length : roomLength;
    const rWidth = layout ? layout.room_width : roomWidth;

    const metalColors = {
      chrome: 0xd1d5db,
      matte_black: 0x18181b,
      gold: 0xd97706,
    };
    const metalProps = {
      chrome: { roughness: 0.1, metalness: 0.95 },
      matte_black: { roughness: 0.6, metalness: 0.2 },
      gold: { roughness: 0.2, metalness: 0.85 },
    };

    const mats = {
      chinaWhite: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.05,
      }),
      fixtureMetal: new THREE.MeshStandardMaterial({
        color: metalColors[activeFinish],
        ...metalProps[activeFinish],
      }),
      vanityWood: new THREE.MeshStandardMaterial({
        color: 0x3f3f46,
        roughness: 0.7,
        metalness: 0.1,
      }),
      countertop: new THREE.MeshStandardMaterial({
        color: 0xf4f4f5,
        roughness: 0.2,
        metalness: 0.1,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.5,
      }),
      mirror: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.0,
        metalness: 0.98,
      }),
      darkAccent: new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.5,
        metalness: 0.2,
      }),
    };

    activeProducts.forEach((product) => {
      const placement = layout?.placements.find(p => p.product_id === product.id);
      if (!placement) return;

      const { centerX, centerY, minX, minY, maxX, maxY } = getPlacementCenterAndBounds(placement);
      const worldX = centerX - rLength / 2;
      const worldZ = centerY - rWidth / 2;
      const rot = (placement.rotation || 0) * (Math.PI / 180);

      const meshResult = buildProductMesh(product, placement, mats);
      const fixtureMesh = meshResult.fixtureGroup;
      fixtureMesh.position.set(worldX, 0, worldZ);
      fixtureMesh.rotation.y = -rot;
      fixtureMesh.userData = { product, placement };
      fixturesGroup.add(fixtureMesh);

      // Add clearance overlay
      if (showClearances) {
        const reqFront = placement.clearance_front || (placement.category === 'toilet' ? 1.75 : placement.category === 'vanity' || placement.category === 'basin' ? 1.75 : 1.5);
        const rotDeg = (placement.rotation || 0) % 360;

        let clCenterX = centerX;
        let clCenterY = centerY;
        let clW = Math.max(0.5, maxX - minX);
        let clD = Math.max(0.5, maxY - minY);

        if (rotDeg === 0) {
          clCenterY = maxY + reqFront / 2;
          clD = reqFront;
        } else if (rotDeg === 90) {
          clCenterX = minX - reqFront / 2;
          clW = reqFront;
        } else if (rotDeg === 180) {
          clCenterY = minY - reqFront / 2;
          clD = reqFront;
        } else if (rotDeg === 270) {
          clCenterX = maxX + reqFront / 2;
          clW = reqFront;
        }

        const clGeo = new THREE.PlaneGeometry(Math.max(0.5, clW), Math.max(0.5, clD));
        const clMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide
        });
        const clMesh = new THREE.Mesh(clGeo, clMat);
        clMesh.rotation.x = -Math.PI / 2;
        clMesh.position.set(clCenterX - rLength / 2, 0.02, clCenterY - rWidth / 2);
        clearanceGroup.add(clMesh);
      }
    });

    // Water particles for shower if active
    if (showWaterSpray) {
      const showerPl = layout?.placements.find(p => p.category === 'shower');
      if (showerPl) {
        const { centerX, centerY } = getPlacementCenterAndBounds(showerPl);
        const pCount = 120;
        const pGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(pCount * 3);
        const sX = centerX - rLength / 2;
        const sZ = centerY - rWidth / 2;

        for (let i = 0; i < pCount; i++) {
          pPositions[i * 3] = sX + (Math.random() - 0.5) * 0.8;
          pPositions[i * 3 + 1] = Math.random() * 6.5 + 0.5;
          pPositions[i * 3 + 2] = sZ + (Math.random() - 0.5) * 0.8;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0x38bdf8,
          size: 0.04,
          transparent: true,
          opacity: 0.7
        });
        const pSystem = new THREE.Points(pGeo, pMat);
        waterParticlesRef.current = pSystem;
        fixturesGroup.add(pSystem);
      }
    }
  }, [layout, products, selectedProductIds, activeFinish, showClearances, showWaterSpray, roomLength, roomWidth]);

  const activeProductCount = selectedProductIds && selectedProductIds.length > 0
    ? products.filter(p => selectedProductIds.includes(p.id)).length
    : products.length;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Visual Studio Header & Segmented Toolbar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-grey-200)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--color-black)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
            3D Realistic Product Visualization
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-grey-500)' }}>
            (Left-click orbit • Right-click pan • Scroll zoom)
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Camera View Angle Selector */}
          <div className="seg-capsule">
            <button
              type="button"
              onClick={() => setCameraView('iso')}
              className={cameraPreset === 'iso' ? 'is-active' : ''}
            >
              Isometric
            </button>
            <button
              type="button"
              onClick={() => setCameraView('top')}
              className={cameraPreset === 'top' ? 'is-active' : ''}
            >
              Top Plan
            </button>
            <button
              type="button"
              onClick={() => setCameraView('front')}
              className={cameraPreset === 'front' ? 'is-active' : ''}
            >
              Front
            </button>
          </div>

          {/* Material Finish Switcher */}
          <div className="seg-capsule">
            <button
              type="button"
              onClick={() => setActiveFinish('chrome')}
              title="Polished Chrome"
              className={activeFinish === 'chrome' ? 'is-active' : ''}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                display: 'inline-block'
              }} />
              Chrome
            </button>
            <button
              type="button"
              onClick={() => setActiveFinish('matte_black')}
              title="Matte Black"
              className={activeFinish === 'matte_black' ? 'is-active' : ''}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#18181b',
                display: 'inline-block'
              }} />
              Black
            </button>
            <button
              type="button"
              onClick={() => setActiveFinish('gold')}
              title="French Gold / Brushed Brass"
              className={activeFinish === 'gold' ? 'is-active' : ''}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'inline-block'
              }} />
              Gold
            </button>
          </div>

          {/* Clearance Toggle */}
          <button
            type="button"
            onClick={() => setShowClearances(!showClearances)}
            className={`btn btn-sm ${showClearances ? 'btn-primary' : 'btn-secondary'}`}
            title="Toggle NKBA 3D Clearance Envelopes"
          >
            <Layers size={13} />
            <span>Clearance</span>
          </button>

          {/* Water Spray Toggle */}
          <button
            type="button"
            onClick={() => setShowWaterSpray(!showWaterSpray)}
            className={`btn btn-sm ${showWaterSpray ? 'btn-primary' : 'btn-secondary'}`}
            title="Toggle Katalyst Water Spray Animation"
          >
            <Droplets size={13} />
            <span>Water Flow</span>
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={() => setCameraView('iso')}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px' }}
            title="Reset Camera View"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div style={{ position: 'relative', width: '100%', height: '540px', backgroundColor: '#f8fafc' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

        {/* Legend / Overlay Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-grey-200)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            color: 'var(--color-grey-800)',
            boxShadow: 'var(--shadow-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={14} color="var(--color-eco-green)" />
            <span>
              {layout ? `${layout.room_length} × ${layout.room_width} ft` : `${roomLength} × ${roomWidth} ft`} &bull;{' '}
              {activeProductCount} {activeProductCount === 1 ? 'Fixture' : 'Fixtures'} Placed
            </span>
          </div>

          {showClearances && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #06b6d4',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              color: '#0891b2',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#06b6d4',
                display: 'inline-block'
              }} />
              <span>Cyan zones: NKBA / Kohler front clearances</span>
            </div>
          )}
        </div>

        {/* Fixture Inspection Tooltip Card */}
        {selectedFixture && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            maxWidth: '340px',
            width: 'calc(100% - 32px)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-grey-200)',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: 'var(--shadow-float)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: 'var(--color-grey-500)',
                  letterSpacing: '0.04em'
                }}>
                  {selectedFixture.placement.category.replace('_', ' ')}
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-grey-800)', margin: '2px 0 0 0' }}>
                  {selectedFixture.product.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFixture(null)}
                style={{
                  color: 'var(--color-grey-400)',
                  padding: '2px 6px',
                  fontSize: '14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '11px',
              color: 'var(--color-grey-700)',
              backgroundColor: 'var(--color-grey-50)',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--color-grey-200)'
            }}>
              <div>
                <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>SKU</span>
                <span style={{ fontWeight: 700, color: 'var(--color-black)' }}>
                  {selectedFixture.product.model_number || selectedFixture.product.id}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>PRICE</span>
                <span style={{ fontWeight: 800, color: 'var(--color-black)' }}>
                  ₹{selectedFixture.product.price_inr.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>WATER RATING</span>
                <span style={{ color: 'var(--color-eco-green)', fontWeight: 600 }}>
                  {selectedFixture.product.water_consumption?.rate ? `${selectedFixture.product.water_consumption.rate} ${selectedFixture.product.water_consumption.unit}` : 'Standard'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>ZONE</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {selectedFixture.placement.zone || 'General'}
                </span>
              </div>
            </div>

            {onSelectFixture && (
              <button
                type="button"
                onClick={() => onSelectFixture(selectedFixture.product.id)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View in Catalog
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
