import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { X, Camera } from "lucide-react";

// Helper: convert base64 dataURL → Blob
function dataURLtoBlob(dataURL) {
  const [header, base64] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export default function CameraModal({ onCapture }) {
  const [open, setOpen] = useState(false);
  const webcamRef = useRef(null);

  const openCamera = () => setOpen(true);

  const closeCamera = () => setOpen(false);

  const takePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = dataURLtoBlob(imageSrc);
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    onCapture?.(file);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openCamera}
        className="w-full bg-[#d33115] text-white hover:bg-[#801300] px-4 py-2.5 font-semibold justify-center rounded-lg flex items-center gap-2"
      >
        <Camera size={24} />
      </button>

      {/* FULLSCREEN MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">

          {/* Top bar */}
          <div className="flex justify-between items-center p-4 text-white bg-black/60">
            <span className="text-sm">Cámara</span>

            <button onClick={closeCamera}>
              <X size={24} />
            </button>
          </div>

          {/* Camera view */}
          <div className="flex-1 flex items-center justify-center">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom controls */}
          <div className="p-4 flex justify-center bg-black/60">
            <button
              onClick={takePhoto}
              className="bg-white text-black px-6 py-3 rounded-full font-semibold"
            >
              Capturar
            </button>
          </div>

        </div>
      )}
    </>
  );
}