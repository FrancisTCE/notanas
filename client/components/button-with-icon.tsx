'use client'

import { Folder, File } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button"
 
interface ButtonWithIconProps {
    id: string;
    name: string;
    ext?: string;
    isDir: boolean;
    path: string;
    lastMod: string;
    onDoubleClick?: React.MouseEventHandler<HTMLButtonElement>; 
  }

  export function ButtonWithIcon({name, isDir, /*id*/}: ButtonWithIconProps) {
    //const router = useRouter();

    const getTruncatedName = (name: string) => {
      const maxChars = 30;
      if (name.length <= maxChars) return name;
  
      const extIndex = name.lastIndexOf(".");
      if (extIndex <= 0) return name.slice(0, maxChars - 3) + "..."; // No extension case
  
      const ext = name.slice(extIndex);
      const truncatedName = name.slice(0, maxChars - ext.length - 3);
      return `${truncatedName}...${ext}`;
    };
    
    const truncatedName = getTruncatedName(name);

    const handleClick = () => {
      //router.push(`/files/${id}`); 
    };

    return (
      <Button className="w-[250px] h-[40px] justify-start"
      onClick={handleClick}
      variant="secondary"
      >
        {isDir ? ( <Folder /> ) : (<File /> )} {truncatedName}
      </Button>
    )
  }