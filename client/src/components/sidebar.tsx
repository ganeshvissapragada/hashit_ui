import { Card, CardContent } from "@/components/ui/card";
import { Clock, Network, Shield, Lock, Hash, Box, Infinity } from "lucide-react";
import { getStorageData, formatBytes, formatTimeAgo } from "@/lib/storage";
import { useQuery } from "@tanstack/react-query";
import { File } from "@shared/schema";

export default function Sidebar() {
  const storageData = getStorageData();
  
  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  const recentFiles = files.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Recent Uploads */}
      <Card className="bg-gray-900/30 border-indigo-700/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="text-purple-400 mr-2" size={20} />
            Recent Uploads
          </h3>
          <div className="space-y-3">
            {recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-900/50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Hash className="text-white" size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatTimeAgo(new Date(file.uploadDate))}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="mx-auto mb-2" size={32} />
                <p className="text-sm">No recent uploads</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card className="bg-gray-900/30 border-indigo-700/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Network className="text-purple-400 mr-2" size={20} />
            Network Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Network</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Gas Price</span>
              <span className="text-white font-medium">{storageData.networkStatus.gasPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Block Height</span>
              <span className="text-white font-medium">{storageData.networkStatus.blockHeight}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-gray-900/30 border-indigo-700/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="text-purple-400 mr-2" size={20} />
            Security Features
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Lock className="text-green-400" size={16} />
              <span className="text-sm text-slate-300">End-to-end encryption</span>
            </div>
            <div className="flex items-center space-x-3">
              <Hash className="text-green-400" size={16} />
              <span className="text-sm text-slate-300">SHA-256 hashing</span>
            </div>
            <div className="flex items-center space-x-3">
              <Box className="text-green-400" size={16} />
              <span className="text-sm text-slate-300">Blockchain storage</span>
            </div>
            <div className="flex items-center space-x-3">
              <Infinity className="text-green-400" size={16} />
              <span className="text-sm text-slate-300">Immutable records</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
