import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Lock, Shield, CloudUpload } from 'lucide-react';

interface Upload3DAnimationProps {
  isUploading: boolean;
  currentStep: number;
  stepProgress: number;
  encrypt: boolean;
}

export default function Upload3DAnimation({ 
  isUploading, 
  currentStep, 
  stepProgress, 
  encrypt 
}: Upload3DAnimationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>();
  const [nodesRef, setNodesRef] = useState<THREE.Mesh[]>([]);
  const [connectionsRef, setConnectionsRef] = useState<THREE.Line[]>([]);

  const uploadSteps = [
    { id: 'encrypt', label: 'Encrypting File', icon: Lock, color: 0xfbbf24 },
    { id: 'key', label: 'Generating Key', icon: Shield, color: 0x3b82f6 },
    { id: 'upload', label: 'Uploading to Blockchain', icon: CloudUpload, color: 0x10b981 }
  ];

  const visibleSteps = encrypt ? uploadSteps : uploadSteps.slice(1);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x111827, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create nodes and connections
    const nodes: THREE.Mesh[] = [];
    const connections: THREE.Line[] = [];

    // Create realistic Earth with detailed texture
    const earthGeometry = new THREE.SphereGeometry(1.2, 128, 128);
    
    // Create realistic Earth texture
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const earthCtx = earthCanvas.getContext('2d')!;
    
    // Create Earth base with realistic colors
    const earthGradient = earthCtx.createRadialGradient(1024, 512, 0, 1024, 512, 1024);
    earthGradient.addColorStop(0, '#1a365d'); // Deep ocean blue
    earthGradient.addColorStop(0.3, '#2563eb'); // Ocean blue
    earthGradient.addColorStop(0.6, '#1e40af'); // Deep blue
    earthGradient.addColorStop(1, '#0f172a'); // Dark edges
    earthCtx.fillStyle = earthGradient;
    earthCtx.fillRect(0, 0, 2048, 1024);
    
    // Add realistic continent shapes and landmasses
    const continents = [
      // North America
      { x: 300, y: 300, width: 400, height: 300, color: '#22543d' },
      // Europe/Asia
      { x: 900, y: 250, width: 600, height: 200, color: '#276749' },
      // Africa
      { x: 850, y: 450, width: 200, height: 400, color: '#2d5016' },
      // South America
      { x: 500, y: 600, width: 150, height: 300, color: '#22543d' },
      // Australia
      { x: 1400, y: 700, width: 200, height: 100, color: '#2d5016' },
    ];
    
    continents.forEach(continent => {
      earthCtx.fillStyle = continent.color;
      earthCtx.fillRect(continent.x, continent.y, continent.width, continent.height);
      
      // Add coastline details
      earthCtx.fillStyle = '#1e3a8a';
      earthCtx.fillRect(continent.x - 2, continent.y - 2, continent.width + 4, continent.height + 4);
      earthCtx.fillStyle = continent.color;
      earthCtx.fillRect(continent.x, continent.y, continent.width, continent.height);
    });
    
    // Add cloud layer texture
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 2048;
    cloudCanvas.height = 1024;
    const cloudCtx = cloudCanvas.getContext('2d')!;
    
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const radius = Math.random() * 40 + 20;
      
      cloudCtx.beginPath();
      cloudCtx.arc(x, y, radius, 0, Math.PI * 2);
      cloudCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      cloudCtx.fill();
    }
    
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    
    // Create Earth material with lighting
    const earthMaterial = new THREE.MeshLambertMaterial({ 
      map: earthTexture,
      transparent: true,
      opacity: 0.9
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, 0, 0);
    scene.add(earth);
    
    // Add cloud layer
    const cloudGeometry = new THREE.SphereGeometry(1.21, 64, 64);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    clouds.position.copy(earth.position);
    scene.add(clouds);
    
    // Add atmospheric glow (multiple layers for realism)
    const atmosphereGeometry = new THREE.SphereGeometry(1.35, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.copy(earth.position);
    scene.add(atmosphere);
    
    // Add outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.15
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.position.copy(earth.position);
    scene.add(outerGlow);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create network nodes on Earth surface like in Filecoin
    const networkNodes = [];
    const nodePositions = [
      // Spread nodes across Earth surface
      { lat: 40.7128, lon: -74.0060 }, // New York
      { lat: 51.5074, lon: -0.1278 },  // London
      { lat: 35.6762, lon: 139.6503 }, // Tokyo
      { lat: -33.8688, lon: 151.2093 }, // Sydney
      { lat: 37.7749, lon: -122.4194 }, // San Francisco
      { lat: 55.7558, lon: 37.6176 },  // Moscow
      { lat: 28.6139, lon: 77.2090 },  // Delhi
      { lat: -23.5505, lon: -46.6333 }, // São Paulo
    ];

    visibleSteps.forEach((step, index) => {
      // Get position for this step
      const pos = nodePositions[index % nodePositions.length];
      
      // Convert lat/lon to 3D position on sphere
      const phi = (90 - pos.lat) * (Math.PI / 180);
      const theta = (pos.lon + 180) * (Math.PI / 180);
      const earthRadius = 1.2;
      
      const x = earthRadius * Math.sin(phi) * Math.cos(theta);
      const y = earthRadius * Math.cos(phi);
      const z = earthRadius * Math.sin(phi) * Math.sin(theta);
      
      // Create glowing node
      const nodeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      
      // Add pulsing glow around node
      const glowGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: step.color,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(node.position);
      
      // Add outer glow ring
      const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: step.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(node.position);
      ring.lookAt(0, 0, 0); // Face camera
      
      scene.add(node);
      scene.add(glow);
      scene.add(ring);
      
      nodes.push(node);
      node.userData.glow = glow;
      node.userData.ring = ring;
      node.userData.step = step;
      
      // Create connection beam to space
      const beamGeometry = new THREE.CylinderGeometry(0.005, 0.005, 2, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: step.color,
        transparent: true,
        opacity: 0.0
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      
      // Position beam from node outward
      const beamPos = node.position.clone().multiplyScalar(1.5);
      beam.position.copy(beamPos);
      beam.lookAt(node.position);
      beam.rotateX(Math.PI / 2);
      
      scene.add(beam);
      connections.push(beam);
      node.userData.beam = beam;
    });

    // Add star field background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });
    
    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Add blockchain data particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });
    
    const particleVertices = [];
    for (let i = 0; i < 200; i++) {
      const radius = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      particleVertices.push(x, y, z);
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particleVertices, 3));
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Store references
    scene.userData.earth = earth;
    scene.userData.clouds = clouds;
    scene.userData.atmosphere = atmosphere;
    scene.userData.outerGlow = outerGlow;
    scene.userData.stars = stars;
    scene.userData.particles = particles;

    setNodesRef(nodes);
    setConnectionsRef(connections);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Rotate Earth slowly
      if (scene.userData.earth) {
        scene.userData.earth.rotation.y += 0.003;
      }
      
      // Rotate clouds slightly faster
      if (scene.userData.clouds) {
        scene.userData.clouds.rotation.y += 0.004;
      }
      
      // Subtle atmosphere rotation
      if (scene.userData.atmosphere) {
        scene.userData.atmosphere.rotation.y += 0.001;
      }

      // Animate star field
      if (scene.userData.stars) {
        scene.userData.stars.rotation.y += 0.0002;
      }

      // Animate blockchain particles
      if (scene.userData.particles) {
        scene.userData.particles.rotation.y += 0.01;
        scene.userData.particles.rotation.x += 0.005;
      }

      // Animate network nodes
      nodes.forEach((node, index) => {
        const time = Date.now() * 0.001;
        
        // Pulsing glow effect
        if (node.userData.glow) {
          const pulseScale = 1 + 0.3 * Math.sin(time * 2 + index);
          node.userData.glow.scale.setScalar(pulseScale);
        }
        
        // Rotating ring effect
        if (node.userData.ring) {
          node.userData.ring.rotation.z += 0.02;
          const ringPulse = 0.5 + 0.3 * Math.sin(time * 3 + index);
          node.userData.ring.material.opacity = ringPulse;
        }
        
        // Beam animation
        if (node.userData.beam) {
          const beamPulse = 0.1 + 0.2 * Math.sin(time * 4 + index);
          node.userData.beam.material.opacity = beamPulse;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [encrypt]);

  // Update animation based on upload progress
  useEffect(() => {
    if (!isUploading || !nodesRef.length || !connectionsRef.length) return;

    nodesRef.forEach((node, index) => {
      const step = visibleSteps[index];
      const material = node.material as THREE.MeshBasicMaterial;
      const glow = node.userData.glow;
      const glowMaterial = glow?.material as THREE.MeshBasicMaterial;
      const ring = node.userData.ring;
      const ringMaterial = ring?.material as THREE.MeshBasicMaterial;
      const beam = node.userData.beam;
      const beamMaterial = beam?.material as THREE.MeshBasicMaterial;

      if (currentStep > index) {
        // Completed step - node becomes bright and active
        material.color.setHex(step.color);
        material.opacity = 1;
        if (glowMaterial) {
          glowMaterial.opacity = 0.6;
          glowMaterial.color.setHex(step.color);
        }
        if (ringMaterial) {
          ringMaterial.color.setHex(step.color);
          ringMaterial.opacity = 0.4;
        }
        if (beamMaterial) {
          beamMaterial.color.setHex(step.color);
          beamMaterial.opacity = 0.3;
        }
        
      } else if (currentStep === index) {
        // Active step - node pulses with energy
        material.color.setHex(step.color);
        material.opacity = 0.9;
        if (glowMaterial) {
          glowMaterial.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.01);
          glowMaterial.color.setHex(step.color);
        }
        if (ringMaterial) {
          ringMaterial.color.setHex(step.color);
          ringMaterial.opacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
        }
        if (beamMaterial) {
          beamMaterial.color.setHex(step.color);
          beamMaterial.opacity = 0.2 + 0.2 * Math.sin(Date.now() * 0.01);
        }
        
      } else {
        // Pending step - node is dormant
        material.color.setHex(0x666666);
        material.opacity = 0.5;
        if (glowMaterial) {
          glowMaterial.opacity = 0.1;
          glowMaterial.color.setHex(0x666666);
        }
        if (ringMaterial) {
          ringMaterial.color.setHex(0x666666);
          ringMaterial.opacity = 0.1;
        }
        if (beamMaterial) {
          beamMaterial.opacity = 0.0;
        }
      }
    });

    // Update Earth atmosphere based on progress
    if (sceneRef.current?.userData.outerGlow) {
      const outerGlow = sceneRef.current.userData.outerGlow;
      const outerGlowMaterial = outerGlow.material as THREE.MeshBasicMaterial;
      
      if (currentStep >= visibleSteps.length - 1) {
        // All steps completed - Earth glows brighter
        outerGlowMaterial.opacity = 0.25;
        outerGlowMaterial.color.setHex(0x22c55e);
      } else {
        // In progress - subtle glow
        outerGlowMaterial.opacity = 0.15;
        outerGlowMaterial.color.setHex(0x4ade80);
      }
    }

  }, [isUploading, currentStep, stepProgress, nodesRef, connectionsRef, visibleSteps]);

  if (!isUploading) return null;

  return (
    <div className="w-full h-48 relative">
      <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Step labels overlay */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex items-center space-x-8">
          {visibleSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`p-2 rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isActive 
                      ? 'bg-purple-500 animate-pulse' 
                      : 'bg-gray-600'
                }`}>
                  <Icon className="text-white" size={16} />
                </div>
                <span className={`text-xs mt-1 transition-colors duration-300 ${
                  isCompleted 
                    ? 'text-green-400' 
                    : isActive 
                      ? 'text-purple-400' 
                      : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-gray-700 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (visibleSteps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}