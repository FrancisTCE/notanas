"use client";

import React, { useEffect, useState } from 'react';
import { ButtonWithIcon } from './button-with-icon';

interface File {
  id: string;
  name: string;
  ext: string;
  isDir: boolean;
  path: string;
  lastMod: string;
  parent: string;
}

const FileList: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/files');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFiles(data.Files);
      } catch (error) {
        console.error('Failed to fetch files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (loading) {
    return <p>Loading files...</p>;
  }

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        files 
          .map((file) => (
            <div key={file.id} className="flex flex-col items-center">
              <ButtonWithIcon
                id={file.id}
                name={file.name}
                isDir={file.isDir}
                path={file.path}
                lastMod={file.lastMod}
              />
            </div>
          ))
      )}
    </div>
  );
};

export default FileList;
