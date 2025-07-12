import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Upload, Key, Unlock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { File } from "@shared/schema";

interface VerificationResult {
  verified: boolean;
  file?: File;
  hash: string;
}

export default function FileVerify() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/files/verify", formData);
      return response.json();
    },
    onSuccess: (data: VerificationResult) => {
      setVerificationResult(data);
      if (data.verified) {
        toast({
          title: "Verification successful",
          description: "File integrity confirmed on blockchain",
        });
      } else {
        toast({
          title: "Verification failed",
          description: "File not found on blockchain",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify file",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file as any);
      setVerificationResult(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile as any);
    
    await verifyMutation.mutateAsync(formData);
  };

  return (
    <Card className="bg-gray-900/30 border-indigo-700/50">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-white text-2xl" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Files</h2>
          <p className="text-slate-300">Verify file integrity and download your stored files</p>
        </div>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-green-500/50 rounded-lg p-8 text-center">
            <div className="mb-4">
              <Upload className="text-green-400 mx-auto" size={48} />
            </div>
            <p className="text-lg font-medium text-white mb-2">Upload file to verify</p>
            <p className="text-slate-400 text-sm mb-4">Compare with blockchain stored version</p>
            <div className="flex flex-col items-center space-y-4">
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 font-medium transition-all duration-200"
                onClick={() => document.getElementById("verify-file-input")?.click()}
              >
                <Upload className="mr-2" size={16} />
                Choose File
              </Button>
              <input
                id="verify-file-input"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-slate-300">
                  Selected: {(selectedFile as any).name}
                </p>
              )}
            </div>
          </div>

          <Card className="bg-gray-900/50 border-indigo-700/50">
            <CardContent className="p-6">
              <Label className="block text-sm font-medium text-slate-300 mb-3">
                <Key className="text-purple-400 mr-2 inline" size={16} />
                Secret Key (for encrypted files)
              </Label>
              <div className="flex space-x-3">
                <Input
                  type="password"
                  placeholder="Enter your secret key..."
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="flex-1 bg-gray-900 border-indigo-600 text-white"
                />
                <Button
                  className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 font-medium transition-all duration-200"
                  onClick={handleVerify}
                  disabled={!selectedFile || verifyMutation.isPending}
                >
                  <Unlock className="mr-2" size={16} />
                  {verifyMutation.isPending ? "Verifying..." : "Decrypt & Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {verificationResult && (
            <Card className="bg-gray-900/50 border-indigo-700/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    verificationResult.verified ? "bg-green-500" : "bg-red-500"
                  }`}>
                    <CheckCircle className="text-white" size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {verificationResult.verified ? "Verification Successful" : "Verification Failed"}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {verificationResult.verified 
                        ? "File integrity confirmed" 
                        : "File not found on blockchain"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Hash:</span>
                    <span className="font-mono text-purple-400">
                      {verificationResult.hash.substring(0, 32)}...
                    </span>
                  </div>
                  {verificationResult.file && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">File Size:</span>
                        <span className="text-white">{verificationResult.file.size} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Upload Date:</span>
                        <span className="text-white">
                          {new Date(verificationResult.file.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
