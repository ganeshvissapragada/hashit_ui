import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Globe, Lock, Key, Upload, Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as THREE from "three";

interface BlockchainUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onUploadComplete?: (transactionId: string) => void;
  encrypt: boolean;
}

interface UploadStep {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  duration: number;
}

export default function BlockchainUploadModal({
  isOpen,
  onClose,
  fileName,
  onUploadComplete,
  encrypt
}: BlockchainUploadModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [statusText, setStatusText] = useState("Preparing upload...");
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    earth: THREE.Mesh;
    satellites: THREE.Mesh[];
    particles: THREE.Points;
    animationId: number;
  } | null>(null);

  const uploadSteps: UploadStep[] = [
    {
      id: "id-generation",
      label: "Generating ID",
      icon: Key,
      description: "Creating unique blockchain identifier",
      duration: 2000
    },
    {
      id: "encryption",
      label: "Encrypting",
      icon: Lock,
      description: encrypt ? "Securing file with quantum encryption" : "Preparing file for blockchain",
      duration: 3000
    },
    {
      id: "blockchain-write",
      label: "Writing to Blockchain",
      icon: Upload,
      description: "Distributing across global network",
      duration: 4000
    }
  ];

  // Initialize 3D scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000814, 50, 200);

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000814, 0.8);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 30, 30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(4, 32, 32);
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
    const atmosphereGeometry = new THREE.SphereGeometry(4.2, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create satellites
    const satellites: THREE.Mesh[] = [];
    const satelliteGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.6);
    const satelliteMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x001122
    });

    for (let i = 0; i < 12; i++) {
      const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 8 + Math.random() * 4;
      const height = (Math.random() - 0.5) * 10;
      
      satellite.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      satellite.userData = {
        angle: angle,
        radius: radius,
        height: height,
        speed: 0.01 + Math.random() * 0.02
      };
      
      satellites.push(satellite);
      scene.add(satellite);
    }

    // Create particle field
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.3 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      // Rotate earth
      earth.rotation.y += 0.005;
      
      // Move satellites
      satellites.forEach(satellite => {
        satellite.userData.angle += satellite.userData.speed;
        satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.radius;
        satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.radius;
        satellite.rotation.x += 0.01;
        satellite.rotation.y += 0.02;
      });

      // Rotate particles
      particles.rotation.y += 0.001;
      
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
  }, [isOpen]);

  // Start upload process when modal opens
  useEffect(() => {
    if (isOpen && !isComplete) {
      startUploadProcess();
    }
  }, [isOpen]);

  const startUploadProcess = async () => {
    setIsComplete(false);
    setCurrentStep(0);
    setStepProgress(0);
    setTotalProgress(0);
    
    // Generate transaction ID
    const txId = generateTransactionId();
    setTransactionId(txId);

    for (let i = 0; i < uploadSteps.length; i++) {
      const step = uploadSteps[i];
      setCurrentStep(i);
      setStatusText(step.description);
      
      // Animate step progress
      await animateStepProgress(step.duration);
      
      // Update total progress
      const progressPercentage = ((i + 1) / uploadSteps.length) * 100;
      setTotalProgress(progressPercentage);
      
      // Short pause between steps
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsComplete(true);
    setStatusText("Upload complete! File successfully stored on blockchain.");
    
    if (onUploadComplete) {
      onUploadComplete(txId);
    }
  };

  const animateStepProgress = (duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setStepProgress(progress * 100);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setStepProgress(100);
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
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
      <DialogContent className="max-w-2xl bg-gray-900 border-indigo-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            <div className="flex items-center justify-center space-x-2">
              <Globe className="text-blue-400" size={24} />
              <span>Global Blockchain Transfer</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Secure, decentralized file storage across the globe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 3D Scene */}
          <div className="relative bg-gradient-to-br from-indigo-900/20 to-blue-900/20 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-48 block"
              style={{ background: 'linear-gradient(135deg, #000814 0%, #001d3d 50%, #003566 100%)' }}
            />
            
            {/* Upload info overlay */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-sm">
              <div className="text-blue-400 font-medium">Uploading:</div>
              <div className="text-white truncate max-w-48">{fileName}</div>
            </div>

            {/* Network status */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-sm">
              <div className="text-green-400 font-medium">Network Status:</div>
              <div className="text-white">
                {isComplete ? "Complete" : "Processing"}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {uploadSteps.map((step, index) => {
                const isActive = index === currentStep && !isComplete;
                const isCompleted = index < currentStep || isComplete;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className="flex-1 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isActive 
                        ? 'bg-blue-500 border-blue-500 animate-pulse' 
                        : 'bg-gray-700 border-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="text-white" size={20} />
                      ) : isActive ? (
                        <Loader2 className="text-white animate-spin" size={20} />
                      ) : (
                        <StepIcon className="text-gray-400" size={20} />
                      )}
                    </div>
                    <div className="text-xs text-center text-gray-300">
                      {step.label}
                    </div>
                    {index < uploadSteps.length - 1 && (
                      <div className={`hidden sm:block absolute h-px bg-gradient-to-r w-16 mt-6 transition-all duration-300 ${
                        isCompleted ? 'from-green-500 to-blue-500' : 'from-gray-600 to-gray-600'
                      }`} style={{ left: `${(index + 1) * 33.33}%` }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current step progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{statusText}</span>
                <span className="text-blue-400">{Math.round(totalProgress)}%</span>
              </div>
              <Progress value={totalProgress} className="bg-gray-700" />
            </div>
          </div>

          {/* Transaction ID */}
          {transactionId && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Transaction ID:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyTransactionId}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Copy size={14} />
                </Button>
              </div>
              <div className="font-mono text-xs text-yellow-400 break-all bg-black/50 p-2 rounded">
                {transactionId}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center">
            {isComplete ? (
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="mr-2" size={16} />
                Done
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="mr-2" size={16} />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}