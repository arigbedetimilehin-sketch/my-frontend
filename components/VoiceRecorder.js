import { useState, useRef } from "react";
import { uploadAttachment } from "../../utils/uploadAttachment";
import { supabase } from "../../supabaseClient";

export default function VoiceRecorder({ userId, triggerId }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, {
          type: "audio/webm",
        });

        // Upload to Supabase
        const audioUrl = await uploadAttachment(userId, triggerId, file);
        setAudioURL(audioUrl);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Please allow microphone access to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-gray-100 mt-4 shadow-sm">
      <h3 className="font-semibold mb-2">🎤 Record Voice Note</h3>

      <div className="flex items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Stop Recording
          </button>
        )}

        {audioURL && (
          <audio controls src={audioURL} className="ml-3" />
        )}
      </div>
    </div>
  );
}
