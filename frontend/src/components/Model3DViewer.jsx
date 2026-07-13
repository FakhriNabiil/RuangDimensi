import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Model3DViewer({ fileUrl, format, className = '' }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!fileUrl || !format) {
      setStatus('error');
      setErrorMessage('No previewable 3D file for this asset.');
      return;
    }

    let cancelled = false;
    let renderer;
    let controls;
    let animationFrameId;
    let resizeObserver;
    const container = containerRef.current;

    setStatus('loading');
    setErrorMessage('');

    async function init() {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0b1325');

      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
      camera.position.set(2, 2, 3);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Lighting: neutral studio setup so PBR/lit materials read clearly
      // against the dark viewport, matching the "Object Inspector" look.
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
      keyLight.position.set(5, 10, 7);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
      fillLight.position.set(-5, -2, -5);
      scene.add(fillLight);

      // const grid = new THREE.GridHelper(10, 20, 0x2d3448, 0x2d3448);
      // grid.position.y = -0.001;
      // scene.add(grid);

      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      let object;
      try {
        if (format === 'obj') {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
          object = await new OBJLoader().loadAsync(fileUrl);
        } else if (format === 'fbx') {
          const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
          object = await new FBXLoader().loadAsync(fileUrl);
        } else {
          throw new Error(`Unsupported preview format: ${format}`);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('3D preview load failed:', err);
        setStatus('error');
        setErrorMessage(
          'Could not load the 3D preview. The file may be unreachable (check the bucket\'s CORS settings) or in an unsupported variant of this format.',
        );
        return;
      }

      if (cancelled) return;

      // Give unlit OBJ meshes a visible material - many exported OBJs carry
      // no material/texture info, which otherwise renders as pure black.
      object.traverse((child) => {
        if (child.isMesh) {
          if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x9aa5b1, roughness: 0.6 });
          }
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      // Auto-frame: center the model and back the camera off based on its size.
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
      const distance = maxDimension * 1.8;
      camera.position.set(distance, distance * 0.8, distance);
      camera.near = maxDimension / 100;
      camera.far = maxDimension * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();

      scene.add(object);
      setStatus('ready');

      function animate() {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      resizeObserver = new ResizeObserver(() => {
        if (!container) return;
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      controls?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [fileUrl, format]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest/90 text-on-surface-variant pointer-events-none">
          <span className="material-symbols-outlined text-[32px] animate-spin text-primary">progress_activity</span>
          <span className="font-label text-label-sm uppercase tracking-wider">Loading model…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest/90 text-center px-6">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant opacity-60">
            view_in_ar
          </span>
          <p className="font-body text-body-sm text-on-surface-variant max-w-xs">{errorMessage}</p>
        </div>
      )}

      {/* Viewport corner brackets - "gizmo" viewer framing */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/70 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/70 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/70 pointer-events-none" />
    </div>
  );
}
