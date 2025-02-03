"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toogle";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useEffect, useRef, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { DashboardItem } from "@/components/dashboard-item";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface File {
  id: string;
  name: string;
  ext: string;
  isDir: boolean;
}

export default function FileDetailsPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearch] = useState<string>("");
  const [SERVER, setSERVERURL] = useState("");
  const [progress, setProgress] = useState(0);
  const animationCleanup = useRef<(() => void) | null>(null);

  const filteredFiles =
    files?.filter((file) => {
      const isMatchingName = file?.name
        ?.toLowerCase()
        .includes(searching.toLowerCase());
      const isFolderSearch =
        searching.toLowerCase() === "folder" && file.ext === "";
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

  const debouncedFetchFiles = useCallback(
    debounce(async (query: string) => {
      const token = Cookies.get("token");
      if (!SERVER || !token) {
        console.error("Server URL or token missing.");
        router.push("/login");
        return;
      }
      if (searching != "") {
          try {
            setLoading(true);
            const response = await fetch(`${SERVER}/api/v1/files/search/${query}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
    
            if (response.status === 401) {
              console.error("Unauthorized access, redirecting to login.");
              router.push("/login");
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
      }
    }, 300), // Adjust debounce delay
    [SERVER, router]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearch(query);
    debouncedFetchFiles(query); // Call the debounced function
  };

  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  

  useEffect(() => {
    if (typeof window !== "undefined") {
      const serverURL = sessionStorage.getItem("serverURL");
      if (serverURL) {
        setSERVERURL(serverURL);
      } else {
        router.push("/login");
      }
    }
    setLoading(false)
  }, [router]);

  useEffect(() => {
    if (loading) {
      animationCleanup.current = startInfiniteProgressAnimation(setProgress); // Start animation when loading
    } else {
      setProgress(0); // Reset progress when loading is done
      if (animationCleanup.current) animationCleanup.current(); // Stop animation
    }
  }, [loading]);

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
                  <BreadcrumbPage>
                    Home PC Linux VM Ubuntu 2X LTS
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {loading ? <Progress value={progress} className="mx-2" /> : <></>}
        <div className="flex w-full max-w-sm items-center space-x-2 p-4">
          <Input
            id="search"
            value={searching}
            onChange={handleSearchChange}
            placeholder="In page search.."
          />
          <Button
            variant="secondary"
            onClick={() => {
              setSearch("");
            }}
          >
            Clear
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
          ) : files.length === 0 ? (
            <p></p>
          ) : (
            files.filter((file: File) => file.isDir).map((file: File) => (
              <div key={file.id}
              className="flex flex-col items-center transform transition duration-500 ease-in-out opacity-0 scale-90 animate-appear"
              >
                <DashboardItem 
                    id={file.id}
                    name={file.name}
                    isDir={file.isDir}
                    path={""}
                    lastMod={""}
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
          }}>
          {loading ? (
            <p></p>
          ) : files.length === 0 ? (
            <p></p>
          ) : (
            files.filter((file: File) => file.isDir).map((file: File) => (
              <div key={file.id}
                className="flex flex-col items-center transform transition duration-500 ease-in-out opacity-0 scale-90 animate-appear"
              >
                <DashboardItem
                  id={file.id}
                  name={file.name}
                  isDir={file.isDir}
                  path={""}
                  lastMod={""}
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
          ) : files.length === 0 ? (
            <p></p>
          ) : (
            files.filter((file: File) => !file.isDir).map((file: File) => (
              <div key={file.id}
                className="flex flex-col items-center transform transition duration-500 ease-in-out opacity-0 scale-90 animate-appear">
                <DashboardItem
                  id={file.id}
                  name={file.name}
                  isDir={file.isDir}
                  path={""}
                  lastMod={""}
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

