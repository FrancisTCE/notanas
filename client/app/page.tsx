'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]); // Dependency array includes router to avoid warnings

  return <div></div>;
}
