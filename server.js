// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://occupation-integration.ipcontrol.online"
}));
const PORT = process.env.PORT || 3000;

const tenantID = process.env.TENANT_ID;
const apiKey = process.env.API_KEY;
const authURL = process.env.AUTH_URL;
const apiURL = process.env.API_URL;

let token = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (token && now < tokenExpiry - 60000) return token;

  const response = await fetch(authURL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: tenantID,
      client_secret: apiKey,
      grant_type: "client_credentials",
      response_type: "id_token",
      scope: "ParkBaseApi"
    })
  });

  if (!response.ok) throw new Error("Failed to get token");

  const data = await response.json();
  token = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  return token;
}

async function apiGet(path) {
  const accessToken = await getToken();
  const response = await fetch(`${apiURL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

app.get("/api/facilities", async (req, res) => {
  try {
    const data = await apiGet("/facilities");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/facilities/:id/occupation", async (req, res) => {
  try {
    const data = await apiGet(`/facilities/${req.params.id}/occupation`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/facilities/:id/capacity", async (req, res) => {
  try {
    const data = await apiGet(`/facilities/${req.params.id}/capacity`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
