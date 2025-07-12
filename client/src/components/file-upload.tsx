import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FolderOpen, Lock, HardDrive, Shield, Infinity } from "lucide-react";
import { generateSHA256, encryptFile } from "@/lib/crypto";
import { addRecentUpload, updateStorageUsed } from "@/lib/storage";
import { apiRequest } from "@/lib/queryClient";

export default function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [encrypt, setEncrypt] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentHash("");

    try {
      // Generate SHA-256 hash
      setUploadProgress(25);
      const hash = await generateSHA256(file);
      setCurrentHash(hash);
      setUploadProgress(50);

      // Simulate blockchain upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("encrypted", encrypt.toString());

      // Upload file
      await uploadMutation.mutateAsync(formData);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentHash("");
      }, 1000);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentHash("");
    }
  }, [encrypt, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
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
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="encrypt-checkbox"
                checked={encrypt}
                onCheckedChange={(checked) => setEncrypt(checked as boolean)}
                className="border-indigo-600"
              />
              <label htmlFor="encrypt-checkbox" className="text-sm text-slate-300 flex items-center space-x-2">
                <Lock className="text-purple-400" size={16} />
                <span>Encrypt file before uploading to blockchain</span>
              </label>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="mt-6">
            <Card className="bg-gray-900/50 border-indigo-700/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Uploading...</span>
                  <span className="text-sm text-slate-300">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="mb-2" />
                <div className="text-xs text-slate-400">
                  <span>SHA-256 hash: </span>
                  <span className="font-mono text-purple-400">
                    {currentHash || "Calculating..."}
                  </span>
                </div>
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
