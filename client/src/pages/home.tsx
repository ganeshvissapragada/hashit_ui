import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, Upload, CheckCircle, Folder } from "lucide-react";
import { getStorageData, formatBytes } from "@/lib/storage";
import FileUpload from "@/components/file-upload";
import FileVerify from "@/components/file-verify";
import FileList from "@/components/file-list";
import Sidebar from "@/components/sidebar";

type Tab = "upload" | "verify" | "files";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const storageData = getStorageData();

  const tabs = [
    { id: "upload", label: "Upload Files", icon: Upload },
    { id: "verify", label: "Verify Files", icon: CheckCircle },
    { id: "files", label: "My Files", icon: Folder },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-indigo-700/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BlockChain Vault</h1>
                <p className="text-slate-300 text-sm">Secure Decentralized Storage</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-300">
                Storage: <span className="text-purple-400 font-semibold">{formatBytes(storageData.storageUsed)}</span> / {formatBytes(storageData.storageTotal)}
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Tabs */}
          <div className="lg:col-span-4">
            <nav className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-indigo-700/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={`flex items-center space-x-2 px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                        : "text-slate-300 hover:text-purple-400 hover:bg-purple-400/10"
                    }`}
                    onClick={() => setActiveTab(tab.id as Tab)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === "upload" && <FileUpload />}
            {activeTab === "verify" && <FileVerify />}
            {activeTab === "files" && <FileList />}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-700/50 bg-gray-900/80 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-slate-400">
              © 2024 BlockChain Vault. Secure decentralized storage for everyone.
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
