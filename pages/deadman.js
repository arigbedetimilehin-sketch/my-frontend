import { useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "../supabaseClient";
import { uploadAttachment } from "../utils/uploadAttachment";

export default function Deadman() {
  // ─────────────────────────────
  // STATE
  // ─────────────────────────────
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // ─────────────────────────────
  // INITIAL SESSION LOAD
  // ─────────────────────────────
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) fetchItems(sessionUser.id);
    };
    getSession();
  }, []);

  // ─────────────────────────────
  // FETCH TRIGGERS
  // ─────────────────────────────
  const fetchItems = async (userId) => {
    const { data, error } = await supabase
      .from("deadman_triggers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) setErrorMsg(error.message);
    else setItems(data);
  };

  // ─────────────────────────────
  // ADD NEW NOTE / TRIGGER
  // ─────────────────────────────
  const addItem = async () => {
    if (!newContent.trim() || !user) return alert("Please write something first.");

    const { error } = await supabase.from("deadman_triggers").insert([
      {
        user_id: user.id,
        content: newContent,
        timeout_days: 1, // Default safe value to avoid null constraint
      },
    ]);

    if (error) setErrorMsg(error.message);
    else {
      setNewContent("");
      fetchItems(user.id);
    }
  };

  // ─────────────────────────────
  // FILE / VOICE / VIDEO UPLOAD
  // ─────────────────────────────
  const handleUpload = async (triggerId, type) => {
    if (!file && !audioBlob) {
      alert("Please select a file or record audio first!");
      return;
    }

    setUploading(true);
    try {
      let uploadFile;

      if (audioBlob) {
        uploadFile = new File([audioBlob], "voice-note.webm", { type: "audio/webm" });
      } else {
        uploadFile = file;
      }

      const url = await uploadAttachment(user.id, triggerId, uploadFile);

      const updateData = {};
      if (type === "voice") updateData.voice_url = url;
      else if (uploadFile.type.startsWith("image")) updateData.photo_url = url;
      else if (uploadFile.type.startsWith("video")) updateData.video_url = url;
      else updateData.file_url = url;

      await supabase.from("deadman_triggers").update(updateData).eq("id", triggerId);

      alert("✅ File uploaded successfully!");
      setFile(null);
      setAudioBlob(null);
      fetchItems(user.id);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────
  // VOICE RECORDER
  // ─────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  // ─────────────────────────────
  // TIMER HANDLING
  // ─────────────────────────────
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    if (timeLeft === 1) handleTimeExpired();
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    if (!timer) return alert("Set a timer first!");
    setIsActive(true);
    setTimeLeft(timer * 60);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
  };

  // ─────────────────────────────
  // ON TIMER EXPIRY → SEND ALERTS
  // ─────────────────────────────
  const handleTimeExpired = async () => {
    setIsActive(false);
    alert("⏰ Time expired! Sending alerts to trusted contacts...");

    try {
      // (Frontend test placeholder — the real alert is sent via /api/send-deadman-alert)
      const { data: contacts, error } = await supabase
        .from("trusted_contacts")
        .select("email")
        .eq("user_id", user.id);

      if (error) throw error;

      const emails = contacts?.map((c) => c.email) || [];
      if (emails.length === 0) {
        alert("No trusted contacts found!");
        return;
      }

      // Trigger backend alert route
      const res = await fetch("/api/send-deadman-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send alerts");
      }

      alert("✅ Alerts sent to trusted contacts!");
      console.log("Alerts sent to:", emails);
    } catch (err) {
      console.error("Error sending alerts:", err);
      alert("Failed to send alerts: " + err.message);
    }
  };

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gradient-to-br from-blue-700 to-indigo-900">
        <p className="text-xl font-semibold">Please log in to access Deadman Fingers.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Deadman Fingers | EchoSignal Cloud</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white p-6 font-sans">
        <h1 className="text-3xl font-bold mb-6 text-center">⚡ Deadman Fingers (Triggers)</h1>
        {errorMsg && <p className="text-red-400 text-center">{errorMsg}</p>}

        {/* Add new note */}
        <div className="bg-white/10 p-6 rounded-xl max-w-md mx-auto mb-10">
          <h2 className="text-xl font-semibold mb-2">✍️ Add Note</h2>
          <input
            type="text"
            placeholder="Write something..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full p-2 rounded-lg text-black mb-3"
          />
          <button
            onClick={addItem}
            className="w-full bg-[#ff6f61] py-2 rounded-lg text-white hover:bg-[#ff3b2e]"
          >
            Save Note
          </button>
        </div>

        {/* Triggers */}
        <h2 className="text-2xl font-semibold mb-4 text-center">📁 Your Triggers</h2>

        {items.length === 0 ? (
          <p className="text-center">No triggers yet. Add one above!</p>
        ) : (
          <div className="grid gap-5 max-w-2xl mx-auto">
            {items.map((item) => (
              <div key={item.id} className="bg-white/10 p-5 rounded-xl">
                <p className="text-lg font-bold">{item.content}</p>
                <p className="text-sm text-gray-200">{new Date(item.created_at).toLocaleString()}</p>

                {/* Display attachments */}
                {item.photo_url && <img src={item.photo_url} alt="Uploaded" className="mt-3 rounded-md" />}
                {item.video_url && <video controls src={item.video_url} className="mt-3 rounded-md w-full" />}
                {item.voice_url && <audio controls src={item.voice_url} className="mt-3 w-full" />}
                {item.file_url && (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="block mt-3 text-yellow-300 underline">
                    View Attached File
                  </a>
                )}

                {/* Upload new attachments */}
                <div className="mt-4">
                  <p>📷 Upload photo, video, or document:</p>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept="image/*,video/*,.pdf,.doc,.zip"
                    className="mt-2"
                  />
                  <button
                    onClick={() => handleUpload(item.id, "file")}
                    disabled={uploading}
                    className="mt-3 bg-green-600 px-4 py-2 rounded-lg text-white"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>

                {/* Voice recording */}
                <div className="mt-4">
                  <p>🎙 Record a voice note:</p>
                  {!recording ? (
                    <button
                      onClick={startRecording}
                      className="bg-yellow-500 mt-2 px-4 py-2 rounded-lg text-white"
                    >
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="bg-red-600 mt-2 px-4 py-2 rounded-lg text-white"
                    >
                      Stop Recording
                    </button>
                  )}
                  {audioBlob && (
                    <button
                      onClick={() => handleUpload(item.id, "voice")}
                      className="mt-3 bg-blue-600 px-4 py-2 rounded-lg text-white"
                    >
                      Save Voice Note
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TIMER SECTION */}
        <hr className="my-10 border-white/30" />
        <h2 className="text-2xl font-bold mb-4 text-center">🕒 Deadman Timer</h2>

        <div className="bg-white text-black p-6 rounded-2xl shadow-lg max-w-md mx-auto">
          <label className="block mb-2 font-semibold">Set Timer (minutes):</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            value={timer || ""}
            onChange={(e) => setTimer(Number(e.target.value))}
            placeholder="Enter minutes"
          />
          <div className="flex justify-between">
            <button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Start
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Reset
            </button>
          </div>

          {isActive && (
            <div className="mt-6 text-center">
              <p className="text-xl font-bold text-indigo-700">
                Time Remaining: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
