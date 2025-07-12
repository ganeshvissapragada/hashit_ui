import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FolderOpen, Lock, HardDrive, Shield, Infinity, Eye, EyeOff, Key, AlertCircle, CheckCircle } from "lucide-react";
import { generateSHA256, encryptFile } from "@/lib/crypto";
import { addRecentUpload, updateStorageUsed } from "@/lib/storage";
import { apiRequest } from "@/lib/queryClient";
import Upload3DAnimation from "./upload-3d-animation";

export default function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [encrypt, setEncrypt] = useState(false);
  const [zeroKnowledge, setZeroKnowledge] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadSteps = [
    { id: 'encrypt', label: 'Encrypting File', icon: Lock, color: 'text-yellow-400' },
    { id: 'key', label: 'Generating Key', icon: Shield, color: 'text-blue-400' },
    { id: 'upload', label: 'Uploading to Blockchain', icon: CloudUpload, color: 'text-green-400' }
  ];

  // Password validation
  const validatePassword = (password: string) => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(validations).filter(Boolean).length;
    return { validations, score, isValid: score >= 4 };
  };

  const passwordValidation = validatePassword(password);
  const canUpload = selectedFiles.length > 0 && (!zeroKnowledge || passwordValidation.isValid);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/files", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `${data.name} has been stored on the blockchain`,
      });
      addRecentUpload(data);
      updateStorageUsed(data.size);
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const animateStep = (stepIndex: number, duration: number = 2000) => {
    return new Promise<void>((resolve) => {
      setCurrentStep(stepIndex);
      setStepProgress(0);
      
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setStepProgress(progress * 100);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    // Validate zero-knowledge password if enabled
    if (zeroKnowledge && !passwordValidation.isValid) {
      toast({
        title: "Invalid password",
        description: "Please enter a strong password that meets all requirements",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentHash("");
    setCurrentStep((encrypt || zeroKnowledge) ? 0 : 1); // Start from encryption or key generation
    setStepProgress(0);

    try {
      // Step 1: Encryption (if enabled)
      if (encrypt || zeroKnowledge) {
        await animateStep(0, 1500);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Step 2: Generate SHA-256 hash (Key Generation)
      await animateStep(1, 1200);
      const hash = await generateSHA256(file);
      setCurrentHash(hash);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Upload to blockchain
      await animateStep(2, 2000);
      
      // Prepare form data
      const formData = new FormData();
      
      if (encrypt || zeroKnowledge) {
        // Use zero-knowledge password or generate one
        const encryptionPassword = zeroKnowledge ? password : Math.random().toString(36).substring(2, 15);
        const { encryptedData, iv, salt } = await encryptFile(file, encryptionPassword);
        
        const encryptedFile = new File([encryptedData], file.name, { type: file.type });
        formData.append("file", encryptedFile);
        if (!zeroKnowledge) {
          formData.append("password", encryptionPassword);
        }
        formData.append("iv", Array.from(iv).join(','));
        formData.append("salt", Array.from(salt).join(','));
      } else {
        formData.append("file", file);
      }
      
      formData.append("hash", hash);
      formData.append("encrypted", (encrypt || zeroKnowledge).toString());
      formData.append("zeroKnowledge", zeroKnowledge.toString());

      // Upload file
      await uploadMutation.mutateAsync(formData);
      
      // Complete animation
      setStepProgress(100);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentHash("");
        setCurrentStep(0);
        setStepProgress(0);
      }, 1000);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentHash("");
      setCurrentStep(0);
      setStepProgress(0);
    }
  }, [encrypt, zeroKnowledge, password, passwordValidation.isValid, toast, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFiles(acceptedFiles);
      }
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isUploading,
  });

  return (
    <Card className="bg-gray-900/30 border-indigo-700/50">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="text-white text-2xl" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload to Blockchain</h2>
          <p className="text-slate-300">Securely store your files on the decentralized blockchain network</p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
            isDragActive
              ? "border-purple-400 bg-purple-400/10"
              : "border-purple-400/50 hover:border-purple-400/70 hover:bg-purple-400/5"
          } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="upload-icon mb-4">
            <CloudUpload className="text-purple-400 mx-auto" size={48} />
          </div>
          <p className="text-lg font-medium text-white mb-2">
            {isDragActive ? "Drop file here" : "Drop files here or click to browse"}
          </p>
          <p className="text-slate-400 text-sm mb-6">Maximum file size: 100MB</p>
          
          <div className="flex flex-col items-center space-y-4">
            <Button 
              className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 font-medium transition-all duration-200"
              disabled={isUploading}
            >
              <FolderOpen className="mr-2" size={16} />
              Browse Files
            </Button>
            

          </div>
        </div>



        {/* Selected files and encryption options */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <Card className="bg-gray-900/50 border-indigo-700/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FolderOpen className="text-purple-400" size={18} />
                    <h3 className="text-lg font-medium text-white">Selected Files</h3>
                  </div>
                  
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-slate-400 text-sm">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFiles([]);
                          setEncrypt(false);
                          setZeroKnowledge(false);
                          setPassword("");
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  
                  {/* Encryption options - shown after file selection */}
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-white mb-3">Encryption Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="encrypt-checkbox"
                          checked={encrypt}
                          onCheckedChange={(checked) => {
                            setEncrypt(checked as boolean);
                            if (checked) {
                              setZeroKnowledge(false);
                              setPassword("");
                            }
                          }}
                          className="border-indigo-600"
                        />
                        <label htmlFor="encrypt-checkbox" className="text-sm text-slate-300 flex items-center space-x-2">
                          <Lock className="text-purple-400" size={16} />
                          <span>Encrypt file with auto-generated password</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="zero-knowledge-checkbox"
                          checked={zeroKnowledge}
                          onCheckedChange={(checked) => {
                            setZeroKnowledge(checked as boolean);
                            if (checked) {
                              setEncrypt(false);
                            } else {
                              setPassword("");
                            }
                          }}
                          className="border-indigo-600"
                        />
                        <label htmlFor="zero-knowledge-checkbox" className="text-sm text-slate-300 flex items-center space-x-2">
                          <Key className="text-blue-400" size={16} />
                          <span>Zero-knowledge encryption with custom password</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password field - shown when zero-knowledge is checked */}
                  {zeroKnowledge && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Key className="text-blue-400" size={18} />
                          <h4 className="text-sm font-medium text-white">Zero-Knowledge Password</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="password" className="text-sm text-slate-300">
                            Enter a strong password for zero-knowledge encryption
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              className="bg-gray-800 border-gray-600 text-white pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Password strength indicator */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400">Password strength:</span>
                            <div className="flex space-x-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-2 rounded-full transition-colors ${
                                    i < passwordValidation.score
                                      ? passwordValidation.score < 3
                                        ? "bg-red-500"
                                        : passwordValidation.score < 4
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                      : "bg-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          {/* Password requirements */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center space-x-1 ${passwordValidation.validations.length ? 'text-green-400' : 'text-red-400'}`}>
                              {passwordValidation.validations.length ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              <span>8+ characters</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${passwordValidation.validations.uppercase ? 'text-green-400' : 'text-red-400'}`}>
                              {passwordValidation.validations.uppercase ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              <span>Uppercase letter</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${passwordValidation.validations.lowercase ? 'text-green-400' : 'text-red-400'}`}>
                              {passwordValidation.validations.lowercase ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              <span>Lowercase letter</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${passwordValidation.validations.number ? 'text-green-400' : 'text-red-400'}`}>
                              {passwordValidation.validations.number ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              <span>Number</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${passwordValidation.validations.special ? 'text-green-400' : 'text-red-400'}`}>
                              {passwordValidation.validations.special ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                              <span>Special character</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit button */}
                  <Button
                    onClick={() => selectedFiles[0] && handleFileUpload(selectedFiles[0])}
                    disabled={!canUpload || isUploading}
                    className="w-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CloudUpload size={16} />
                        <span>Upload to Blockchain</span>
                      </div>
                    )}
                  </Button>
                  
                  {zeroKnowledge && !passwordValidation.isValid && (
                    <p className="text-red-400 text-sm text-center">
                      Please enter a strong password before uploading
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isUploading && (
          <div className="mt-6">
            <Card className="bg-gray-900/50 border-indigo-700/50">
              <CardContent className="p-6">
                {/* 3D Animation */}
                <Upload3DAnimation 
                  isUploading={isUploading}
                  currentStep={currentStep}
                  stepProgress={stepProgress}
                  encrypt={encrypt || zeroKnowledge}
                />

                {/* Current Step Info */}
                <div className="text-center mt-6 mb-4">
                  <p className="text-lg font-medium text-white mb-2">
                    {uploadSteps[currentStep]?.label || 'Processing...'}
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>

                {/* Hash Display */}
                {currentHash && (
                  <div className="text-xs text-slate-400 text-center">
                    <span>SHA-256 hash: </span>
                    <span className="font-mono text-purple-400">
                      {currentHash.substring(0, 32)}...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <HardDrive className="text-purple-400" size={16} />
            <span>Max: 100MB</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="text-green-400" size={16} />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center space-x-2">
            <Infinity className="text-purple-400" size={16} />
            <span>Immutable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
