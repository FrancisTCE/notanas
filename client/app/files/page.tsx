"use client";

import { AppSidebar } from '@/components/app-sidebar';
import { ModeToggle } from '@/components/mode-toogle';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { DashboardItem } from '@/components/dashboard-item';
import { Progress } from '@/components/ui/progress';



interface FileDetails {
  id: string;
  name: string;
  lastMod: string;
  // Add other fields as needed
}

interface File {
  id: string;
  name: string;
  ext: string;
  isDir: boolean;
  path: string;
  lastMod: string;
  parent: string;
}

export default function FileDetailsPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearch] = useState<string>("");
  const [progress, setProgress] = useState(0)
  const animationCleanup = useRef<(() => void) | null>(null);
  const [initialized, setInitialized] = useState(false);

  const openFile = async (id: string) => {
    if (!id) {
      console.warn("ID is not provided. Skipping API call.");
      return;
    }
  
    const token = Cookies.get('token');
    if (!token) {
      console.error("No token found, redirecting to login.");
      router.push('/login');
      return;
    }
  
    const serverURL = sessionStorage.getItem('serverURL');
    if (!serverURL) {
      console.error("Server URL not found, redirecting to login.");
      router.push('/login');
      return;
    }
  
    try {
      const response = await fetch(`${serverURL}/api/v1/file/root`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 401) {
        console.error("Unauthorized access, redirecting to login.");
        router.push('/login');
        return;
      }
  
      if (response.ok) {
        const data = await response.json();
        setFiles(data.Files);
      } else {
        console.error("Failed to fetch files:", response.status);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredFiles = files?.filter((file) => {
    const isMatchingName = file?.name?.toLowerCase().includes(searching.toLowerCase());
    const isFolderSearch = searching.toLowerCase() === "folder" && file.ext === "";
    return isMatchingName || isFolderSearch;
  }) || [];

  function startInfiniteProgressAnimation(
    updateProgress: (value: number) => void
  ): () => void {
    let progress = 0;
    let direction = 1;

    const interval = setInterval(() => {
      progress += direction * 5; // Adjust step size for speed
      if (progress >= 100) {
        progress = 0; 
      }
      updateProgress(progress);
    }, 100); // Adjust interval for animation smoothness

    return () => clearInterval(interval); // Return cleanup function
  }

  useEffect(() => {
    if (loading) {
      animationCleanup.current = startInfiniteProgressAnimation(setProgress); // Start animation when loading
    } else {
      setProgress(0); // Reset progress when loading is done
      if (animationCleanup.current) animationCleanup.current(); // Stop animation
    }
  
    // Only fetch files when id exists or it's the initial load
    if (!initialized) {
      openFile("root"); // Replace "" with "root" or any default value for initial load
      setInitialized(true); // Set initialized to true so this doesn't run again
    } 
  }, [router, loading, initialized]);
  

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <ModeToggle />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Server</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Home PC Linux VM Ubuntu 2X LTS</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {loading ? <Progress value={progress} className='mx-2' /> : <></>}
        <div
          className="grid gap-4 p-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))"
          }}>
          {loading ? (
            <p></p>
          ) : filteredFiles.length === 0 ? (
            <p></p>
          ) : (
            filteredFiles.filter((file: File) => file.isDir).map((file: File) => (
              <div key={file.id}
                className="flex flex-col items-center transform transition duration-500 ease-in-out opacity-0 scale-90 animate-appear"
              >
                <DashboardItem
                  id={file.id}
                  name={file.name}
                  isDir={file.isDir}
                  path={file.path}
                  lastMod={file.lastMod}
                  onClick={() => {
                    router.push("/files/" + file.id)
                  }}
                />
              </div>
            ))
          )}


        </div>
        <div
          className="grid gap-4 p-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))"
          }}>

          {loading ? (
            <p></p>
          ) : filteredFiles.length === 0 ? (
            <p></p>
          ) : (
            filteredFiles.filter((file: File) => !file.isDir).map((file: File) => (
              <div key={file.id}
                className="flex flex-col items-center transform transition duration-500 ease-in-out opacity-0 scale-90 animate-appear">
                <DashboardItem
                  id={file.id}
                  name={file.name}
                  isDir={file.isDir}
                  path={file.path}
                  lastMod={file.lastMod}
                  onClick={() => {

                  }}
                />
              </div>
            ))
          )}
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}
