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

    // Create central Earth
    const earthGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    
    // Create Earth texture using procedural generation
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 1024;
    earthCanvas.height = 512;
    const earthCtx = earthCanvas.getContext('2d')!;
    
    // Create Earth-like texture
    const gradient = earthCtx.createLinearGradient(0, 0, 1024, 512);
    gradient.addColorStop(0, '#1a472a');
    gradient.addColorStop(0.3, '#2d5a3d');
    gradient.addColorStop(0.6, '#1e3a8a');
    gradient.addColorStop(1, '#1e40af');
    earthCtx.fillStyle = gradient;
    earthCtx.fillRect(0, 0, 1024, 512);
    
    // Add continent-like patterns
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radius = Math.random() * 30 + 10;
      
      earthCtx.beginPath();
      earthCtx.arc(x, y, radius, 0, Math.PI * 2);
      earthCtx.fillStyle = Math.random() > 0.5 ? '#22c55e' : '#16a34a';
      earthCtx.fill();
    }
    
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    const earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, 0, 0);
    scene.add(earth);
    
    // Add Earth glow
    const earthGlowGeometry = new THREE.SphereGeometry(0.85, 32, 32);
    const earthGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.2
    });
    const earthGlow = new THREE.Mesh(earthGlowGeometry, earthGlowMaterial);
    earthGlow.position.copy(earth.position);
    scene.add(earthGlow);

    visibleSteps.forEach((step, index) => {
      // Create satellite nodes orbiting Earth
      const geometry = new THREE.SphereGeometry(0.15, 32, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x374151,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(geometry, material);
      
      // Position nodes in orbit around Earth
      const radius = 1.5;
      const angle = (index / visibleSteps.length) * Math.PI * 2;
      node.position.x = Math.cos(angle) * radius;
      node.position.y = Math.sin(angle) * radius;
      node.position.z = 0;
      
      // Store orbital data
      node.userData.orbitRadius = radius;
      node.userData.orbitAngle = angle;
      node.userData.orbitSpeed = 0.02;
      
      scene.add(node);
      nodes.push(node);

      // Create connection lines to Earth
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0)); // Earth center
      points.push(node.position.clone());
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x374151,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      connections.push(line);
      node.userData.connectionLine = line;

      // Add satellite glow
      const glowGeometry = new THREE.SphereGeometry(0.2, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: step.color,
        transparent: true,
        opacity: 0.1
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(node.position);
      scene.add(glow);
      node.userData.glow = glow;
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
    scene.userData.earthGlow = earthGlow;
    scene.userData.stars = stars;
    scene.userData.particles = particles;

    setNodesRef(nodes);
    setConnectionsRef(connections);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Rotate Earth
      if (scene.userData.earth) {
        scene.userData.earth.rotation.y += 0.005;
        scene.userData.earthGlow.rotation.y += 0.005;
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

      // Animate satellites in orbit
      nodes.forEach((node, index) => {
        if (node.userData.orbitRadius) {
          // Update orbital position
          node.userData.orbitAngle += node.userData.orbitSpeed;
          const x = Math.cos(node.userData.orbitAngle) * node.userData.orbitRadius;
          const y = Math.sin(node.userData.orbitAngle) * node.userData.orbitRadius;
          node.position.x = x;
          node.position.y = y;
          
          // Update glow position
          if (node.userData.glow) {
            node.userData.glow.position.copy(node.position);
          }
          
          // Update connection line
          if (node.userData.connectionLine) {
            const line = node.userData.connectionLine;
            const positions = line.geometry.attributes.position.array as Float32Array;
            positions[3] = x; // End point x
            positions[4] = y; // End point y
            positions[5] = 0; // End point z
            line.geometry.attributes.position.needsUpdate = true;
          }
        }
        
        // Rotate satellites
        node.rotation.x += 0.02;
        node.rotation.y += 0.02;
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
      const connectionLine = node.userData.connectionLine;
      const connectionMaterial = connectionLine?.material as THREE.LineBasicMaterial;

      if (currentStep > index) {
        // Completed step - satellite becomes active
        material.color.setHex(step.color);
        material.opacity = 1;
        if (glowMaterial) {
          glowMaterial.opacity = 0.4;
          glowMaterial.color.setHex(step.color);
        }
        if (connectionMaterial) {
          connectionMaterial.color.setHex(step.color);
          connectionMaterial.opacity = 0.8;
        }
        
        // Faster orbit for completed satellites
        node.userData.orbitSpeed = 0.03;
        
      } else if (currentStep === index) {
        // Active step - satellite pulses and glows
        material.color.setHex(step.color);
        material.opacity = 0.9;
        if (glowMaterial) {
          glowMaterial.opacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.01);
          glowMaterial.color.setHex(step.color);
        }
        if (connectionMaterial) {
          connectionMaterial.color.setHex(step.color);
          connectionMaterial.opacity = 0.5 + 0.3 * Math.sin(Date.now() * 0.01);
        }
        
        // Medium orbit speed for active satellite
        node.userData.orbitSpeed = 0.025;
        
      } else {
        // Pending step - satellite is dormant
        material.color.setHex(0x374151);
        material.opacity = 0.6;
        if (glowMaterial) {
          glowMaterial.opacity = 0.1;
        }
        if (connectionMaterial) {
          connectionMaterial.color.setHex(0x374151);
          connectionMaterial.opacity = 0.2;
        }
        
        // Slow orbit for pending satellites
        node.userData.orbitSpeed = 0.015;
      }
    });

    // Update Earth glow based on progress
    if (sceneRef.current?.userData.earthGlow) {
      const earthGlow = sceneRef.current.userData.earthGlow;
      const earthGlowMaterial = earthGlow.material as THREE.MeshBasicMaterial;
      
      if (currentStep >= visibleSteps.length - 1) {
        // All steps completed - Earth glows brighter
        earthGlowMaterial.opacity = 0.4;
        earthGlowMaterial.color.setHex(0x22c55e);
      } else {
        // In progress - subtle glow
        earthGlowMaterial.opacity = 0.2;
        earthGlowMaterial.color.setHex(0x4ade80);
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