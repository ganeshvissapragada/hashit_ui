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

    visibleSteps.forEach((step, index) => {
      // Create node
      const geometry = new THREE.SphereGeometry(0.3, 32, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x374151,
        transparent: true,
        opacity: 0.8
      });
      const node = new THREE.Mesh(geometry, material);
      
      // Position nodes horizontally
      const spacing = 2;
      const totalWidth = (visibleSteps.length - 1) * spacing;
      const startX = -totalWidth / 2;
      node.position.x = startX + index * spacing;
      node.position.y = 0;
      node.position.z = 0;
      
      scene.add(node);
      nodes.push(node);

      // Create connection lines
      if (index > 0) {
        const points = [];
        points.push(new THREE.Vector3(startX + (index - 1) * spacing, 0, 0));
        points.push(new THREE.Vector3(startX + index * spacing, 0, 0));
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x374151,
          transparent: true,
          opacity: 0.5
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        connections.push(line);
      }

      // Add glow effect
      const glowGeometry = new THREE.SphereGeometry(0.35, 32, 32);
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

    setNodesRef(nodes);
    setConnectionsRef(connections);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Rotate nodes
      nodes.forEach((node, index) => {
        node.rotation.x += 0.01;
        node.rotation.y += 0.01;
        
        // Animate glow
        if (node.userData.glow) {
          node.userData.glow.rotation.x += 0.02;
          node.userData.glow.rotation.y += 0.02;
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

      if (currentStep > index) {
        // Completed step
        material.color.setHex(step.color);
        material.opacity = 1;
        if (glowMaterial) {
          glowMaterial.opacity = 0.3;
          glowMaterial.color.setHex(step.color);
        }
        
        // Scale animation for completed
        const scale = 1 + 0.1 * Math.sin(Date.now() * 0.005);
        node.scale.setScalar(scale);
        
      } else if (currentStep === index) {
        // Active step
        material.color.setHex(step.color);
        material.opacity = 0.8 + 0.2 * Math.sin(Date.now() * 0.01);
        if (glowMaterial) {
          glowMaterial.opacity = 0.2 + 0.1 * Math.sin(Date.now() * 0.01);
          glowMaterial.color.setHex(step.color);
        }
        
        // Pulsing animation for active step
        const pulseScale = 1 + 0.2 * Math.sin(Date.now() * 0.01);
        node.scale.setScalar(pulseScale);
        
      } else {
        // Pending step
        material.color.setHex(0x374151);
        material.opacity = 0.5;
        if (glowMaterial) {
          glowMaterial.opacity = 0.05;
        }
        node.scale.setScalar(1);
      }
    });

    // Update connection lines
    connectionsRef.forEach((line, index) => {
      const material = line.material as THREE.LineBasicMaterial;
      if (currentStep > index) {
        // Connection is active
        material.color.setHex(visibleSteps[index + 1].color);
        material.opacity = 0.8;
      } else {
        // Connection is inactive
        material.color.setHex(0x374151);
        material.opacity = 0.3;
      }
    });

  }, [isUploading, currentStep, stepProgress, nodesRef, connectionsRef]);

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