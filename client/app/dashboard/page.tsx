"use client";

import Cookies from 'js-cookie'; // Ensure to import this at the top

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toogle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useRef, useState } from "react";
import { ButtonWithIcon } from "@/components/button-with-icon";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { File } from 'lucide-react';
import { DashboardItem } from '@/components/dashboard-item';


interface File {
  id: string;
  name: string;
  ext: string;
  isDir: boolean;
  path: string;
  lastMod: string;
  parent: string;
}

export default function Page() {
  const [files, setFiles] = useState<File[]>([]);
  const [parentfiles, setParentFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearch] = useState<string>("");
  const router = useRouter();
  const [SERVER, setSERVERURL] = useState('');
  const [progress, setProgress] = useState(0)
  const animationCleanup = useRef<(() => void) | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>("");
  const [initialized, setInitialized] = useState(false);
  const PARENT_LIST: string[] = [];



  const currentFiles = async (id: string) => {
    const token = Cookies.get('token');
    if (typeof window !== 'undefined') {
      const serverURL = sessionStorage.getItem('serverURL');
      if (serverURL) {
        setSERVERURL(serverURL);
      } else {
        router.push('/login');
      }
    }
  
    setLoading(true);
    setFiles([]);  // Clear files while fetching new data
  
    let responseChildren: Response;
    try {
      // Fetch root folder or children based on `id`
      if (id === "" && SERVER !== "") {
        responseChildren = await fetch(SERVER + "/api/v1/file/root", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        responseChildren = await fetch(
         
          SERVER + "/api/v1/files/children?id=" + id,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (responseChildren.status === 401) {
        console.error("Unauthorized access, redirecting to login.");
        router.push('/login');
        return;
      }
  
      if (responseChildren.ok) {
        const data = await responseChildren.json();
        setFiles(data.Files);
        parentfiles.push()
        setLoading(false);
  
        // Update the current folder id in state and add it to PARENT_LIST
        setCurrentFolderId(id);
        PARENT_LIST.push(id);
        console.log("Fetching new parent " + PARENT_LIST)
      } else {
        console.error("Failed to fetch files:", responseChildren.status);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };
  

  useEffect(() => {
    if (loading) {
      animationCleanup.current = startInfiniteProgressAnimation(setProgress); // Start animation when loading
    } else {
      setProgress(0); // Reset progress when loading is done
      if (animationCleanup.current) animationCleanup.current(); // Stop animation
    }
  
    // Call currentFiles("") only if it hasn't been called before (initial load)
    if (!initialized) {
      currentFiles(""); // Only fetch root files when component is first loaded
      setInitialized(true); // Set initialized to true so this doesn't run again
    }
  
  }, [router, loading, initialized]);

  function startInfiniteProgressAnimation(
    updateProgress: (value: number) => void
  ): () => void {
    let progress = 0;
    let direction = 1;
  
    const interval = setInterval(() => {
      progress += direction * 5; // Adjust step size for speed
      if (progress >= 100 || progress <= 0) {
        direction *= -1; // Reverse direction when hitting bounds
      }
      updateProgress(progress);
    }, 100); // Adjust interval for animation smoothness
  
    return () => clearInterval(interval); // Return cleanup function
  }


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value)
  };

  const filteredFiles = files?.filter((file) => {
    const isMatchingName = file?.name?.toLowerCase().includes(searching.toLowerCase());
    const isFolderSearch = searching.toLowerCase() === "folder" && file.ext === "";
    return isMatchingName || isFolderSearch;
  }) || [];

  
    const goBack = () => {
      if (PARENT_LIST.length > 1) {
        const previousFolder = PARENT_LIST[PARENT_LIST.length - 2]; // Get second-to-last folder
        currentFiles(previousFolder); // Navigate to the previous folder
        PARENT_LIST.pop(); // Remove the current folder from history
      } else {
        currentFiles(""); // Navigate back to the root
        PARENT_LIST.length = 0; // Clear the list completely
      }
      console.log("PARENT_LIST after goBack:", PARENT_LIST);
    };
    
    
    

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
        <div className="flex w-full max-w-sm items-center space-x-2 p-4">
          
          <Input
            id="search"
            value={searching}
            onChange={handleSearchChange}
            placeholder="Type here to search..."
          />
          <Button variant="secondary"
          onClick={() => {
            setSearch("")
          }}          
          >Clear</Button>
           
        </div>
        <div className="flex flex-wrap gap-4 py-5">
          {loading ? (
            <Progress value={progress} className='mx-2'/>
          ) : (
            <span></span>
          )}
          {loading ? (
            <p>Loading extensions...</p>
          ) : filteredFiles?.length === 0 ? (
            <p>No files available.</p>
          ) : (
            (() => {
              const uniqueExtensions = new Set(
                filteredFiles?.map((file) => (file.ext === "" ? "Folder" : file.ext))
              );
              const uniqueArray = Array.from(uniqueExtensions); // Convert Set to Array
              return uniqueArray.map((ext, index) => (
                <div key={index}>
                  <Badge
                    variant="secondary"
                    onClick={() => setSearch(ext)}
                    style={{ cursor: "pointer" }}
                  >
                    {ext}
                  </Badge>
                </div>
              ));
            })()
          )}
        </div>
        <div>
        <Breadcrumb className="flex flex-wrap gap-4 p-4">
              <BreadcrumbList>
                {PARENT_LIST?.map((parent) => (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="">{parent}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
        </div>
        <div className="flex flex-wrap gap-4 p-4">
            <Button
              onClick={goBack}
              variant="secondary"
              className="mb-1 mt-1"
            >
              Go Back
            </Button>
        </div>

        <div 
          className="grid gap-4 p-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))"
          }}
        >
        
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
                      router.push("files/"+file.id)
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
          }}
        >
        
          {loading ? (
            <p></p>
          ) : filteredFiles.length === 0 ? (
            <p></p>
          ) : (
            filteredFiles.filter((file: File) => !file.isDir).map((file: File) => (
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
                      if (file.isDir && file.id !== currentFolderId) {
                        currentFiles(file.id); 
                        PARENT_LIST.push(file.id)
                      }
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


