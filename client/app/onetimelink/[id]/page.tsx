"use client";


import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react"

export default function Page({ params }: { params: { id: string } }) {
    const { id } = params;
    const [currentDomain, setCurrentDomain] = useState('');


    async function downloadFile() {

      const newDomain = currentDomain + "/otl?id=" + id;
      console.log("calling: " + newDomain)
    
        const response = await fetch(newDomain, {
            method: 'GET',
            headers: {
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


    useEffect(() => {
        setCurrentDomain(window.location.origin)
    }, [])

    return (
      <div className="flex flex-col h-screen w-full items-center justify-center px-4 space-y-4 text-center">
        <h1 className="break-words">
          Welcome to NOTANAS OSS DFS 
        </h1>
        <h1>Reversed Proxied with TLS 1.3 Encryption</h1>
        <h3>Click download to retrieve the file</h3>
        <Button onClick={downloadFile}>Download</Button>
      </div>


    )
  }