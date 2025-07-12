import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as THREE from "three";

interface BlockchainUploadModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onUploadComplete?: (transactionId: string) => void;
  encrypt: boolean;
}

export default function BlockchainUploadModalNew({
  isOpen,
  onClose,
  fileName,
  onUploadComplete,
  encrypt
}: BlockchainUploadModalNewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [statusText, setStatusText] = useState("Ready to upload to global blockchain");
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    earth: THREE.Mesh;
    satellites: THREE.Mesh[];
    particles: THREE.Points;
    connectionLines: THREE.Line[];
    animationId: number;
  } | null>(null);

  // Initialize 3D scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000814, 100, 300);

    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000814, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(8, 64, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2e8b57,
      shininess: 0.1,
      transparent: true,
      opacity: 0.9
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    scene.add(earth);

    // Create atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(8.5, 64, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create continents
    const continentGeometry = new THREE.SphereGeometry(8.1, 32, 16);
    const continentMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 6; i++) {
      const continent = new THREE.Mesh(continentGeometry, continentMaterial);
      continent.scale.set(
        0.3 + Math.random() * 0.4,
        0.2 + Math.random() * 0.3,
        0.3 + Math.random() * 0.4
      );
      continent.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16
      );
      continent.position.normalize().multiplyScalar(8.05);
      earth.add(continent);
    }

    // Create satellites
    const satellites: THREE.Mesh[] = [];
    const satelliteGeometry = new THREE.BoxGeometry(0.5, 0.5, 1);
    const satelliteMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x001122
    });

    for (let i = 0; i < 24; i++) {
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      const angle = (i / 24) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      const height = (Math.random() - 0.5) * 20;
      
      satellite.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      satellite.userData = {
        angle: angle,
        radius: radius,
        height: height,
        speed: 0.005 + Math.random() * 0.01
      };
      
      satellites.push(satellite);
      scene.add(satellite);
    }

    // Create particle field
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;

      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.2 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.4
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      
      // Rotate Earth (accurate rotation on z-axis, slower speed)
      earth.rotation.z += 0.002;
      
      // Move satellites
      satellites.forEach(satellite => {
        satellite.userData.angle += satellite.userData.speed;
        satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.radius;
        satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.radius;
        satellite.rotation.x += 0.01;
        satellite.rotation.y += 0.01;
      });

      // Rotate particles
      particles.rotation.y += 0.001;

      // Update connection lines during processing
      if (isProcessing && sceneRef.current?.connectionLines.length) {
        sceneRef.current.connectionLines.forEach(line => {
          line.material.opacity = 0.3 + Math.sin(time * 3) * 0.3;
        });
      }

      // Camera movement
      camera.position.x = Math.sin(time * 0.1) * 10;
      camera.position.z = Math.cos(time * 0.1) * 10 + 40;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    animate();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      earth,
      satellites,
      particles,
      connectionLines: [],
      animationId: 0
    };

    // Handle resize
    const handleResize = () => {
      if (canvas && sceneRef.current) {
        const { camera, renderer } = sceneRef.current;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.renderer.dispose();
        sceneRef.current = null;
      }
    };
  }, [isOpen, isProcessing]);

  // Start upload process when modal opens
  useEffect(() => {
    if (isOpen && !isComplete) {
      startUploadProcess();
    }
  }, [isOpen]);

  const startUploadProcess = async () => {
    setIsComplete(false);
    setIsProcessing(true);
    setCurrentStep(0);
    setTotalProgress(0);
    
    // Generate transaction ID
    const txId = generateTransactionId();
    setTransactionId(txId);

    // Step 1: Generating ID
    setCurrentStep(1);
    setStatusText("Generating unique blockchain ID...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTotalProgress(33);

    // Step 2: Encrypting
    setCurrentStep(2);
    setStatusText("Encrypting files with quantum encryption...");
    createEncryptionEffect();
    await new Promise(resolve => setTimeout(resolve, 3000));
    setTotalProgress(66);

    // Step 3: Writing to blockchain
    setCurrentStep(3);
    setStatusText("Writing to blockchain network...");
    await new Promise(resolve => setTimeout(resolve, 4000));
    setTotalProgress(100);

    setIsComplete(true);
    setIsProcessing(false);
    setStatusText("File successfully stored on blockchain!");
    
    if (onUploadComplete) {
      onUploadComplete(txId);
    }
  };

  const createEncryptionEffect = () => {
    if (!sceneRef.current) return;

    // Clear existing connections
    sceneRef.current.connectionLines.forEach(line => sceneRef.current!.scene.remove(line));
    sceneRef.current.connectionLines = [];

    // Create encryption effect around Earth
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const startPoint = new THREE.Vector3(
        Math.cos(angle) * 10,
        0,
        Math.sin(angle) * 10
      );
      const endPoint = new THREE.Vector3(
        Math.cos(angle + Math.PI) * 10,
        0,
        Math.sin(angle + Math.PI) * 10
      );
      
      const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6
      });
      
      const line = new THREE.Line(geometry, material);
      sceneRef.current.scene.add(line);
      sceneRef.current.connectionLines.push(line);
    }
  };

  const generateTransactionId = (): string => {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const copyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
    toast({
      title: "Transaction ID copied",
      description: "The transaction ID has been copied to your clipboard",
    });
  };

  const handleClose = () => {
    if (isComplete) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-transparent border-none overflow-hidden">
        <DialogTitle className="sr-only">Global Blockchain Transfer</DialogTitle>
        <DialogDescription className="sr-only">Secure, decentralized file storage across the globe</DialogDescription>
        <div 
          className="relative w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #000814 0%, #001d3d 50%, #003566 100%)',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* UI Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Upload Zone */}
            <div 
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 ease-in-out min-w-[400px] text-center p-10 rounded-[20px] ${
                isProcessing 
                  ? 'border-2 border-[rgba(0,255,136,0.5)] bg-[rgba(0,30,60,0.9)] shadow-[0_20px_40px_rgba(0,255,136,0.3)]'
                  : isComplete
                  ? 'border-2 border-[rgba(255,193,7,0.5)] bg-[rgba(0,30,60,0.9)] shadow-[0_20px_40px_rgba(255,193,7,0.3)]'
                  : 'border-2 border-[rgba(0,212,255,0.3)] bg-[rgba(0,30,60,0.9)] shadow-[0_20px_40px_rgba(0,212,255,0.2)]'
              }`}
              style={{
                backdropFilter: 'blur(15px)'
              }}
            >
              <div className={`text-5xl mb-5 opacity-80 ${isProcessing ? 'animate-spin' : ''}`}>
                🌍
              </div>
              <div className="text-[22px] mb-2.5 font-semibold text-[#00d4ff]">
                Global Blockchain Transfer
              </div>
              <div className="text-sm opacity-70 mb-7 text-[#a0a0a0]">
                Secure, decentralized file storage across the globe
              </div>
              
              {/* Progress Steps */}
              {isProcessing && (
                <div className="flex justify-between mb-7 px-5">
                  {[
                    { id: 1, label: "Generating ID" },
                    { id: 2, label: "Encrypting" },
                    { id: 3, label: "Writing on Blockchain" }
                  ].map((step, index) => (
                    <div key={step.id} className="flex-1 text-center relative">
                      <div className={`w-10 h-10 rounded-full border-2 mx-auto mb-2.5 flex items-center justify-center font-bold transition-all duration-300 ${
                        currentStep === step.id 
                          ? 'bg-gradient-to-r from-[#00d4ff] to-[#0077be] border-[#00d4ff] animate-pulse'
                          : currentStep > step.id
                          ? 'bg-gradient-to-r from-[#00ff88] to-[#00cc6a] border-[#00ff88]'
                          : 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.3)]'
                      }`}>
                        {step.id}
                      </div>
                      {index < 2 && (
                        <div className={`absolute top-5 left-[60%] w-[80%] h-0.5 transition-all duration-300 ${
                          currentStep > step.id ? 'bg-gradient-to-r from-[#00ff88] to-[#00d4ff]' : 'bg-[rgba(255,255,255,0.2)]'
                        }`} />
                      )}
                      <div className={`text-xs mt-1.5 ${
                        currentStep === step.id ? 'opacity-100 text-[#00d4ff]' : currentStep > step.id ? 'opacity-100 text-[#00ff88]' : 'opacity-70'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className="w-full h-1.5 bg-[rgba(255,255,255,0.1)] rounded-sm overflow-hidden mb-5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              )}

              {/* Status Text */}
              <div className="text-base font-medium mb-4 text-[#00d4ff]">
                {statusText}
              </div>

              {/* Complete state */}
              {isComplete && (
                <button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-[#00d4ff] to-[#0077be] border-none px-8 py-4 rounded-[30px] text-white font-bold cursor-pointer transition-all duration-300 text-base hover:transform hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,212,255,0.4)]"
                >
                  Complete
                </button>
              )}
            </div>

            {/* Transaction ID */}
            {transactionId && isComplete && (
              <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-[rgba(0,0,0,0.9)] px-6 py-4 rounded-[10px] font-mono text-xs text-[#ffd700] border border-[rgba(255,215,0,0.3)] opacity-100 transition-all duration-300 cursor-pointer"
                onClick={copyTransactionId}>
                <strong>Transaction ID:</strong> <span>{transactionId}</span>
              </div>
            )}

            {/* Transaction Status */}
            <div className="absolute bottom-5 right-5 bg-[rgba(0,0,0,0.8)] px-4 py-4 rounded-[10px] text-xs border border-[rgba(0,212,255,0.3)]">
              <div className="text-white">
                Transaction Status: <span className="text-[#00d4ff]">{isComplete ? "Complete" : "Processing"}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}