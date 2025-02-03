# notanas
NextJS + GIN Golang + NGINX File Server using Clouldflare tunnels [Work in Progress but functional]

As of now this is not yet secured please don't use this to store important things, it still has alot to implement in roadmap such as: SSR Backend for user management, IP locks, Geolocation locks, finalize other features, etc.

To change default password please change the hardcoded values on Server -> service -> main.go -> line 66 and 67. (in future will be replace by the SSR Backend)

To change default folder please change the hardcoded values on Server -> service -> main.go -> line 58. (in future will be replace by the SSR Backend) By default its hardcoded the sample folder.

How to run:
docker compose up --build

How to expose the server:
cloudflared tunnel --url http://localhost:80 (NGINX)

How to access: Open the cloudflared tunnel url provided by cloudflare
