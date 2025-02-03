import React, { useEffect, useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Folder, File, Grip  } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from './ui/button';
import Cookies from 'js-cookie'; 
import { useRouter } from 'next/navigation';


interface ButtonWithIconProps {
  id: string;
  name: string;
  ext?: string;
  isDir: boolean;
  path: string;
  lastMod: string;
  onDoubleClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}


export function DashboardItem({ name, isDir, ext, id, path, lastMod, onClick }: ButtonWithIconProps) {
  const [otl, setOlt] = useState('');
  const [SERVER, setSERVERURL] = useState('');
  const [isDialogOpenDetails, setIsDialogOpenDetails] = useState(false);
  const [isDialogOpenOTL, setIsDialogOpenOTL] = useState(false);
  const [isDialogOpenDelete, setIsDialogOpenDelete] = useState(false);
  const [isDialogOpenDownload, setIsDialogOpenDownload] = useState(false);
  const [isDialogOpenMenu, setIsDialogOpenMenu] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const serverURL = sessionStorage.getItem('serverURL');
      if (serverURL) setSERVERURL(serverURL);
    }
  });

  const generateOTL = async (id: string) => {
    if (!id) return;
    const token = Cookies.get('token');
    if (!token) return;

    try {
      const response = await fetch(`${SERVER}/api/v1/files/otl?id=${id}&expires=60&maxdownloads=5`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to generate OTL");
      const data = await response.json();
      const otlLink = data.Token || data.token;
      setOlt(`${SERVER}/onetimelink/${otlLink}`);
    } catch (error) {
      console.error("Error generating OTL:", error);
    }
  };

  const copyOTL = async () => {
    await navigator.clipboard.writeText(otl);
    toast({ title: "OTL", description: "One-time link copied to clipboard." });
    setOlt("");
  };

  const deleteFile = async (id: string) => {
    const token = Cookies.get('token');
    const response = await fetch(`${SERVER}/api/v1/files?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      console.error("Failed to delete file:", response.statusText);
    } else router.refresh; 
  };

  async function downloadFile(id: string) {
    const token = Cookies.get('token');

    const serverURL = sessionStorage.getItem('serverURL');
    if (!serverURL) {
      console.error("Server URL not found, redirecting to login.");
      router.push('/login');
      return;
    }

    const response = await fetch(serverURL+"/api/v1/download?id="+id, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    // Check if the response is okay and has data
    if (!response.ok) {
      console.error("Failed to download file:", response.statusText);
      return;
    }

    // Convert response to a blob
    const blob = await response.blob();

    // Create a temporary URL for the blob and trigger the download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Set a default filename if one isn’t provided in response headers
    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition 
      ? contentDisposition.split("filename=")[1] 
      : `downloaded-file-${id}`;

    // Set the filename and initiate download
    link.download = filename.replace(/"/g, ''); // Remove quotes if present
    link.click();

    // Clean up by revoking the blob URL
    window.URL.revokeObjectURL(url);
    }

  return (
    <div>
      <Grip
            className="absolute top-4 right-6 m-2 cursor-pointer z-10"
            onClick={(e) => {
              e.stopPropagation(); // Prevent parent click handlers
              e.preventDefault(); // Prevent default context menu
              setIsDialogOpenMenu(true)
            }}
          />
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="relative flex flex-col items-center w-full max-w-sm p-4 space-y-2">
            
            <Button
              variant="secondary"
              className="flex flex-col items-center justify-center w-[100px] h-[100px] p-2 space-y-1 border  border-gray-300 rounded-lg"
              onClick={(event) => onClick?.(event)}
              //onDoubleClick={(event) => onDoubleClick?.(event)}
            >
              {isDir ? <Folder size={"4rem"} /> : <File size={"4rem"} />}
            </Button>
            <p className="text-sm text-center truncate max-w-[90%] overflow-hidden whitespace-nowrap select-none">
              {name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name}
            </p>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => setIsDialogOpenDetails(true)}>View Details</ContextMenuItem>
          <ContextMenuItem onClick={() => setIsDialogOpenDownload(true)}>Download</ContextMenuItem>
          <ContextMenuItem onClick={() => {generateOTL(id); setIsDialogOpenOTL(true); }}>Generate OTL</ContextMenuItem>
          <ContextMenuItem onClick={() => setIsDialogOpenDelete(true)}>Delete</ContextMenuItem>
        </ContextMenuContent>

        {/* Details Dialog */}
        <AlertDialog open={isDialogOpenDetails} onOpenChange={() => setIsDialogOpenDetails(!isDialogOpenDetails)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>File Details</AlertDialogTitle>
              <AlertDialogDescription>
                <ul>
                  <li>ID: {id}</li>
                  <li>Name: {name}</li>
                  <li>Extension: {ext}</li>
                  <li>Folder: {isDir ? "true" : "false"}</li>
                  <li>Path: {path}</li>
                  <li>Last Modified: {lastMod}</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* OTL Dialog */}
        <AlertDialog open={isDialogOpenOTL} onOpenChange={() => setIsDialogOpenOTL(!isDialogOpenOTL)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>OTL Created</AlertDialogTitle>
              <AlertDialogDescription>
                This link allows file download: {otl==="" ? "Generated."  : "Generated."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={copyOTL}>Copy</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDialogOpenDelete} onOpenChange={() => setIsDialogOpenDelete(!isDialogOpenDelete)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This action is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                onClick={() => {
                  deleteFile(id);
                  toast({ title: "Alert", description: `File "${name}" deletion requested.` });
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        {/* Download Confirmation */}
        <AlertDialog open={isDialogOpenDownload} onOpenChange={() => setIsDialogOpenDownload(!isDialogOpenDownload)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Download Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                File to download: {name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  downloadFile(id)
                  toast({ title: "Downloads", description: `File "${name}" download requested.` });
                }}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContextMenu>

          {/* Menu Confirmation */}
          <AlertDialog open={isDialogOpenMenu} onOpenChange={() => setIsDialogOpenMenu(!isDialogOpenMenu)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>File Menu</AlertDialogTitle>
          <AlertDialogDescription>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className='mt-2' onClick={() => {generateOTL(id); setIsDialogOpenOTL(true)}}>OTL</AlertDialogAction>
          <AlertDialogAction className='mt-2' onClick={() => setIsDialogOpenDownload(true)}>Download</AlertDialogAction>
          <AlertDialogAction className='mt-2' onClick={() => setIsDialogOpenDetails(true)}>Details</AlertDialogAction>
          <AlertDialogAction className='mt-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground' onClick={() => setIsDialogOpenDelete(true)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

      

    </div>
  );
}
