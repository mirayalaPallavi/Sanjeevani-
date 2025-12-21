import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, patientName, doctorName } = await req.json();
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    
    if (!DAILY_API_KEY) {
      // If no Daily.co API key, generate a Jitsi room URL instead
      console.log("No Daily.co API key found, generating Jitsi room...");
      const roomName = `sanjeevani-${appointmentId}-${Date.now()}`;
      const jitsiUrl = `https://meet.jit.si/${roomName}`;
      
      return new Response(JSON.stringify({ 
        url: jitsiUrl,
        provider: "jitsi",
        roomName 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Daily.co room
    console.log("Creating Daily.co room...");
    
    const roomResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `appointment-${appointmentId}`,
        privacy: "private",
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!roomResponse.ok) {
      const errorText = await roomResponse.text();
      console.error("Daily.co error:", roomResponse.status, errorText);
      
      // Fallback to Jitsi
      const roomName = `sanjeevani-${appointmentId}-${Date.now()}`;
      const jitsiUrl = `https://meet.jit.si/${roomName}`;
      
      return new Response(JSON.stringify({ 
        url: jitsiUrl,
        provider: "jitsi",
        roomName 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const room = await roomResponse.json();
    
    // Create meeting tokens for participants
    const createToken = async (userName: string, isOwner: boolean) => {
      const tokenResponse = await fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: room.name,
            user_name: userName,
            is_owner: isOwner,
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
        }),
      });
      
      if (!tokenResponse.ok) {
        console.error("Failed to create token for", userName);
        return null;
      }
      
      const tokenData = await tokenResponse.json();
      return tokenData.token;
    };

    const [doctorToken, patientToken] = await Promise.all([
      createToken(doctorName || "Doctor", true),
      createToken(patientName || "Patient", false),
    ]);

    return new Response(JSON.stringify({
      url: room.url,
      provider: "daily",
      roomName: room.name,
      doctorToken,
      patientToken,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-video-room function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
