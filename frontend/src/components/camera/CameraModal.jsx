import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { X, Send, Camera, RotateCcw, CheckCircle } from 'lucide-react';
import { analyzePhoto } from '../../services/cameraService';
import { processSale } from '../../services/salesService';

function dataURLtoBlob(dataURL) {
  const [header, base64] = dataURL.split(',');
  const mime = header.match(/:(.+?);/)[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

const STEPS = { CAMERA: 'camera', PREVIEW: 'preview', PROCESSING: 'processing', RESULT: 'result', SELLING: 'selling' };

export default function CameraModal({ inventory, setInventory, showNotification, currentUser }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEPS.CAMERA);
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [cart, setCart] = useState([]);
  const webcamRef = useRef(null);

  const openCamera = () => { setStep(STEPS.CAMERA); setPhoto(null); setCart([]); setOpen(true); };
  const closeModal = () => { setOpen(false); setStep(STEPS.CAMERA); setPhoto(null); setCart([]); };

  const takePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = dataURLtoBlob(imageSrc);
    setPhoto(imageSrc);
    setPhotoFile(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    setStep(STEPS.PREVIEW);
  };

  const retake = () => { setPhoto(null); setPhotoFile(null); setStep(STEPS.CAMERA); };

  const sendPhoto = async () => {
    setStep(STEPS.PROCESSING);
    try {
      const result = await analyzePhoto(photoFile);
      if (result.success) {
        setCart(result.cart);
        setStep(STEPS.RESULT);
      }
    } catch {
      setStep(STEPS.PREVIEW);
    }
  };

  const confirmAndSendCart = async () => {
    const matched = cart.filter(i => i.confidence >= 0.65 && i.codigo);
    if (matched.length === 0) { showNotification('No hay productos identificados para vender', 'error'); return; }
    setStep(STEPS.SELLING);
    try {
      const cartData = matched.map(item => ({
        codigo: item.codigo,
        cantidad_vendida: item.cantidadVendida,
        nombre: item.nombre,
        precio: item.precio,
        tipoPrecio: item.tipoPrecio,
      }));
      const result = await processSale(cartData, currentUser?.nombre);
      if (result.success) {
        setInventory(inventory.map(item => {
          const cartItem = cart.find(c => c.id === item.id);
          return cartItem ? { ...item, cantidad: item.cantidad - cartItem.cantidadVendida } : item;
        }));
        showNotification('¡Venta procesada exitosamente!', 'success');
        setCart([]);
      } else {
        showNotification(result.error, 'error');
      }
    } catch {
      showNotification('Error al procesar la venta', 'error');
    } finally {
      closeModal();
    }
  };

  if (!open) {
    return (
      <button
        onClick={openCamera}
        className="w-full bg-[#d33115] text-white hover:bg-[#801300] px-4 py-2.5 font-semibold justify-center rounded-lg flex items-center gap-2 transition"
      >
        <Camera size={20} />
        <span>Escanear</span>
      </button>
    );
  }

  const Spinner = () => (
    <div className="flex gap-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-[#008cc8] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col">
      {step === STEPS.CAMERA && (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center p-5">
              <button onClick={closeModal} className="bg-black/40 backdrop-blur-sm p-2 rounded-full text-white">
                <X size={22} />
              </button>
              <div className="w-10" />
            </div>
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="w-full max-w-sm aspect-3/4 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
            <p className="text-center text-white/80 text-sm mb-4 px-8">Apunta la cámara hacia la lista de ventas</p>
            <div className="flex justify-center items-center pb-12 gap-16">
              <div className="w-10" />
              <button onClick={takePhoto} className="w-15 h-15 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                <div className="w-11 h-11 rounded-full bg-white border-4 border-gray-300" />
              </button>
              <div className="w-10" />
            </div>
          </div>
        </>
      )}

      {step === STEPS.PREVIEW && (
        <>
          <img src={photo} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center p-5 pt-10">
              <button onClick={closeModal} className="bg-black/40 backdrop-blur-sm p-2 rounded-full text-white"><X size={22} /></button>
              <span className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">Vista previa</span>
              <div className="w-10" />
            </div>
            <div className="flex-1" />
            <div className="p-5 pb-12 flex items-center justify-between gap-40">
              <button onClick={retake} className="flex flex-col items-center gap-1 text-white">
                <div className="bg-black/50 backdrop-blur-sm p-3 rounded-full"><RotateCcw size={22} /></div>
                <span className="text-xs">Repetir foto</span>
              </button>
              <button onClick={sendPhoto} className="flex-1 bg-[#0796c2] hover:bg-[#006b9e] text-white font-semibold py-3 rounded-3xl flex items-center justify-center gap-2 text-base shadow-lg active:scale-95 transition-transform">
                Analizar
              </button>
            </div>
          </div>
        </>
      )}

      {step === STEPS.PROCESSING && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <p className="text-white/60 text-m">Identificando productos y cantidades</p>
          <Spinner />
        </div>
      )}

      {step === STEPS.RESULT && (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-5 pt-10 shrink-0">
            <button onClick={closeModal} className="text-white/70"><X size={22} /></button>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-white font-semibold">Lista detectada</span>
            </div>
            <div className="w-6" />
          </div>
          <div className="px-5 py-2 shrink-0">
            <p className="text-white font-semibold">
              {cart.filter(i => i.confidence >= 0.65).length} de {cart.length} productos identificados
            </p>
            <p className="text-white/50 text-xs">Ajusta cantidades o elimina líneas incorrectas antes de confirmar</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-2 space-y-2">
            {cart.map((item, i) => {
              const matched = item.confidence >= 0.65;
              return (
                <div key={i} className={`rounded-xl px-4 py-3 ${matched ? 'bg-white/10 backdrop-blur-sm' : 'bg-red-900/30 border border-red-500/30'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm truncate ${matched ? 'text-white' : 'text-red-300'}`}>
                          {matched ? item.nombre : `Sin match: "${item.original_text}"`}
                        </p>
                        {matched && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium ${
                            item.confidence >= 0.85 ? 'bg-green-500/30 text-green-300' :
                            item.confidence >= 0.65 ? 'bg-yellow-500/30 text-yellow-300' : 'bg-red-500/30 text-red-300'
                          }`}>
                            {Math.round(item.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      {matched && item.original_text !== item.nombre && (
                        <p className="text-white/40 text-xs mt-0.5 truncate">OCR: "{item.original_text}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => setCart(c => c.filter((_, idx) => idx !== i))}
                      className="text-white/40 hover:text-red-400 transition shrink-0 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {matched && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCart(c => c.map((it, idx) => idx === i ? {...it, cantidadVendida: Math.max(0.01, it.cantidadVendida - 1)} : it))}
                          className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-lg leading-none hover:bg-white/20 transition">−</button>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.cantidadVendida}
                          onChange={e => setCart(c => c.map((it, idx) => idx === i ? {...it, cantidadVendida: parseFloat(e.target.value) || 1} : it))}
                          className="w-14 text-center text-sm font-semibold bg-white/10 text-white border border-white/20 rounded-lg px-1 py-0.5 focus:outline-none"
                        />
                        <button onClick={() => setCart(c => c.map((it, idx) => idx === i ? {...it, cantidadVendida: it.cantidadVendida + 1} : it))}
                          className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-lg leading-none hover:bg-white/20 transition">+</button>
                      </div>
                      <div className="text-right">
                        <p className="text-[#008cc8] font-bold text-sm">${(item.precio * item.cantidadVendida).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {cart.filter(i => i.confidence >= 0.65).length > 0 && (
            <div className="px-5 py-3 shrink-0 bg-white/10 backdrop-blur-sm mx-5 rounded-2xl mb-2">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Subtotal</span>
                <span className="text-white text-lg font-bold">
                  ${cart.filter(i => i.confidence >= 0.65).reduce((sum, item) => sum + item.precio * item.cantidadVendida, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <div className="p-5 pb-10 flex gap-3 shrink-0">
            <button onClick={retake} className="flex items-center gap-2 px-4 py-3 rounded-3xl border border-white/30 text-white text-sm">
              <RotateCcw size={16} />
              Repetir
            </button>
            <button
              onClick={confirmAndSendCart}
              disabled={cart.filter(i => i.confidence >= 0.65).length === 0}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Send size={20} />
              Confirmar ({cart.filter(i => i.confidence >= 0.65).length})
            </button>
          </div>
        </div>
      )}

      {step === STEPS.SELLING && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="text-center">
            <p className="text-white text-xl font-semibold">Procesando venta</p>
            <p className="text-white/60 text-sm mt-2">Por favor espera un momento</p>
          </div>
          <Spinner />
        </div>
      )}
    </div>
  );
}
