'use client';

import Cookies from 'js-cookie'; // Ensure to import this at the top
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [defaultUrl, setDefaultUrl] = useState("");

  // Set the default URL on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDefaultUrl(window.location.origin); // Get the current URL origin
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = formData.get("email");
    const password = formData.get("password");
    const URL = formData.get("url");

    // Type narrowing for 'url'
    if (typeof URL !== "string") {
      alert("Please provide a valid server URL.");
      return;
    }

    const response = await fetch(URL + "/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Login response data:", data); // Log the entire response

      const token = data.token; // Check if this is the right path
      console.log("Extracted Token:", token); // Log the extracted token

      // Store the token in cookies
      Cookies.set("token", token, { expires: 1 }); // Set the cookie to expire in 1 day
      if (typeof window !== "undefined" && URL != null) {
        // Ensure we're on the client-side
        sessionStorage.setItem("serverURL", URL);
        console.log(sessionStorage.getItem("serverURL"));
      }
      // Redirect to the dashboard
      router.push("/files");
    } else {
      // Handle errors (e.g., show an error message)
      const errorData = await response.json();
      console.error("Login error:", errorData.error);
      alert("Login failed: " + errorData.error);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your Account below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Input
            className="mt-2"
            name="email"
            placeholder="Account"
            required
          />
          <Input
            className="mt-2"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <Input
            className="mt-2"
            type="text"
            name="url"
            placeholder="Server URL"
            defaultValue={defaultUrl} // Prefill with the current URL
            required
          />
          <Button className="mt-2" type="submit">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
