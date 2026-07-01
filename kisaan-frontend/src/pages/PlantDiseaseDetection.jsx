import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Search, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PlantDiseaseDetection() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [cameraMode, setCameraMode] = useState(false);
    const [modelStatus, setModelStatus] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/detection/status`);
                const data = await response.json();
                setModelStatus(data);
            } catch (err) {
                console.error('Failed to fetch model status:', err);
            }
        };

        checkStatus();
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError(null);
    };

    const startCamera = async () => {
        setCameraMode(true);
        setResult(null);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access failed:', err);
            setError('Could not access camera. Please check permissions.');
            setCameraMode(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            setImage(file);
            setPreview(URL.createObjectURL(blob));
            stopCamera();
        }, 'image/jpeg');
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraMode(false);
    };

    const detectDisease = async () => {
        if (!image) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await fetch(`${API_URL}/api/detection/detect`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Detection failed');
            }

            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to process image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setPreview(null);
        setImage(null);
        setResult(null);
        setError(null);
    };

    const isHealthy = (disease) => disease?.toLowerCase().includes('healthy') || false;
    const isModelReady = modelStatus?.status === 'ready';

    return (
        <div className="min-h-screen bg-transparent pb-24 text-gray-100 flex flex-col font-sans">
            <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 pt-6 md:pt-10">
                <header className="mb-6 flex items-center gap-4">
                    <button onClick={() => navigate('/home')} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        Plant Disease Detection <Search size={22} className="text-green-400" />
                    </h1>
                </header>

                {modelStatus && (
                    <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
                        isModelReady
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    }`}>
                        {isModelReady ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <div className="flex-1">
                            <p className="text-sm font-bold">
                                {isModelReady ? 'Plant Disease Model Ready' : 'Model Files Missing'}
                            </p>
                            <p className="text-[10px] opacity-70">
                                {isModelReady
                                    ? 'Leaf scan predictions are available now.'
                                    : 'Add the trained .h5 model file to the backend disease model folder to enable predictions.'}
                            </p>
                        </div>
                    </div>
                )}

                <main className="space-y-6">
                    {!cameraMode ? (
                        <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl">
                            {preview ? (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden aspect-square flex items-center justify-center bg-black/40 border border-white/10">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={clearSelection}
                                            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={detectDisease}
                                        disabled={loading || !isModelReady}
                                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                                            loading || !isModelReady
                                                ? 'bg-gray-700 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95'
                                        }`}
                                    >
                                        {loading ? <RefreshCw className="animate-spin" /> : <Search size={20} />}
                                        {loading ? 'Analyzing...' : isModelReady ? 'Detect Disease' : 'Model Required'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-500/30 hover:bg-white/5 transition-all"
                                    >
                                        <div className="bg-green-500/10 p-4 rounded-full">
                                            <Upload className="text-green-400" size={32} />
                                        </div>
                                        <p className="text-sm font-medium text-gray-300">Upload Leaf Image</p>
                                        <p className="text-xs text-gray-500">Tap to browse files</p>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">OR</span>
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </div>

                                    <button
                                        onClick={startCamera}
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all"
                                    >
                                        <Camera size={20} className="text-blue-400" />
                                        Take a Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover aspect-square" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-8">
                                <button onClick={stopCamera} className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all">
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={capturePhoto} className="bg-white p-6 rounded-full text-black shadow-2xl active:scale-90 transition-all">
                                    <Camera size={32} />
                                </button>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-gradient-to-br from-gray-900 to-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                <div className={`border-b border-white/5 p-4 flex items-center justify-between ${isHealthy(result.diseasePredicted) ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    <div className="flex items-center gap-2">
                                        {isHealthy(result.diseasePredicted)
                                            ? <CheckCircle className="text-green-400" size={18} />
                                            : <AlertCircle className="text-red-400" size={18} />
                                        }
                                        <span className={`text-xs font-bold uppercase tracking-wider ${isHealthy(result.diseasePredicted) ? 'text-green-400' : 'text-red-400'}`}>
                                            {isHealthy(result.diseasePredicted) ? 'Plant is Healthy' : 'Disease Detected'}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isHealthy(result.diseasePredicted) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {result.confidence} confidence
                                    </span>
                                </div>

                                <div className="p-6 space-y-5">
                                    {result.plant && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Plant</p>
                                            <p className="text-sm font-semibold text-gray-200">{result.plant}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Detected Condition</p>
                                        <p className={`text-lg font-bold ${isHealthy(result.diseasePredicted) ? 'text-green-400' : 'text-orange-400'}`}>
                                            {result.diseasePredicted}
                                        </p>
                                    </div>

                                    <div className={`rounded-2xl p-4 border space-y-3 ${isHealthy(result.diseasePredicted) ? 'bg-green-500/5 border-green-500/15' : 'bg-orange-500/5 border-orange-500/15'}`}>
                                        <div className={`flex items-center gap-2 ${isHealthy(result.diseasePredicted) ? 'text-green-400' : 'text-orange-400'}`}>
                                            <Info size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {isHealthy(result.diseasePredicted) ? 'Care Tips' : 'Treatment Recommendation'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed font-medium">{result.treatment}</p>
                                    </div>

                                    {!isHealthy(result.diseasePredicted) && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex gap-3">
                                            <AlertCircle className="text-yellow-400 shrink-0" size={18} />
                                            <p className="text-[11px] text-yellow-200/80 leading-snug">
                                                <b>Note:</b> These results come from the integrated plant disease classifier. For high-stakes crop decisions, verify with an agronomist.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                            <AlertCircle className="text-red-400" size={20} />
                            <p className="text-sm text-red-200 font-medium">{error}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
