import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, FileText, Download, Trash2 } from "lucide-react";
import { File } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatBytes, formatTimeAgo } from "@/lib/storage";

export default function FileList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "File has been removed from blockchain",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (fileId: number) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(fileId);
    }
  };

  const handleDownload = (file: File) => {
    // In a real implementation, this would download the file from blockchain
    toast({
      title: "Download started",
      description: `Downloading ${file.name}`,
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/30 border-indigo-700/50">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/30 border-indigo-700/50">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="text-white text-2xl" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">My Files</h2>
          <p className="text-slate-300">Manage and download your stored files</p>
        </div>

        <div className="space-y-4">
          {files.length > 0 ? (
            files.map((file) => (
              <Card key={file.id} className="bg-gray-900/50 border-indigo-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{file.name}</h3>
                        <p className="text-sm text-slate-400">
                          {formatBytes(file.size)} • {formatTimeAgo(new Date(file.uploadDate))} • 
                          <span className="text-purple-400 ml-1">
                            {file.encrypted ? "Encrypted" : "Unencrypted"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        className="text-slate-400 hover:text-purple-400"
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-slate-400 hover:text-red-400"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FolderOpen className="mx-auto mb-4" size={48} />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload your first file to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
