import { useState, useRef, useEffect } from "react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError("Could not access camera: " + e.message);
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }

  function retake() {
    setPreview(null);
    async function restart() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    restart();
  }

  function confirm() {
    const base64 = preview.split(",")[1];
    onCapture({ base64, mediaType: "image/jpeg" });
  }

  return (
    <div className="camera-overlay">
      <div className="camera-container">
        <div className="camera-header">
          <button onClick={onClose} className="cooking-exit-btn">× Cancel</button>
        </div>

        {error ? (
          <div className="empty-state">
            <p className="empty-state-emoji">📷</p>
            <p className="empty-state-title">Camera unavailable</p>
            <p className="empty-state-text">{error}</p>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="Preview" className="camera-preview" />
            <div className="camera-actions">
              <button onClick={retake} className="btn btn-secondary btn-lg">↩ Retake</button>
              <button onClick={confirm} className="btn btn-primary btn-lg">Use Photo →</button>
            </div>
          </>
        ) : (
          <>
            <video ref={videoRef} className="camera-video" playsInline muted />
            <div className="camera-actions">
              <button onClick={capture} disabled={!ready} className="camera-shutter">
                {ready ? "📷" : "Loading…"}
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
